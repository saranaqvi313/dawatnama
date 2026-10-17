'use client'
import { useRef, useState, type FormEvent } from 'react'
import { SHARE_PRICE_LABEL } from '@/lib/pricing'

export const PAY_MESSAGES: Record<string, string> = {
  paid: 'Payment received. Your share link is live.',
  failed: 'We could not confirm the payment. If money was taken from your card, contact us with the time of payment.',
  cancelled: 'Payment cancelled. You have not been charged.',
  error: 'We could not start the payment. Please try again in a minute.',
  unavailable: 'Payments are not set up on this site yet.',
}

/**
 * Locks the share link until this card is paid for. Saves the card first (so nothing is lost
 * while the customer is on the payment page), then goes to the secure card payment page.
 */
export default function SharePaywall({ invitationId, beforePay }: { invitationId: string; beforePay: () => Promise<boolean> }) {
  const form = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true); setError('')
    if (!(await beforePay())) { setBusy(false); setError('Could not save your card. Please try again.'); return }
    form.current?.submit()  // full-page navigation to the payment page; the button keeps spinning
  }

  return (
    <form ref={form} action="/api/pay/card" method="post" className="locked share-lock" onSubmit={onSubmit}>
      <input type="hidden" name="purpose" value="share" />
      <input type="hidden" name="invitation" value={invitationId} />
      <p className="kicker">Share link</p>
      <h3>Get a link for this card</h3>
      <p className="muted">
        Pay <b>{SHARE_PRICE_LABEL}</b> once for this card to get a link you can send on WhatsApp or anywhere.
        Guests can open it in any browser and RSVP. You can keep editing afterwards; the same link always shows the latest version.
      </p>
      <p className="muted small-note">Visa or Mastercard from any bank, on Safepay&apos;s secure page. This is separate from Premium.</p>
      <button className="btn" disabled={busy} aria-busy={busy}>Pay {SHARE_PRICE_LABEL} and get link</button>
      {error && <p className="err" role="alert">{error}</p>}
    </form>
  )
}
