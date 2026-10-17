import LegalPage, { Contact } from '@/components/legal/LegalPage'

export const metadata = { title: 'Refund policy — Dawatnama', description: 'When and how Dawatnama refunds payments.' }

export default function Refunds() {
  return (
    <LegalPage title="Refund and cancellation policy">
      <p>Everything we sell is digital and delivered to your account immediately after payment.</p>
      <h2>When you can get a refund</h2>
      <ul>
        <li><b>Charged but nothing added</b> (for example, the payment went through but your links or Premium did not appear): full refund, or we add what you paid for, your choice.</li>
        <li><b>Charged twice</b> for the same purchase: the extra payment is refunded in full.</li>
        <li><b>Unused guest links:</b> links you have not made live can be refunded within 7 days of purchase.</li>
        <li><b>Premium:</b> refundable within 7 days of purchase if you have not published a card with a Premium design.</li>
      </ul>
      <h2>When we can’t refund</h2>
      <p>Guest links that have been made live, and Premium after a Premium design has been shared, cannot be refunded, because the service has been delivered.</p>
      <h2>How to ask</h2>
      <p>Contact us with the mobile number on your account, the date and time of payment, and the amount. We reply within 3 working days. Approved refunds go back to the same card through Safepay, and usually reach your account within 7 to 14 working days depending on your bank.</p>
      <h2>Contact</h2>
      <Contact />
    </LegalPage>
  )
}
