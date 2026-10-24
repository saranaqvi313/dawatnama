import Card from '@/components/Card'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { PRODUCTS, rupees } from '@/lib/pricing'

/** Your plan: Premium on/off and guest links left, with the kit's promo-card look. */
export default function PlanCard({ premium, credits }: { premium: boolean; credits: number }) {
  return (
    <Card title="Your plan" headContent={<span className={`mr-3 label ${premium ? 'label-green' : 'label-gray'}`}>{premium ? 'Premium' : 'Free'}</span>}>
      <div className="px-5 pb-5 max-lg:px-3 max-lg:pb-3">
        <div className="flex items-center gap-4 mb-6 p-5 rounded-3xl border border-s-subtle bg-b-depth2">
          <div className="flex shrink-0 items-center justify-center size-12 rounded-full bg-b-surface2 shadow-depth-toggle"><Icon className="fill-t-primary" name="link" /></div>
          <div>
            <div className="text-h4 leading-none">{credits}</div>
            <div className="mt-1 text-caption text-t-secondary">guest link{credits === 1 ? '' : 's'} left · {rupees(PRODUCTS.links1.price)} each, less in bundles</div>
          </div>
        </div>
        <div className="mb-6 text-body-2 text-t-secondary">
          {premium
            ? 'Premium is active: colours, fonts, calligraphy names, fairy-tale scenes, openings and the drag-and-drop designer are unlocked for all your cards.'
            : `Making cards is free. Premium (${rupees(PRODUCTS.premium.price)}, one time) unlocks the design: scenes, calligraphy names, openings and the designer.`}
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" isBlack as="link" href="/premium">Buy links</Button>
          {!premium && <Button className="flex-1" isStroke as="link" href="/premium">Get Premium</Button>}
        </div>
      </div>
    </Card>
  )
}
