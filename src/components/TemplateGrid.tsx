import Link from 'next/link'
import { createInvitation } from '@/app/actions'
import { FONTS, TEMPLATES } from '@/lib/types'

export default function TemplateGrid({ labels }: { labels: { preview: string; use: string } }) {
  return (
    <div className="tpl-grid">
      {TEMPLATES.map((t) => (
        <article key={t.id} className="tpl">
          <Link href={`/preview/${t.id}`} className="tpl-thumb" style={{ background: t.design.bg, color: t.design.ink, borderColor: t.design.accent }}>
            <small style={{ color: t.design.accent }}>{t.tag}</small>
            <b style={{ fontFamily: FONTS[t.design.headingFont].css }}>{t.name}</b>
          </Link>
          <h3>{t.name}</h3>
          <div className="tpl-actions">
            <Link href={`/preview/${t.id}`} className="btn ghost small">{labels.preview}</Link>
            <form action={createInvitation}>
              <input type="hidden" name="template" value={t.id} />
              <button className="btn small">{labels.use}</button>
            </form>
          </div>
        </article>
      ))}
    </div>
  )
}
