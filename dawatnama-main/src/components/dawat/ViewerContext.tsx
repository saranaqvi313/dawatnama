'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Viewer } from '@/lib/viewer'

/** undefined = not known yet; null = signed out. */
const ViewerContext = createContext<{ viewer: Viewer | null | undefined; provided: boolean }>({ viewer: undefined, provided: false })

export function ViewerProvider({ viewer, children }: { viewer: Viewer | null; children: ReactNode }) {
  return <ViewerContext.Provider value={{ viewer, provided: true }}>{children}</ViewerContext.Provider>
}

let cached: Promise<Viewer | null> | null = null

/** The signed-in person. Pages built with <Shell> pass it from the server; other pages fetch it once. */
export function useViewer(): Viewer | null | undefined {
  const ctx = useContext(ViewerContext)
  const [fetched, setFetched] = useState<Viewer | null | undefined>(undefined)
  useEffect(() => {
    if (ctx.provided) return
    cached ??= fetch('/api/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => (d?.viewer ?? null) as Viewer | null).catch(() => null)
    let live = true
    void cached.then((v) => { if (live) setFetched(v) })
    return () => { live = false }
  }, [ctx.provided])
  return ctx.provided ? ctx.viewer : fetched
}
