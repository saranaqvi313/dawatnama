import { NextResponse, type NextRequest } from 'next/server'
import { parsePhone, safeNext } from '@/lib/identity'
import { OTP_ENABLED, OtpError, sendLoginCode } from '@/lib/otp'
import { signInWithPhonePassword } from '@/lib/passwordAuth'
import { sameOrigin, siteUrl } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logError } from '@/lib/errors'

export const runtime = 'nodejs'

/**
 * Sign-in. While SMS codes are off (OTP_ENABLED = false in lib/otp.ts) this checks the mobile
 * number + password (and creates the account on first use). With codes on, it sends a code instead.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request, siteUrl(request.nextUrl.origin))) return NextResponse.json({ error: 'Please sign in from the Dawatnama site.' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown; name?: unknown; next?: unknown; password?: unknown; mode?: unknown }
  const phone = parsePhone(String(body.phone ?? ''))
  if ('error' in phone) return NextResponse.json({ error: phone.error }, { status: 400 })

  if (!OTP_ENABLED) {
    // Mobile number + password (SMS codes are off).
    const password = String((body as { password?: unknown }).password ?? '')
    if (!password) return NextResponse.json({ error: 'Enter your password.' }, { status: 400 })
    try {
      const name = String(body.name ?? '').trim().slice(0, 60)
      const mode = body.mode === 'signin' || body.mode === 'signup' ? body.mode : undefined
      const res = await signInWithPhonePassword(createAdminClient(), await createClient(), phone.value, password, name || undefined, mode)
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })
    } catch (e) {
      await logError('login-password', e, request.nextUrl.pathname)
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
