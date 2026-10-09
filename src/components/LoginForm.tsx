'use client'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ next, labels }: { next: string; labels: { email: string; send: string; sent: string } }) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function sendLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('busy'); setError('')
    const f = new FormData(e.currentTarget)
    const address = String(f.get('email') || '').trim()
    const name = String(f.get('name') || '').trim().slice(0, 60)
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: name ? { full_name: name } : undefined,
      },
    })
    if (error) { setError(error.message); setState('idle') } else { setEmail(address); setState('sent') }
  }

  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const token = String(new FormData(e.currentTarget).get('code') || '').replace(/\D/g, '')
    const { error } = await createClient().auth.verifyOtp({ email, token, type: 'email' })
    if (error) setError('That code is wrong or has expired. Please try again.')
    else window.location.assign(next)
  }

  if (state === 'sent')
    return (
      <form onSubmit={verifyCode} className="auth-form">
        <p className="ok" role="status">{labels.sent}</p>
        <label>Or type the code from the email
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" required dir="ltr" />
        </label>
        <button className="btn">Sign in with code</button>
        <button type="button" className="link" onClick={() => { setState('idle'); setError('') }}>Use a different email</button>
        {error && <p className="err" role="alert">{error}</p>}
      </form>
    )

  return (
    <form onSubmit={sendLink} className="auth-form">
      <label>Your name<input name="name" autoComplete="name" maxLength={60} placeholder="Shown in your account" /></label>
      <label>{labels.email}<input name="email" type="email" required autoComplete="email" dir="ltr" /></label>
      <button className="btn" disabled={state === 'busy'}>{labels.send}</button>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
