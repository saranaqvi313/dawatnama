'use client'
import type { ReactNode } from 'react'
import Icon from '@/components/Icon'
import Switch from '@/components/Switch'
import Tooltip from '@/components/Tooltip'

/** A field label in the kit's style (text-button, with an optional tooltip). */
export function Label({ children, tooltip, className }: { children: ReactNode; tooltip?: string; className?: string }) {
  return (
    <div className={`flex items-center mb-4 ${className || ''}`}>
      <div className="text-button">{children}</div>
      {tooltip && <Tooltip className="ml-1.5" content={tooltip} />}
    </div>
  )
}

/** Pick-one buttons, drawn like the kit's Tabs (wraps onto more lines when needed). */
export function Chips<T extends string>({ value, options, onChange, multi }: { value: T | T[]; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; multi?: boolean }) {
  const on = (v: T) => (multi ? (value as T[]).includes(v) : value === v)
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={on(v)} onClick={() => onChange(v)}
          className={`flex justify-center items-center h-10 px-4 rounded-full border text-button transition-colors hover:text-t-primary ${on(v) ? 'border-s-stroke2 text-t-primary bg-b-surface1' : 'border-transparent text-t-secondary'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

/** A colour picker in a kit-style rounded field. */
export function ColorField({ label, value, onChange, disabled, className }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; className?: string }) {
  return (
    <div className={`pt-1.5 ${disabled ? 'opacity-50' : ''} ${className || ''}`}>
      <label className="relative flex items-center gap-3 h-12 pl-2 pr-4.5 border border-s-stroke2 rounded-full transition-colors hover:border-s-highlight cursor-pointer">
        <span className="absolute -top-2.5 left-6 px-1 bg-b-surface2 text-caption pointer-events-none">{label}</span>
        <input type="color" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 p-0 border-0 rounded-full bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-s-stroke2 [&::-moz-color-swatch]:rounded-full" />
        <span className="text-body-2 text-t-secondary uppercase" dir="ltr">{value}</span>
      </label>
    </div>
  )
}

/** A label with a kit Switch on the right, like the kit's notification settings rows. */
export function SwitchRow({ title, note, checked, onChange }: { title: string; note?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center gap-6 py-5 border-b border-s-subtle last:border-b-0">
      <div>
        <div className="text-button">{title}</div>
        {note && <div className="mt-1 text-caption text-t-secondary">{note}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

/** The kit's image drop area, for choosing a photo or video file. */
export function UploadBox({ label, hint, accept, multiple, disabled, onFiles, className }: {
  label: string; hint?: string; accept: string; multiple?: boolean; disabled?: boolean; onFiles: (files: FileList | null) => void; className?: string
}) {
  return (
    <div className={`relative flex flex-col justify-center items-center h-40 px-4 bg-b-surface3 border border-transparent rounded-4xl overflow-hidden text-center transition-colors hover:border-s-highlight ${disabled ? 'opacity-60' : ''} ${className || ''}`}>
      <input type="file" className="absolute inset-0 z-10 opacity-0 cursor-pointer" accept={accept} multiple={multiple} disabled={disabled}
        onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} aria-label={label} />
      <Icon className="mb-2 !size-8 fill-t-secondary" name="camera" />
      <div className="text-body-2 text-t-secondary">{label}, or <span className="font-bold text-t-primary">Browse</span></div>
      {hint && <div className="mt-1 text-caption text-t-tertiary">{hint}</div>}
    </div>
  )
}

/** A small rounded panel inside a card (kit's depth box). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 rounded-3xl border border-s-subtle bg-b-depth2 max-md:p-4 ${className || ''}`}>{children}</div>
}

/** Status line in the kit's label style. */
export function Notice({ text, tone = 'gray' }: { text: string; tone?: 'gray' | 'green' | 'red' | 'yellow' }) {
  if (!text) return null
  return <div className={`label label-${tone} !h-auto min-h-7 py-1.5 !leading-normal`} role="status">{text}</div>
}
