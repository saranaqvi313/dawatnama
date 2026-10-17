import Link from 'next/link'
import type { CSSProperties } from 'react'
import { createInvitation } from '@/app/actions'
import { FONTS, TEMPLATES } from '@/lib/types'
import Scene from './Scene'
import SubmitButton from './SubmitButton'

export default function TemplateGrid({ labels }: { labels: { preview: string; use: string } }) {
  return (
    <div className="tpl-grid">
      {TEMPLATES.map((t) => (
        <article key={t.id} className="tpl">
          <Link href={`/preview/${t.id}`} className="tpl-thumb tpl-scene"
            style={{ background: t.design.bg, color: t.design.ink, borderColor: t.design.accent, '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent } as CSSProperties}>
            <span className="scene-mini"><Scene kind={t.design.scene} /></span>
            <small style={{ color: t.design.accent }}>{t.tag}</small>
            <b style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS[t.design.headingFont]).css }}>{t.name}</b>
          </Link>
          <h3>{t.name}</h3>
          <div className="tpl-actions">
            <Link href={`/preview/${t.id}`} className="btn ghost small">{labels.preview}</Link>
            <form action={createInvitation}>
              <input type="hidden" name="template" value={t.id} />
              <SubmitButton className="btn small">{labels.use}</SubmitButton>
            </form>
          </div>
        </article>
      ))}
    </div>
  )
}
