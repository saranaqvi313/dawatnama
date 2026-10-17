import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import LoginForm from '@/components/LoginForm'
import { OTP_ENABLED } from '@/lib/otp'
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
        <p>{OTP_ENABLED ? t.loginSub : 'Enter your mobile number to continue. No password needed.'}</p>
        <LoginForm next={next} otp={OTP_ENABLED} />
      </section>
    </>
  )
}
