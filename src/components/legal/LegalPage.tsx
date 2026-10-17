import type { ReactNode } from 'react'
import Nav from '../Nav'
import { BUSINESS } from '@/lib/business'

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Nav />
      <article className="legal">
        <h1>{title}</h1>
        <p className="muted">Last updated {BUSINESS.updated}</p>
        {children}
      </article>
    </>
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
