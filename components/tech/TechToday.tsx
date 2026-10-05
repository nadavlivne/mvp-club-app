'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { tradeInfo } from '@/config/business'
import { loadSampleDay, signOut } from '@/app/tech/actions'
import { checklistAreas, newWork, tradeOrder, tradeProgress, type TechDay, type Visit, type VisitWork } from '@/lib/tech'
import type { GuideRow } from '@/lib/types'
import type { ApprovalSummary } from '@/lib/approvals'
import { readWork } from '@/lib/useVisitWork'
import { Card, Logo } from '../ui'

const VAN_KEY = 'mvp-tech-van'

type Props = { guide: GuideRow[]; dateText: string } & (
  | { mode: 'sample'; day: TechDay }
  | {
      mode: 'db'
      tech: { name: string; van: string }
      visits: Visit[]
      works: Record<string, VisitWork | null>
      approvals: Record<string, ApprovalSummary>
      isStaff?: boolean
    }
)

export default function TechToday(props: Props) {
  const areas = useMemo(() => checklistAreas(props.guide), [props.guide])

  // Sample mode: pick a van, work kept on the device.
  const sampleDay = props.mode === 'sample' ? props.day : null
  const [vanId, setVanId] = useState(sampleDay?.vans[0].id ?? '')
  const [deviceWorks, setDeviceWorks] = useState<Record<string, VisitWork>>({})
  useEffect(() => {
    if (!sampleDay) return
    try {
      const saved = localStorage.getItem(VAN_KEY)
      if (saved && sampleDay.vans.some((v) => v.id === saved)) setVanId(saved)
    } catch {}
    setDeviceWorks(Object.fromEntries(sampleDay.visits.map((v) => [v.id, readWork(v)])))
  }, [sampleDay])
  const pickVan = (id: string) => {
    setVanId(id)
    try {
      localStorage.setItem(VAN_KEY, id)
    } catch {}
  }

  const [loading, startLoading] = useTransition()
  const [loadError, setLoadError] = useState<string | null>(null)

  let visits: Visit[]
  let who: string
  let workOf: (v: Visit) => VisitWork | undefined
  if (props.mode === 'sample') {
    const van = props.day.vans.find((v) => v.id === vanId)!
    visits = props.day.visits.filter((v) => v.vanId === vanId)
    who = `${van.name} · ${van.tech}`
    workOf = (v) => deviceWorks[v.id]
  } else {
    visits = props.visits
    who = [props.tech.van, props.tech.name].filter(Boolean).join(' · ')
    workOf = (v) => ({ ...newWork(v), ...(props.works[v.id] ?? {}) })
  }

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <div className="flex items-center justify-between gap-3">
            <Logo tagline="TECH" />
            {props.mode === 'db' && (
              <div className="flex items-center gap-4">
                {props.isStaff && (
                  <Link href="/office" className="flex h-11 items-center text-sm font-semibold text-sub">
                    Office →
                  </Link>
                )}
                <form action={signOut}>
                  <button type="submit" className="flex h-11 items-center text-sm font-semibold text-sub">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] leading-[1.05] font-bold">Today&apos;s visits</h1>
            <div className="text-sm text-sub">
              {props.dateText}
              {who && ` · ${who}`}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-3.5 px-4 py-4">
        {sampleDay && (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Van">
            {sampleDay.vans.map((v) => (
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
        )}

        {visits.length === 0 && (
          <Card className="flex flex-col items-start gap-3 text-body">
            <span>No visits assigned to you today.</span>
            {props.mode === 'db' && (
              <>
                <span className="text-sm text-muted">
                  Until Housecall Pro sends the schedule (phase 3), you can load four sample visits to try the app.
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    startLoading(async () => {
                      setLoadError(null)
                      const r = await loadSampleDay()
                      if (r?.error) setLoadError(r.error)
                    })
                  }
                  className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white"
                >
                  {loading ? 'Loading…' : 'Load sample visits for today'}
                </button>
                {loadError && <span className="text-sm font-semibold text-alert">{loadError}</span>}
              </>
            )}
          </Card>
        )}
        <div className="grid gap-3.5 md:grid-cols-2">
          {visits.map((v) => {
            const w = workOf(v)
            const checkup = v.kind === 'checkup'
            const done = w ? tradeOrder.filter((t) => tradeProgress(w, areas, t).complete).length : 0
            const options = w?.estimate?.options.length ?? 0
            const approval = props.mode === 'db' ? props.approvals[v.id] : undefined
            const status = approval
              ? `✓ Approved · $${Math.round(approval.total).toLocaleString('en-US')}`
              : w?.sentAt
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
                        {checkup
                          ? `${v.season === 'spring' ? 'Spring' : 'Fall'} check-up`
                          : `Service call · ${tradeInfo[v.trade ?? 'HVAC'].label}`}
                      </span>
                    </div>
                    <div className="text-base font-bold">{v.customer.name}</div>
                    <div className="text-sm text-body">{v.address}</div>
                    {v.complaint && <div className="text-sm text-body">“{v.complaint}”</div>}
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                      <span className={v.customer.isMember ? 'font-semibold text-success' : 'text-muted'}>
                        {v.customer.isMember ? 'Member' : 'Not a member'}
                      </span>
                      <span
                        className={`font-semibold ${approval ? 'rounded-full bg-success-bg px-2 text-success' : w?.sentAt ? 'text-success' : 'text-muted'}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        {props.mode === 'sample' && (
          <div className="text-center text-xs text-muted">
            Sample day · vans, techs and customers are placeholders · work is kept on this device
          </div>
        )}
      </main>
    </>
  )
}
