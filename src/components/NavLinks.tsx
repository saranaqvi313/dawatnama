'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { href: string; label: string; match?: string[]; className?: string }

/** Nav links with a hover effect; the page you are on is highlighted. */
export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <>
      {items.map((it) => {
        const active = (it.match ?? []).some((m) => pathname === m || pathname.startsWith(`${m}/`))
        return (
          <Link key={it.href} href={it.href} className={`nav-link${active ? ' active' : ''}${it.className ? ` ${it.className}` : ''}`}
            aria-current={active ? 'page' : undefined}>
            {it.label}
          </Link>
        )
      })}
    </>
  )
}
