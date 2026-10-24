import Button from '@/components/Button'
import Shell from '@/components/dawat/Shell'
import DesignShowcase from '@/components/dawat/canvas/DesignShowcase'
import { PRICE_LABEL } from '@/lib/pricing'
import { getViewer } from '@/lib/viewer'

export const metadata = { title: 'Designer cards — Dawatnama' }

export default async function Designs() {
  const viewer = await getViewer()
  const premium = Boolean(viewer?.premium)
  return (
    <Shell title="Designer cards" viewer={viewer}>
      <div className="card">
        <div className="flex items-center flex-wrap gap-3 pl-5 max-lg:pl-3">
          <div className="mr-auto">
            <div className="text-h6">Design every detail yourself</div>
            <div className="text-body-2 text-t-secondary">Drag text, photos and ornaments anywhere, change fonts and colours. {premium ? 'Premium is active on your account.' : `Part of Premium, ${PRICE_LABEL} one time.`}</div>
          </div>
          {!premium && <Button isBlack as="link" href="/premium?from=designer">Get Premium</Button>}
        </div>
        <div className="p-5 pt-3 max-lg:p-3">
          <DesignShowcase premium={premium} />
        </div>
      </div>
    </Shell>
  )
}
