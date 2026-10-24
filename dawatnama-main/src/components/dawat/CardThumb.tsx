import type { CSSProperties } from 'react'
import { FONTS, type Design } from '@/lib/types'
import type { CanvasDoc } from '@/lib/canvas'
import CanvasCard from './canvas/CanvasCard'
import Scene from './Scene'

/** A small picture of a card, used where the kit shows a product image. */
export default function CardThumb({ title, design, canvas, className }: { title: string; design: Design | null; canvas: CanvasDoc | null; className?: string }) {
  if (canvas) {
    return (
      <div className={`relative overflow-hidden ${className || ''}`}>
        <div className="absolute left-0 right-0 top-0"><CanvasCard doc={canvas} /></div>
      </div>
    )
  }
  const d = design
  const letters = title.split('&').map((s) => s.trim()[0] ?? '').join('&').slice(0, 3) || 'D'
  return (
    <div className={`tpl-scene relative flex items-center justify-center overflow-hidden ${className || ''}`}
      style={d ? ({ background: d.bg, color: d.ink, '--bg': d.bg, '--ink': d.ink, '--accent': d.accent } as CSSProperties) : undefined}>
      {d && <span className="scene-mini"><Scene kind={d.scene} /></span>}
      <b className="!text-[1.35rem] leading-none" style={{ fontFamily: d ? (FONTS[d.nameFont] ?? FONTS[d.headingFont])?.css : undefined }}>{letters}</b>
    </div>
  )
}
