import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import { isCardId, paymentMode } from '@/lib/payments'
import { PRICE_LABEL, SHARE_PRICE_LABEL } from '@/lib/pricing'
import SubmitButton from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

/** Stand-in for Safepay's card page while PAYMENT_MODE=demo. Unavailable on the production deployment. */
export default async function TestCheckout({ searchParams }: { searchParams: Promise<{ for?: string; invitation?: string }> }) {
  if (paymentMode() !== 'demo') notFound()
  const sp = await searchParams
  const share = sp.for === 'share' && isCardId(String(sp.invitation ?? ''))
  return (
    <>
      <Nav />
      <section className="auth">
        <p className="kicker">Test checkout</p>
        <h1>{share ? `Share link · ${SHARE_PRICE_LABEL}` : `Card payment · ${PRICE_LABEL}`}</h1>
        <p className="muted">This is a test page. No money is charged. On the live site, customers enter their card on the secure payment page here.</p>
        <form action="/api/pay/demo" method="post" className="auth-form">
          {share && <><input type="hidden" name="for" value="share" /><input type="hidden" name="invitation" value={sp.invitation} /></>}
          <SubmitButton className="btn" name="outcome" value="pay">Simulate successful payment</SubmitButton>
          <SubmitButton className="btn ghost" name="outcome" value="fail">Simulate failed payment</SubmitButton>
        </form>
      </section>
    </>
  )
}
