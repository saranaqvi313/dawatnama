import { NextResponse, type NextRequest } from 'next/server'
import { parsePhone } from '@/lib/identity'
import { sendLoginCode } from '@/lib/otp'
import { sameOrigin, siteUrl } from '@/lib/payments'
import { logError } from '@/lib/errors'

export const runtime = 'nodejs'

/** Step 1 of sign-in: sends a one-time code to the mobile number. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request, siteUrl(request.nextUrl.origin))) return NextResponse.json({ error: 'Please sign in from the Dawatnama site.' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown }
  const phone = parsePhone(String(body.phone ?? ''))
  if ('error' in phone) return NextResponse.json({ error: phone.error }, { status: 400 })
  try {
    const res = await sendLoginCode(phone.value)
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })
    return NextResponse.json({ sent: true, demoCode: res.demoCode })
  } catch (e) {
    await logError('login-send', e, request.nextUrl.pathname)
    return NextResponse.json({ error: 'Could not send the code right now. Please try again in a minute.' }, { status: 502 })
  }
}
