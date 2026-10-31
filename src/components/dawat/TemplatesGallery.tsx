import Link from 'next/link'
import type { CSSProperties } from 'react'
import Icon from '@/components/Icon'
import { createAiCard, createBlankCard, createCanvasInvitation, createDesignFromTemplate, createInvitation } from '@/app/actions'
import { CANVAS_TEMPLATES } from '@/lib/canvasTemplates'
import { CATEGORIES, getCategory, type CategoryId } from '@/lib/categories'
import { FONTS, TEMPLATES } from '@/lib/types'
import CanvasCard from './canvas/CanvasCard'
import Scene from './Scene'
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

const inCategory = (t: { categories: readonly CategoryId[] }, c?: CategoryId) => !c || t.categories.includes(c)
const categoryNames = (ids: readonly CategoryId[]) => ids.map((id) => getCategory(id)?.name).filter(Boolean).join(' · ')

/** "All · Nikah · Walima · Birthday · Eid …": links to /templates?category=<id>, with how many cards each has. */
function CategoryNav({ active, base }: { active?: CategoryId; base: string }) {
  const count = (id: CategoryId) => TEMPLATES.filter((t) => t.categories.includes(id)).length + CANVAS_TEMPLATES.filter((t) => t.categories.includes(id)).length
  const chip = (on: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-button transition-colors hover:text-t-primary ${on ? 'border-s-stroke2 text-t-primary' : 'border-transparent bg-b-surface2 text-t-secondary'}`
  return (
    <nav aria-label="Card categories" className="flex flex-wrap gap-2 mb-10 max-md:flex-nowrap max-md:overflow-x-auto max-md:-mx-3 max-md:px-3 max-md:pb-2 max-md:mb-7">
      <Link href={base} className={chip(!active)} aria-current={!active ? 'page' : undefined} scroll={false}>All cards</Link>
      {CATEGORIES.map((c) => (
        <Link key={c.id} href={`${base}?category=${c.id}`} className={chip(active === c.id)} aria-current={active === c.id ? 'page' : undefined} scroll={false}>
          {c.name}<span className="text-caption text-t-tertiary">{count(c.id)}</span>
        </Link>
      ))}
    </nav>
  )
}

/**
 * Every way to start a card: a blank card, AI from a picture, ready-made templates (quick edit or design freely),
 * and designer templates, filtered by kind of event. Used on /templates and in the dashboard.
 */
export default function TemplatesGallery({ limit, compact, category, base = '/templates' }: { limit?: number; compact?: boolean; category?: CategoryId; base?: string }) {
  const cat = category ? getCategory(category) : undefined
  const classic = TEMPLATES.filter((t) => inCategory(t, category)).slice(0, limit)
  const designs = CANVAS_TEMPLATES.filter((t) => inCategory(t, category)).slice(0, limit)
  return (
    <div>
      {!compact && <CategoryNav active={category} base={base} />}
      <Section title={cat ? `${cat.name} cards` : 'Ready-made cards'}
        note={cat ? `${cat.note}. Pick one and change anything, or open it in the designer.` : 'Pick one and change anything: names, dates, colours, photos, animations. “Quick edit” is a simple form; “Design freely” opens the drag-and-drop designer.'}>
        {!compact && (
          <form action={createBlankCard} className="flex flex-col">
            <SubmitButton plain className="group flex flex-col items-center justify-center gap-3 w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-s-stroke2 text-t-secondary transition-colors hover:border-s-highlight hover:text-t-primary">
              <span className="flex items-center justify-center size-14 rounded-full bg-b-surface2 shadow-depth-toggle"><Icon className="fill-inherit" name="plus" /></span>
              <span className="text-sub-title-1">Blank card</span>
              <span className="px-4 text-caption text-center">Start from scratch, like Canva</span>
            </SubmitButton>
          </form>
        )}
        {!compact && (
          <form action={createAiCard} className="flex flex-col">
            {category && <input type="hidden" name="category" value={category} />}
            <SubmitButton plain className="group flex flex-col items-center justify-center gap-3 w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-s-stroke2 text-t-secondary transition-colors hover:border-s-highlight hover:text-t-primary">
              <span className="flex items-center justify-center size-14 rounded-full bg-b-surface2 shadow-depth-toggle"><Icon className="fill-inherit" name="magic-pencil" /></span>
              <span className="text-sub-title-1">Create with AI</span>
              <span className="px-4 text-caption text-center">Upload a design you like (Pinterest, Canva…) and describe your card</span>
            </SubmitButton>
          </form>
        )}
        {classic.map((t) => (
          <article key={t.id} className="flex flex-col">
            <Link href={`/preview/${t.id}`} aria-label={`Preview ${t.name}`}
              className="tpl-scene group flex flex-col items-center justify-center gap-2 aspect-[3/4] rounded-3xl text-center transition-transform duration-300 hover:-translate-y-1"
              style={{ background: t.design.bg, color: t.design.ink, '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent } as CSSProperties}>
              <span className="scene-mini"><Scene kind={t.design.scene} /></span>
              <small className="text-overline uppercase tracking-[0.2em]" style={{ color: t.design.accent }}>{t.tag}</small>
              <b className="!text-[2rem] max-md:!text-[1.6rem]" style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS[t.design.headingFont]).css }}>{t.name}</b>
              <span className="absolute bottom-3 right-3 z-1 flex items-center gap-1 px-2.5 h-7 rounded-full bg-black/35 text-caption text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
                <Icon className="!size-4 fill-white" name="video" />Preview
              </span>
            </Link>
            <div className="mt-3 text-sub-title-1">{t.name}</div>
            <div className="mb-2 text-caption text-t-secondary">{categoryNames(t.categories)}</div>
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

      {designs.length > 0 && (
        <Section title="Designer cards" note="Made in the drag-and-drop designer. Move anything, add photos, video, fairy-tale scenes and animations.">
          {designs.map((t) => (
            <article key={t.id} className="flex flex-col">
              <Link href={`/preview/${t.id}`} className="block rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1" aria-label={`Preview ${t.name}`}>
                <CanvasCard doc={t.doc} />
              </Link>
              <div className="mt-3 text-sub-title-1">{t.name}</div>
              <div className="mb-2 text-caption text-t-secondary">{categoryNames(t.categories)}</div>
              <form action={createCanvasInvitation} className="mt-auto">
                <input type="hidden" name="template" value={t.id} />
                <SubmitButton className={`w-full ${small}`} isBlack>Customise</SubmitButton>
              </form>
            </article>
          ))}
        </Section>
      )}
    </div>
  )
}
