import Link from 'next/link'
import { dict } from '@/lib/i18n'
import { createClient, getLang } from '@/lib/supabase/server'

export default async function Nav() {
  const lang = await getLang()
  const t = dict[lang]
  let signedIn = false
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient()
    signedIn = !!(await supabase.auth.getUser()).data.user
  }
  return (
    <header className="nav">
      <Link href="/" className="logo"><span>D</span>{t.brand}</Link>
      <nav>
        <Link href="/templates">{t.templates}</Link>
        <Link href="/#how" className="hide-sm">{t.how}</Link>
        <Link href="/#faq" className="hide-sm">{t.faq}</Link>
        {signedIn ? (
          <>
            <Link href="/dashboard" className="btn small">{t.dashboard}</Link>
            <form action="/auth/signout" method="post"><button className="link">{t.signout}</button></form>
          </>
        ) : (
          <Link href="/login" className="btn small">{t.signin}</Link>
        )}
      </nav>
    </header>
  )
}
