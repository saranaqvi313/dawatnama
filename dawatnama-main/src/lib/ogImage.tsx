/** The picture WhatsApp/Facebook show when a card link is shared (1200×630). */
import { ImageResponse } from 'next/og'
import { loadPublicCard } from './publicCard'
import { FONTS, normalize } from './types'

export const OG_SIZE = { width: 1200, height: 630 }

/** Fetches just the letters we need from Google Fonts, so the image uses the card's own lettering. */
async function googleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&text=${encodeURIComponent(text)}`, { cache: 'force-cache' })).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url, { cache: 'force-cache' })).arrayBuffer() : null
  } catch { return null }
}
const familyOf = (key: string) => (FONTS[key]?.css.match(/'([^']+)'/)?.[1]) ?? 'Pinyon Script'

export async function cardImage(slug: string) {
  const found = await loadPublicCard(slug)
  let bg = '#12382d', ink = '#f6efdc', accent = '#d4af37', names = 'You are invited', kicker = 'Dawatnama', when = '', nameFamily = 'Pinyon Script', photo = ''
  if (found && found.card.kind !== 'canvas') {
    const { content, design } = normalize(found.card.content as never, found.card.design as never, found.card.template)
    bg = design.bg; ink = design.ink; accent = design.accent
    names = [content.name1, content.name2].filter(Boolean).join(' & ') || content.eventType
    kicker = content.eventType
    const ev = content.events[0]
    if (ev?.date) when = new Date(`${ev.date}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    nameFamily = familyOf(design.nameFont || design.headingFont)
    photo = content.photoUrl
  } else if (found) {
    names = String((found.card.content as { name1?: string })?.name1 || 'You are invited')
  }
  const dear = found?.guest ? `Dear ${found.guest.name}, you are invited` : 'You are invited'
  const [script, serif] = await Promise.all([googleFont(nameFamily, names), googleFont('Cormorant Garamond', `${dear}${kicker}${when}&·`)])
  const fonts = [
    ...(script ? [{ name: 'Names', data: script, style: 'normal' as const, weight: 400 as const }] : []),
    ...(serif ? [{ name: 'Serif', data: serif, style: 'normal' as const, weight: 400 as const }] : []),
  ]
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: bg, padding: 28 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `3px solid ${accent}`, borderRadius: 28, color: ink, textAlign: 'center', padding: 40 }}>
          {photo ? <img src={photo} width={150} height={150} style={{ borderRadius: 999, border: `4px solid ${accent}`, objectFit: 'cover', marginBottom: 18 }} /> : null}
          <div style={{ fontFamily: 'Serif', fontSize: 34, color: accent, letterSpacing: 6, textTransform: 'uppercase' }}>{kicker}</div>
          <div style={{ fontFamily: 'Names', fontSize: names.length > 22 ? 96 : 120, color: accent, lineHeight: 1.1, marginTop: 10 }}>{names}</div>
          <div style={{ fontFamily: 'Serif', fontSize: 38, marginTop: 18 }}>{dear}</div>
          {when ? <div style={{ fontFamily: 'Serif', fontSize: 30, opacity: .85, marginTop: 8 }}>{when}</div> : null}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  )
}
