import Link from 'next/link'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import Shell from '@/components/dawat/Shell'
import BuyButton from '@/components/dawat/BuyButton'
import FaqList from '@/components/dawat/FaqList'
import { paymentMode, safeReturn } from '@/lib/payments'
import { FREE_MODE, PRODUCTS, rupees, type Product } from '@/lib/pricing'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Plans and prices — Dawatnama' }
export const dynamic = 'force-dynamic'

const RESULT: Record<string, { cls: string; text: string }> = {
  paid: { cls: 'label-green', text: 'Payment successful. It has been added to your account.' },
  failed: { cls: 'label-red', text: 'We could not confirm this payment. Please try again. If money was taken from your card, contact us with the time of payment and we will sort it out.' },
  cancelled: { cls: 'label-gray', text: 'Payment cancelled. You have not been charged.' },
  error: { cls: 'label-red', text: 'We could not start the payment. Please try again in a minute.' },
  unavailable: { cls: 'label-red', text: 'Payments are not set up on this site yet.' },
}

const Notice = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <div className={`label ${cls} !h-auto min-h-7 py-1.5 !px-3 justify-center text-center max-w-142 mx-auto mb-3 !leading-normal`} role="status">{children}</div>
)

export default async function Plans({ searchParams }: { searchParams: Promise<{ result?: string; return?: string; from?: string }> }) {
  const sp = await searchParams
  const viewer = await getViewer()
  if (FREE_MODE) return (
    <Shell title="Plans" viewer={viewer}>
      <div className="card">
        <div className="pt-20 pb-24 text-center max-md:py-14">
          <div className="flex items-center justify-center size-16 mx-auto mb-6 rounded-full bg-primary-02/15"><Icon className="fill-primary-02" name="check" /></div>
          <div className="mb-2 text-h4 max-md:text-h5">Everything is free</div>
          <div className="max-w-120 mx-auto mb-8 text-sub-title-1 text-t-tertiary">Every design tool, animations, the designer, guest links and card links. Nothing to buy.</div>
          <Button isBlack as="link" href={safeReturn(sp.return) || '/templates'}>{sp.return ? 'Back to your card' : 'Make a card'}</Button>
        </div>
      </div>
    </Shell>
  )
  const premium = Boolean(viewer?.premium)
  const credits = viewer?.credits ?? 0
  const mode = paymentMode()
  const result = sp.result ? RESULT[sp.result] : undefined
  const ret = safeReturn(sp.return)
  const canBuy = Boolean(viewer) && mode !== 'off'
  const L = PRODUCTS

  const buy = (p: Product, label: string, ghost?: boolean) =>
    !viewer ? <Button className="w-full" isBlack={!ghost} isStroke={ghost} as="link" href={`/login?next=${encodeURIComponent('/premium')}`}>Sign in to buy</Button>
      : canBuy ? <BuyButton className="w-full" product={p} returnTo={ret} label={label} ghost={ghost} />
        : <Button className="w-full" isStroke disabled>Payments not set up</Button>

  const plans = [
    {
      key: 'links', title: 'Guest links', price: rupees(L.links1.price), unit: 'per guest',
      text: 'A personal link for each guest, like your-site.com/ali-khan. The card greets them by name.',
      action: buy(L.links1, 'Buy 1 link', true),
      features: ['Card greets the guest by name', 'See who opened it', 'RSVP per function', 'WhatsApp invite and reminder', 'QR code for every link'],
    },
    {
      key: 'shaadi', title: L.shaadi.name, price: rupees(L.shaadi.price), unit: `instead of ${rupees(L.premium.price + L.links1.price * L.shaadi.credits)}`, highlight: true,
      text: L.shaadi.blurb,
      action: buy(L.shaadi, 'Get the package'),
      features: ['Everything in Premium design', `${L.shaadi.credits} personal guest links`, 'Guest list upload from Excel', 'Food headcount for every function', 'WhatsApp invites and reminders'],
    },
    {
      key: 'premium', title: 'Premium design', price: rupees(L.premium.price), unit: 'one time, all cards',
      text: L.premium.blurb,
      action: premium ? <Button className="w-full" isStroke disabled>Your current plan</Button> : buy(L.premium, 'Get Premium', true),
      features: ['Fairy-tale scenes and openings', 'Calligraphy names with gold foil', 'Colours, fonts and card styles', 'Drag-and-drop designer', 'Photos, gallery and video'],
    },
  ]

  const faqs: [string, string][] = [
    ['What is free?', 'Making a card and adding your details, functions, photos and video is free. You pay only for the links you send, and for Premium design if you want it.'],
    ['What is a guest link?', `A personal link for one guest (or family). It costs ${rupees(L.links1.price)}, less in bundles. A link is used when you make it live, and unused links never expire.`],
    ['Can I use links on different cards?', 'Yes. Links are kept on your account, so you can use them on any of your cards, for example Mehndi on one card and Walima on another.'],
    ['How do I pay?', 'With any Visa or Mastercard debit or credit card, from any bank, on Safepay\'s secure payment page. Your purchase is added as soon as the payment is confirmed.'],
    ['Can I get a refund?', 'See our refund policy. If something went wrong with a payment, contact us with the time of payment and we will sort it out.'],
  ]

  return (
    <Shell title="Plans and prices" viewer={viewer}>
      <div className="card px-12 py-22 max-lg:p-8 max-lg:px-6">
        <div className="max-w-215 mx-auto">
          <div className="mb-22 max-md:mb-14">
            <div className="mb-16 text-center max-lg:mb-12 max-md:mb-10 max-md:text-left">
              <div className="max-w-160 mx-auto mb-4 text-h3 max-lg:max-w-120 max-lg:text-h4">Making a card is free. Pay only for what you send.</div>
              <div className="max-w-142 mx-auto mb-4 text-[1.125rem] font-medium tracking-[-0.01em] text-t-secondary">
                Guest links for the people you invite, and Premium if you want to design every detail. Pay by Visa or Mastercard from any bank.
              </div>
              {viewer && (
                <div className="flex flex-wrap justify-center gap-2 mb-4 max-md:justify-start">
                  <span className="label label-gray">{credits} guest link{credits === 1 ? '' : 's'} to use</span>
                  <span className={`label ${premium ? 'label-green' : 'label-gray'}`}>{premium ? 'Premium is active' : 'Free plan'}</span>
                </div>
              )}
              {result && <Notice cls={result.cls}>{result.text}</Notice>}
              {sp.from === 'designer' && !premium && <Notice cls="label-yellow">The drag-and-drop designer is part of Premium.</Notice>}
              {mode === 'demo' && <Notice cls="label-yellow">Test mode: no real money is charged.</Notice>}
            </div>
            <div className="flex max-md:overflow-x-auto max-md:scrollbar-none max-md:-mx-6 max-md:before:shrink-0 max-md:before:w-2 max-md:after:shrink-0 max-md:after:w-6">
              {plans.map((item) => (
                <div key={item.key}
                  className={`flex-1 min-w-0 pt-15 px-3 pb-10 max-lg:pt-8 max-lg:pb-7 max-md:flex-auto max-md:shrink-0 max-md:w-80 ${item.highlight ? 'relative border border-s-stroke2 rounded-[2.5rem]' : ''}`}>
                  {item.highlight && (
                    <div className="absolute top-6 right-6 flex items-center justify-center size-16 pb-0.5 border border-s-stroke2 rounded-full max-lg:top-4 max-lg:right-4 max-lg:size-11">
                      <Icon className="fill-t-secondary" name="star-stroke-think" />
                    </div>
                  )}
                  <div className="mb-8 pl-6 pr-16 text-h4 max-lg:mb-5 max-lg:pl-5 max-lg:text-h5">{item.title}</div>
                  <div className={`mb-8 px-6 py-6 border rounded-3xl max-lg:mb-5 max-lg:p-5 ${item.highlight ? 'border-s-stroke2 shadow-depth' : 'border-s-subtle'}`}>
                    <div className="mb-2 text-h3 whitespace-nowrap max-lg:text-h4">{item.price}</div>
                    <div className="mb-5 text-body-2 text-t-secondary">{item.unit}</div>
                    <div className="mb-5 text-body-2 text-t-secondary">{item.text}</div>
                    {item.action}
                  </div>
                  <div className="flex flex-col gap-4 px-6 max-lg:pl-5 max-lg:pr-0">
                    {item.features.map((feature) => (
                      <div className="flex items-center gap-4 max-lg:gap-2 max-lg:text-body-2" key={feature}>
                        <Icon className={`shrink-0 ${item.highlight ? 'fill-t-primary' : 'fill-t-secondary/50'}`} name="check-circle-fill" />
                        <div>{feature}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-22 max-md:mb-14">
            <h2 className="mb-10 text-center text-h3 max-lg:mb-6 max-lg:text-h4 max-md:text-left">Link bundles</h2>
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              {[L.links1, L.links5, L.links20].map((p) => (
                <div key={p.id} className={`p-6 border rounded-3xl ${p.id === 'links5' ? 'border-s-stroke2 shadow-depth' : 'border-s-subtle'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sub-title-1">{p.name}</div>
                    {p.id === 'links5' && <span className="label label-green">Popular</span>}
                  </div>
                  <div className="mb-1 text-h4">{rupees(p.price)}</div>
                  <div className="mb-5 text-caption text-t-secondary">{p.credits > 1 ? `${rupees(Math.round(p.price / p.credits))} each · ` : ''}{p.blurb}</div>
                  {buy(p, `Buy ${p.credits === 1 ? '1 link' : `${p.credits} links`}`, p.id !== 'links5')}
                </div>
              ))}
            </div>
            {ret && <div className="mt-6 text-center"><Link className="text-button text-t-secondary transition-colors hover:text-t-primary" href={ret}>← Back to your card</Link></div>}
          </div>

          <div>
            <h2 className="mb-10 text-center text-h3 max-lg:mb-6 max-lg:text-h4 max-md:text-left">Frequently asked questions</h2>
            <FaqList items={faqs} />
          </div>
        </div>
      </div>
    </Shell>
  )
}
