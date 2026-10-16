'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parsePhone } from '@/lib/identity'
import { savePending } from '@/lib/pendingLogin'

/**
 * Step 1 of sign-in / sign-up: mobile number. A one-time code is sent by SMS.
 * New users are created automatically on their first code, so this is also sign-up.
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const phone = parsePhone(String(f.get('phone') || ''))
    if ('error' in phone) return setError(phone.error)
    const name = String(f.get('name') || '').trim().slice(0, 60)
    setBusy(true); setError('')
    const { error } = await createClient().auth.signInWithOtp({
      phone: phone.value,
      options: { channel: 'sms', data: name ? { full_name: name } : undefined },
    })
    setBusy(false)
    if (error) return setError(friendly(error.message))
    savePending({ value: phone.value, display: phone.display, next, sentAt: Date.now() })
    router.push('/login/verify')
  }

  return (
    <form onSubmit={sendCode} className="auth-form" noValidate>
      <label>Your name<input name="name" autoComplete="name" maxLength={60} placeholder="Shown in your account (optional)" /></label>
      <label>Mobile number
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" dir="ltr" />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Sending code…' : 'Send code by SMS'}</button>
      <p className="muted small-note">New here? The same code creates your account.</p>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}

export function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('rate limit') || m.includes('seconds')) return 'Please wait a minute before asking for another code.'
  if (m.includes('provider') || m.includes('unsupported') || m.includes('disabled'))
    return 'Sign-in by SMS is not available right now. Please try again later.'
  if (m.includes('expired') || m.includes('invalid')) return 'That code is wrong or has expired.'
  return message
}
