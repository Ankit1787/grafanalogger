interface LogOptions {
  context?: Record<string, string>;
}

export const serverLogger = {
  info(message: string, options?: LogOptions) {
    console.info(`[Server INFO] ${message}`, options?.context || '')
    sendToServerFaro({
      logs: [
        {
          level: 'info',
          message,
          timestamp: new Date().toISOString(),
          context: options?.context,
        },
      ],
    })
  },

  warn(message: string, options?: LogOptions) {
    console.warn(`[Server WARN] ${message}`, options?.context || '')
    sendToServerFaro({
      logs: [
        {
          level: 'warn',
          message,
          timestamp: new Date().toISOString(),
          context: options?.context,
        },
      ],
    })
  },

  error(message: string, options?: LogOptions) {
    console.error(`[Server ERROR] ${message}`, options?.context || '')
    sendToServerFaro({
      logs: [
        {
          level: 'error',
          message,
          timestamp: new Date().toISOString(),
          context: options?.context,
        },
      ],
    })
  },

  debug(message: string, options?: LogOptions) {
    console.debug(`[Server DEBUG] ${message}`, options?.context || '')
    sendToServerFaro({
      logs: [
        {
          level: 'debug',
          message,
          timestamp: new Date().toISOString(),
          context: options?.context,
        },
      ],
    })
  },

  exception(error: Error, options?: LogOptions) {
    console.error(`[Server EXCEPTION] ${error.message || error}`, error.stack || '')
    sendToServerFaro({
      exceptions: [
        {
          type: error.name || 'Error',
          value: error.message || String(error),
          stacktrace: error.stack || undefined,
          timestamp: new Date().toISOString(),
          context: options?.context,
        },
      ],
    })
  },
}
