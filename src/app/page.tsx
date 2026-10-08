import Link from 'next/link'
import Nav from '@/components/Nav'
import InvitationView from '@/components/InvitationView'
import TemplateGrid from '@/components/TemplateGrid'
import { dict } from '@/lib/i18n'
import { getLang } from '@/lib/supabase/server'
import { EVENT_TYPES, TEMPLATES } from '@/lib/types'

export default async function Home() {
  const lang = await getLang()
  const t = dict[lang]
  const hero = TEMPLATES[0]
  return (
    <>
      <Nav />
      <section className="hero">
        <div className="hero-copy">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSub}</p>
          <div className="cta">
            <Link href="/templates" className="btn">{t.ctaCreate}</Link>
            <Link href={`/preview/${hero.id}`} className="btn ghost">{t.ctaLive}</Link>
          </div>
          <ul className="types">{EVENT_TYPES.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="phone hero-phone"><div className="phone-scroll">
          <InvitationView content={hero.content} design={hero.design} skipOpening />
        </div></div>
      </section>

      <section className="band">
        <p className="kicker">{t.whyKicker}</p>
        <h2>{t.whyTitle}</h2>
        <div className="grid3">
          {t.features.map(([h, p], i) => (
            <article key={h} className="feature"><span>{String(i + 1).padStart(2, '0')}</span><h3>{h}</h3><p>{p}</p></article>
          ))}
        </div>
      </section>

      <section className="band alt">
        <p className="kicker">{t.tplKicker}</p>
        <h2>{t.tplTitle}</h2>
        <p className="sub">{t.tplSub}</p>
        <TemplateGrid labels={{ preview: t.preview, use: t.use }} />
      </section>

      <section className="band" id="how">
        <h2>{t.howTitle}</h2>
        <ol className="steps">{t.steps.map(([h, p]) => <li key={h}><h3>{h}</h3><p>{p}</p></li>)}</ol>
      </section>

      <section className="band alt" id="faq">
        <h2>{t.faqTitle}</h2>
        <div className="faq">{t.faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section className="final">
        <h2>{t.finalTitle}</h2>
        <Link href="/templates" className="btn">{t.ctaCreate}</Link>
      </section>
      <footer className="foot">© {new Date().getFullYear()} {t.brand} · {t.footer} 🇵🇰</footer>
    </>
  )
}
