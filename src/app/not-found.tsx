import Button from '@/components/Button'
import Shell from '@/components/dawat/Shell'

export default function NotFound() {
  return (
    <Shell title="Not found">
      <div className="card">
        <div className="pt-26 pb-32 text-center max-md:py-16">
          <div className="inline-block mb-2 text-h4">Not found</div>
          <div className="max-w-120 mx-auto text-sub-title-1 text-t-tertiary">This page or invitation does not exist, or it has not been published yet.</div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button isBlack as="link" href="/">Go home</Button>
            <Button isStroke as="link" href="/templates">See templates</Button>
          </div>
        </div>
      </div>
    </Shell>
  )
}
