import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { paymentMode } from '@/lib/payments'
import { PRICE_LABEL } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

/** Stand-in for Safepay's card page while PAYMENT_MODE=demo. Unavailable on the production deployment. */
export default async function TestCheckout() {
  if (paymentMode() !== 'demo') notFound()
  return (
    <>
      <Nav />
      <section className="auth">
        <p className="kicker">Test checkout</p>
        <h1>Card payment · {PRICE_LABEL}</h1>
        <p className="muted">This is a test page. No money is charged. On the live site, customers enter their card on the secure payment page here.</p>
        <form action="/api/pay/demo" method="post" className="auth-form">
          <button className="btn" name="outcome" value="pay">Simulate successful payment</button>
          <button className="btn ghost" name="outcome" value="fail">Simulate failed payment</button>
        </form>
      </section>
    </>
  )
}
