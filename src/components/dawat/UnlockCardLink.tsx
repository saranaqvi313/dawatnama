'use client'
import { useState } from 'react'
import Button from '@/components/Button'
import { activateCardLink } from '@/app/guestActions'
import { Notice, Panel } from './ui'
import { FREE_MODE } from '@/lib/pricing'

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
    <Panel>
      <div className="mb-2 text-sub-title-1">Open link for this card</div>
      <div className="mb-5 text-body-2 text-t-secondary">One link anyone can open (for a WhatsApp group or Instagram).{FREE_MODE ? ' Free.' : ` Uses 1 guest link. You have ${credits}.`}</div>
      {FREE_MODE || credits > 0
        ? <Button className="w-full" isBlack onClick={unlock} disabled={busy} aria-busy={busy || undefined}>{FREE_MODE ? 'Get my card link' : 'Unlock with 1 link'}</Button>
        : <Button className="w-full" isBlack as="link" href={`/premium?return=${encodeURIComponent(returnTo)}`}>Buy links</Button>}
      {error && <div className="mt-3"><Notice text={error} tone="red" /></div>}
    </Panel>
  )
}
