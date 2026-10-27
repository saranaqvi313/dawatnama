'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Phone menu for the public pages: a round button that opens a simple list. */
export default function PublicMenu({ items, signedIn }: { items: (readonly [string, string])[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => { setOpen(false) }, [pathname])
  return (
    <div className="lg:hidden">
      <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}
        className="flex flex-col items-center justify-center gap-[4.5px] size-10 rounded-full bg-b-surface2 shadow-widget">
        <span className={`block w-4.5 h-[1.5px] rounded-full bg-t-primary transition-transform ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
        <span className={`block w-4.5 h-[1.5px] rounded-full bg-t-primary transition-transform ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 px-4 pb-4 bg-b-surface1 shadow-depth" onClick={(e) => { if ((e.target as Element).closest('a')) setOpen(false) }}>
          <nav className="flex flex-col p-2 rounded-3xl bg-b-surface2" aria-label="Menu">
            {items.map(([l, h]) => <Link key={h} href={h} className="px-4 py-3.5 rounded-2xl text-sub-title-1 hover:bg-b-surface1">{l}</Link>)}
            {!signedIn && <Link href="/login" className="px-4 py-3.5 rounded-2xl text-sub-title-1 hover:bg-b-surface1">Sign in</Link>}
          </nav>
        </div>
      )}
    </div>
  )
}
