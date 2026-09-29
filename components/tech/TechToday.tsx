'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { tradeInfo } from '@/config/business'
import { checklistAreas, tradeOrder, tradeProgress, type TechDay, type VisitWork } from '@/lib/tech'
import type { GuideRow } from '@/lib/types'
import { readWork } from '@/lib/useVisitWork'
import { Card, Logo } from '../ui'

const VAN_KEY = 'mvp-tech-van'

export default function TechToday({ day, guide, dateText }: { day: TechDay; guide: GuideRow[]; dateText: string }) {
  const [vanId, setVanId] = useState(day.vans[0].id)
  const [works, setWorks] = useState<Record<string, VisitWork>>({})
  const areas = useMemo(() => checklistAreas(guide), [guide])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VAN_KEY)
      if (saved && day.vans.some((v) => v.id === saved)) setVanId(saved)
    } catch {}
    setWorks(Object.fromEntries(day.visits.map((v) => [v.id, readWork(v)])))
  }, [day])

  const pickVan = (id: string) => {
    setVanId(id)
    try {
      localStorage.setItem(VAN_KEY, id)
    } catch {}
  }

  const van = day.vans.find((v) => v.id === vanId)!
  const visits = day.visits.filter((v) => v.vanId === vanId)

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <Logo tagline="TECH" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] leading-[1.05] font-bold">Today&apos;s visits</h1>
            <div className="text-sm text-sub">
              {dateText} · {van.name} · {van.tech}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-3.5 px-4 py-4">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Van">
          {day.vans.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={v.id === vanId}
              onClick={() => pickVan(v.id)}
              className={`h-12 rounded-[10px] border border-edge text-[15px] font-semibold ${v.id === vanId ? 'bg-navy text-white' : 'bg-white text-navy'}`}
            >
              {v.name} · {v.tech}
            </button>
          ))}
        </div>

        {visits.length === 0 && <Card className="text-body">No visits for this van today.</Card>}
        <div className="grid gap-3.5 md:grid-cols-2">
          {visits.map((v) => {
            const w = works[v.id]
            const checkup = v.kind === 'checkup'
            const done = w ? tradeOrder.filter((t) => tradeProgress(w, areas, t).complete).length : 0
            const options = w?.estimate?.options.length ?? 0
            const status = w?.sentAt
              ? checkup
                ? 'Report sent'
                : 'Estimate sent'
              : checkup
                ? `${done} of 3 trades done`
                : options
                  ? `Estimate: ${options} ${options === 1 ? 'option' : 'options'}`
                  : 'Estimate not started'
            return (
              <Link key={v.id} href={`/tech/visit/${v.id}`} className="block">
                <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white">
                  <div className="h-1" style={{ background: checkup ? '#1E7B45' : tradeInfo[v.trade ?? 'HVAC'].color }} />
                  <div className="flex grow flex-col gap-1.5 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xl font-bold">{v.window}</span>
                      <span className="rounded-full bg-page px-2 py-0.5 text-xs font-bold text-muted">
                        {checkup ? `${v.season === 'spring' ? 'Spring' : 'Fall'} check-up` : `Service call · ${tradeInfo[v.trade ?? 'HVAC'].label}`}
                      </span>
                    </div>
                    <div className="text-base font-bold">{v.customer.name}</div>
                    <div className="text-sm text-body">{v.address}</div>
                    {v.complaint && <div className="text-sm text-body">“{v.complaint}”</div>}
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                      <span className={v.customer.isMember ? 'font-semibold text-success' : 'text-muted'}>
                        {v.customer.isMember ? 'Member' : 'Not a member'}
                      </span>
                      <span className={`font-semibold ${w?.sentAt ? 'text-success' : 'text-muted'}`}>{status}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="text-center text-xs text-muted">Sample day · vans, techs and customers are placeholders</div>
      </main>
    </>
  )
}
