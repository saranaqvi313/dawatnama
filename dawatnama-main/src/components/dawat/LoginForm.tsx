'use client'
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import Button from '@/components/Button'
import Field from '@/components/Field'
import Icon from '@/components/Icon'
import { parsePhone } from '@/lib/identity'
import { PASSWORD_RULES, passwordProblem } from '@/lib/password'

const LENGTH = 6
const RESEND_AFTER = 60

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = (await res.json().catch(() => ({}))) as { error?: string; next?: string; demoCode?: string }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

type Mode = 'signin' | 'signup' | 'reset'

const Err = ({ text }: { text: string }) => (text ? <div className="mt-4 text-center text-caption text-primary-03" role="alert">{text}</div> : null)

/**
 * The kit's Sign in / Create an account / Reset password panel, for mobile number + password.
 * With SMS codes switched on (lib/otp.ts) it asks for the 6-digit code after the number instead.
 */
export default function LoginForm({ next, otp = false, contactHref = '/contact' }: { next: string; otp?: boolean; contactHref?: string }) {
  const [mode, setMode] = useState<Mode>('signin')
  const [step, setStep] = useState<'form' | 'code' | 'done'>('form')
  const [name, setName] = useState('')
  const [phoneText, setPhoneText] = useState('')
  const [phone, setPhone] = useState<{ value: string; display: string } | null>(null)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sentAt, setSentAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { if (step === 'code') boxes.current[0]?.focus() }, [step])
  useEffect(() => { setError(''); setInfo('') }, [mode])

  function finish(to?: string) {
    setStep('done')
    window.setTimeout(() => window.location.assign(to || '/dashboard'), 500)
  }

  async function send(target: { value: string; display: string }) {
    setBusy(true); setError(''); setInfo('')
    try {
      const data = await post('/api/login', { phone: target.value, name, next, ...(otp ? {} : { password, mode }) })
      if (data.next) return finish(data.next)
      setPhone(target); setStep('code'); setSentAt(Date.now()); setDigits(Array(LENGTH).fill(''))
      if (data.demoCode) setInfo(`Test mode (no SMS sent): your code is ${data.demoCode}`)
    } catch (e) { setError((e as Error).message) }
    setBusy(false)
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const p = parsePhone(phoneText)
    if ('error' in p) return setError(p.error)
    if (!otp) {
      if (!password) return setError('Enter your password.')
      if (mode === 'signup') {
        const problem = passwordProblem(password)
        if (problem) return setError(problem)
      }
    }
    void send(p)
  }

  async function verify(code: string) {
    if (!phone || code.length !== LENGTH || busy) return
    setBusy(true); setError('')
    try {
      const data = await post('/api/login/verify', { phone: phone.value, code, name, next })
      finish(data.next)
    } catch (e) {
      setError((e as Error).message); setDigits(Array(LENGTH).fill('')); boxes.current[0]?.focus(); setBusy(false)
    }
  }
  function fill(text: string, from = 0) {
    const d = digits.slice()
    text.replace(/\D/g, '').slice(0, LENGTH - from).split('').forEach((ch, k) => { d[from + k] = ch })
    setDigits(d)
    boxes.current[Math.min(LENGTH - 1, from + text.length)]?.focus()
    if (d.every(Boolean)) void verify(d.join(''))
  }
  function setAt(i: number, value: string) {
    const clean = value.replace(/\D/g, '')
    if (clean.length > 1) return fill(clean, i)
    const d = digits.slice(); d[i] = clean
    setDigits(d)
    if (clean && i < LENGTH - 1) boxes.current[i + 1]?.focus()
    if (d.every(Boolean)) void verify(d.join(''))
  }
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus() }
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => { e.preventDefault(); fill(e.clipboardData.getData('text')) }

  const heading = step === 'done' ? 'Signed in' : step === 'code' ? 'Enter your code' : mode === 'reset' ? 'Reset password' : mode === 'signin' ? 'Sign in to Dawatnama' : 'Create an account'

  return (
    <div>
      <div className="mb-10 text-h4 text-center max-md:mb-6 max-md:text-h5">{heading}</div>

      {step === 'done' && (
        <div className="text-center" role="status">
          <div className="flex items-center justify-center size-16 mx-auto mb-6 rounded-full bg-primary-02/15">
            <Icon className="fill-primary-02" name="check" />
          </div>
          <div className="text-body-2 text-t-secondary">Taking you to your dashboard…</div>
        </div>
      )}

      {step === 'code' && phone && (
        <form onSubmit={(e) => { e.preventDefault(); void verify(digits.join('')) }}>
          <div className="mb-6 text-center text-body-2 text-t-secondary">We sent a 6-digit code by SMS to <b className="text-t-primary" dir="ltr">{phone.display}</b>.</div>
          <fieldset className="grid grid-cols-6 gap-2" aria-label="Sign-in code" disabled={busy}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { boxes.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={LENGTH} aria-label={`Digit ${i + 1}`} dir="ltr"
                className="w-full h-14 border border-s-stroke2 rounded-2xl text-center text-h5 text-t-primary outline-none transition-colors hover:border-s-highlight focus:border-s-highlight"
                onChange={(e) => setAt(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onPaste={onPaste} onFocus={(e) => e.target.select()} />
            ))}
          </fieldset>
          <Button className="mt-6 w-full" isBlack disabled={busy || digits.some((d) => !d)} aria-busy={busy || undefined}>Verify and sign in</Button>
          <Err text={error} />
          {info && <div className="mt-4 text-center text-caption text-t-secondary" role="status">{info}</div>}
          <div className="flex justify-between gap-4 mt-4 text-body-2 text-t-secondary">
            {RESEND_AFTER - Math.floor((now - sentAt) / 1000) > 0
              ? <span>New code in {RESEND_AFTER - Math.floor((now - sentAt) / 1000)}s</span>
              : <button type="button" className="text-t-primary font-bold transition-colors hover:text-primary-01" disabled={busy} onClick={() => send(phone)}>Send a new code</button>}
            <button type="button" className="text-t-primary font-bold transition-colors hover:text-primary-01" onClick={() => { setStep('form'); setError(''); setInfo('') }}>Change number</button>
          </div>
        </form>
      )}

      {step === 'form' && mode === 'reset' && (
        <>
          <div className="text-center text-body-2 text-t-secondary">
            For your safety we reset passwords by hand. Message us from the mobile number on your account and we will set a new password for you.
          </div>
          <Button className="mt-6 w-full" isBlack as="link" href={contactHref}>Contact us</Button>
          <div className="mt-4 text-center text-body-2 text-t-secondary">
            Have your password?&nbsp;
            <button className="text-t-primary font-bold transition-colors hover:text-primary-01" onClick={() => setMode('signin')}>Login</button>
          </div>
        </>
      )}

      {step === 'form' && mode !== 'reset' && (
        <form onSubmit={submit} noValidate>
          <div className="text-center text-caption text-t-tertiary">
            {mode === 'signin' ? 'Sign in with your mobile number' : 'Use your mobile number'}
          </div>
          {mode === 'signup' && (
            <Field className="mt-6" innerLabel="Your name" placeholder="Shown in your account (optional)" autoComplete="name" maxLength={60}
              value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Field className="mt-6" innerLabel="Mobile number" placeholder="0300 1234567" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required
            value={phoneText} onChange={(e) => { setPhoneText(e.target.value); setError('') }} />
          {!otp && (
            <Field className="mt-6" classInput="pr-20" innerLabel="Password" placeholder={mode === 'signup' ? 'Choose a password' : 'Enter password'}
              type={showPw ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={72} dir="ltr" required
              value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
              handleForgotPassword={mode === 'signin' ? () => setMode('reset') : undefined}>
              <button type="button" className="absolute top-1/2 right-5 z-2 -translate-y-1/2 text-caption text-t-secondary transition-colors hover:text-t-primary"
                onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}>{showPw ? 'Hide' : 'Show'}</button>
            </Field>
          )}
          {!otp && mode === 'signup' && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 max-md:grid-cols-1" aria-label="Password rules">
              {PASSWORD_RULES.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-caption text-t-secondary">
                  <Icon className={`!size-4 shrink-0 ${r.test(password) ? 'fill-primary-02' : 'fill-t-secondary/50'}`} name="check-circle-fill" />
                  {r.label}
                </div>
              ))}
            </div>
          )}
          <Button className="mt-6 w-full" isBlack disabled={busy} aria-busy={busy || undefined}>
            {otp ? 'Send code' : mode === 'signin' ? 'Sign in' : 'Create an account'}
          </Button>
          <Err text={error} />
          <div className="mt-4 text-center text-body-2 text-t-secondary">
            {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}&nbsp;
            <button type="button" className="text-t-primary font-bold transition-colors hover:text-primary-01" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
