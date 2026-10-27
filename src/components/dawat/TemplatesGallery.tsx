import Link from 'next/link'
import type { CSSProperties } from 'react'
import Icon from '@/components/Icon'
import { createBlankCard, createCanvasInvitation, createDesignFromTemplate, createInvitation } from '@/app/actions'
import { CANVAS_TEMPLATES } from '@/lib/canvasTemplates'
import { FONTS, GALLERY_TEMPLATES as TEMPLATES } from '@/lib/types'
import CanvasCard from './canvas/CanvasCard'
import TemplateFace, { faceStyle } from './TemplateFace'
import SubmitButton from './SubmitButton'

const small = '!h-10 !px-4 !text-caption max-md:!px-3'

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 last:mb-0 max-md:mb-9">
      <h2 className="text-h5 max-md:text-h6">{title}</h2>
      {note && <p className="mt-1 text-body-2 text-t-secondary">{note}</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(13.5rem,1fr))] gap-5 mt-5 max-md:grid-cols-2 max-md:gap-3">{children}</div>
    </section>
  )
}

/**
 * Every way to start a card: a blank card, ready-made templates (quick edit or design freely),
 * and designer templates. Used on /templates and in the dashboard.
 */
export default function TemplatesGallery({ limit, compact }: { limit?: number; compact?: boolean }) {
  const classic = TEMPLATES.slice(0, limit)
  const designs = CANVAS_TEMPLATES.slice(0, limit)
  return (
    <div>
      <Section title="Ready-made cards" note="Pick one and change anything: names, dates, colours, photos, animations. “Quick edit” is a simple form; “Design freely” opens the drag-and-drop designer.">
        {!compact && (
          <form action={createBlankCard} className="flex flex-col">
            <SubmitButton plain className="group flex flex-col items-center justify-center gap-3 w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-s-stroke2 text-t-secondary transition-colors hover:border-s-highlight hover:text-t-primary">
              <span className="flex items-center justify-center size-14 rounded-full bg-b-surface2 shadow-depth-toggle"><Icon className="fill-inherit" name="plus" /></span>
              <span className="text-sub-title-1">Blank card</span>
              <span className="px-4 text-caption text-center">Start from scratch, like Canva</span>
            </SubmitButton>
          </form>
        )}
        {classic.map((t) => (
          <article key={t.id} className="flex flex-col">
            <Link href={`/preview/${t.id}`} aria-label={`Preview ${t.name}`}
              className="tpl-scene group flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-3xl text-center transition-transform duration-300 hover:-translate-y-1"
              style={faceStyle(t)}>
                <TemplateFace t={t} />
              <span className="absolute bottom-3 right-3 z-1 flex items-center gap-1 px-2.5 h-7 rounded-full bg-black/35 text-caption text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
                <Icon className="!size-4 fill-white" name="video" />Preview
              </span>
            </Link>
            <div className="mt-3 mb-2 text-sub-title-1">{t.name}</div>
            <div className="flex gap-2 mt-auto max-md:flex-col">
              <form action={createInvitation} className="flex-1">
                <input type="hidden" name="template" value={t.id} />
                <SubmitButton className={`w-full ${small}`} isStroke>Quick edit</SubmitButton>
              </form>
              <form action={createDesignFromTemplate} className="flex-1">
                <input type="hidden" name="template" value={t.id} />
                <SubmitButton className={`w-full ${small}`} isBlack>Design freely</SubmitButton>
              </form>
            </div>
          </article>
        ))}
      </Section>

      <Section title="Designer cards" note="Made in the drag-and-drop designer. Move anything, add photos, video, fairy-tale scenes and animations.">
        {designs.map((t) => (
          <article key={t.id} className="flex flex-col">
            <Link href={`/preview/${t.id}`} className="block rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1" aria-label={`Preview ${t.name}`}>
              <CanvasCard doc={t.doc} />
            </Link>
            <div className="mt-3 mb-2 text-sub-title-1">{t.name}</div>
            <form action={createCanvasInvitation} className="mt-auto">
              <input type="hidden" name="template" value={t.id} />
              <SubmitButton className={`w-full ${small}`} isBlack>Customise</SubmitButton>
            </form>
          </article>
        ))}
      </Section>
    </div>
  )
}
