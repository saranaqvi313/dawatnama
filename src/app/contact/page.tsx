import Button from '@/components/Button'
import LegalPage, { Contact } from '@/components/dawat/legal/LegalPage'
import { BUSINESS } from '@/lib/business'

export const metadata = { title: 'Contact — Dawatnama', description: 'Get in touch with Dawatnama for help with cards, payments or refunds.' }

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <p>Questions about a card, a payment or a refund? We usually reply within one working day.</p>
      <Contact />
      {BUSINESS.whatsapp && (
        <p><Button isBlack as="a" href={`https://wa.me/${BUSINESS.whatsapp.replace(/\D/g, '').replace(/^0/, '92')}`} target="_blank" rel="noreferrer">Message us on WhatsApp</Button></p>
      )}
      <p>For payment questions, please include the mobile number on your account and the time of payment.</p>
    </LegalPage>
  )
}
