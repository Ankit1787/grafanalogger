import { initializeFaro, getWebInstrumentations, LogLevel, type Faro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

type FaroLogger = {
  info: (msg: string, context?: Record<string, string>) => void
  warn: (msg: string, context?: Record<string, string>) => void
  error: (msg: string, context?: Record<string, string>) => void
  debug: (msg: string, context?: Record<string, string>) => void
}

export default defineNuxtPlugin<{ faro: Faro | null; faroLogger: FaroLogger }>((nuxtApp) => {
  const config = useRuntimeConfig()
  const faroUrl = config.public.faroUrl
  const faroAppName = config.public.faroAppName
  const faroAppVersion = config.public.faroAppVersion
  const faroEnv = config.public.faroEnv
  const faroSamplingRate = config.public.faroSamplingRate

  if (!faroUrl) {
    console.warn('[Faro] Collector URL is not set. Frontend observability is disabled.')
    return {
      provide: {
        faro: null,
        faroLogger: {
          info: (msg: string) => console.log(`[Faro Info - Disabled]: ${msg}`),
          warn: (msg: string) => console.warn(`[Faro Warn - Disabled]: ${msg}`),
          error: (msg: string) => console.error(`[Faro Error - Disabled]: ${msg}`),
          debug: (msg: string) => console.debug(`[Faro Debug - Disabled]: ${msg}`),
        } as FaroLogger
      }
    }
  }

  // Initialize Faro Web SDK
  const faro = initializeFaro({
        url:faroUrl,
        app: {
          name:faroAppName,
          environment: faroEnv,
          version: faroAppVersion
        },
        sessionTracking: {
          samplingRate: faroSamplingRate,
          persistent: true
        },
        instrumentations: [
          ...getWebInstrumentations(),
          new TracingInstrumentation()
        ]
      })

  // Hook Vue Global Error Handler to push exceptions to Faro
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    faro.api.pushError(error as Error, {
      type: 'vue_error',
      context: {
        info,
        componentName: instance?.$options?.name || 'AnonymousComponent',
      }
    })
    // Continue default console reporting
    console.error(error)
  }

  // Monitor Vue Router navigations if router is available
  const router = useRouter()
  if (router) {
    router.afterEach((to) => {
      faro.api.setView({ name: to.path || to.name as string || 'unknown' })
    })
  }

  // Custom Logger wrapper
  const faroLogger = {
    info: (message: string, context?: Record<string, string>) => {
      faro.api.pushLog([message], { level: LogLevel.INFO, context })
    },
    warn: (message: string, context?: Record<string, string>) => {
      faro.api.pushLog([message], { level: LogLevel.WARN, context })
    },
    error: (message: string, context?: Record<string, string>) => {
      faro.api.pushLog([message], { level: LogLevel.ERROR, context })
    },
    debug: (message: string, context?: Record<string, string>) => {
      faro.api.pushLog([message], { level: LogLevel.DEBUG, context })
    }
  }

  return {
    provide: {
      faro,
      faroLogger
    }
  }
})
