import faroUploader from '@grafana/faro-rollup-plugin'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  sourcemap: {
    client: true,
    server: false,
  },
  vite: {
    plugins: [
      faroUploader({
        appName: process.env.NUXT_PUBLIC_FARO_APP_NAME || 'nuxt-grafana-app',
        appId: process.env.FARO_APP_ID || '',
        stackId: process.env.FARO_STACK_ID || '',
        endpoint: process.env.FARO_SOURCEMAP_ENDPOINT || '',
        apiKey: process.env.FARO_SOURCEMAP_API_KEY || '',
        gzipContents: true,
        skipUpload: !process.env.FARO_SOURCEMAP_API_KEY,
      }),
    ],
  },
  runtimeConfig: {
    public: {
      faroUrl: process.env.NUXT_PUBLIC_FARO_URL || '',
      faroAppName: process.env.NUXT_PUBLIC_FARO_APP_NAME || 'nuxt-grafana-app',
      faroAppVersion: process.env.NUXT_PUBLIC_FARO_APP_VERSION || '1.0.0',
      faroEnv: process.env.NUXT_PUBLIC_FARO_ENV || 'development',
      faroSamplingRate: Number(process.env.NUXT_PUBLIC_FARO_SAMPLING_RATE) || 1.0,
    }
  }
})
