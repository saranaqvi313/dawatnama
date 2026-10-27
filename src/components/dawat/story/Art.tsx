import { useId } from 'react'
/**
 * Hand-made drawings for story cards: wax seal, flowers, lace, pearls, torn paper and the
 * little programme icons. All original SVG, coloured from the card's theme (CSS variables).
 */
import type { CSSProperties } from 'react'

/** A wax seal with a soft, uneven rim and the couple's initials. */
export function WaxSeal({ initials, size = 96, className = '' }: { initials: string; size?: number; className?: string }) {
  const rim = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    const r = 46 + (i % 3 === 0 ? 3 : i % 2 ? -1.5 : 1.5)
    return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
  }).join(' ')
  const gid = `st-wax-${useId().replace(/:/g, '')}`
  return (
    <svg className={`st-seal ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="var(--st-seal-hi)" />
          <stop offset=".55" stopColor="var(--st-seal)" />
          <stop offset="1" stopColor="var(--st-seal-lo)" />
        </radialGradient>
      </defs>
      <polygon points={rim} fill={`url(#${gid})`} />
      <circle cx="50" cy="50" r="33" fill="none" stroke="var(--st-seal-lo)" strokeWidth="2.2" opacity=".7" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--st-seal-hi)" strokeWidth="1" opacity=".45" />
      <text x="50.8" y="59" textAnchor="middle" fontSize={initials.length > 3 ? 19 : 26} fill="var(--st-seal-lo)" opacity=".85"
        style={{ fontFamily: 'var(--st-name)' }}>{initials}</text>
      <text x="50" y="58" textAnchor="middle" fontSize={initials.length > 3 ? 19 : 26} fill="var(--st-seal-hi)"
        style={{ fontFamily: 'var(--st-name)' }}>{initials}</text>
    </svg>
  )
}

function Rose({ x, y, r, rot = 0, color = 'var(--st-flower)', dark = 'var(--st-flower-dk)' }: { x: number; y: number; r: number; rot?: number; color?: string; dark?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 20})`}>
      <circle r="20" fill={dark} />
      <path d="M-18 4C-20-10-8-20 4-19 16-18 21-6 18 6 14 17 0 21-9 17-16 14-19 9-18 4Z" fill={color} />
      <path d="M-12 2C-12-8-3-14 5-13 13-12 15-3 12 5 9 12 0 14-6 11-10 9-12 6-12 2Z" fill={dark} opacity=".55" />
      <path d="M-7 1C-7-5-1-9 4-8 9-7 10-1 8 4 6 8 0 9-4 7-6 6-7 4-7 1Z" fill={color} />
      <path d="M-3 0C-3-3 0-5 3-4 5-3 5 0 4 2 3 4 0 4-2 3Z" fill={dark} opacity=".6" />
    </g>
  )
}
function Peony({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 20})`}>
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-11" rx="9" ry="12" fill="var(--st-flower)" stroke="var(--st-flower-dk)" strokeWidth=".6" transform={`rotate(${i * 40})`} opacity=".96" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-6" rx="5.5" ry="8" fill="var(--st-flower)" stroke="var(--st-flower-dk)" strokeWidth=".5" transform={`rotate(${i * 60 + 20})`} />
      ))}
      <circle r="4" fill="var(--st-gold)" opacity=".8" />
    </g>
  )
}
function Leaf({ x, y, s = 1, rot = 0, fill = 'var(--st-leaf)' }: { x: number; y: number; s?: number; rot?: number; fill?: string }) {
  return <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} d="M0 0C6-10 18-14 30-12 22-2 12 4 0 0Z" fill={fill} />
}

/** A spray of flowers for corners and section heads, in the theme's style. */
export function Florals({ kind, flip, className = '', style }: { kind: string; flip?: boolean; className?: string; style?: CSSProperties }) {
  const t = flip ? 'translate(200 0) scale(-1 1)' : undefined
  if (kind === 'lace') return <LaceCorner flip={flip} className={className} style={style} />
  if (kind === 'pearls') return (
    <svg className={`st-florals ${className}`} style={style} viewBox="0 0 200 120" aria-hidden="true">
      <g transform={t}><PearlArc /></g>
    </svg>
  )
  if (kind === 'olive') return (
    <svg className={`st-florals ${className}`} style={style} viewBox="0 0 200 120" aria-hidden="true">
      <g transform={t}>
        <path d="M6 112C40 80 90 60 190 46" stroke="var(--st-leaf-dk)" strokeWidth="2" fill="none" />
        {Array.from({ length: 11 }, (_, i) => {
          const x = 18 + i * 16, y = 104 - i * 5.6
          return <g key={i}><Leaf x={x} y={y} s={0.85} rot={-40 - i} /><Leaf x={x + 4} y={y + 2} s={0.75} rot={150 - i} fill="var(--st-leaf-dk)" /></g>
        })}
        {[40, 96, 150].map((x, i) => <ellipse key={i} cx={x} cy={96 - i * 18} rx="5" ry="7" fill="var(--st-flower-dk)" opacity=".9" />)}
      </g>
    </svg>
  )
  return (
    <svg className={`st-florals ${className}`} style={style} viewBox="0 0 200 120" aria-hidden="true">
      <g transform={t}>
        <Leaf x={20} y={70} s={1.6} rot={-30} /><Leaf x={70} y={40} s={1.4} rot={-70} fill="var(--st-leaf-dk)" />
        <Leaf x={92} y={78} s={1.5} rot={10} /><Leaf x={40} y={96} s={1.3} rot={30} fill="var(--st-leaf-dk)" />
        <Leaf x={120} y={52} s={1.2} rot={-20} />
        {kind === 'peony' ? (
          <><Peony x={52} y={62} r={30} /><Peony x={104} y={44} r={20} rot={20} /><Peony x={20} y={34} r={16} rot={-10} /></>
        ) : (
          <><Rose x={54} y={62} r={28} /><Rose x={102} y={42} r={19} rot={30} /><Rose x={22} y={32} r={15} rot={-20} /><Rose x={92} y={86} r={12} rot={60} /></>
        )}
        {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={130 + i * 9} cy={30 + (i % 2) * 8} r="2.4" fill="var(--st-gold)" opacity=".8" />)}
      </g>
    </svg>
  )
}

function PearlArc() {
  return (
    <g>
      {Array.from({ length: 24 }, (_, i) => {
        const a = Math.PI * (0.05 + (i / 23) * 0.9)
        return <circle key={i} cx={100 - Math.cos(a) * 92} cy={10 + Math.sin(a) * 90} r={i % 4 === 0 ? 5.2 : 4} fill="url(#st-pearl)" />
      })}
      <defs>
        <radialGradient id="st-pearl" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#efe8dc" /><stop offset="1" stopColor="#b9ab95" /></radialGradient>
      </defs>
    </g>
  )
}

/** A row of pearls used as a divider. */
export function Pearls({ className = '' }: { className?: string }) {
  return (
    <svg className={`st-pearls ${className}`} viewBox="0 0 240 16" aria-hidden="true">
      <defs><radialGradient id="st-pearl2" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#fff" /><stop offset=".6" stopColor="#efe8dc" /><stop offset="1" stopColor="#b3a48d" /></radialGradient></defs>
      {Array.from({ length: 21 }, (_, i) => <circle key={i} cx={10 + i * 11} cy={8 + Math.sin(i / 3) * 1.5} r={i === 10 ? 6.5 : 4.4} fill="url(#st-pearl2)" />)}
    </svg>
  )
}

/** A scalloped lace corner. */
function LaceCorner({ flip, className = '', style }: { flip?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <svg className={`st-florals ${className}`} style={style} viewBox="0 0 200 120" aria-hidden="true">
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined} fill="none" stroke="var(--st-lace)" strokeWidth="1.2">
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 22} 4a11 11 0 0 0 22 0`} />)}
        {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={i * 22 + 11} cy={10} r="2.4" />)}
        {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M4 ${i * 22 + 20}a11 11 0 0 1 0 22`} />)}
        <path d="M30 30c20 0 30 10 30 30M30 30c0 20 10 30 30 30" />
        <circle cx="45" cy="45" r="6" /><circle cx="45" cy="45" r="2" fill="var(--st-lace)" />
        <path d="M70 26c10-8 24-8 34 0M26 70c-8 10-8 24 0 34" />
      </g>
    </svg>
  )
}

/** Lace border all around a box (scallops and dots), drawn with CSS masks in story.css. */
export function TornEdge({ flip, className = '' }: { flip?: boolean; className?: string }) {
  const pts: string[] = []
  for (let x = 0; x <= 400; x += 8) pts.push(`${x},${10 + ((x * 7919) % 13) - 6 + (x % 3)}`)
  return (
    <svg className={`st-torn ${flip ? 'flip' : ''} ${className}`} viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,24 ${pts.join(' ')} 400,24`} fill="currentColor" />
    </svg>
  )
}

const ICON: Record<string, string> = {
  rings: 'M9 14a5 5 0 1 0 0.01 0ZM15 14a5 5 0 1 0 0.01 0ZM10 6l2-3 2 3',
  mosque: 'M4 20h16M6 20v-7a6 6 0 0 1 12 0v7M12 7V4M12 4a1 1 0 1 0 0.01 0M3 20V11M21 20V11M10 20v-3a2 2 0 0 1 4 0v3',
  glass: 'M8 3h8l-1 7a3 3 0 0 1-6 0ZM12 13v7M8 20h8',
  dinner: 'M4 15h16M5 15a7 7 0 0 1 14 0M12 8V6M3 18h18',
  camera: 'M4 8h4l2-2h4l2 2h4v11H4ZM12 16a3 3 0 1 0 0.01 0',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0',
  car: 'M4 16v-4l2-5h12l2 5v4ZM4 12h16M7 19a1.5 1.5 0 1 0 0.01 0M17 19a1.5 1.5 0 1 0 0.01 0',
  cake: 'M5 20h14v-7H5ZM5 15c2 1.5 4 1.5 7 0s5-1.5 7 0M12 13V9M12 9c-1-1-1-3 0-4 1 1 1 3 0 4',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  flower: 'M12 12a2 2 0 1 0 0.01 0M12 10c0-4 4-4 4-1s-4 3-4 3M12 14c0 4-4 4-4 1s4-3 4-3M10 12c-4 0-4-4-1-4s3 4 3 4M14 12c4 0 4 4 1 4s-3-4-3-4M12 16v5',
}
export function ProgramIcon({ name }: { name: string }) {
  return (
    <svg className="st-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[name] ?? ICON.heart} />
    </svg>
  )
}
