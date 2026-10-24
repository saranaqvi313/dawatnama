import Link from 'next/link'
import Icon from '@/components/Icon'
import Shell from '@/components/dawat/Shell'
import { SEO_PAGES } from '@/lib/seoPages'

export const metadata = { title: 'Invitation card ideas — Mehndi, Nikah, Baraat, Walima | Dawatnama', description: 'Digital invitation cards for every function of a Pakistani wedding and more.' }

export default function Cards() {
  return (
    <Shell title="Card ideas">
      <div className="card">
        <div className="flex items-center h-12 pl-5 max-lg:pl-3">
          <h1 className="mr-auto text-h6">Invitation cards for every function</h1>
        </div>
        <div className="flex flex-col gap-1 pt-3">
          {SEO_PAGES.map((p) => (
            <Link key={p.slug} href={`/cards/${p.slug}`} className="group relative flex items-center gap-5 px-3 py-5">
              <div className="box-hover"></div>
              <div className="relative z-2 flex shrink-0 justify-center items-center size-12 rounded-full bg-b-surface1">
                <Icon className="fill-t-secondary transition-colors group-hover:fill-t-primary" name="calendar-1" />
              </div>
              <div className="relative z-2 grow min-w-0">
                <div className="text-sub-title-1">{p.h1}</div>
                <div className="mt-1 text-body-2 text-t-secondary line-clamp-2">{p.description}</div>
              </div>
              <Icon className="relative z-2 shrink-0 fill-t-secondary transition-colors group-hover:fill-t-primary" name="arrow" />
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}
