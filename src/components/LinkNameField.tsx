'use client'
import { useState } from 'react'
import { updateSlug } from '@/app/actions'
import { toSlug } from '@/lib/slug'

type Props = { invitationId: string; slug: string; siteUrl: string; live: boolean; onSaved: (slug: string) => void }

/** Lets the owner choose the name in the card's link: your-site.com/<name>. */
export default function LinkNameField({ invitationId, slug, siteUrl, live, onSaved }: Props) {
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
    <div className="link-name">
      <label>Link name (e.g. the guest&apos;s name)
        <div className="link-name-row">
          <span className="link-host" dir="ltr">{host}/</span>
          <input value={value} onChange={(e) => { setValue(e.target.value); setMsg(null) }} onBlur={() => setValue((v) => toSlug(v) || v)}
            placeholder="ali-khan" maxLength={60} dir="ltr" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            onKeyDown={(e) => { if (e.key === 'Enter' && changed) { e.preventDefault(); void save() } }} />
        </div>
      </label>
      <p className="muted small-note link-preview" dir="ltr">{host}/<b>{preview}</b></p>
      {changed && <button type="button" className="btn ghost small" disabled={busy} aria-busy={busy} onClick={save}>Save link name</button>}
      {msg && <p className={msg.ok ? 'ok' : 'err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
    </div>
  )
}
