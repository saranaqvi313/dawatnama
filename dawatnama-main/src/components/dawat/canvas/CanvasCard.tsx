import type { CSSProperties } from 'react'
import { CANVAS_FONTS, CH, CW, type CanvasBg, type CanvasDoc, type CanvasEl, type PatternName } from '@/lib/canvas'
import OrnamentSvg from './OrnamentSvg'

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
  if (bg.image) layers.push(`url("${bg.image.replace(/["\\\n]/g, '')}")`)
  if (bg.gradient) layers.push(`linear-gradient(170deg, ${bg.color}, ${bg.color2})`)
  return {
    backgroundColor: bg.color,
    backgroundImage: layers.join(', ') || undefined,
    backgroundSize: layers.map((l) => (l.startsWith('url("data:') ? (bg.pattern === 'dots' ? `${u(24)} ${u(24)}` : `${u(60)} auto`) : 'cover')).join(', ') || undefined,
    backgroundPosition: 'center',
  }
}

export function elementBox(el: CanvasEl): CSSProperties {
  return {
    position: 'absolute', left: u(el.x), top: u(el.y), width: u(el.w), height: u(el.h),
    transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined, opacity: el.opacity,
  }
}

export function ElementBody({ el }: { el: CanvasEl }) {
  if (el.type === 'text')
    return (
      <div className="cv-text" style={{
        fontFamily: CANVAS_FONTS[el.font].css, fontSize: u(el.size), color: el.color, fontWeight: el.weight,
        fontStyle: el.italic ? 'italic' : 'normal', textAlign: el.align, letterSpacing: u(el.spacing),
        lineHeight: el.lineHeight, textTransform: el.upper ? 'uppercase' : 'none',
        justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
      }}>{el.text}</div>
    )
  if (el.type === 'image')
    return el.src
      ? <img className="cv-img" src={el.src} alt="" style={{ borderRadius: `${el.radius}%`, objectFit: el.fit, border: el.border ? `${u(el.border)} solid ${el.borderColor}` : undefined }} />
      : <div className="cv-img cv-img-empty" style={{ borderRadius: `${el.radius}%`, border: `${u(Math.max(1, el.border))} dashed ${el.borderColor}` }}><span>Photo</span></div>
  if (el.type === 'shape') {
    const stroke = el.strokeWidth ? `${u(el.strokeWidth)} solid ${el.stroke}` : undefined
    if (el.shape === 'line') return <div style={{ width: '100%', height: '100%', background: el.stroke }} />
    if (el.shape === 'arch')
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 138V50C2 24 24 2 50 2s48 22 48 48v88Z" fill={el.fill} stroke={el.stroke}
            strokeWidth={el.strokeWidth} vectorEffect="non-scaling-stroke" />
        </svg>
      )
    return <div style={{ width: '100%', height: '100%', background: el.fill, border: stroke, borderRadius: el.shape === 'circle' ? '50%' : u(el.radius) }} />
  }
  return <div style={{ width: '100%', height: '100%', color: el.color }}><OrnamentSvg name={el.name} /></div>
}

/** Read-only rendering of a designer card. Scales to the width of its container. */
export default function CanvasCard({ doc, className = '' }: { doc: CanvasDoc; className?: string }) {
  return (
    <div className={`cv-wrap ${className}`}>
      <div className="cv" style={backgroundStyle(doc.bg)} role="img" aria-label={doc.elements.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text).join(' · ').slice(0, 300)}>
        {doc.elements.map((el) => (
          <div key={el.id} style={elementBox(el)}><ElementBody el={el} /></div>
        ))}
      </div>
    </div>
  )
}

export const CANVAS_ASPECT = `${CW} / ${CH}`
