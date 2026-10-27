import Link from 'next/link'
import type { CSSProperties } from 'react'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import PublicShell from '@/components/dawat/PublicShell'
import InvitationView from '@/components/dawat/InvitationView'
import FaqList from '@/components/dawat/FaqList'
import Scene from '@/components/dawat/Scene'
import { FONTS, TEMPLATES } from '@/lib/types'
import { getViewer } from '@/lib/viewer'

const STEPS = [
  ['Pick a card', 'Choose a ready-made design, or start from a blank card.'],
  ['Make it yours', 'Names, dates, venues, photos, music. Move anything, change any colour.'],
  ['Send the link', 'Share on WhatsApp. Guests open it on any phone and reply right on the card.'],
]

const FEATURES = [
  ['magic-pencil', 'Design it like Canva', 'Drag text, photos and ornaments anywhere. Hundreds of combinations of fonts and colours.'],
  ['star-stroke', 'Fairy-tale animations', 'Palace gates that open, falling petals, sky lanterns, gold-foil names that shimmer.'],
  ['camera', 'Photos, video and music', 'Add your photos, a YouTube video or your own clip, and a song that plays as the card opens.'],
  ['profile', 'Guest list and replies', 'Each guest gets their own link. See who opened it and how many are coming to each function.'],
]

const FAQS: [string, string][] = [
  ['Is it really free?', 'Yes. Making cards, every design tool, animations, guest links and sharing are all free.'],
  ['Do my guests need an app?', 'No. The card opens in any phone browser, straight from WhatsApp.'],
  ['Can I change the card after sending it?', 'Yes. Edit any time; the same link shows the latest version.'],
  ['Can I make a card for Mehndi, Nikah and Walima together?', 'Yes. Add as many functions as you like, and guests reply for each one separately.'],
]

export default async function Home() {
  const viewer = await getViewer()
  const hero = TEMPLATES[0]
  const strip = TEMPLATES.slice(0, 6)
  return (
    <PublicShell viewer={viewer}>
      {/* Hero */}
      <section className="max-w-300 mx-auto px-6 pt-10 pb-16 max-md:px-4 max-md:pt-4 max-md:pb-10">
        <div className="grid grid-cols-[1.1fr_0.9fr] items-center gap-12 max-lg:grid-cols-1 max-lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 h-8 mb-6 px-3 rounded-full bg-b-surface2 shadow-widget text-caption text-t-secondary">
              <span className="size-2 rounded-full bg-primary-02" />Free for everyone
            </div>
            <h1 className="mb-5 text-h2 text-balance max-xl:text-h3 max-md:text-[2.25rem] max-md:leading-[1.15]">
              Wedding invitations your guests will love to open
            </h1>
            <p className="max-w-130 mb-8 text-[1.125rem] font-medium leading-relaxed tracking-[-0.01em] text-t-secondary max-md:text-body-1">
              Make a beautiful animated card in minutes, share one link on WhatsApp, and see who is coming. No printing, no app.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button isBlack as="link" href="/templates" className="max-md:flex-1">Make my card</Button>
              <Button isStroke as="link" href={`/preview/${hero.id}`} className="max-md:flex-1">See a live card</Button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-8 text-body-2 text-t-secondary">
              {['Mehndi, Nikah, Baraat, Walima', 'RSVP built in', 'Works on every phone'].map((x) => (
                <span key={x} className="inline-flex items-center gap-1.5"><Icon className="!size-5 fill-primary-02" name="check-circle-fill" />{x}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="phone !w-[min(300px,72vw)]"><div className="phone-scroll">
              <InvitationView content={hero.content} design={hero.design} skipOpening />
            </div></div>
          </div>
        </div>
      </section>

      {/* Templates strip */}
      <section className="py-14 bg-b-surface2 max-md:py-10">
        <div className="max-w-300 mx-auto px-6 max-md:px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-h4 max-md:text-h5">Start from a design</h2>
              <p className="mt-1 text-body-2 text-t-secondary">Tap any card to see it open. Change everything after you pick.</p>
            </div>
            <Button isStroke as="link" href="/templates">All templates</Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x scroll-pl-6 scrollbar-none max-md:-mx-4 max-md:px-4 max-md:scroll-pl-4">
            {strip.map((t) => (
              <Link key={t.id} href={`/preview/${t.id}`} className="tpl-scene shrink-0 snap-start flex flex-col items-center justify-center gap-2 w-52 aspect-[3/4] rounded-3xl text-center transition-transform duration-300 hover:-translate-y-1 max-md:w-40"
                style={{ background: t.design.bg, color: t.design.ink, '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent } as CSSProperties}>
                <span className="scene-mini"><Scene kind={t.design.scene} /></span>
                <small className="text-overline uppercase tracking-[0.2em]" style={{ color: t.design.accent }}>{t.tag}</small>
                <b className="!text-[1.8rem] max-md:!text-[1.4rem]" style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS[t.design.headingFont]).css }}>{t.name}</b>
              </Link>
            ))}
            <Link href="/templates" className="shrink-0 snap-start flex flex-col items-center justify-center gap-3 w-52 aspect-[3/4] rounded-3xl border-2 border-dashed border-s-stroke2 text-t-secondary transition-colors hover:text-t-primary hover:border-s-highlight max-md:w-40">
              <span className="flex items-center justify-center size-12 rounded-full bg-b-surface1"><Icon className="fill-inherit" name="plus" /></span>
              <span className="text-sub-title-1">Blank card</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="how" className="max-w-300 mx-auto px-6 py-16 scroll-mt-20 max-md:px-4 max-md:py-12">
        <h2 className="mb-10 text-h4 text-center max-md:text-h5 max-md:mb-6 max-md:text-left">Three easy steps</h2>
        <ol className="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-3">
          {STEPS.map(([h, p], i) => (
            <li key={h} className="p-6 rounded-3xl bg-b-surface2 shadow-widget max-md:p-5">
              <div className="flex items-center justify-center size-10 mb-4 rounded-full bg-b-surface1 text-button">{i + 1}</div>
              <div className="mb-1 text-sub-title-1">{h}</div>
              <div className="text-body-2 text-t-secondary">{p}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="max-w-300 mx-auto px-6 pb-16 max-md:px-4 max-md:pb-12">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 max-md:grid-cols-1 max-md:gap-6">
          {FEATURES.map(([icon, h, p]) => (
            <div key={h} className="flex gap-4">
              <div className="flex shrink-0 items-center justify-center size-12 rounded-2xl bg-b-surface2 shadow-widget"><Icon className="fill-t-primary" name={icon} /></div>
              <div>
                <div className="mb-1 text-sub-title-1">{h}</div>
                <div className="text-body-2 text-t-secondary">{p}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-215 mx-auto px-6 pb-16 scroll-mt-20 max-md:px-4 max-md:pb-12">
        <h2 className="mb-4 text-h4 text-center max-md:text-h5 max-md:text-left">Questions</h2>
        <FaqList items={FAQS} />
      </section>

      {/* Final call */}
      <section className="max-w-300 mx-auto px-6 max-md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-6 px-12 py-10 rounded-4xl bg-b-dark1 text-t-light max-md:px-6 max-md:py-8">
          <div>
            <div className="text-h4 max-md:text-h5">Your celebration starts with the invitation</div>
            <div className="mt-1 text-body-2 opacity-70">Free. Ready in a few minutes.</div>
          </div>
          <Button isWhite as="link" href="/templates" className="max-md:w-full">Make my card</Button>
        </div>
      </section>
    </PublicShell>
  )
}
