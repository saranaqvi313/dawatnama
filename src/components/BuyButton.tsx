import SubmitButton from './SubmitButton'
import { rupees, type Product } from '@/lib/pricing'

/** Posts to the card payment route for one product; comes back to `returnTo` afterwards. */
export default function BuyButton({ product, returnTo, label, ghost }: { product: Product; returnTo?: string | null; label?: string; ghost?: boolean }) {
  return (
    <form action="/api/pay/card" method="post">
      <input type="hidden" name="product" value={product.id} />
      {returnTo && <input type="hidden" name="return" value={returnTo} />}
      <SubmitButton className={`btn${ghost ? ' ghost' : ''}`}>{label ?? `Pay ${rupees(product.price)}`}</SubmitButton>
    </form>
  )
}
