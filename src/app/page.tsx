import Link from 'next/link'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import Shell from '@/components/dawat/Shell'
import InvitationView from '@/components/dawat/InvitationView'
import TemplateGrid from '@/components/dawat/TemplateGrid'
import FaqList from '@/components/dawat/FaqList'
import DesignShowcase from '@/components/dawat/canvas/DesignShowcase'
import { dict } from '@/lib/i18n'
import { getLang } from '@/lib/supabase/server'
import { PRICE_LABEL } from '@/lib/pricing'
import { EVENT_TYPES, TEMPLATES } from '@/lib/types'
import { getViewer } from '@/lib/viewer'

const FEATURE_ICONS = ['magic-pencil', 'edit', 'chat', 'calendar', 'clock', 'link']

export default async function Home() {
  const t = dict[await getLang()]
  const hero = TEMPLATES[0]
  const viewer = await getViewer()
  const premium = Boolean(viewer?.premium)
  return (
    <Shell title="Home" viewer={viewer}>
      <div className="flex max-lg:block">
        <div className="col-left">
          <div className="card">
            <div className="px-5 pt-8 pb-6 max-lg:px-3 max-md:pt-4">
              <div className="mb-4 text-caption uppercase tracking-[0.2em] text-t-tertiary">Digital invitations for Pakistan</div>
              <h1 className="max-w-160 mb-4 text-h2 max-2xl:text-h3 max-md:text-h4">{t.heroTitle}</h1>
              <p className="max-w-142 mb-8 text-[1.125rem] font-medium tracking-[-0.01em] text-t-secondary max-md:text-body-1">{t.heroSub}</p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Button isBlack as="link" href="/templates">{t.ctaCreate}</Button>
                <Button isStroke as="link" href={`/preview/${hero.id}`}>{t.ctaLive}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.slice(0, 18).map((x) => <span key={x} className="label label-gray">{x}</span>)}
                <Link href="/cards" className="label label-gray !text-t-primary">+ {EVENT_TYPES.length - 18} more</Link>
              </div>
            </div>
          </div>

          <Card title={t.whyTitle}>
            <div className="grid grid-cols-3 gap-3 p-2 pt-0 max-2xl:grid-cols-2 max-md:grid-cols-1">
              {t.features.map(([h, p], i) => (
                <div key={h} className="relative p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4">
                  <div className="flex items-center justify-center size-12 mb-4 rounded-full bg-b-surface2 shadow-depth-toggle">
                    <Icon className="fill-t-primary" name={FEATURE_ICONS[i] ?? 'check'} />
                  </div>
                  <div className="mb-2 text-sub-title-1">{h}</div>
                  <div className="text-body-2 text-t-secondary">{p}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t.tplTitle} headContent={<Button className="mr-1 !h-10 !px-4" isStroke as="link" href="/templates">See all</Button>}>
            <div className="px-5 pb-5 max-lg:px-3 max-lg:pb-3">
              <p className="mb-2 text-body-2 text-t-secondary">{t.tplSub}</p>
              <TemplateGrid limit={5} />
            </div>
          </Card>

          <div id="designs" className="scroll-mt-24">
            <Card title="Design every detail yourself" headContent={<Button className="mr-1 !h-10 !px-4" isStroke as="link" href="/designs">See all</Button>}>
              <div className="px-5 pb-5 max-lg:px-3 max-lg:pb-3">
                <p className="mb-2 text-body-2 text-t-secondary">Start from one of these designs, then drag text, photos and ornaments anywhere, change fonts and colours, and share your card&apos;s link. {premium ? 'Premium is active on your account.' : `Premium, ${PRICE_LABEL} one time.`}</p>
                <DesignShowcase premium={premium} limit={5} />
              </div>
            </Card>
          </div>
        </div>

        <div className="col-right">
          <Card title="Live card" headContent={<Button className="mr-1 !h-10 !px-4" isStroke as="link" href={`/preview/${hero.id}`}>Open</Button>}>
            <div className="px-3 pb-3">
              <div className="phone"><div className="phone-scroll">
                <InvitationView content={hero.content} design={hero.design} skipOpening />
              </div></div>
            </div>
          </Card>

          <div id="how" className="scroll-mt-24">
            <Card title={t.howTitle}>
              <div className="flex flex-col gap-1 px-2 pb-2">
                {t.steps.map(([h, p], i) => (
                  <div key={h} className="flex gap-4 p-3">
                    <div className="flex shrink-0 items-center justify-center size-12 rounded-full bg-b-surface1 text-h6">{i + 1}</div>
                    <div>
                      <div className="mb-1 text-sub-title-1">{h}</div>
                      <div className="text-body-2 text-t-secondary">{p}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div id="faq" className="scroll-mt-24">
            <Card title={t.faqTitle}>
              <div className="px-5 pb-2 max-lg:px-3">
                <FaqList items={t.faqs as [string, string][]} />
              </div>
            </Card>
          </div>

          <div className="card">
            <div className="p-5 text-center max-lg:p-3">
              <div className="mb-6 text-h5">{t.finalTitle}</div>
              <Button className="w-full" isBlack as="link" href="/templates">{t.ctaCreate}</Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
