import Link from 'next/link'
import LegalPage, { Contact } from '@/components/legal/LegalPage'
import { BUSINESS } from '@/lib/business'
import { PRODUCTS, rupees } from '@/lib/pricing'

export const metadata = { title: 'Terms of service — Dawatnama', description: 'The terms for using Dawatnama digital invitations.' }

export default function Terms() {
  return (
    <LegalPage title="Terms of service">
      <p>These terms apply when you use {BUSINESS.name} (“we”, “us”) to make and share digital invitation cards. By creating an account or paying, you agree to them.</p>
      <h2>Your account</h2>
      <p>You sign in with your mobile number and a one-time code sent by SMS. Keep your phone safe: anyone who can read your SMS can sign in to your account. You are responsible for what you put on your cards.</p>
      <h2>What you can put on a card</h2>
      <p>Only content you have the right to use: your own photos, names, and details. No unlawful, hateful, obscene or misleading content, and nothing that infringes someone else’s rights. We may remove a card or close an account that breaks these rules.</p>
      <h2>Prices and payment</h2>
      <ul>
        <li>Making a card and adding details, functions, photos and video is free.</li>
        <li>Guest links: {rupees(PRODUCTS.links1.price)} each, or in bundles ({PRODUCTS.links5.credits} for {rupees(PRODUCTS.links5.price)}, {PRODUCTS.links20.credits} for {rupees(PRODUCTS.links20.price)}). A link is used when you make it live.</li>
        <li>Premium design: {rupees(PRODUCTS.premium.price)}, one time, for all your cards.</li>
        <li>{PRODUCTS.shaadi.name}: {rupees(PRODUCTS.shaadi.price)} for Premium plus {PRODUCTS.shaadi.credits} guest links.</li>
      </ul>
      <p>All prices are in Pakistani rupees and include any applicable taxes unless stated. Payments are made by Visa or Mastercard through our payment partner Safepay; we never see or store your card number. Purchases are delivered to your account as soon as the payment is confirmed. See the <Link href="/refund-policy">refund policy</Link>.</p>
      <h2>Availability</h2>
      <p>We work to keep cards online and links working, but the service is provided “as is” and may occasionally be unavailable for maintenance or reasons outside our control. Unused guest links do not expire while your account is active.</p>
      <h2>Ending your account</h2>
      <p>You can ask us to delete your account and cards at any time (see contact details below). Deleting removes your cards and guest lists; it does not refund purchases already used.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, our total liability for any claim is limited to the amount you paid us in the three months before the claim.</p>
      <h2>Law</h2>
      <p>These terms are governed by the laws of Pakistan, and the courts of {BUSINESS.city} have jurisdiction.</p>
      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  )
}
