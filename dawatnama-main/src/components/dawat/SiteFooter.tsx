import Link from 'next/link'
import { BUSINESS } from '@/lib/business'

const links = [
  ['Card ideas', '/cards'],
  ['Plans and prices', '/premium'],
  ['Contact', '/contact'],
  ['Terms', '/terms'],
  ['Privacy', '/privacy'],
  ['Refunds', '/refund-policy'],
]

/** Small line of legal links under every dashboard page (payment providers ask for these). */
export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 px-5 text-caption text-t-tertiary max-lg:px-3">
      <span>© {new Date().getFullYear()} {BUSINESS.name} · Payments by Safepay (Visa, Mastercard)</span>
      <nav className="flex flex-wrap gap-x-4 gap-y-1 ml-auto max-md:ml-0" aria-label="Footer">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition-colors hover:text-t-primary">{label}</Link>
        ))}
      </nav>
    </footer>
  )
}
