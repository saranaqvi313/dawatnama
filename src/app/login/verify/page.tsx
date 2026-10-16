import Nav from '@/components/Nav'
import OtpScreen from '@/components/OtpScreen'
import { OTP_LENGTH } from '@/lib/identity'

export const metadata = { title: 'Enter your code — Dawatnama' }

export default function Verify() {
  return (
    <>
      <Nav />
      <section className="auth">
        <h1>Sign in</h1>
        <OtpScreen length={OTP_LENGTH} />
      </section>
    </>
  )
}
