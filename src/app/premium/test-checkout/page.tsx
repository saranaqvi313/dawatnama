import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import SubmitButton from '@/components/SubmitButton'
import { paymentMode, safeReturn } from '@/lib/payments'
import { PRODUCTS, isProductId, rupees } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

/** Stand-in for Safepay's card page while PAYMENT_MODE=demo. Unavailable on the production deployment. */
export default async function TestCheckout({ searchParams }: { searchParams: Promise<{ product?: string; return?: string }> }) {
  if (paymentMode() !== 'demo') notFound()
  const sp = await searchParams
  const product = PRODUCTS[isProductId(String(sp.product)) ? (sp.product as keyof typeof PRODUCTS) : 'premium']
  const ret = safeReturn(sp.return)
  return (
    <>
      <Nav />
      <section className="auth">
        <p className="kicker">Test checkout</p>
        <h1>{product.name} · {rupees(product.price)}</h1>
        <p className="muted">This is a test page. No money is charged. On the live site, customers enter their card on the secure payment page here.</p>
        <form action="/api/pay/demo" method="post" className="auth-form">
          <input type="hidden" name="product" value={product.id} />
          {ret && <input type="hidden" name="return" value={ret} />}
          <SubmitButton className="btn" name="outcome" value="pay">Simulate successful payment</SubmitButton>
          <SubmitButton className="btn ghost" name="outcome" value="fail">Simulate failed payment</SubmitButton>
        </form>
      </section>
    </>
  )
}
