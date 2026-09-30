import Link from 'next/link'
import { visitSlots } from '@/config/business'
import { Card } from '@/components/ui'
import { money } from '@/lib/pricing'
import { adminClient } from '@/lib/supabase/server'
import { dateET, requireStaff, weekStartET } from '@/lib/staff'
import ScheduledButton from './ScheduledButton'

type Row = {
  id: string
  created_at: string
  details: Record<string, unknown>
  signature: string
  scheduled_at: string | null
  customer_links: {
    kind: 'report' | 'estimate'
    token: string
    visits: {
      address: string
      kind: string
      trade: string | null
      customer: { name: string; isMember: boolean }
      techs: { name: string; van: string } | null
    }
  }
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// Every job a customer approved, ready for the office to book in Housecall Pro.
export default async function ApprovedJobs({ searchParams }: { searchParams: Promise<{ van?: string; show?: string }> }) {
  const staff = await requireStaff()
  const { van = 'all', show = 'ready' } = await searchParams

  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const { data } = await adminClient()
    .from('approvals')
    .select(
      'id, created_at, details, signature, scheduled_at, customer_links!inner(kind, token, visits!inner(address, kind, trade, customer, techs(name, van)))',
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .returns<Row[]>()
  const rows = data ?? []
  const vanOf = (r: Row) => r.customer_links.visits.techs?.van || 'No van'
  const vans = [...new Set(rows.map(vanOf))].sort()

  const inVan = rows.filter((r) => van === 'all' || vanOf(r) === van)
  const ready = inVan.filter((r) => !r.scheduled_at)
  const done = inVan.filter((r) => r.scheduled_at)
  const list = show === 'scheduled' ? done : ready

  // Admin only: approved this week (Mon–Sun) per van. Not revenue yet — paid jobs come from Housecall Pro (phase 3).
  const monday = weekStartET()
  const week = rows.filter((r) => dateET(r.created_at) >= monday)
  const weekByVan = [...new Set(week.map(vanOf))].sort().map((v) => ({
    van: v,
    total: week.filter((r) => vanOf(r) === v).reduce((a, r) => a + Number(r.details.total ?? 0), 0),
    jobs: week.filter((r) => vanOf(r) === v).length,
  }))

  const link = (p: Record<string, string>) => `/office?${new URLSearchParams({ van, show, ...p })}`
  const pill = (on: boolean) =>
    `flex h-11 items-center rounded-[10px] border px-4 text-[15px] font-semibold ${on ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'}`

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      {staff.role === 'admin' && (
        <Card className="flex flex-col gap-2">
          <div className="text-base font-bold">
            Approved this week{' '}
            <span className="text-sm font-normal text-muted">
              (since Monday {new Date(monday + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · admin only)
            </span>
          </div>
          {weekByVan.length === 0 ? (
            <div className="text-sm text-muted">Nothing approved yet this week.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weekByVan.map((w) => (
                <div key={w.van} className="flex flex-col">
                  <span className="text-xs text-muted">{w.van}</span>
                  <span className="font-display text-2xl font-bold">{money(w.total)}</span>
                  <span className="text-xs text-muted">
                    {w.jobs} {w.jobs === 1 ? 'job' : 'jobs'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-muted">Approved, not yet paid. Paid revenue and bonuses come from Housecall Pro in phase 3.</div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Link href={link({ show: 'ready' })} className={pill(show !== 'scheduled')}>
            Ready to schedule ({ready.length})
          </Link>
          <Link href={link({ show: 'scheduled' })} className={pill(show === 'scheduled')}>
            Scheduled ({done.length})
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', ...vans].map((v) => (
            <Link key={v} href={link({ van: v })} className={pill(van === v)}>
              {v === 'all' ? 'All vans' : v}
            </Link>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <Card className="text-[15px] text-body">
          {show === 'scheduled' ? 'Nothing scheduled yet.' : 'All caught up — no approved jobs waiting.'}
        </Card>
      )}

      <div className="grid gap-3.5 lg:grid-cols-2">
        {list.map((r) => {
          const v = r.customer_links.visits
          const d = r.details
          const report = r.customer_links.kind === 'report'
          const items = (d.items as { title: string; price: number }[] | undefined) ?? []
          const option = d.option as { name: string; what: string; price: number } | undefined
          const slot = visitSlots.find((s) => s.id === d.slot)?.label
          return (
            <Card key={r.id} className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">{v.customer.name}</span>
                  <span className="text-sm text-body">{v.address}</span>
                </div>
                <span className="font-display text-2xl font-bold">{money(Number(d.total ?? 0))}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-page px-2 py-0.5 text-muted">{report ? 'From check-up' : 'Service-call estimate'}</span>
                <span className="rounded-full bg-page px-2 py-0.5 text-muted">
                  {v.techs?.van || 'No van'} · {v.techs?.name || 'Unknown tech'}
                </span>
                {v.customer.isMember && <span className="rounded-full bg-success-bg px-2 py-0.5 text-success">Member</span>}
                {d.joinedClub === true && (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-success">Joined MVP Club today</span>
                )}
              </div>
              <div className="flex flex-col gap-1 text-[15px]">
                {report
                  ? items.map((i) => (
                      <div key={i.title} className="flex justify-between gap-3">
                        <span>{i.title}</span>
                        <span className="font-semibold">{money(i.price)}</span>
                      </div>
                    ))
                  : option && (
                      <>
                        <div className="flex justify-between gap-3">
                          <span>
                            {option.name} — {option.what}
                          </span>
                          <span className="font-semibold">{money(option.price)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Service call</span>
                          <span className="font-semibold">{money(Number(d.serviceCall ?? 0))}</span>
                        </div>
                      </>
                    )}
              </div>
              {report && (
                <div className="rounded-[10px] bg-[#FFF1CC] px-3 py-2 text-[15px] font-semibold text-[#6B4700]">
                  Customer picked: {String(d.dayLabel ?? '')} · {slot}
                </div>
              )}
              {!report && <div className="text-sm text-muted">Emergency repair — done on the same visit.</div>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5">
                <div className="flex items-center gap-3 text-xs text-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.signature} alt="Customer signature" className="h-10 rounded border border-line bg-white" />
                  <span>
                    Approved {fmt(r.created_at)}
                    {r.scheduled_at && (
                      <>
                        <br />
                        Scheduled {fmt(r.scheduled_at)}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/r/${r.customer_links.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center px-2 text-sm font-semibold text-link"
                  >
                    Customer page
                  </a>
                  <ScheduledButton id={r.id} scheduled={!!r.scheduled_at} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
