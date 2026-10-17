'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import NavLinks, { type NavItem } from './NavLinks'
import SubmitButton from './SubmitButton'

type Props = { items: NavItem[]; name: string; premium: boolean; signoutLabel: string }

/**
 * Site navigation. On wide screens it is a row of links; on phones it folds into a
 * hamburger button that opens a menu panel under the header.
 */
export default function NavMenu({ items, name, premium, signoutLabel }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => { setOpen(false) }, [pathname])  // close after navigating
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  }, [open])

  return (
    <div ref={wrap} className="nav-wrap">
      <button type="button" className={`nav-toggle${open ? ' open' : ''}`} aria-expanded={open} aria-controls="site-menu"
        aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
        <span /><span /><span />
      </button>
      <nav id="site-menu" className={open ? 'open' : ''} onClick={(e) => { if ((e.target as Element).closest('a')) setOpen(false) }}>
        <NavLinks items={items} />
        {name && (
          <div className="nav-user">
            {premium && <span className="pill premium" title="Premium is active">Premium</span>}
            <span className="who" title="Signed in">{name}</span>
            <form action="/auth/signout" method="post"><SubmitButton className="btn ghost small">{signoutLabel}</SubmitButton></form>
          </div>
        )}
      </nav>
    </div>
  )
}
