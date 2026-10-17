'use client'
import type { CSSProperties } from 'react'
import { OpenTracker, RsvpForm, type CardGuest } from '../InvitationView'
import { cardText } from '@/lib/i18n'

/** Under a designer card: greets the guest, counts the open, and takes the RSVP. */
export default function CanvasGuestPanel({ guest, slug, canReply, invitationId, colors }: {
  guest: CardGuest | null; slug: string; canReply: boolean; invitationId: string; colors: { bg: string; ink: string; accent: string }
}) {
  const t = cardText.en
  return (
    <section className="cv-guest" style={{ '--bg': colors.bg, '--ink': colors.ink, '--accent': colors.accent } as CSSProperties}>
      <OpenTracker slug={slug} />
      {guest && <p className="inv-dear">Dear <b>{guest.name}</b>{guest.party_size > 1 ? ' & family' : ''}, you are invited.</p>}
      {canReply && (
        <>
          <h3>{t.rsvp}</h3>
          <RsvpForm invitationId={invitationId} t={t} events={[]} guest={guest} slug={slug} />
        </>
      )}
    </section>
  )
}
