import Link from 'next/link'
import { dict } from '@/lib/i18n'
import { createClient, getLang } from '@/lib/supabase/server'
import { displayName, isPremium } from '@/lib/premium'
import { type NavItem } from './NavLinks'
import NavMenu from './NavMenu'

export default async function Nav() {
  const lang = await getLang()
  const t = dict[lang]
  let name = ''
  let premium = false
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      name = displayName(user)
      premium = await isPremium(supabase, user.id)
    }
  }
  const items: NavItem[] = [
    { href: '/templates', label: t.templates, match: ['/templates', '/preview'] },
    { href: '/#how', label: t.how, className: 'hide-sm' },
    { href: '/#faq', label: t.faq, className: 'hide-sm' },
  ]
  if (name) {
    items.push({ href: '/dashboard', label: t.dashboard, match: ['/dashboard', '/design'] })
  }
  items.push({ href: '/premium', label: premium ? 'Plans' : 'Plans & prices', match: ['/premium'], className: 'hide-sm premium-link' })
  if (!name) {
    items.push({ href: '/login', label: t.signin, match: ['/login'], className: 'nav-cta' })
  }
  return (
    <header className="nav">
      <Link href="/" className="logo"><span>D</span>{t.brand}</Link>
      <NavMenu items={items} name={name} premium={premium} signoutLabel={t.signout} />
    </header>
  )
}
