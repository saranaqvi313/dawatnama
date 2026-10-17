'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BUSINESS } from '@/lib/business'

// Pages of the site itself. Card links (your-site.com/<name>) stay clean, with no footer.
const SITE = ['/', '/templates', '/premium', '/login', '/dashboard', '/design', '/preview', '/terms', '/privacy', '/refund-policy', '/contact', '/cards', '/admin']

export default function Footer() {
  const path = usePathname() || '/'
  if (!SITE.some((p) => path === p || (p !== '/' && path.startsWith(`${p}/`)))) return null
  if (path.startsWith('/design/')) return null
  return (
    <footer className="site-foot">
      <div>
        <b>{BUSINESS.name}</b>
        <p className="muted">Digital shadi cards and invitations for Pakistan.</p>
      </div>
      <nav aria-label="Footer">
        <Link href="/cards">Card ideas</Link>
        <Link href="/premium">Plans and prices</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/refund-policy">Refunds</Link>
      </nav>
      <p className="muted small-note">© {new Date().getFullYear()} {BUSINESS.name} · Payments by Safepay (Visa, Mastercard)</p>
    </footer>
  )
}
