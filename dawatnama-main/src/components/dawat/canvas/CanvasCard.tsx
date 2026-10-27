import type { CSSProperties } from 'react'
import { CANVAS_FONTS, CH, CW, FILTER_CSS, type CanvasBg, type CanvasDoc, type CanvasEl, type PatternName } from '@/lib/canvas'
import { videoEmbed } from '@/lib/media'
import OrnamentSvg from './OrnamentSvg'
import Scene from '../Scene'

/** Design units → container-relative units, so the card scales to any width. */
export const u = (v: number) => `${((v / CW) * 100).toFixed(4)}cqw`

function patternImage(pattern: PatternName, color: string): string {
  if (pattern === 'none') return ''
  const c = encodeURIComponent(color)
  const svg = (w: number, h: number, body: string) =>
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' fill='none' stroke='${c}' stroke-opacity='.22'%3E${body}%3C/svg%3E")`
  if (pattern === 'geometric') return svg(60, 60, "%3Cpath d='M30 3 39 21 57 30 39 39 30 57 21 39 3 30 21 21Z'/%3E")
  if (pattern === 'floral') return svg(70, 70, "%3Ccircle cx='35' cy='35' r='4'/%3E%3Cellipse cx='35' cy='21' rx='5' ry='10'/%3E%3Cellipse cx='35' cy='49' rx='5' ry='10'/%3E%3Cellipse cx='21' cy='35' rx='10' ry='5'/%3E%3Cellipse cx='49' cy='35' rx='10' ry='5'/%3E")
  if (pattern === 'arches') return svg(50, 80, "%3Cpath d='M6 80V36c0-18 19-24 19-32 0 8 19 14 19 32v44'/%3E")
  return svg(24, 24, "%3Ccircle cx='12' cy='12' r='1.4' fill='" + c + "' fill-opacity='.5' stroke='none'/%3E")
}

export function backgroundStyle(bg: CanvasBg): CSSProperties {
  const layers: string[] = []
  const pat = patternImage(bg.pattern, bg.patternColor)
  if (pat) layers.push(pat)
  if (bg.gradient) layers.push(`linear-gradient(170deg, ${bg.color}, ${bg.color2})`)
  return {
    backgroundColor: bg.color,
    backgroundImage: layers.join(', ') || undefined,
    backgroundSize: layers.map((l) => (l.startsWith('url("data:') ? (bg.pattern === 'dots' ? `${u(24)} ${u(24)}` : `${u(60)} auto`) : 'cover')).join(', ') || undefined,
    backgroundPosition: 'center top',
  }
}

/** The card's background photo, as its own layer so it can be faded. */
export function BackgroundPhoto({ bg }: { bg: CanvasBg }) {
  if (!bg.image) return null
  return <div className="cv-bgimg" aria-hidden="true" style={{ backgroundImage: `url("${bg.image.replace(/["\\\n]/g, '')}")`, opacity: bg.imageOpacity ?? 1 }} />
}

export function elementBox(el: CanvasEl): CSSProperties {
  return {
    position: 'absolute', left: u(el.x), top: u(el.y), width: u(el.w), height: u(el.h),
    transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined, opacity: el.opacity,
  }
}

/** Animation class and timing for an element (only plays inside a card with .cv-play). */
export function animProps(el: CanvasEl): { className: string; style: CSSProperties } {
  if (!el.anim || el.anim === 'none') return { className: '', style: {} }
  return { className: `cv-anim cv-a-${el.anim}`, style: { '--d': `${el.delay || 0}s` } as CSSProperties }
}

const MASK_SVG: Record<string, string> = {
  heart: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 92'%3E%3Cpath d='M50 92 7 49C-6 36-1 9 22 3c12-3 22 3 28 13C56 6 66 0 78 3c23 6 28 33 15 46Z'/%3E%3C/svg%3E\")",
  blob: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M78 14c13 10 22 27 19 44s-15 34-32 39-38 0-50-13S-2 52 4 35 26 6 43 3s22 1 35 11Z'/%3E%3C/svg%3E\")",
}

function maskStyle(mask: string, radius: number): CSSProperties {
  if (mask === 'circle') return { borderRadius: '50%' }
  if (mask === 'arch') return { borderRadius: '999px 999px 6% 6% / 60% 60% 6% 6%' }
  if (mask === 'heart' || mask === 'blob') return { WebkitMaskImage: MASK_SVG[mask], maskImage: MASK_SVG[mask], WebkitMaskSize: '100% 100%', maskSize: '100% 100%', borderRadius: 0 }
  return { borderRadius: `${radius}%` }
}

function StarPath() {
  return <path d="M50 3 62 37h36L69 58l11 36-30-22-30 22 11-36L2 37h36Z" />
}

export function ElementBody({ el, editing }: { el: CanvasEl; editing?: boolean }) {
  if (el.type === 'text')
    return (
      <div className={`cv-text${el.foil ? ' cv-foil' : ''}`} style={{
        fontFamily: CANVAS_FONTS[el.font].css, fontSize: u(el.size), color: el.color, fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal', textAlign: el.align, letterSpacing: u(el.spacing),
        lineHeight: el.lineHeight, textTransform: el.upper ? 'uppercase' : 'none',
        textDecoration: el.underline ? 'underline' : undefined,
        justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
        textShadow: el.shadow ? `0 ${u(2)} ${u(8)} rgba(0,0,0,.35)` : undefined,
        background: el.bg && el.bg !== 'transparent' ? el.bg : undefined,
        borderRadius: el.bg && el.bg !== 'transparent' ? u(8) : undefined,
        padding: el.bg && el.bg !== 'transparent' ? `0 ${u(8)}` : undefined,
        '--foil': el.color,
      } as CSSProperties}>
        {el.foil ? <span>{el.text}</span> : el.text}
      </div>
    )
  if (el.type === 'image') {
    const frame: CSSProperties = {
      ...maskStyle(el.mask ?? 'none', el.radius),
      border: el.border && !['heart', 'blob'].includes(el.mask) ? `${u(el.border)} solid ${el.borderColor}` : undefined,
      boxShadow: el.shadow ? `0 ${u(10)} ${u(24)} rgba(0,0,0,.3)` : undefined,
    }
    return el.src
      // eslint-disable-next-line @next/next/no-img-element
      ? <img className="cv-img" src={el.src} alt="" draggable={false} style={{ ...frame, objectFit: el.fit, filter: FILTER_CSS[el.filter ?? 'none'] || undefined }} />
      : <div className="cv-img cv-img-empty" style={{ ...frame, border: `${u(Math.max(1, el.border))} dashed ${el.borderColor}` }}><span>Photo</span></div>
  }
  if (el.type === 'video') {
    const frame: CSSProperties = { borderRadius: `${el.radius}%`, border: el.border ? `${u(el.border)} solid ${el.borderColor}` : undefined }
    const v = el.src ? videoEmbed(el.src) : null
    if (!v) return <div className="cv-img cv-img-empty" style={{ ...frame, border: `${u(1.5)} dashed ${el.borderColor}` }}><span>▶ Video</span></div>
    if (v.kind === 'iframe')
      return (
        <div className="cv-video" style={frame}>
          <iframe src={v.src} title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy"
            style={{ pointerEvents: editing ? 'none' : undefined }} />
        </div>
      )
    return (
      <div className="cv-video" style={frame}>
        <video src={v.src} playsInline muted={editing || el.autoplay} autoPlay={el.autoplay} loop={el.autoplay} controls={!editing} preload="metadata" />
      </div>
    )
  }
  if (el.type === 'scene')
    return (
      <div className="cv-scene" style={{ '--accent': el.color, color: el.color } as CSSProperties}>
        <Scene kind={el.name} />
      </div>
    )
  if (el.type === 'shape') {
    const stroke = el.strokeWidth ? `${u(el.strokeWidth)} solid ${el.stroke}` : undefined
    const shadow = el.shadow ? `drop-shadow(0 ${u(6)} ${u(12)} rgba(0,0,0,.3))` : undefined
    if (el.shape === 'line') return <div style={{ width: '100%', height: '100%', background: el.stroke }} />
    if (el.shape === 'arch' || el.shape === 'heart' || el.shape === 'star')
      return (
        <svg width="100%" height="100%" viewBox={el.shape === 'arch' ? '0 0 100 140' : '0 0 100 96'} preserveAspectRatio="none" aria-hidden="true" style={{ filter: shadow, overflow: 'visible' }}>
          <g fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} vectorEffect="non-scaling-stroke">
            {el.shape === 'arch' && <path d="M2 138V50C2 24 24 2 50 2s48 22 48 48v88Z" vectorEffect="non-scaling-stroke" />}
            {el.shape === 'heart' && <path d="M50 92 7 49C-6 36-1 9 22 3c12-3 22 3 28 13C56 6 66 0 78 3c23 6 28 33 15 46Z" vectorEffect="non-scaling-stroke" />}
            {el.shape === 'star' && <StarPath />}
          </g>
        </svg>
      )
    return <div style={{ width: '100%', height: '100%', background: el.fill, border: stroke, borderRadius: el.shape === 'circle' ? '50%' : u(el.radius), filter: shadow }} />
  }
  return <div style={{ width: '100%', height: '100%', color: el.color }}><OrnamentSvg name={el.name} /></div>
}

/** One element, with its animation and (on the live card) its link. */
export function PlacedElement({ el, live }: { el: CanvasEl; live?: boolean }) {
  const a = animProps(el)
  const body = <ElementBody el={el} />
  return (
    <div style={elementBox(el)}>
      <div className={`cv-el ${a.className}`} style={a.style}>
        {live && el.link ? <a className="cv-link" href={el.link} target="_blank" rel="noopener noreferrer">{body}</a> : body}
      </div>
    </div>
  )
}

/**
 * Read-only rendering of a designer card. Scales to the width of its container.
 * `play` starts the animations (the live card, after it opens); thumbnails stay still.
 */
export default function CanvasCard({ doc, className = '', play, live }: { doc: CanvasDoc; className?: string; play?: boolean; live?: boolean }) {
  const h = doc.h || CH
  return (
    <div className={`cv-wrap ${className}`}>
      <div className={`cv${play ? ' cv-play' : ''}`} style={{ ...backgroundStyle(doc.bg), aspectRatio: `${CW} / ${h}`, '--cv-bg': doc.bg.color } as CSSProperties} role="img"
        aria-label={doc.elements.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text).join(' · ').slice(0, 300)}>
        <BackgroundPhoto bg={doc.bg} />
        {doc.elements.map((el) => <PlacedElement key={el.id} el={el} live={live} />)}
      </div>
    </div>
  )
}

export const CANVAS_ASPECT = `${CW} / ${CH}`
