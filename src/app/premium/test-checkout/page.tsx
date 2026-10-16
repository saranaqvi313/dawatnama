import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { paymentMode } from '@/lib/payments'
import { PRICE_LABEL } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

/** Stand-in for Easypaisa while PAYMENT_MODE=demo. Unavailable on the production deployment. */
export default async function TestCheckout({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  if (paymentMode() !== 'demo') notFound()
  const method = (await searchParams).method === 'easypaisa' ? 'Easypaisa account' : 'Card'
  return (
    <>
      <Nav />
      <section className="auth">
        <p className="kicker">Test checkout</p>
        <h1>{method} · {PRICE_LABEL}</h1>
        <p className="muted">This is a test page. No money is charged. On the live site, customers see Easypaisa&apos;s real payment page here.</p>
        <form action="/api/pay/demo" method="post" className="auth-form">
          <button className="btn" name="outcome" value="pay">Simulate successful payment</button>
          <button className="btn ghost" name="outcome" value="fail">Simulate failed payment</button>
        </form>
      </section>
    </>
  )
}
