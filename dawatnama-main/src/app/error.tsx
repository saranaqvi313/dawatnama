'use client'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { reportError } from '@/components/dawat/ErrorReporter'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error.message || 'Page error', `${error.digest ?? ''}\n${error.stack ?? ''}`) }, [error])
  return (
    <Layout title="Something went wrong">
      <div className="card">
        <div className="pt-26 pb-32 text-center max-md:py-16">
          <div className="inline-block mb-2 text-h4">Something went wrong</div>
          <div className="text-sub-title-1 text-t-tertiary">The problem has been reported to us. Please try again.</div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button isBlack onClick={reset}>Try again</Button>
            <Button isStroke as="a" href="/">Go to the home page</Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
