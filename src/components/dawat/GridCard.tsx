'use client'
import { useState, type ReactNode } from 'react'

type Props = {
  title: ReactNode
  thumb: ReactNode
  badge?: ReactNode
  details?: ReactNode
  actions?: ReactNode
  /** Always visible under the tile (e.g. a main button). */
  footer?: ReactNode
  /** Height of the picture area (kit default h-57.5). */
  thumbClass?: string
  className?: string
}

/**
 * One tile in a kit-style grid (same layout as the kit's product grid): picture, title, a label on
 * the right, and actions that appear on hover (tap on phones).
 */
export default function GridCard({ title, thumb, badge, details, actions, footer, thumbClass, className }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className={`group w-[calc(20%-1.5rem)] mt-6 mx-3 max-4xl:w-[calc(25%-1.5rem)] max-[1539px]:w-[calc(33.333%-1.5rem)] max-lg:w-[calc(50%-1.5rem)] max-md:w-[calc(100%-1.5rem)] ${className || ''}`}
      onClick={() => setVisible(!visible)}
    >
      <div className={`relative overflow-hidden rounded-3xl ${thumbClass || 'h-57.5'}`}>{thumb}</div>
      <div className="flex items-start mt-3">
        <div className="grow pt-0.5 text-sub-title-1">{title}</div>
        {badge && <div className="shrink-0 ml-3">{badge}</div>}
      </div>
      <div className="relative min-h-6 mt-1">
        {details && (
          <div className={`absolute top-0 left-0 right-0 truncate text-caption text-t-secondary transition-all ${actions ? 'group-hover:invisible group-hover:opacity-0' : ''} ${visible && actions ? 'max-lg:invisible max-lg:opacity-0' : ''}`}>
            {details}
          </div>
        )}
        {actions && (
          <div className={`flex flex-wrap gap-2 mt-0.5 -ml-1 invisible opacity-0 transition-all group-hover:visible group-hover:opacity-100 ${visible ? 'max-lg:visible max-lg:opacity-100' : ''}`}
            onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      {footer && <div className="mt-3" onClick={(e) => e.stopPropagation()}>{footer}</div>}
    </div>
  )
}

/** The kit's grid wrapper (pairs with GridCard's margins). */
export function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap -mt-6 -mx-3 ${className || ''}`}>{children}</div>
}
