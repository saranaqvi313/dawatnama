'use client'
import { useState, type FormEvent } from 'react'
import { parsePhone } from '@/lib/identity'

/**
 * Sign in / sign up with a mobile number only. No code, no link: the account for the number
 * is opened (or created on first use) straight away.
 */
export default function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const phone = parsePhone(String(f.get('phone') || ''))
    if ('error' in phone) return setError(phone.error)
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: phone.value, name: String(f.get('name') || ''), next }),
      })
      const data = (await res.json().catch(() => ({}))) as { next?: string; error?: string }
      if (!res.ok || !data.next) throw new Error(data.error || 'Could not sign you in right now. Please try again.')
      setDone(true)
      window.location.assign(data.next)
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Could not sign you in right now. Please try again.')
    }
  }

  if (done)
    return (
      <div className="otp-done" role="status">
        <span aria-hidden="true">✓</span>
        <h2>Sign in successful</h2>
        <p className="muted">Taking you to your invitations…</p>
      </div>
    )

  return (
    <form onSubmit={signIn} className="auth-form" noValidate>
      <label>Your name<input name="name" autoComplete="name" maxLength={60} placeholder="Shown in your account (optional)" /></label>
      <label>Mobile number
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" dir="ltr" />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Continue'}</button>
      <p className="muted small-note">New here? Your account is created with your number.</p>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
