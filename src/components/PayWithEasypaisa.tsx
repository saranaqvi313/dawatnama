'use client'
import { useState, type FormEvent } from 'react'

/** Easypaisa mobile account payment: the customer approves the request on their phone. */
export default function PayWithEasypaisa({ price, defaultMobile }: { price: string; defaultMobile: string }) {
  const [state, setState] = useState<'idle' | 'waiting'>('idle')
  const [error, setError] = useState('')

  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setState('waiting')
    const mobile = String(new FormData(e.currentTarget).get('mobile') || '')
    try {
      const res = await fetch('/api/pay/easypaisa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile }),
      })
      const data = (await res.json()) as { status: string; message?: string; order?: string; redirect?: string }
      if (data.status === 'demo' && data.redirect) return window.location.assign(data.redirect)
      if (data.status === 'paid' || data.status === 'pending') {
        return window.location.assign(`/premium?result=${data.status}${data.order ? `&order=${data.order}` : ''}`)
      }
      setError(data.message || 'The payment did not go through. Please try again.')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    }
    setState('idle')
  }

  return (
    <form onSubmit={pay} className="pay-option">
      <div>
        <h3>Easypaisa account</h3>
        <p className="muted">We&apos;ll send a payment request to your Easypaisa app. Approve it to finish.</p>
        <label>Easypaisa mobile number
          <input name="mobile" defaultValue={defaultMobile} inputMode="tel" autoComplete="tel" placeholder="0345 1234567" required dir="ltr" />
        </label>
      </div>
      <button className="btn" disabled={state === 'waiting'}>{state === 'waiting' ? 'Waiting for approval…' : `Pay ${price} with Easypaisa`}</button>
      {state === 'waiting' && (
        <p className="notice muted" role="status">Open the Easypaisa app (or the prompt on your phone) and approve the payment. Keep this page open.</p>
      )}
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
