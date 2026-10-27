import { NextResponse, type NextRequest } from 'next/server'
import { logError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Simple per-instance limit so a broken page can't flood the log.
const seen = new Map<string, { n: number; t: number }>()

/** Receives errors from visitors' browsers (see components/ErrorReporter.tsx). */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const hit = seen.get(ip)
  if (hit && now - hit.t < 60_000 && hit.n >= 10) return new NextResponse(null, { status: 204 })
  seen.set(ip, hit && now - hit.t < 60_000 ? { n: hit.n + 1, t: hit.t } : { n: 1, t: now })
  if (seen.size > 5000) seen.clear()
  const body = (await request.json().catch(() => null)) as { message?: unknown; detail?: unknown; url?: unknown } | null
  if (!body?.message) return new NextResponse(null, { status: 204 })
  const user = (await (await createClient()).auth.getUser()).data.user
  await logError('browser', String(body.message).slice(0, 1000), String(body.url ?? '').slice(0, 500),
    `${String(body.detail ?? '').slice(0, 3500)}\nUA: ${request.headers.get('user-agent')?.slice(0, 300) ?? ''}`, user?.id)
  return new NextResponse(null, { status: 204 })
}
