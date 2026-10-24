'use client'
import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Card from '@/components/Card'
import Icon from '@/components/Icon'

type Tile = { id: number; icon: string; label: string; value: number; note: string }
type Day = { name: string; amt: number }

const durations = [
  { id: 1, name: 'Last 7 days' },
  { id: 2, name: 'Last 30 days' },
]

/** The kit's "Overview" card with Dawatnama numbers, and replies per day in the kit's bar chart. */
export default function DashboardOverview({ tiles, week, month }: { tiles: Tile[]; week: Day[]; month: Day[] }) {
  const [active, setActive] = useState(tiles[0]?.id ?? 1)
  const [duration, setDuration] = useState(durations[0])
  const data = duration.id === 1 ? week : month
  const total = data.reduce((n, d) => n + d.amt, 0)
  const top = useMemo(() => Math.max(...data.map((d) => d.amt)), [data])

  const CustomTooltip = ({ payload }: { payload?: { value: number }[] }) =>
    payload && payload.length ? <div className="chart-tooltip !py-0.75"><div className="text-caption">{payload[0].value}</div></div> : null

  return (
    <>
      <Card title="Overview">
        <div className="pt-1">
          <div className="flex mb-4 p-1.5 border border-s-subtle rounded-4xl bg-b-depth2 max-md:flex-wrap">
            {tiles.map((tab) => (
              <div key={tab.id}
                className={`group flex-1 px-8 py-8 rounded-3xl cursor-pointer transition-all max-3xl:px-6 max-2xl:p-5 max-md:basis-1/2 max-md:p-4 ${active === tab.id ? 'bg-b-surface2 shadow-depth-toggle' : ''}`}
                onClick={() => setActive(tab.id)}>
                <div className={`flex items-center gap-3 mb-2 text-sub-title-1 transition-colors group-hover:text-t-primary max-md:mb-3 max-md:text-sub-title-2 ${active === tab.id ? 'text-t-primary' : 'text-t-secondary'}`}>
                  <Icon className={`transition-colors group-hover:fill-t-primary ${active === tab.id ? 'fill-t-primary' : 'fill-t-secondary'}`} name={tab.icon} />
                  <div>{tab.label}</div>
                </div>
                <div className="text-h2 max-2xl:text-h3 max-md:text-h4">{tab.value}</div>
                <div className="mt-1 text-body-2 text-t-secondary max-md:text-caption">{tab.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Replies" selectValue={duration} selectOnChange={setDuration} selectOptions={durations}>
        <div className="pt-6 px-5 pb-5 max-md:pt-5 max-lg:px-3 max-lg:pb-4">
          <div className="flex items-end max-md:block">
            <div className="shrink-0 w-52 mr-18 max-2xl:mr-8 max-md:flex max-md:items-center max-md:gap-4 max-md:mb-4">
              <div className="mb-4 text-h2 max-md:mb-0">{total}</div>
              <div className="text-caption text-t-tertiary">RSVP replies in the {duration.name.toLowerCase()}</div>
            </div>
            <div className="grow h-74">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart width={150} height={40} data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: '12px', fill: 'var(--text-tertiary)' }} height={32} dy={10} interval={duration.id === 1 ? 0 : 4} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Bar dataKey="amt" activeBar={{ fill: 'var(--chart-green)', fillOpacity: 1 }} radius={6} minPointSize={4}>
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.amt === top && top > 0 ? 'var(--chart-green)' : 'var(--shade-07)'} fillOpacity={entry.amt === top && top > 0 ? 1 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
