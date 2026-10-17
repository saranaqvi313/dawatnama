import Link from 'next/link'
import Nav from '@/components/Nav'
import { SEO_PAGES } from '@/lib/seoPages'

export const metadata = { title: 'Invitation card ideas — Mehndi, Nikah, Baraat, Walima | Dawatnama', description: 'Digital invitation cards for every function of a Pakistani wedding and more.' }

export default function Cards() {
  return (
    <>
      <Nav />
      <section className="band seo">
        <h1>Invitation cards for every function</h1>
        <ul className="seo-index">
          {SEO_PAGES.map((p) => <li key={p.slug}><Link href={`/cards/${p.slug}`}><b>{p.h1}</b><span className="muted">{p.description}</span></Link></li>)}
        </ul>
      </section>
    </>
  )
}
