import type { CSSProperties } from 'react'
import { FONTS, STORY_THEMES, type Template } from '@/lib/types'
import Scene from './Scene'
import { Florals, WaxSeal } from './story/Art'

/** Background/colour style for a template thumbnail tile. */
export function faceStyle(t: Template): CSSProperties {
  const th = t.design.layout === 'story' ? STORY_THEMES[t.design.theme] : null
  if (th) return { background: th.bg, color: th.paper, '--st-gold': th.gold, '--st-accent': th.accent, '--st-name': (FONTS[t.design.nameFont] ?? FONTS.pinyon).css } as CSSProperties
  return { background: t.design.bg, color: t.design.ink, '--bg': t.design.bg, '--ink': t.design.ink, '--accent': t.design.accent } as CSSProperties
}

/** What goes inside a template thumbnail tile (scene + tag + name, or a story card's seal and florals). */
export default function TemplateFace({ t, size = 'lg' }: { t: Template; size?: 'lg' | 'md' }) {
  const nameCls = size === 'lg' ? '!text-[2rem] max-md:!text-[1.6rem]' : '!text-[1.8rem] max-md:!text-[1.4rem]'
  const font = (FONTS[t.design.nameFont] ?? FONTS[t.design.headingFont]).css
  if (t.design.layout === 'story') {
    const th = STORY_THEMES[t.design.theme] ?? STORY_THEMES.burgundy
    const initials = [t.content.name1, t.content.name2].map((x) => x.trim()[0] ?? '').filter(Boolean).join('·').toUpperCase()
    return (
      <span className={`st-thumb st-${t.design.theme}`}>
        <Florals kind={th.deco} className="st-thumb-fl l" />
        <Florals kind={th.deco} flip className="st-thumb-fl r" />
        <WaxSeal initials={initials || '♥'} size={size === 'lg' ? 64 : 54} />
        <small className="text-overline uppercase tracking-[0.2em]" style={{ color: th.gold }}>{t.tag}</small>
        <b className={nameCls} style={{ fontFamily: font, fontWeight: 400, color: th.paper }}>{t.name}</b>
      </span>
    )
  }
  return (
    <>
      <span className="scene-mini"><Scene kind={t.design.scene} /></span>
      <small className="text-overline uppercase tracking-[0.2em]" style={{ color: t.design.accent }}>{t.tag}</small>
      <b className={nameCls} style={{ fontFamily: font }}>{t.name}</b>
    </>
  )
}
