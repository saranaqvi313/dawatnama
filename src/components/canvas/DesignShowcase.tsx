import Link from 'next/link'
import { createCanvasInvitation } from '@/app/actions'
import { CANVAS_TEMPLATES } from '@/lib/canvasTemplates'
import CanvasCard from './CanvasCard'

/** Home page: the drag-and-drop design templates. */
export default function DesignShowcase({ premium }: { premium: boolean }) {
  return (
    <div className="design-grid">
      {CANVAS_TEMPLATES.map((t) => (
        <article key={t.id} className="design-tpl">
          <Link href={`/preview/${t.id}`} className="design-thumb" aria-label={`Preview ${t.name}`}>
            <CanvasCard doc={t.doc} />
          </Link>
          <div className="design-meta">
            <div><h3>{t.name}</h3><span className="muted">{t.tag}</span></div>
            <span className="pill premium">Premium</span>
          </div>
          <div className="tpl-actions">
            <Link href={`/preview/${t.id}`} className="btn ghost small">Preview</Link>
            <form action={createCanvasInvitation}>
              <input type="hidden" name="template" value={t.id} />
              <button className="btn small">{premium ? 'Customise this design' : 'Customise (Premium)'}</button>
            </form>
          </div>
        </article>
      ))}
    </div>
  )
}
