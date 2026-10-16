'use client'
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clearPending, loadPending, savePending, type PendingLogin } from '@/lib/pendingLogin'
import { friendly } from './LoginForm'

const RESEND_AFTER = 60

/** Step 2 of sign-in: enter the one-time code. Success signs the user in and continues. */
export default function OtpScreen({ length }: { length: number }) {
  const [pending, setPending] = useState<PendingLogin | null | undefined>(undefined)
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''))
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { setPending(loadPending()) }, [])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { if (pending) boxes.current[0]?.focus() }, [pending])

  if (pending === undefined) return null
  if (pending === null)
    return (
      <div className="auth-form">
        <p className="muted">Your sign-in session has ended. Please enter your mobile number again.</p>
        <Link href="/login" className="btn">Back to sign in</Link>
      </div>
    )
  const p = pending

  const wait = Math.max(0, RESEND_AFTER - Math.floor((now - p.sentAt) / 1000))

  async function verify(code: string) {
    if (code.length !== length || state !== 'idle') return
    setState('checking'); setError(''); setInfo('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ phone: p.value, token: code, type: 'sms' })
    if (error) {
      setState('idle'); setError(friendly(error.message)); setDigits(Array(length).fill(''))
      boxes.current[0]?.focus()
      return
    }
    setState('done'); clearPending()
    window.setTimeout(() => window.location.assign(p.next), 900)
  }

  function setAt(i: number, value: string) {
    const clean = value.replace(/\D/g, '')
    if (clean.length > 1) return fill(clean, i)
    const next = digits.slice(); next[i] = clean
    setDigits(next)
    if (clean && i < length - 1) boxes.current[i + 1]?.focus()
    if (next.every(Boolean)) void verify(next.join(''))
  }

  function fill(text: string, from = 0) {
    const next = digits.slice()
    text.replace(/\D/g, '').slice(0, length - from).split('').forEach((ch, k) => { next[from + k] = ch })
    setDigits(next)
    boxes.current[Math.min(length - 1, from + text.length)]?.focus()
    if (next.every(Boolean)) void verify(next.join(''))
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < length - 1) boxes.current[i + 1]?.focus()
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    fill(e.clipboardData.getData('text'))
  }

  async function resend() {
    setError(''); setInfo('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone: p.value, options: { channel: 'sms' } })
    if (error) return setError(friendly(error.message))
    const updated = { ...p, sentAt: Date.now() }
    savePending(updated); setPending(updated); setNow(Date.now())
    setInfo('A new code is on its way.')
  }

  if (state === 'done')
    return (
      <div className="otp-done" role="status">
        <span aria-hidden="true">✓</span>
        <h2>Sign in successful</h2>
        <p className="muted">Taking you to your invitations…</p>
      </div>
    )

  return (
    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); void verify(digits.join('')) }}>
      <p className="muted otp-to">
        We sent a {length}-digit code by SMS to <b dir="ltr">{p.display}</b>.
      </p>
      <fieldset className="otp" aria-label="One-time code" disabled={state === 'checking'}>
        {digits.map((d, i) => (
          <input key={i} ref={(el) => { boxes.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={length} aria-label={`Digit ${i + 1}`} dir="ltr"
            onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onPaste={onPaste} onFocus={(e) => e.target.select()} />
        ))}
      </fieldset>
      <button className="btn" disabled={state === 'checking' || digits.some((d) => !d)}>
        {state === 'checking' ? 'Checking…' : 'Verify and sign in'}
      </button>
      {error && <p className="err" role="alert">{error}</p>}
      {info && <p className="ok" role="status">{info}</p>}
      <div className="otp-links">
        {wait > 0
          ? <span className="muted">Resend code in {wait}s</span>
          : <button type="button" className="link" onClick={resend}>Resend code</button>}
        <Link href={`/login?next=${encodeURIComponent(p.next)}`} onClick={clearPending}>
          Use a different number
        </Link>
      </div>
    </form>
  )
}
