'use client'
import { useEffect } from 'react'

/** Re-checks a pending order every few seconds and reloads the page once it settles. */
export default function PendingCheck({ order }: { order: string }) {
  useEffect(() => {
    let tries = 0
    const id = setInterval(async () => {
      tries += 1
      try {
        const res = await fetch(`/api/pay/status?order=${encodeURIComponent(order)}`, { cache: 'no-store' })
        const { status } = (await res.json()) as { status: string }
        if (status === 'paid' || status === 'failed') window.location.replace(`/premium?result=${status}`)
      } catch { /* keep trying */ }
      if (tries >= 40) clearInterval(id)
    }, 5000)
    return () => clearInterval(id)
  }, [order])
  return null
}
