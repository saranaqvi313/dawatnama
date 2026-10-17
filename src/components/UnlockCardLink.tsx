'use client'
import { useState } from 'react'
import Link from 'next/link'
import { activateCardLink } from '@/app/guestActions'

/** Unlocks a card's open link with one guest-link credit (or sends you to buy one). */
export default function UnlockCardLink({ invitationId, credits, returnTo, beforeUnlock, onUnlocked }: {
  invitationId: string; credits: number; returnTo: string; beforeUnlock: () => Promise<boolean>; onUnlocked: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function unlock() {
    setBusy(true); setError('')
    if (!(await beforeUnlock())) { setBusy(false); setError('Could not save your card. Please try again.'); return }
    const res = await activateCardLink(invitationId)
    setBusy(false)
    if (!res.ok) return setError(res.error ?? 'Could not unlock the link.')
    onUnlocked()
  }
  return (
    <div className="share-box">
      <h3>Open link for this card</h3>
      <p className="muted">One link anyone can open (for a WhatsApp group or Instagram). Uses 1 guest link. You have {credits}.</p>
      {credits > 0
        ? <button type="button" className="btn" disabled={busy} aria-busy={busy} onClick={unlock}>Unlock with 1 link</button>
        : <Link className="btn" href={`/premium?return=${encodeURIComponent(returnTo)}`}>Buy links</Link>}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  )
}
