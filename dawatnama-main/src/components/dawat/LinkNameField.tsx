'use client'
import { useState } from 'react'
import Button from '@/components/Button'
import { updateSlug } from '@/app/actions'
import { toSlug } from '@/lib/slug'
import { Label, Notice } from './ui'

type Props = { invitationId: string; slug: string; siteUrl: string; live: boolean; paid: boolean; onSaved: (slug: string) => void }

/** Lets the owner choose the name in the card's link: your-site.com/<name>. */
export default function LinkNameField({ invitationId, slug, siteUrl, live, paid, onSaved }: Props) {
  const [value, setValue] = useState(slug)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const host = siteUrl.replace(/^https?:\/\//, '')
  const preview = toSlug(value) || '…'
  const changed = toSlug(value) !== slug

  async function save() {
    if (live && !window.confirm('The old link will stop working. Anyone you already sent it to will need the new link. Change it?')) return
    setBusy(true); setMsg(null)
    const res = await updateSlug(invitationId, value)
    setBusy(false)
    if (!res.ok || !res.slug) return setMsg({ ok: false, text: res.error ?? 'Could not save.' })
    setValue(res.slug); onSaved(res.slug)
    setMsg({ ok: true, text: 'Link name saved.' })
  }

  return (
    <div>
      <Label tooltip="English letters, numbers and hyphens, e.g. ali-khan">Link name (e.g. the guest&apos;s name)</Label>
      <div className="flex items-center h-12 border border-s-stroke2 rounded-full overflow-hidden transition-colors hover:border-s-highlight focus-within:border-s-highlight">
        {paid && <span className="shrink-0 max-w-[55%] h-full flex items-center pl-4.5 pr-1 bg-b-surface1 text-body-2 text-t-secondary truncate" dir="ltr">{host}/</span>}
        <input className="grow min-w-0 h-full px-4.5 bg-transparent text-body-2 text-t-primary outline-none placeholder:text-t-secondary/50"
          value={value} onChange={(e) => { setValue(e.target.value); setMsg(null) }} onBlur={() => setValue((v) => toSlug(v) || v)}
          placeholder="ali-khan" maxLength={60} dir="ltr" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          onKeyDown={(e) => { if (e.key === 'Enter' && changed) { e.preventDefault(); void save() } }} />
      </div>
      <div className="mt-2 text-caption text-t-secondary break-all" dir="ltr">
        {paid ? <>{host}/<b className="text-t-primary">{preview}</b></> : 'Your full link appears here after payment.'}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 empty:hidden">
        {changed && <Button isStroke className="!h-10" onClick={save} disabled={busy} aria-busy={busy || undefined}>Save link name</Button>}
        {msg && <Notice text={msg.text} tone={msg.ok ? 'green' : 'red'} />}
      </div>
    </div>
  )
}
