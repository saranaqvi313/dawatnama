'use client'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayPoint } from '@/lib/cardAnalytics'

// Kit blue and green: checked for colour-blind separation and contrast in light and dark mode.
const SERIES = [
  { key: 'opens', label: 'Opens', color: 'var(--primary-01)' },
  { key: 'replies', label: 'Replies', color: 'var(--primary-02)' },
] as const

function Tip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip !py-1.5">
      <div className="mb-1 text-caption text-t-secondary">{label}</div>
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center gap-2 text-caption">
          <span className="size-2 rounded-full" style={{ background: s.color }} />
          {s.label} <b className="ml-auto pl-3">{payload.find((p) => p.dataKey === s.key)?.value ?? 0}</b>
        </div>
      ))}
    </div>
  )
}

/** Opens and replies per day, side by side on one count axis. */
export default function OpensRepliesChart({ data }: { data: DayPoint[] }) {
  return (
    <div>
      <div className="flex gap-5 mb-4 text-caption text-t-secondary" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
      <div className="h-64" role="img" aria-label="Opens and replies per day for the last 14 days">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: '12px', fill: 'var(--text-tertiary)' }} interval={1} dy={8} height={30} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: '12px', fill: 'var(--text-tertiary)' }} width={48} />
            <Tooltip content={<Tip />} cursor={{ fill: 'var(--shade-07)', fillOpacity: 0.08 }} />
            {SERIES.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={14} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-caption text-t-secondary">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="w-full mt-2 text-left">
          <thead><tr><th className="py-1 font-normal">Day</th><th className="font-normal">Opens</th><th className="font-normal">Replies</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.day} className="text-t-primary"><td className="py-0.5">{d.label}</td><td>{d.opens}</td><td>{d.replies}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  )
}
