export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error: any, { event }) => {
    // Standard server logging for stdout
    console.error(`[Server Error] Route: ${event?.path || 'unknown'}. Message: ${error.message || error}`)

    // Push to Grafana Faro
    const exception = {
      type: error.name || 'Error',
      value: error.message || String(error),
      stacktrace: error.stack || undefined,
      timestamp: new Date().toISOString(),
      context: {
        url: event?.path || 'unknown',
        method: event?.method || 'unknown',
        ssr: event ? 'true' : 'false'
      }
    }

    await sendToServerFaro({
      exceptions: [exception]
    })
  })
})
