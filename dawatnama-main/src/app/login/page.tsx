import { redirect } from 'next/navigation'
import Shell from '@/components/dawat/Shell'
import LoginForm from '@/components/dawat/LoginForm'
import { OTP_ENABLED } from '@/lib/otp'
import { safeNext } from '@/lib/identity'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Sign in — Dawatnama' }

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  const viewer = await getViewer()
  if (viewer) redirect(next)
  return (
    <Shell viewer={null}>
      <div className="w-full max-w-120 mx-auto mt-6 p-16 bg-b-surface2 rounded-3xl shadow-depth max-md:mt-0 max-md:p-6">
        <LoginForm next={next} otp={OTP_ENABLED} />
      </div>
    </Shell>
  )
}
