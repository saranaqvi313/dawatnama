'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseIdentity } from '@/lib/identity'
import { savePending } from '@/lib/pendingLogin'

/** Step 1 of sign-in: phone number or email. A one-time code is sent; no links. */
export default function LoginForm({ next, phoneEnabled }: { next: string; phoneEnabled: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const id = parseIdentity(String(f.get('id') || ''), phoneEnabled)
    if ('error' in id) return setError(id.error)
    const name = String(f.get('name') || '').trim().slice(0, 60)
    setBusy(true); setError('')
    const data = name ? { full_name: name } : undefined
    // No emailRedirectTo: the email carries only the code (see README, step "Email code").
    const { error } = id.kind === 'phone'
      ? await createClient().auth.signInWithOtp({ phone: id.value, options: { data, channel: 'sms' } })
      : await createClient().auth.signInWithOtp({ email: id.value, options: { data, shouldCreateUser: true } })
    setBusy(false)
    if (error) return setError(friendly(error.message))
    savePending({ kind: id.kind, value: id.value, display: id.display, next, sentAt: Date.now() })
    router.push('/login/verify')
  }

  return (
    <form onSubmit={sendCode} className="auth-form" noValidate>
      <label>Your name<input name="name" autoComplete="name" maxLength={60} placeholder="Shown in your account (optional)" /></label>
      <label>{phoneEnabled ? 'Phone number or email' : 'Email address'}
        <input name="id" required autoComplete={phoneEnabled ? 'tel' : 'email'} inputMode={phoneEnabled ? 'text' : 'email'}
          placeholder={phoneEnabled ? '0300 1234567 or you@example.com' : 'you@example.com'} dir="ltr" />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Sending code…' : 'Send code'}</button>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}

export function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('rate limit') || m.includes('seconds')) return 'Please wait a minute before asking for another code.'
  if (m.includes('phone') && (m.includes('provider') || m.includes('unsupported') || m.includes('disabled')))
    return 'Sign-in by phone is not set up yet. Please use your email.'
  if (m.includes('expired') || m.includes('invalid')) return 'That code is wrong or has expired.'
  return message
}
