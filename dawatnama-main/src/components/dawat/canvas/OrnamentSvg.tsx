import type { OrnamentName } from '@/lib/canvas'

const petals = (n: number, r1: number, r2: number, w: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const [cx, cy] = [50 + Math.cos(a) * ((r1 + r2) / 2), 50 + Math.sin(a) * ((r1 + r2) / 2)]
    return <ellipse key={i} cx={cx} cy={cy} rx={(r2 - r1) / 2} ry={w} transform={`rotate(${(a * 180) / Math.PI} ${cx} ${cy})`} />
  })

const starPath = (n: number, outer: number, inner: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    return `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`
  }).join(' ') + 'Z'

/** Original line-art ornaments. They take the colour of the element (currentColor). */
export default function OrnamentSvg({ name }: { name: OrnamentName }) {
  const common = { width: '100%', height: '100%', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, 'aria-hidden': true } as const
  switch (name) {
    case 'mandala':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r="46" /><circle cx="50" cy="50" r="40" strokeDasharray="1 3" />
          <g>{petals(16, 22, 38, 4)}</g><g>{petals(8, 10, 24, 5)}</g>
          <circle cx="50" cy="50" r="8" /><circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
      )
    case 'divider':
      return (
        <svg viewBox="0 0 220 40" {...common} preserveAspectRatio="xMidYMid meet">
          <path d="M8 20H88M132 20H212" /><path d="M110 6l14 14-14 14-14-14Z" /><path d="M110 13l7 7-7 7-7-7Z" fill="currentColor" />
          <circle cx="92" cy="20" r="2" fill="currentColor" /><circle cx="128" cy="20" r="2" fill="currentColor" />
          <circle cx="8" cy="20" r="1.5" fill="currentColor" /><circle cx="212" cy="20" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'corner':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M4 96V30C4 15 15 4 30 4h66" /><path d="M12 96V34c0-12 10-22 22-22h62" strokeDasharray="1 3" />
          <path d="M30 4c0 14 10 24 24 24M4 30c14 0 24 10 24 24" /><circle cx="28" cy="28" r="5" />
          <circle cx="28" cy="28" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'lantern':
      return (
        <svg viewBox="0 0 50 100" {...common} preserveAspectRatio="xMidYMid meet">
          <path d="M25 0v22" /><path d="M15 22h20l-3 8H18Z" /><path d="M18 30c-8 8-10 28-4 40h22c6-12 4-32-4-40" />
          <path d="M25 32v36M17 40c4 8 4 20 0 28M33 40c-4 8-4 20 0 28" strokeDasharray="1.5 2.5" />
          <path d="M14 70h22l-4 8H18Z" /><path d="M25 78v10" /><circle cx="25" cy="92" r="4" fill="currentColor" />
        </svg>
      )
    case 'crescent':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M62 12A40 40 0 1 0 62 88 32 32 0 1 1 62 12Z" fill="currentColor" fillOpacity=".15" />
          <path d={starPath(5, 10, 4).replace(/(\d+\.\d+) (\d+\.\d+)/g, (_, x, y) => `${(Number(x) + 22).toFixed(2)} ${(Number(y) - 12).toFixed(2)}`)} fill="currentColor" />
        </svg>
      )
    case 'leaf':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d="M10 90C35 70 60 45 90 10" />
          {[[28, 72, -40], [42, 58, 30], [55, 44, -40], [67, 31, 30], [79, 19, -40]].map(([x, y, r], i) => (
            <path key={i} d="M0 0c6-10 18-12 24-8-4 8-14 14-24 8Z" transform={`translate(${x} ${y}) rotate(${r})`} fill="currentColor" fillOpacity=".25" />
          ))}
        </svg>
      )
    case 'flower':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <g fill="currentColor" fillOpacity=".12">{petals(8, 12, 46, 9)}</g>
          <circle cx="50" cy="50" r="10" /><circle cx="50" cy="50" r="4" fill="currentColor" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <path d={starPath(8, 46, 30)} /><path d={starPath(8, 30, 20)} fill="currentColor" fillOpacity=".15" />
          <circle cx="50" cy="50" r="8" />
        </svg>
      )
  }
}
