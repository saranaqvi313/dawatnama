import Link from 'next/link'
import type { CSSProperties } from 'react'
import Icon from '@/components/Icon'
import { createInvitation } from '@/app/actions'
import { FONTS, TEMPLATES } from '@/lib/types'
import GridCard, { Grid } from './GridCard'
import Scene from './Scene'
import SubmitButton from './SubmitButton'

/** The card templates, as a kit-style grid. */
export default function TemplateGrid({ limit }: { limit?: number }) {
  return (
    <Grid>
      {TEMPLATES.slice(0, limit).map((t) => (
        <GridCard key={t.id}
          title={t.name}
          badge={<div className="label label-gray text-t-primary">Free</div>}
          details={t.tag}
          thumb={
            <Link href={`/preview/${t.id}`} aria-label={`Preview ${t.name}`}
              className="tpl-scene !absolute inset-0 flex flex-col items-center justify-center gap-2 text-center transition-transform duration-300 group-hover:scale-[1.03]"
              style={{ background: t.design.bg, color: t.design.ink, '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent } as CSSProperties}>
              <span className="scene-mini"><Scene kind={t.design.scene} /></span>
              <small className="text-overline uppercase tracking-[0.2em]" style={{ color: t.design.accent }}>{t.tag}</small>
              <b style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS[t.design.headingFont]).css }}>{t.name}</b>
            </Link>
          }
          actions={
            <>
              <Link className="action" href={`/preview/${t.id}`}><Icon name="desktop" />Preview</Link>
              <form action={createInvitation}>
                <input type="hidden" name="template" value={t.id} />
                <SubmitButton plain className="action"><Icon name="plus" />Use template</SubmitButton>
              </form>
            </>
          }
        />
      ))}
    </Grid>
  )
}
