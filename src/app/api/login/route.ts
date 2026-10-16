import { NextResponse, type NextRequest } from 'next/server'
import { parsePhone, safeNext } from '@/lib/identity'
import { ensureAccount } from '@/lib/phoneAccount'
import { sameOrigin, siteUrl } from '@/lib/payments'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** Sign in (or sign up) with a mobile number only. Sets the session cookie and returns where to go. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request, siteUrl(request.nextUrl.origin))) return NextResponse.json({ error: 'Please sign in from the Dawatnama site.' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as { phone?: unknown; name?: unknown; next?: unknown }
  const phone = parsePhone(String(body.phone ?? ''))
  if ('error' in phone) return NextResponse.json({ error: phone.error }, { status: 400 })
  const name = String(body.name ?? '').trim().slice(0, 60)

  const supabase = await createClient()
  try {
    const account = await ensureAccount(createAdminClient(), phone.value, name || undefined)
    const { error } = await supabase.auth.signInWithPassword(account)
    if (error) throw error
  } catch (e) {
    console.error('number sign-in failed', e)
    return NextResponse.json({ error: 'Could not sign you in right now. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ next: safeNext(String(body.next ?? '')) })
}
