'use client'

import { useMemo } from 'react'
import { visitDaysOffered, visitSlots } from '@/config/business'
import { Card } from './ui'

export type VisitDay = { iso: string; label: string; long: string }

// The next few weekdays, starting tomorrow.
export function upcomingDays(count = visitDaysOffered, from = new Date()): VisitDay[] {
  const days: VisitDay[] = []
  const d = new Date(from)
  let first = true
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) {
      first = false
      continue
    }
    const short = d.toLocaleDateString('en-US', { weekday: 'short' })
    days.push({
      iso: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: first && days.length === 0 ? 'Tomorrow' : `${short} ${d.getDate()}`,
      long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    })
    first = false
  }
  return days
}

const pill = (on: boolean) =>
  `h-11 rounded-[10px] border border-edge text-sm font-semibold ${on ? 'bg-navy text-white' : 'bg-white text-navy'}`

export default function VisitPicker({
  day,
  slot,
  onDay,
  onSlot,
  title,
}: {
  day: VisitDay | null
  slot: string
  onDay: (d: VisitDay) => void
  onSlot: (s: string) => void
  title?: React.ReactNode
}) {
  const days = useMemo(() => upcomingDays(), [])
  return (
    <Card className="flex flex-col gap-2.5">
      {title ?? <div className="text-base font-bold">When should we come?</div>}
      <div className="grid grid-cols-4 gap-2">
        {days.map((d) => (
          <button key={d.iso} type="button" className={pill(day?.iso === d.iso)} onClick={() => onDay(d)}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {visitSlots.map((s) => (
          <button key={s.id} type="button" className={pill(slot === s.id)} onClick={() => onSlot(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
    </Card>
  )
}
