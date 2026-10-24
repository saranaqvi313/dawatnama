import { NextResponse, type NextRequest } from 'next/server'
import { parsePhone, safeNext } from '@/lib/identity'
import { checkLoginCode } from '@/lib/otp'
import { ensureAccount } from '@/lib/phoneAccount'
import { sameOrigin, siteUrl } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/errors'

export const runtime = 'nodejs'

/** Step 2 of sign-in: checks the code, then signs in (or creates the account on first use). */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request, siteUrl(request.nextUrl.origin))) return NextResponse.json({ error: 'Please sign in from the Dawatnama site.' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown; code?: unknown; name?: unknown; next?: unknown }
  const phone = parsePhone(String(body.phone ?? ''))
  if ('error' in phone) return NextResponse.json({ error: phone.error }, { status: 400 })
  try {
    const check = await checkLoginCode(phone.value, String(body.code ?? '').replace(/\D/g, ''))
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })
    const name = String(body.name ?? '').trim().slice(0, 60)
    const account = await ensureAccount(createAdminClient(), phone.value, name || undefined)
    const { error } = await (await createClient()).auth.signInWithPassword(account)
    if (error) throw error
  } catch (e) {
    await logError('login-verify', e, request.nextUrl.pathname)
    return NextResponse.json({ error: 'Could not sign you in right now. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ next: safeNext(String(body.next ?? '')) })
}
