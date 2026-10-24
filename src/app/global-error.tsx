'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      void fetch('/api/log-error', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ message: error.message || 'App crashed', detail: `${error.digest ?? ''}\n${error.stack ?? ''}`, url: location.pathname }) })
    } catch { /* ignore */ }
  }, [error])
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem 1.2rem', textAlign: 'center', background: '#f1f1f1', color: '#101010' }}>
        <h1>Something went wrong</h1>
        <p>The problem has been reported to us. Please try again.</p>
        <button onClick={reset} style={{ border: 0, cursor: 'pointer', background: 'linear-gradient(#2c2c2c,#282828)', color: '#fdfdfd', fontWeight: 600, height: 48, padding: '0 26px', borderRadius: 24 }}>Try again</button>
      </body>
    </html>
  )
}
