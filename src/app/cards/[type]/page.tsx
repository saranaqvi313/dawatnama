import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import PublicShell from '@/components/dawat/PublicShell'
import { getViewer } from '@/lib/viewer'
import FaqList from '@/components/dawat/FaqList'
import { PROSE } from '@/components/dawat/legal/LegalPage'
import Scene from '@/components/dawat/Scene'
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
    <PublicShell viewer={await getViewer()}>
      <div className="max-w-300 mx-auto px-6 max-md:px-4">
      <div className="flex max-lg:block">
        <div className="col-left">
          <div className="card px-12 py-16 max-lg:p-8 max-lg:px-6">
            <article className={PROSE}>
              <h1 className="mb-4">{p.h1}</h1>
              <p className="text-[1.125rem] font-medium tracking-[-0.01em]">{p.intro}</p>
              <div className="flex flex-wrap gap-3 mt-6 mb-4">
                <Button isBlack as="link" href="/templates">Make your card free</Button>
                <Button isStroke as="link" href={`/preview/${p.templates[0]}`}>See a live example</Button>
              </div>
              <h2>Wording ideas</h2>
              <div className="flex flex-col gap-3">
                {p.wording.map((w) => (
                  <div key={w} className="p-5 rounded-3xl border border-s-subtle bg-b-depth2 text-t-primary" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem' }}>“{w}”</div>
                ))}
              </div>
              <h2>Tips</h2>
              <ul>{p.tips.map((w) => <li key={w}>{w}</li>)}</ul>
              <h2>Questions</h2>
            </article>
            <FaqList items={faq.map((f) => [f.q, f.a] as [string, string])} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
          </div>
        </div>
        <div className="col-right">
          <Card title="Designs for this occasion">
            <div className="flex flex-col gap-3 px-3 pb-3">
              {p.templates.map((id) => {
                const t = getTemplate(id)
                return (
                  <Link key={id} href={`/preview/${t.id}`} className="tpl-scene group relative flex flex-col items-center justify-center gap-1 h-48 rounded-3xl overflow-hidden text-center"
                    style={{ '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent, background: t.design.bg, color: t.design.ink } as CSSProperties}>
                    <span className="scene-mini"><Scene kind={t.design.scene} /></span>
                    <small className="text-overline uppercase tracking-[0.2em]" style={{ color: t.design.accent }}>{t.tag}</small>
                    <b style={{ fontFamily: (FONTS[t.design.nameFont] ?? FONTS.pinyon).css }}>{t.name}</b>
                  </Link>
                )
              })}
            </div>
          </Card>
          <Card classHead="!pl-3" title="More ideas">
            <div className="flex flex-col gap-1">
              {SEO_PAGES.filter((x) => x.slug !== p.slug).map((x) => (
                <Link key={x.slug} href={`/cards/${x.slug}`} className="group relative flex items-center gap-4 px-3 py-4">
                  <div className="box-hover"></div>
                  <div className="relative z-2 grow text-button text-t-secondary transition-colors group-hover:text-t-primary">{x.h1}</div>
                  <Icon className="relative z-2 shrink-0 fill-t-secondary" name="arrow" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </div>
    </PublicShell>
  )
}
