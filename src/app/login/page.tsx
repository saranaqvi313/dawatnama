import Nav from '@/components/Nav'
import LoginForm from '@/components/LoginForm'
import { dict } from '@/lib/i18n'
import { getLang } from '@/lib/supabase/server'

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const t = dict[await getLang()]
  const sp = await searchParams
  const next = sp.next && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/dashboard'
  return (
    <>
      <Nav />
      <section className="auth">
        <h1>{t.loginTitle}</h1>
        <p>{t.loginSub}</p>
        {sp.error && <p className="err" role="alert">That link has expired or was already used. Please request a new one.</p>}
        <LoginForm next={next} labels={{ email: t.email, send: t.sendLink, sent: t.linkSent }} />
      </section>
    </>
  )
}
