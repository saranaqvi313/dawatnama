import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import Scene from '@/components/Scene'
import { SEO_PAGES, getSeoPage } from '@/lib/seoPages'
import { FONTS, getTemplate } from '@/lib/types'
import type { CSSProperties } from 'react'

type Props = { params: Promise<{ type: string }> }

export function generateStaticParams() { return SEO_PAGES.map((p) => ({ type: p.slug })) }
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getSeoPage((await params).type)
  if (!p) return {}
  return { title: `${p.title} | Dawatnama`, description: p.description, alternates: { canonical: `/cards/${p.slug}` }, openGraph: { title: p.title, description: p.description } }
}

export default async function SeoCard({ params }: Props) {
  const p = getSeoPage((await params).type)
  if (!p) notFound()
  const faq = [
    { q: 'Is it free to make?', a: 'Yes. Making the card, adding functions, photos and video is free. You pay only for the links you send (Rs 100 per guest, less in bundles).' },
    { q: 'Do guests need an app?', a: 'No. The link opens in any phone browser, including straight from WhatsApp.' },
    { q: 'Can I see who is coming?', a: 'Yes. Guests reply on the card, and your guest list shows who opened it and the headcount for every function.' },
  ]
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  return (
    <>
      <Nav />
      <article className="band seo">
        <h1>{p.h1}</h1>
        <p className="seo-intro">{p.intro}</p>
        <div className="cta"><Link className="btn" href="/templates">Make your card free</Link><Link className="btn ghost" href={`/preview/${p.templates[0]}`}>See a live example</Link></div>
        <h2>Designs for this occasion</h2>
        <div className="seo-tpls">
          {p.templates.map((id) => {
            const t = getTemplate(id)
            return (
              <Link key={id} href={`/preview/${t.id}`} className="seo-tpl" style={{ '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent, background: t.design.bg, color: t.design.ink } as CSSProperties}>
                <span className="scene-mini"><Scene kind={t.design.scene} /></span>
                <b style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS.pinyon).css }}>{t.name}</b>
                <small>{t.tag}</small>
              </Link>
            )
          })}
        </div>
        <h2>Wording ideas</h2>
        <ul className="seo-wording">{p.wording.map((w) => <li key={w}>“{w}”</li>)}</ul>
        <h2>Tips</h2>
        <ul>{p.tips.map((w) => <li key={w}>{w}</li>)}</ul>
        <h2>Questions</h2>
        <dl className="seo-faq">{faq.map((f) => <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl>
        <p className="muted">More ideas: {SEO_PAGES.filter((x) => x.slug !== p.slug).map((x, i) => <span key={x.slug}>{i > 0 && ' · '}<Link href={`/cards/${x.slug}`}>{x.h1}</Link></span>)}</p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </article>
    </>
  )
}
