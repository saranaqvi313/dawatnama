import Button from '@/components/Button'
import Shell from '@/components/dawat/Shell'
import TemplateGrid from '@/components/dawat/TemplateGrid'
import { dict } from '@/lib/i18n'
import { getLang } from '@/lib/supabase/server'

export const metadata = { title: 'Templates — Dawatnama' }

export default async function Templates() {
  const t = dict[await getLang()]
  return (
    <Shell title="Templates">
      <div className="card">
        <div className="flex items-center flex-wrap gap-3 pl-5 max-lg:pl-3">
          <div className="mr-auto">
            <div className="text-h6">{t.tplTitle}</div>
            <div className="text-body-2 text-t-secondary">{t.tplSub}</div>
          </div>
          <Button isStroke as="link" href="/designs">Designer cards</Button>
        </div>
        <div className="p-5 pt-3 max-lg:p-3">
          <TemplateGrid />
        </div>
      </div>
    </Shell>
  )
}
