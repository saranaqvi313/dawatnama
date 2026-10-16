import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="auth">
      <h1>Not found</h1>
      <p>This page or invitation does not exist, or it has not been published yet.</p>
      <Link href="/" className="btn">Go home</Link>
    </section>
  )
}
