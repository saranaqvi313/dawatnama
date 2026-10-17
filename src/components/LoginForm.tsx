'use client'
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { parsePhone } from '@/lib/identity'

const LENGTH = 6
const RESEND_AFTER = 60

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as { error?: string; next?: string; demoCode?: string }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

/**
 * Sign in or sign up: mobile number, then the 6-digit code sent by SMS. Every sign-in needs a
 * fresh code. New numbers get an account on their first sign-in.
 */
export default function LoginForm({ next }: { next: string }) {
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone')
  const [phone, setPhone] = useState<{ value: string; display: string } | null>(null)
  const [name, setName] = useState('')
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sentAt, setSentAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { if (step === 'code') boxes.current[0]?.focus() }, [step])

  async function send(target: { value: string; display: string }) {
    setBusy(true); setError(''); setInfo('')
    try {
      const data = await post('/api/login', { phone: target.value })
      setPhone(target); setStep('code'); setSentAt(Date.now()); setDigits(Array(LENGTH).fill(''))
      if (data.demoCode) setInfo(`Test mode (no SMS sent): your code is ${data.demoCode}`)
    } catch (e) { setError((e as Error).message) }
    setBusy(false)
  }

  function onPhone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const p = parsePhone(String(f.get('phone') || ''))
    if ('error' in p) return setError(p.error)
    setName(String(f.get('name') || '').trim())
    void send(p)
  }

  async function verify(code: string) {
    if (!phone || code.length !== LENGTH || busy) return
    setBusy(true); setError('')
    try {
      const data = await post('/api/login/verify', { phone: phone.value, code, name, next })
      setStep('done')
      window.setTimeout(() => window.location.assign(data.next || '/dashboard'), 700)
    } catch (e) {
      setError((e as Error).message); setDigits(Array(LENGTH).fill('')); boxes.current[0]?.focus(); setBusy(false)
    }
  }

  function fill(text: string, from = 0) {
    const nextDigits = digits.slice()
    text.replace(/\D/g, '').slice(0, LENGTH - from).split('').forEach((ch, k) => { nextDigits[from + k] = ch })
    setDigits(nextDigits)
    boxes.current[Math.min(LENGTH - 1, from + text.length)]?.focus()
    if (nextDigits.every(Boolean)) void verify(nextDigits.join(''))
  }
  function setAt(i: number, value: string) {
    const clean = value.replace(/\D/g, '')
    if (clean.length > 1) return fill(clean, i)
    const nextDigits = digits.slice(); nextDigits[i] = clean
    setDigits(nextDigits)
    if (clean && i < LENGTH - 1) boxes.current[i + 1]?.focus()
    if (nextDigits.every(Boolean)) void verify(nextDigits.join(''))
  }
  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus()
  }
  function onPaste(e: ClipboardEvent<HTMLInputElement>) { e.preventDefault(); fill(e.clipboardData.getData('text')) }

  if (step === 'done')
    return (
      <div className="otp-done" role="status">
        <span aria-hidden="true">✓</span>
        <h2>Signed in</h2>
        <p className="muted">Taking you to your invitations…</p>
      </div>
    )

  if (step === 'code' && phone) {
    const wait = Math.max(0, RESEND_AFTER - Math.floor((now - sentAt) / 1000))
    return (
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void verify(digits.join('')) }}>
        <p className="muted otp-to">Enter the 6-digit code we sent by SMS to <b dir="ltr">{phone.display}</b>.</p>
        <fieldset className="otp" aria-label="Sign-in code" disabled={busy}>
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={LENGTH} aria-label={`Digit ${i + 1}`} dir="ltr"
              onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onPaste={onPaste} onFocus={(e) => e.target.select()} />
          ))}
        </fieldset>
        <button className="btn" disabled={busy || digits.some((d) => !d)} aria-busy={busy}>Verify and sign in</button>
        {error && <p className="err" role="alert">{error}</p>}
        {info && <p className="notice muted" role="status">{info}</p>}
        <div className="otp-links">
          {wait > 0 ? <span className="muted">Send a new code in {wait}s</span>
            : <button type="button" className="link" disabled={busy} onClick={() => send(phone)}>Send a new code</button>}
          <button type="button" className="link" onClick={() => { setStep('phone'); setError(''); setInfo('') }}>Use a different number</button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={onPhone} className="auth-form" noValidate>
      <label>Your name<input name="name" autoComplete="name" maxLength={60} defaultValue={name} placeholder="Shown in your account (optional)" /></label>
      <label>Mobile number
        <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0300 1234567" dir="ltr" defaultValue={phone?.display} />
      </label>
      <button className="btn" disabled={busy} aria-busy={busy}>Send code</button>
      <p className="muted small-note">We&apos;ll text you a 6-digit code. New here? Your account is created when you sign in.</p>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
