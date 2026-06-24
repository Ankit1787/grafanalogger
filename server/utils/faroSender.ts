interface ServerLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: Record<string, string>;
}

interface FaroFrame {
  filename: string;
  lineno?: number;
  colno?: number;
  function?: string;
}

interface FaroStacktrace {
  frames: FaroFrame[];
}

interface ServerExceptionInput {
  type: string;
  value: string;
  stacktrace?: string;
  timestamp: string;
  context?: Record<string, string>;
}

interface ServerExceptionOutput {
  type: string;
  value: string;
  stacktrace?: FaroStacktrace;
  timestamp: string;
  context?: Record<string, string>;
}

// Parse server-side stack trace string into structured Faro frames
function parseStacktrace(stack?: string): FaroStacktrace {
  if (!stack) {
    return { frames: [{ filename: 'unknown', function: 'unknown' }] }
  }

  const lines = stack.split('\n')
  const frames: FaroFrame[] = []

  for (const line of lines) {
    const cleanLine = line.trim()
    if (!cleanLine.startsWith('at ')) {
      continue
    }

    // Match V8 patterns:
    // "at functionName (filename:line:col)" or "at filename:line:col"
    const match = cleanLine.match(/^at\s+(?:([^\s(]+)\s+\()?(.*?):(\d+):(\d+)\)?$/)
    if (match) {
      frames.push({
        function: match[1] || undefined,
        filename: match[2]||"",
        lineno: parseInt(match[3] || "0", 10),
        colno: match[4] ? parseInt(match[4], 10) : undefined
      })
    } else {
      // Fallback for custom/unorthodox formats
      frames.push({
        filename: cleanLine.substring(3)
      })
    }
  }

  if (frames.length === 0) {
    frames.push({ filename: 'unknown', function: 'unknown' })
  }

  return { frames }
}

export async function sendToServerFaro(data: { logs?: ServerLog[]; exceptions?: ServerExceptionInput[] }) {
  const config = useRuntimeConfig()
  const faroUrl = config.public.faroUrl as string
  const faroAppName = config.public.faroAppName as string
  const faroAppVersion = config.public.faroAppVersion as string
  const faroEnv = config.public.faroEnv as string

  if (!faroUrl) {
    return
  }

  // Attempt to read the session ID from the active request context if available
  let sessionId: string | undefined
  try {
    const event = (globalThis as any).useEvent?.()
    if (event) {
      const h3 = await import('h3')
      sessionId = h3.getRequestHeader(event, 'x-faro-session-id')
    }
  } catch (err) {
    // Ignore context error outside of request
  }

  // Generate fallback session ID if not found to satisfy Faro collector
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Format exceptions to follow the required Faro schema
  const formattedExceptions: ServerExceptionOutput[] = (data.exceptions || []).map((exc) => {
    return {
      type: exc.type,
      value: exc.value,
      stacktrace: parseStacktrace(exc.stacktrace),
      timestamp: exc.timestamp,
      context: exc.context
    }
  })

  const payload = {
    meta: {
      sdk: {
        name: '@grafana/faro-web-sdk', // Align with standard RUM SDK name to bypass collector whitelist/filtering
        version: '1.0.0',
      },
      app: {
        name: faroAppName,
        version: faroAppVersion,
        environment: faroEnv,
      },
      session: {
        id: sessionId,
      },
      browser: {
        name: 'Node.js',
        version: process.version,
        os: process.platform,
      }
    },
    logs: data.logs,
    exceptions: formattedExceptions.length > 0 ? formattedExceptions : undefined
  }

  try {
    const response = await globalThis.$fetch.raw(faroUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Faro-Session-Id': sessionId,
      },
      body: payload,
    })
    
    if (process.dev) {
      console.log(`[Faro Server Sender] Telemetry dispatched successfully. Status: ${response.status}`)
    }
  } catch (error: any) {
    console.error('[Faro Server Sender Error] Failed to dispatch telemetry to Grafana Faro:')
    if (error.response) {
      console.error(`- Status: ${error.response.status}`)
      console.error(`- Response Body:`, JSON.stringify(error.response._data || {}))
    } else {
      console.error(`- Error Message: ${error.message || error}`)
    }
  }
}
