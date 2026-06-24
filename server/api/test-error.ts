export default defineEventHandler((event) => {
  const query = getQuery(event)

  if (query.type === 'log') {
    serverLogger.info('This is a manual server-side info log triggered by user query', {
      context: { source: 'api-route', testEnv: 'true' }
    })
    return { status: 'success', message: 'Logged server-side message successfully!' }
  }

  if (query.type === 'exception') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Custom Test Server Exception triggered by user query',
    })
  }

  return { message: 'Use ?type=log or ?type=exception to trigger events.' }
})
