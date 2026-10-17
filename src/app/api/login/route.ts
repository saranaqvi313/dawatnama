import { NextResponse, type NextRequest } from 'next/server'
import { parsePhone, safeNext } from '@/lib/identity'
import { OTP_ENABLED, OtpError, sendLoginCode } from '@/lib/otp'
import { ensureAccount } from '@/lib/phoneAccount'
import { sameOrigin, siteUrl } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/errors'

export const runtime = 'nodejs'

/**
 * Sign-in step 1. While SMS codes are off (OTP_ENABLED = false in lib/otp.ts) this signs the
 * user in straight away with the mobile number. With codes on, it sends the code instead.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request, siteUrl(request.nextUrl.origin))) return NextResponse.json({ error: 'Please sign in from the Dawatnama site.' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown; name?: unknown; next?: unknown }
  const phone = parsePhone(String(body.phone ?? ''))
  if ('error' in phone) return NextResponse.json({ error: phone.error }, { status: 400 })

  if (!OTP_ENABLED) {
    try {
      const name = String(body.name ?? '').trim().slice(0, 60)
      const account = await ensureAccount(createAdminClient(), phone.value, name || undefined)
      const { error } = await (await createClient()).auth.signInWithPassword(account)
      if (error) throw error
    } catch (e) {
      await logError('login-direct', e, request.nextUrl.pathname)
      return NextResponse.json({ error: 'Could not sign you in right now. Please try again.' }, { status: 500 })
    }
    return NextResponse.json({ next: safeNext(String(body.next ?? '')) })
  }

  try {
    const res = await sendLoginCode(phone.value)
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })
    return NextResponse.json({ sent: true, demoCode: res.demoCode })
  } catch (e) {
    await logError('login-send', e, request.nextUrl.pathname)
    const kind = e instanceof OtpError ? e.kind : 'sms'
    const reason = kind === 'database' ? ' (code SETUP-DB: run supabase/schema.sql in Supabase)'
      : kind === 'setup' ? ' (code SETUP-KEY: server key missing)'
        : ' (code SMS: the SMS phone or textbee did not accept the message)'
    return NextResponse.json({ error: `Could not send the code right now. Please try again in a minute.${reason}` }, { status: 502 })
  }
}
