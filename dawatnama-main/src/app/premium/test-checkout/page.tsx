import { notFound } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import SubmitButton from '@/components/dawat/SubmitButton'
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
    <Shell title="Test checkout">
      <div className="w-full max-w-120 mx-auto mt-6 p-16 bg-b-surface2 rounded-3xl shadow-depth max-md:mt-0 max-md:p-6">
        <div className="mb-2 text-center"><span className="label label-yellow">Test checkout</span></div>
        <div className="mb-4 text-h4 text-center max-md:text-h5">{product.name} · {rupees(product.price)}</div>
        <div className="mb-8 text-center text-body-2 text-t-secondary">This is a test page. No money is charged. On the live site, customers enter their card on the secure payment page here.</div>
        <form action="/api/pay/demo" method="post" className="flex flex-col gap-3">
          <input type="hidden" name="product" value={product.id} />
          {ret && <input type="hidden" name="return" value={ret} />}
          <SubmitButton isBlack name="outcome" value="pay">Simulate successful payment</SubmitButton>
          <SubmitButton isStroke name="outcome" value="fail">Simulate failed payment</SubmitButton>
        </form>
      </div>
    </Shell>
  )
}
