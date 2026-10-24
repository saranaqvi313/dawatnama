import Link from 'next/link'
import type { CanvasDoc } from '@/lib/canvas'
import CanvasCard from './CanvasCard'
import CanvasGuestPanel from './CanvasGuestPanel'
import type { CardGuest } from '../InvitationView'

/** Full-screen view of a designer card, as guests see it from the shared link. */
export default function CanvasPage({ doc, guest, slug, canReply, invitationId }: {
  doc: CanvasDoc; guest?: CardGuest | null; slug?: string; canReply?: boolean; invitationId?: string
}) {
  const ink = /^#([0-9a-f]{6})$/i.test(doc.bg.color) && parseInt(doc.bg.color.slice(1, 3), 16) + parseInt(doc.bg.color.slice(3, 5), 16) + parseInt(doc.bg.color.slice(5, 7), 16) < 380 ? '#fbf6ea' : '#2b2418'
  return (
    <main className="cv-page" style={{ background: `color-mix(in srgb, ${doc.bg.color} 70%, #000)` }}>
      <CanvasCard doc={doc} className="cv-page-card" />
      {slug && invitationId && (
        <CanvasGuestPanel guest={guest ?? null} slug={slug} canReply={Boolean(canReply)} invitationId={invitationId}
          colors={{ bg: doc.bg.color, ink, accent: doc.bg.patternColor || '#b8892b' }} />
      )}
      <Link href="/?ref=card" className="cv-made">Made with Dawatnama · make your own</Link>
    </main>
  )
}
