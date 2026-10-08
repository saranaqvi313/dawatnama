'use client'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ next, labels }: { next: string; labels: { email: string; send: string; sent: string } }) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')
  const [error, setError] = useState('')
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('busy'); setError('')
    const email = String(new FormData(e.currentTarget).get('email') || '').trim()
    const { error } = await createClient().auth.signInWithOtp({
      email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) { setError(error.message); setState('idle') } else setState('sent')
  }
  if (state === 'sent') return <p className="ok" role="status">{labels.sent}</p>
  return (
    <form onSubmit={onSubmit} className="auth-form">
      <label>{labels.email}<input name="email" type="email" required autoComplete="email" dir="ltr" /></label>
      <button className="btn" disabled={state === 'busy'}>{labels.send}</button>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
