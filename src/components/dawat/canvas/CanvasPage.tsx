import Link from 'next/link'
import { CH, type CanvasDoc } from '@/lib/canvas'
import LiveCanvas from './LiveCanvas'
import CanvasGuestPanel from './CanvasGuestPanel'
import type { CardGuest } from '../InvitationView'
import type { EventItem } from '@/lib/types'

/** Full-screen view of a designer card, as guests see it from the shared link. */
export default function CanvasPage({ doc, guest, slug, canReply, invitationId, title, events, updatedAt }: {
  doc: CanvasDoc; guest?: CardGuest | null; slug?: string; canReply?: boolean; invitationId?: string; title?: string; events?: EventItem[]; updatedAt?: string | null
}) {
  const ink = /^#([0-9a-f]{6})$/i.test(doc.bg.color) && parseInt(doc.bg.color.slice(1, 3), 16) + parseInt(doc.bg.color.slice(3, 5), 16) + parseInt(doc.bg.color.slice(5, 7), 16) < 380 ? '#fbf6ea' : '#2b2418'
  const long = (doc.h || CH) > CH
  return (
    <main className={`cv-page${long ? ' long' : ''}`} style={{ background: `color-mix(in srgb, ${doc.bg.color} 70%, #000)` }}>
      <LiveCanvas doc={doc} title={title} guestName={guest?.name} />
      {slug && invitationId && (
        <CanvasGuestPanel guest={guest ?? null} slug={slug} canReply={Boolean(canReply)} invitationId={invitationId}
          colors={{ bg: doc.bg.color, ink, accent: doc.fx?.effectColor || doc.bg.patternColor || '#b8892b' }} events={events} updatedAt={updatedAt} />
      )}
      <Link href="/?ref=card" className="cv-made">Made with Dawatnama · make your own</Link>
    </main>
  )
}
