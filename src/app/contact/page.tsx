import LegalPage, { Contact } from '@/components/legal/LegalPage'
import { BUSINESS } from '@/lib/business'

export const metadata = { title: 'Contact — Dawatnama', description: 'Get in touch with Dawatnama for help with cards, payments or refunds.' }

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <p>Questions about a card, a payment or a refund? We usually reply within one working day.</p>
      <Contact />
      {BUSINESS.whatsapp && (
        <p><a className="btn" href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, '').replace(/^0/, '92')}`} target="_blank" rel="noreferrer">Message us on WhatsApp</a></p>
      )}
      <p className="muted">For payment questions, please include the mobile number on your account and the time of payment.</p>
    </LegalPage>
  )
}
