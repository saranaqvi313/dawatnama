import Link from 'next/link'
import Nav from '@/components/Nav'
import PayWithEasypaisa from '@/components/PayWithEasypaisa'
import PendingCheck from '@/components/PendingCheck'
import { paymentMode } from '@/lib/payments'
import { isPremium } from '@/lib/premium'
import { PRICE_LABEL } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Premium — Dawatnama' }
export const dynamic = 'force-dynamic'

const PERKS = [
  'Drag-and-drop designer: move, resize and style text, photos and ornaments anywhere on the card',
  'Change colours, fonts, background artwork, opening animation, 3D effects and card style',
  'Premium design templates to start from',
  'Unlocks every card on your account, now and later',
]

const RESULT: Record<string, { cls: string; text: string }> = {
  paid: { cls: 'ok', text: 'Payment successful. Premium is now active on your account.' },
  failed: { cls: 'err', text: 'The payment did not go through. You have not been charged. Please try again.' },
  pending: { cls: 'muted', text: 'Your payment is being confirmed by Easypaisa. This page will update automatically.' },
  unavailable: { cls: 'err', text: 'Payments are not set up on this site yet.' },
}

export default async function Premium({ searchParams }: { searchParams: Promise<{ result?: string; order?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const premium = await isPremium(supabase, user?.id)
  const mode = paymentMode()
  const result = sp.result ? RESULT[sp.result] : undefined

  return (
    <>
      <Nav />
      <section className="band premium-page">
        <div className="premium-card">
          <p className="kicker">Dawatnama Premium</p>
          <h1>Design your card your way</h1>
          <p className="price"><b>{PRICE_LABEL}</b> <span className="muted">one time, for all your cards</span></p>
          <ul className="perks">{PERKS.map((p) => <li key={p}>{p}</li>)}</ul>

          {result && <p className={`notice ${result.cls}`} role="status">{result.text}</p>}
          {sp.result === 'pending' && sp.order && <PendingCheck order={sp.order} />}

          {premium ? (
            <div className="premium-active">
              <p className="ok">Premium is active on your account.</p>
              <div className="cta">
                <Link href="/#designs" className="btn">Open the designer</Link>
                <Link href="/dashboard" className="btn ghost">My invitations</Link>
              </div>
            </div>
          ) : !user ? (
            <Link href="/login?next=/premium" className="btn">Sign in to continue</Link>
          ) : mode === 'off' ? (
            <p className="err">Payments are not set up on this site yet. Please check back soon.</p>
          ) : (
            <div className="pay-options">
              {mode === 'demo' && <p className="notice muted">Test mode: no real money is charged.</p>}
              <h2>Choose how to pay</h2>
              <form action="/api/pay/card" method="post" className="pay-option">
                <div>
                  <h3>Debit or credit card</h3>
                  <p className="muted">Visa or Mastercard, on Easypaisa&apos;s secure card page.</p>
                </div>
                <button className="btn">Pay {PRICE_LABEL} by card</button>
              </form>
              <PayWithEasypaisa price={PRICE_LABEL} defaultMobile={user.phone ? `0${user.phone.replace(/^\+?92/, '')}` : ''} />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
