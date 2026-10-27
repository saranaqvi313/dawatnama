import type { ReactNode } from 'react'
import PublicShell from '../PublicShell'
import { getViewer } from '@/lib/viewer'
import { BUSINESS } from '@/lib/business'

/** Text styles for long-form pages, using the kit's type scale. */
export const PROSE = 'text-body-1 text-t-secondary [&_h1]:text-h3 [&_h1]:text-t-primary [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-h5 [&_h2]:text-t-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-h6 [&_h3]:text-t-primary [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-2 [&_b]:text-t-primary [&_b]:font-semibold [&_a:not([class])]:text-t-primary [&_a:not([class])]:underline [&_a:not([class])]:underline-offset-4 hover:[&_a:not([class])]:text-primary-01'

export default async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicShell viewer={await getViewer()}>
      <div className="max-w-300 mx-auto px-6 max-md:px-4"><div className="card px-12 py-16 max-lg:p-8 max-lg:px-6 max-md:px-5">
        <article className={`max-w-180 mx-auto ${PROSE}`}>
          <h1 className="mb-2">{title}</h1>
          <p className="!mb-10 text-caption text-t-tertiary">Last updated {BUSINESS.updated}</p>
          {children}
        </article>
      </div></div>
    </PublicShell>
  )
}

export function Contact() {
  return (
    <ul>
      {BUSINESS.email && <li>Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>}
      {BUSINESS.phone && <li>Phone / WhatsApp: <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a></li>}
      <li>Address: {BUSINESS.address}</li>
    </ul>
  )
}
