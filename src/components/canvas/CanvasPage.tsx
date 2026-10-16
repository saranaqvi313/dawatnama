import Link from 'next/link'
import type { CanvasDoc } from '@/lib/canvas'
import CanvasCard from './CanvasCard'

/** Full-screen view of a designer card, as guests see it from the shared link. */
export default function CanvasPage({ doc }: { doc: CanvasDoc }) {
  return (
    <main className="cv-page" style={{ background: `color-mix(in srgb, ${doc.bg.color} 70%, #000)` }}>
      <CanvasCard doc={doc} className="cv-page-card" />
      <Link href="/" className="cv-made">Made with Dawatnama</Link>
    </main>
  )
}
