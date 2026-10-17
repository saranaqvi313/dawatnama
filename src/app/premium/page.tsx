import Link from 'next/link'
import Nav from '@/components/Nav'
import BuyButton from '@/components/BuyButton'
import { paymentMode, safeReturn } from '@/lib/payments'
import { isPremium, linkCredits } from '@/lib/premium'
import { PRODUCTS, rupees } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Plans and prices — Dawatnama' }
export const dynamic = 'force-dynamic'

const RESULT: Record<string, { cls: string; text: string }> = {
  paid: { cls: 'ok', text: 'Payment successful. It has been added to your account.' },
  failed: { cls: 'err', text: 'We could not confirm this payment. Please try again. If money was taken from your card, contact us with the time of payment and we will sort it out.' },
  cancelled: { cls: 'muted', text: 'Payment cancelled. You have not been charged.' },
  error: { cls: 'err', text: 'We could not start the payment. Please try again in a minute.' },
  unavailable: { cls: 'err', text: 'Payments are not set up on this site yet.' },
}

export default async function Plans({ searchParams }: { searchParams: Promise<{ result?: string; return?: string; from?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  const [premium, credits] = await Promise.all([isPremium(supabase, user?.id), linkCredits(supabase, user?.id)])
  const mode = paymentMode()
  const result = sp.result ? RESULT[sp.result] : undefined
  const ret = safeReturn(sp.return)
  const canBuy = Boolean(user) && mode !== 'off'
  const L = PRODUCTS

  const buy = (p: (typeof L)[keyof typeof L], label?: string, ghost?: boolean) =>
    !user ? <Link href={`/login?next=${encodeURIComponent('/premium')}`} className={`btn${ghost ? ' ghost' : ''}`}>Sign in to buy</Link>
      : canBuy ? <BuyButton product={p} returnTo={ret} label={label} ghost={ghost} />
        : null

  return (
    <>
      <Nav />
      <section className="band plans">
        <header className="plans-head">
          <h1>Plans and prices</h1>
          <p className="muted">Making a card is free. You pay for the links you send, and for Premium design if you want it. Pay by Visa or Mastercard from any bank.</p>
          {user && (
            <p className="plans-balance">
              You have <b>{credits}</b> guest link{credits === 1 ? '' : 's'} to use{premium ? ' · Premium is active' : ''}.
            </p>
          )}
          {result && <p className={`notice ${result.cls}`} role="status">{result.text}</p>}
          {sp.from === 'designer' && !premium && <p className="notice muted">The drag-and-drop designer is part of Premium.</p>}
          {user && mode === 'off' && <p className="err">Payments are not set up on this site yet. Please check back soon.</p>}
          {mode === 'demo' && <p className="notice muted">Test mode: no real money is charged.</p>}
        </header>

        <div className="plan-feature">
          <div>
            <h2>{L.shaadi.name}</h2>
            <p>{L.shaadi.blurb}</p>
            <ul className="perks">
              <li>Premium design and the drag-and-drop designer</li>
              <li>{L.shaadi.credits} personal guest links, each addressed to the guest by name</li>
              <li>Guest list upload, WhatsApp invites and reminders, RSVP per function</li>
            </ul>
          </div>
          <div className="plan-price">
            <b>{rupees(L.shaadi.price)}</b>
            <span className="muted">instead of <s>{rupees(L.premium.price + L.links1.price * L.shaadi.credits)}</s></span>
            {buy(L.shaadi, 'Get the Shaadi package')}
          </div>
        </div>

        <h2 className="plans-sub">Guest links</h2>
        <p className="muted plans-note">Each guest gets their own link, like <span dir="ltr">your-site.com/ali-khan</span>. The card greets them by name, and you see when they open it and what they reply.</p>
        <div className="plan-grid">
          {[L.links1, L.links5, L.links20].map((p) => (
            <article key={p.id} className="plan">
              <h3>{p.name}</h3>
              <p className="plan-amount"><b>{rupees(p.price)}</b>{p.credits > 1 && <span className="muted"> · {rupees(Math.round(p.price / p.credits))} each</span>}</p>
              <p className="muted">{p.blurb}</p>
              {buy(p, `Buy ${p.credits === 1 ? '1 link' : `${p.credits} links`}`, p.id !== 'links5')}
            </article>
          ))}
        </div>

        <h2 className="plans-sub">Premium design</h2>
        <article className="plan plan-wide">
          <div>
            <h3>{rupees(L.premium.price)} <span className="muted">one time, for all your cards</span></h3>
            <p className="muted">{L.premium.blurb} Colours, fonts, calligraphy names, fairy-tale scenes, opening effects, and the drag-and-drop designer.</p>
          </div>
          {premium ? <p className="ok">Premium is active on your account.</p> : buy(L.premium, `Get Premium for ${rupees(L.premium.price)}`, true)}
        </article>
        {ret && <p><Link href={ret}>← Back to your card</Link></p>}
      </section>
    </>
  )
}
