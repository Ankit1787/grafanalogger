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

  return {
    info,
    warn,
    error,
    debug,
    exception,
  }
}
