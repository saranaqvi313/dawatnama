/** Records an error in the error_logs table (shown on the admin page). Server-only; never throws. */
import { createAdminClient } from './supabase/admin'

export async function logError(source: string, err: unknown, url?: string, detail?: string, userId?: string) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[${source}]`, message)
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
    await createAdminClient().from('error_logs').insert({
      source: source.slice(0, 40), message: message.slice(0, 1000),
      detail: (detail ?? (err instanceof Error ? err.stack : undefined))?.slice(0, 4000) ?? null,
      url: url?.slice(0, 500) ?? null, user_id: userId ?? null,
    })
  } catch { /* logging must never break the request */ }
}
