/**
 * Fairy-tale scenes drawn around the card: lamps in a mirror palace, a moonlit skyline,
 * a rose garden with butterflies, rising sky lanterns, marigold torans with diyas, a fairy castle.
 * Pure SVG + CSS animation (no images to download). Colours come from the card's design.
 */
import type { CSSProperties, ReactNode } from 'react'

const rand = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

/** A cusped (multi-foil) Mughal arch from (x0, base) to (x1, base) rising to the apex. */
function cuspedArch(x0: number, x1: number, base: number, spring: number, apex: number, cusps = 13) {
  const cx = (x0 + x1) / 2
  const pts: [number, number][] = []
  for (let i = 0; i <= cusps; i++) {
    const t = i / cusps
    const side = t <= 0.5 ? t * 2 : (1 - t) * 2 // 0 at springing points, 1 at apex
    const x = x0 + (x1 - x0) * t
    // ogee-ish profile: steeper near the apex
    const y = spring - (spring - apex) * Math.pow(Math.sin((side * Math.PI) / 2), 1.6)
    pts.push([x, y])
  }
  pts[Math.round(cusps / 2)] = [cx, apex]
  let d = `M${x0},${base} L${x0},${spring}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]
    const r = Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]) * 0.62
    d += ` A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${x.toFixed(1)},${y.toFixed(1)}`
  }
  return `${d} L${x1},${base}`
}

function Stars({ n, seed, w, h, size = 1 }: { n: number; seed: number; w: number; h: number; size?: number }) {
  const r = rand(seed)
  return (
    <g className="sc-stars">
      {Array.from({ length: n }, (_, i) => {
        const x = r() * w, y = r() * h, s = (0.6 + r() * 1.6) * size
        return <path key={i} d={`M${x},${y - s * 2}Q${x},${y} ${x + s * 2},${y}Q${x},${y} ${x},${y + s * 2}Q${x},${y} ${x - s * 2},${y}Q${x},${y} ${x},${y - s * 2}Z`}
          style={{ animationDelay: `${(r() * 4).toFixed(2)}s`, animationDuration: `${(2.4 + r() * 3).toFixed(2)}s` } as CSSProperties} />
      })}
    </g>
  )
}

function Jhoomar({ x, len, delay }: { x: number; len: number; delay: number }) {
  return (
    <g className="sc-sway" style={{ transformOrigin: `${x}px 0px`, animationDelay: `${delay}s` } as CSSProperties}>
      <line x1={x} y1={0} x2={x} y2={len} className="sc-line" />
      <g transform={`translate(${x},${len})`}>
        <circle r="22" className="sc-glow" />
        <path d="M-18,0 Q0,-14 18,0 L12,8 Q0,14 -12,8Z" className="sc-fill" />
        <path d="M-12,8 L-8,26 L0,34 L8,26 L12,8" className="sc-stroke" />
        {[-12, -6, 0, 6, 12].map((dx, i) => <circle key={i} cx={dx} cy={12 + Math.abs(dx) * -0.4 + 14} r="1.8" className="sc-drop" style={{ animationDelay: `${i * 0.3}s` } as CSSProperties} />)}
        <path d="M0,-6 q-3,-6 0,-11 q3,5 0,11" className="sc-flame" />
      </g>
    </g>
  )
}

function Rose({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} className="sc-rose">
      <ellipse cx="-9" cy="6" rx="9" ry="4" transform="rotate(-30)" className="sc-leaf" />
      <ellipse cx="9" cy="6" rx="9" ry="4" transform="rotate(30)" className="sc-leaf" />
      <circle r="9" className="sc-petal-a" />
      <path d="M-6,-1 q6,-9 12,0 q-6,7 -12,0" className="sc-petal-b" />
      <path d="M-3,-2 q3,-4 6,0 q-3,3 -6,0" className="sc-petal-c" />
    </g>
  )
}

function Butterfly({ cls, delay }: { cls: string; delay: number }) {
  return (
    <svg className={`sc-butterfly ${cls}`} viewBox="-12 -10 24 20" style={{ animationDelay: `${delay}s` } as CSSProperties}>
      <g className="sc-wings" style={{ animationDelay: `${delay}s` } as CSSProperties}>
        <path d="M0,0 C-4,-10 -12,-9 -10,-2 C-9,2 -4,2 0,0Z M0,0 C-3,6 -9,8 -8,3 C-7,0 -3,0 0,0Z" />
        <path d="M0,0 C4,-10 12,-9 10,-2 C9,2 4,2 0,0Z M0,0 C3,6 9,8 8,3 C7,0 3,0 0,0Z" />
      </g>
      <rect x="-.6" y="-4" width="1.2" height="9" rx=".6" className="sc-body" />
    </svg>
  )
}

function Lantern({ i }: { i: number }) {
  const r = rand(i * 97 + 13)
  const left = 4 + r() * 88, size = 18 + r() * 22, dur = 16 + r() * 16, delay = -r() * dur
  return (
    <svg className="sc-lantern" viewBox="-10 -14 20 30" style={{ left: `${left}%`, width: size, animationDuration: `${dur}s`, animationDelay: `${delay}s` } as CSSProperties}>
      <circle r="14" cy="2" className="sc-glow" />
      <path d="M-7,-10 L7,-10 L9,8 Q0,12 -9,8Z" className="sc-lantern-body" />
      <path d="M-4,8 L4,8 L3,11 L-3,11Z" className="sc-fill" />
      <ellipse cy="9" rx="2" ry="1.4" className="sc-flame" />
    </svg>
  )
}

function Marigolds({ x, n, seed }: { x: number; n: number; seed: number }) {
  const r = rand(seed)
  return (
    <g className="sc-sway" style={{ transformOrigin: `${x}px 0px`, animationDelay: `${-r() * 3}s`, animationDuration: `${3.5 + r() * 2}s` } as CSSProperties}>
      <line x1={x} y1={0} x2={x} y2={n * 11} className="sc-line" />
      {Array.from({ length: n }, (_, i) => <circle key={i} cx={x} cy={8 + i * 11} r={5.4} className={i % 3 === 2 ? 'sc-marigold-b' : 'sc-marigold'} />)}
      <path d={`M${x - 3},${n * 11 + 4} L${x},${n * 11 + 16} L${x + 3},${n * 11 + 4}`} className="sc-tassel" />
    </g>
  )
}

function Diya({ x, delay }: { x: number; delay: number }) {
  return (
    <g transform={`translate(${x},62)`}>
      <circle cy="-12" r="14" className="sc-glow" style={{ animationDelay: `${delay}s` } as CSSProperties} />
      <path d="M-14,-2 Q0,14 14,-2 Q8,-6 0,-5 Q-8,-6 -14,-2Z" className="sc-diya" />
      <path d="M0,-5 q-4,-7 0,-14 q4,7 0,14" className="sc-flame" style={{ animationDelay: `${delay}s` } as CSSProperties} />
    </g>
  )
}

const top = (children: ReactNode, h = 260) => <svg className="sc-top" viewBox={`0 0 400 ${h}`} preserveAspectRatio="xMidYMin meet">{children}</svg>
const bottom = (children: ReactNode, h = 120) => <svg className="sc-bottom" viewBox={`0 0 400 ${h}`} preserveAspectRatio="xMidYMax meet">{children}</svg>

export const SCENES = ['sheesh', 'chandni', 'gulistan', 'qandeel', 'genda', 'castle'] as const

export default function Scene({ kind }: { kind: string }) {
  if (!SCENES.includes(kind as (typeof SCENES)[number])) return null
  return (
    <div className={`scene scene-${kind}`} aria-hidden="true">
      {kind === 'sheesh' && <>
        {top(<>
          <path d={cuspedArch(14, 386, 260, 150, 18)} className="sc-arch" />
          <path d={cuspedArch(30, 370, 260, 158, 36)} className="sc-arch thin" />
          {Array.from({ length: 15 }, (_, i) => {
            const t = (i + 0.5) / 15, side = t <= .5 ? t * 2 : (1 - t) * 2
            const x = 22 + 356 * t, y = 154 - (154 - 26) * Math.pow(Math.sin((side * Math.PI) / 2), 1.6)
            return <rect key={i} x={x - 2.6} y={y - 2.6} width="5.2" height="5.2" transform={`rotate(45 ${x} ${y})`} className="sc-mirror" style={{ animationDelay: `${(i % 5) * .5}s` } as CSSProperties} />
          })}
          <Jhoomar x={92} len={70} delay={0} />
          <Jhoomar x={308} len={84} delay={-1.4} />
          <Jhoomar x={200} len={46} delay={-.7} />
        </>)}
        {bottom(<>
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={cuspedArch(8 + i * 48.5, 50 + i * 48.5, 120, 86, 52, 7)} className="sc-arch thin" />)}
          <line x1="0" y1="119" x2="400" y2="119" className="sc-arch" />
        </>)}
      </>}

      {kind === 'chandni' && <>
        {top(<>
          <Stars n={46} seed={7} w={400} h={230} />
          <circle cx="300" cy="78" r="70" className="sc-moonglow" />
          <circle cx="300" cy="78" r="34" className="sc-moon" />
          <circle cx="288" cy="70" r="6" className="sc-crater" /><circle cx="312" cy="90" r="4" className="sc-crater" /><circle cx="306" cy="64" r="3" className="sc-crater" />
          <path d="M0,40 Q60,30 120,46" className="sc-shooting" />
        </>, 230)}
        {bottom(<>
          <path className="sc-skyline" d="M0,120 L0,96 L30,96 L30,70 L34,62 L38,70 L38,96 L70,96 Q70,74 92,66 Q100,52 104,40 Q108,52 116,66 Q138,74 138,96 L170,96 Q170,62 200,48 Q204,30 200,22 Q206,30 204,48 Q234,62 234,96 L262,96 Q262,74 284,66 Q292,52 296,40 Q300,52 308,66 Q330,74 330,96 L362,96 L362,70 L366,62 L370,70 L370,96 L400,96 L400,120Z" />
          {[[36, 82], [100, 86], [200, 80], [296, 86], [366, 82]].map(([x, y], i) => <rect key={i} x={x - 2} y={y} width="4" height="7" rx="2" className="sc-window" style={{ animationDelay: `${i * .7}s` } as CSSProperties} />)}
        </>)}
      </>}

      {kind === 'gulistan' && <>
        {top(<>
          <path className="sc-vine sc-draw" d="M10,250 C0,150 40,60 120,34 C170,18 230,18 280,34 C360,60 400,150 390,250" />
          <path className="sc-vine thin sc-draw" d="M34,250 C30,170 60,90 130,62 C180,44 220,44 270,62 C340,90 370,170 366,250" />
          {[[22, 180, .9, -20], [52, 96, 1.1, 10], [118, 40, 1, 0], [200, 24, 1.3, 0], [282, 40, 1, 0], [348, 96, 1.1, -10], [378, 180, .9, 20], [86, 64, .7, 30], [314, 64, .7, -30]].map(([x, y, s, r], i) =>
            <Rose key={i} x={x} y={y} s={s} rot={r} />)}
        </>)}
        {bottom(<>
          {Array.from({ length: 11 }, (_, i) => <Rose key={i} x={10 + i * 38} y={100 - (i % 2) * 14} s={1.1 - (i % 3) * .12} rot={(i % 2 ? 1 : -1) * 15} />)}
        </>)}
        <Butterfly cls="b1" delay={0} /><Butterfly cls="b2" delay={-4} /><Butterfly cls="b3" delay={-8} />
      </>}

      {kind === 'qandeel' && <>
        {top(<>
          <Stars n={30} seed={21} w={400} h={180} size={.8} />
          <path d="M0,18 Q100,70 200,24 Q300,70 400,18" className="sc-line" />
          {Array.from({ length: 13 }, (_, i) => {
            const t = (i + .5) / 13, x = 400 * t, seg = t < .5 ? t * 2 : (t - .5) * 2
            const y = (t < .5 ? 18 + (24 - 18) * seg : 24 + (18 - 24) * seg) + Math.sin(seg * Math.PI) * 23
            return <circle key={i} cx={x} cy={y + 5} r="3.2" className="sc-bulb" style={{ animationDelay: `${(i % 4) * .35}s` } as CSSProperties} />
          })}
        </>, 180)}
        {bottom(<>
          <path className="sc-hills" d="M0,120 L0,88 Q60,60 120,82 Q190,104 250,74 Q320,44 400,80 L400,120Z" />
          <Stars n={14} seed={5} w={400} h={30} size={.5} />
        </>)}
        <div className="sc-lanterns">{Array.from({ length: 9 }, (_, i) => <Lantern key={i} i={i} />)}</div>
      </>}

      {kind === 'genda' && <>
        {top(<>
          <path d="M0,6 Q200,58 400,6" className="sc-line" />
          {Array.from({ length: 21 }, (_, i) => {
            const t = i / 20, x = 400 * t, y = 6 + Math.sin(t * Math.PI) * 26
            return <circle key={`g${i}`} cx={x} cy={y} r="6.5" className={i % 2 ? 'sc-marigold-b' : 'sc-marigold'} />
          })}
          {[[24, 10], [64, 7], [104, 12], [144, 8], [256, 8], [296, 12], [336, 7], [376, 10]].map(([x, n], i) => <Marigolds key={i} x={x} n={n} seed={i + 3} />)}
          <path className="sc-paisley" d="M188,40 c-14,10 -10,34 10,34 c16,0 20,-20 8,-28 c-8,-6 -4,-16 6,-18 c-14,-4 -22,4 -24,12z" />
        </>, 200)}
        {bottom(<>{[40, 120, 200, 280, 360].map((x, i) => <Diya key={i} x={x} delay={i * .4} />)}</>, 80)}
      </>}

      {kind === 'castle' && <>
        {top(<>
          <Stars n={34} seed={11} w={400} h={200} />
          <path d="M318,40 a26,26 0 1 0 22,40 a20,20 0 1 1 -22,-40z" className="sc-moon" />
          <g className="sc-cloud c1"><ellipse cx="80" cy="60" rx="40" ry="12" /><ellipse cx="104" cy="52" rx="24" ry="12" /><ellipse cx="62" cy="54" rx="18" ry="10" /></g>
          <g className="sc-cloud c2"><ellipse cx="250" cy="110" rx="34" ry="10" /><ellipse cx="270" cy="102" rx="20" ry="10" /></g>
          <path d="M20,180 Q160,40 380,120" className="sc-dust" />
        </>, 200)}
        {bottom(<>
          <g transform="translate(0,24)">
          <path className="sc-castle" d="M90,120 L90,70 L84,70 L100,30 L116,70 L110,70 L110,82 L140,82 L140,56 L134,56 L152,10 L170,56 L164,56 L164,74 L184,74 L184,40 L178,40 L200,-6 L222,40 L216,40 L216,74 L236,74 L236,56 L230,56 L248,10 L266,56 L260,56 L260,82 L290,82 L290,70 L284,70 L300,30 L316,70 L310,70 L310,120Z" />
          <path className="sc-door" d="M188,124 L188,104 Q200,90 212,104 L212,124Z" />
          {[[100, 92], [152, 70], [200, 54], [200, 82], [248, 70], [300, 92]].map(([x, y], i) => <rect key={i} x={x - 2.5} y={y} width="5" height="8" rx="2.5" className="sc-window" style={{ animationDelay: `${i * .6}s` } as CSSProperties} />)}
          <path className="sc-flag" d="M200,-6 l0,-14 l12,4 l-12,4" />
          </g>
        </>, 150)}
      </>}
    </div>
  )
}
