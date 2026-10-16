import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import LoginForm from '@/components/LoginForm'
import { dict } from '@/lib/i18n'
import { safeNext } from '@/lib/identity'
import { createClient, getLang } from '@/lib/supabase/server'

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = dict[await getLang()]
  const next = safeNext((await searchParams).next)
  const { data } = await (await createClient()).auth.getUser()
  if (data.user) redirect(next)
  return (
    <>
      <Nav />
      <section className="auth">
        <h1>{t.loginTitle}</h1>
        <p>{t.loginSub}</p>
        <LoginForm next={next} />
      </section>
    </>
  )
}
