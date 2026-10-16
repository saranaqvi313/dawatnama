'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseIdentity } from '@/lib/identity'
import { savePending } from '@/lib/pendingLogin'

type Via = 'phone' | 'email'

/**
 * Step 1 of sign-in / sign-up: phone number or email. A one-time code is sent; no links.
 * New users are created automatically on their first code, so this is also sign-up.
 */
export default function LoginForm({ next, phoneEnabled }: { next: string; phoneEnabled: boolean }) {
  const router = useRouter()
  const [via, setVia] = useState<Via>(phoneEnabled ? 'phone' : 'email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const raw = String(f.get('id') || '').trim()
    const id = parseIdentity(raw, phoneEnabled && via === 'phone')
    if ('error' in id) return setError(id.error)
    if (id.kind !== via) {
      return setError(via === 'phone' ? 'Enter a mobile number, or switch to the Email tab.' : 'Enter an email address, or switch to the Phone tab.')
    }
    const name = String(f.get('name') || '').trim().slice(0, 60)
    setBusy(true); setError('')
    const data = name ? { full_name: name } : undefined
    // No emailRedirectTo: the email carries only the code (see README, "Sign-in with a code").
    const { error } = id.kind === 'phone'
      ? await createClient().auth.signInWithOtp({ phone: id.value, options: { data, channel: 'sms' } })
      : await createClient().auth.signInWithOtp({ email: id.value, options: { data, shouldCreateUser: true } })
    setBusy(false)
    if (error) return setError(friendly(error.message))
    savePending({ kind: id.kind, value: id.value, display: id.display, next, sentAt: Date.now() })
    router.push('/login/verify')
  }

  function choose(v: Via) {
    setVia(v); setError('')
  }

  return (
    <form onSubmit={sendCode} className="auth-form" noValidate>
      {phoneEnabled && (
        <div className="seg-tabs" role="tablist" aria-label="Sign in with">
          <button type="button" role="tab" aria-selected={via === 'phone'} className={via === 'phone' ? 'on' : ''} onClick={() => choose('phone')}>Phone number</button>
          <button type="button" role="tab" aria-selected={via === 'email'} className={via === 'email' ? 'on' : ''} onClick={() => choose('email')}>Email</button>
        </div>
      )}
      <label>Your name<input name="name" autoComplete="name" maxLength={60} placeholder="Shown in your account (optional)" /></label>
      {via === 'phone' ? (
        <label key="phone">Mobile number
          <input name="id" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" dir="ltr" />
        </label>
      ) : (
        <label key="email">Email address
          <input name="id" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" dir="ltr" />
        </label>
      )}
      <button className="btn" disabled={busy}>{busy ? 'Sending code…' : via === 'phone' ? 'Send code by SMS' : 'Send code by email'}</button>
      <p className="muted small-note">New here? The same code creates your account.</p>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}

export function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('rate limit') || m.includes('seconds')) return 'Please wait a minute before asking for another code.'
  if (m.includes('phone') && (m.includes('provider') || m.includes('unsupported') || m.includes('disabled')))
    return 'Sign-in by phone is not set up yet. Please use the Email tab.'
  if (m.includes('expired') || m.includes('invalid')) return 'That code is wrong or has expired.'
  return message
}
