import LegalPage, { Contact } from '@/components/dawat/legal/LegalPage'
import { BUSINESS } from '@/lib/business'

export const metadata = { title: 'Privacy policy — Dawatnama', description: 'What Dawatnama collects, why, and how it is protected.' }

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>{BUSINESS.name} collects only what is needed to make and share your invitations.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Your account:</b> your mobile number and the name you give us.</li>
        <li><b>Your cards:</b> the names, functions, venues, photos, videos and messages you add.</li>
        <li><b>Your guest list:</b> guests’ names and, if you add them, their mobile numbers and how many people are invited.</li>
        <li><b>Replies from guests:</b> what guests send through the RSVP form, and when a guest link is opened.</li>
        <li><b>Payments:</b> the amount, time and result of each payment. Card details are handled by Safepay and never reach us.</li>
        <li><b>Technical logs:</b> error reports to help us fix problems.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run your account, show your cards to the people you share them with, keep your sign-in secure, take payments, and keep the service secure. We do not sell your data or your guests’ data, and we do not use guest numbers to contact them.</p>
      <h2>Who can see what</h2>
      <p>Cards are visible only through the links you make live. Guest lists, replies and open counts are visible only to you. Our service providers (Supabase for hosting the database and files, Vercel for the website, and Safepay for payments) process data on our behalf.</p>
      <h2>How long we keep it</h2>
      <p>For as long as your account is active. Ask us to delete your account and we will remove your cards, guest lists and replies within 30 days, except payment records we must keep by law.</p>
      <h2>Your choices</h2>
      <p>You can edit or delete cards and guests at any time from your dashboard, and ask us for a copy or deletion of your data.</p>
      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  )
}
