import { trace } from '@opentelemetry/api'

export function useAppLogger() {
  const nuxtApp = useNuxtApp()
  const faro = nuxtApp.$faro
  const logger = nuxtApp.$faroLogger

  const info = (message: string, context?: Record<string, string>) => {
    if (logger) {
      logger.info(message, context)
    } else {
      console.log(`[Client Info]: ${message}`, context || '')
    }
  }

  const warn = (message: string, context?: Record<string, string>) => {
    if (logger) {
      logger.warn(message, context)
    } else {
      console.warn(`[Client Warn]: ${message}`, context || '')
    }
  }

  const error = (message: string, context?: Record<string, string>) => {
    if (logger) {
      logger.error(message, context)
    } else {
      console.error(`[Client Error]: ${message}`, context || '')
    }
  }

  const debug = (message: string, context?: Record<string, string>) => {
    if (logger) {
      logger.debug(message, context)
    } else {
      console.debug(`[Client Debug]: ${message}`, context || '')
    }
  }

  const exception = (err: Error, context?: Record<string, string>) => {
    if (faro) {
      faro.api.pushError(err, { context })
    } else {
      console.error(`[Client Exception]: ${err.message}`, err, context || '')
    }
  }

  const event = (name: string, attributes?: Record<string, string>, domain?: string) => {
    if (faro) {
      faro.api.pushEvent(name, attributes, domain)
    } else {
      console.log(`[Client Event]: ${name}`, { attributes, domain })
    }
  }

  const measurement = (type: string, values: Record<string, number>, context?: Record<string, string>) => {
    if (faro) {
      faro.api.pushMeasurement({ type, values }, { context })
    } else {
      console.log(`[Client Measurement]: ${type}`, { values, context })
    }
  }

  const runWithSpan = async <T>(spanName: string, attributes: Record<string, any>, fn: () => Promise<T>): Promise<T> => {
    const tracer = trace.getTracer('nuxt-app-custom')
    const span = tracer.startSpan(spanName)

    Object.entries(attributes).forEach(([key, val]) => {
      span.setAttribute(key, String(val))
    })

    try {
      const result = await fn()
      span.setStatus({ code: 1 }) // Ok
      return result
    } catch (err) {
      span.setStatus({
        code: 2, // Error
        message: (err as Error).message
      })
      if (faro) {
        faro.api.pushError(err as Error, {
          context: { spanName }
        })
      }
      throw err
    } finally {
      span.end()
    }
  }

  const startUserAction = (name: string, attributes?: Record<string, string>) => {
    if (faro) {
      faro.api.startUserAction(name, attributes)
    } else {
      console.log(`[User Action Started]: ${name}`, attributes || '')
    }
  }

  const getSession = () => {
    if (faro) {
      return faro.api.getSession()
    }
    return null
  }

  const setSession = (sessionInfo: { id?: string; attributes?: Record<string, string> }) => {
    if (faro) {
      faro.api.setSession(sessionInfo)
    } else {
      console.log('[Client setSession]:', sessionInfo)
    }
  }

  return {
    info,
    warn,
    error,
    debug,
    exception,
    event,
    measurement,
    runWithSpan,
    startUserAction,
    getSession,
    setSession
  }
}

