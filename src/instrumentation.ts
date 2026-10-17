/** Logs server-side errors (pages, actions, API routes) to the error_logs table, shown on /admin. */
export async function register() {}

export async function onRequestError(err: unknown, request: { path: string; method: string }, context: { routerKind: string; routePath: string; routeType: string }) {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { logError } = await import('./lib/errors')
  await logError('server', err, request.path, `${request.method} ${context.routePath} (${context.routeType})\n${err instanceof Error ? err.stack ?? '' : ''}`)
}
