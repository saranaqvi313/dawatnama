import Nav from '@/components/Nav'
import TemplateGrid from '@/components/TemplateGrid'
import { dict } from '@/lib/i18n'
import { getLang } from '@/lib/supabase/server'

export default async function Templates() {
  const t = dict[await getLang()]
  return (
    <>
      <Nav />
      <section className="band">
        <p className="kicker">{t.tplKicker}</p>
        <h2>{t.tplTitle}</h2>
        <p className="sub">{t.tplSub}</p>
        <TemplateGrid labels={{ preview: t.preview, use: t.use }} />
      </section>
    </>
  )
}
