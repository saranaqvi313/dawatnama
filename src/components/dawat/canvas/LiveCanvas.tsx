'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { CanvasDoc } from '@/lib/canvas'
import { videoEmbed } from '@/lib/media'
import Effects from '../Effects'
import CanvasCard from './CanvasCard'

const pattern = (accent: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' fill='none' stroke='${encodeURIComponent(accent)}' stroke-opacity='.25'%3E%3Cpath d='M30 3 39 21 57 30 39 39 30 57 21 39 3 30 21 21Z'/%3E%3C/svg%3E")`

/**
 * A designer card as guests see it: the opening (gates, envelope…), floating effects,
 * background music, and element animations that start when the card opens.
 */
export default function LiveCanvas({ doc, title, guestName, className = '' }: { doc: CanvasDoc; title?: string; guestName?: string; className?: string }) {
  const opening = doc.fx?.opening ?? 'none'
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>(opening !== 'none' ? 'closed' : 'open')
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const music = doc.fx?.music ? videoEmbed(doc.fx.music) : null
  const musicSrc = doc.fx?.music && (!music || music.kind === 'file') ? doc.fx.music : ''
  const accent = doc.fx?.effectColor || doc.bg.patternColor || '#d4af37'
  const isLight = (() => { const h = doc.bg.color.replace('#', ''); if (h.length < 6) return true; const n = parseInt(h.slice(0, 6), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 })()

  useEffect(() => { setStage(opening !== 'none' ? 'closed' : 'open') }, [opening])

  const open = () => {
    setStage('opening')
    if (audio.current) audio.current.play().then(() => setPlaying(true)).catch(() => {})
    setTimeout(() => setStage('open'), opening === 'storybook' || opening === 'gates' ? 1900 : 1500)
  }
  const toggleMusic = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {})
    else { a.pause(); setPlaying(false) }
  }

  const style = {
    '--bg': doc.bg.color, '--ink': isLight ? '#2b2418' : '#fbf6ea', '--accent': accent, '--art': pattern(accent),
    '--hfont': "'Cormorant Garamond', serif", '--nfont': "'Great Vibes', cursive", '--bfont': "'Poppins', sans-serif",
  } as CSSProperties

  return (
    <div className={`relative ${className}`} style={style}>
      <CanvasCard doc={doc} className="cv-page-card" play={stage === 'open'} live />
      <Effects kind={doc.fx?.effect ?? 'none'} color={accent} />
      {musicSrc && <audio ref={audio} src={musicSrc} loop preload="none" />}
      {musicSrc && stage === 'open' && (
        <button type="button" className="cv-music" onClick={toggleMusic} aria-label={playing ? 'Pause music' : 'Play music'}>{playing ? '❚❚' : '♪'}</button>
      )}
      {stage !== 'open' && (
        <div className={`opening op-${opening} ${stage === 'opening' ? 'go' : ''}`}>
          <div className="op-a"><i className="op-orn" /></div><div className="op-b"><i className="op-orn" /></div>
          {opening === 'magic' && <div className="op-burst">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--a': `${i * (360 / 14)}deg` } as CSSProperties} />)}</div>}
          <button className="op-seal" onClick={open}>
            {guestName && <span className="op-dear">Dear {guestName}</span>}
            <span className="op-names">{doc.fx?.sealText || title || 'You are invited'}</span>
            <span className="op-tap">Tap to open</span>
          </button>
        </div>
      )}
    </div>
  )
}
