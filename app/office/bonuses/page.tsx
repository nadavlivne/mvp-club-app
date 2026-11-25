import Link from 'next/link'
import BonusLines from '@/components/BonusCard'
import { Card } from '@/components/ui'
import { bonusWeek, payday, recentWeeks, weekLabel } from '@/lib/bonus'
import { requireStaff, weekStartET } from '@/lib/staff'
import { saveVanRevenue } from './actions'

const input = 'h-11 rounded-lg border border-edge bg-white px-3 text-[16px] outline-none focus:border-navy'

// Weekly tech bonus per van (admin only). Revenue is typed in from Housecall Pro until phase 3.
export default async function BonusesPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  await requireStaff('admin')
  const weeks = recentWeeks(weekStartET())
  const { week: asked } = await searchParams
  const week = weeks.includes(asked ?? '') ? asked! : weeks[0]
  const { vans, setupMissing } = await bonusWeek(week)
  const total = vans.reduce((a, v) => a + v.bonus.total, 0)

  const pill = (on: boolean) =>
    `flex h-11 items-center rounded-[10px] border px-3 text-sm font-semibold ${on ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'}`

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <div className="flex flex-wrap gap-2">
        {weeks.map((w, i) => (
          <Link key={w} href={`/office/bonuses?week=${w}`} className={pill(w === week)}>
            {i === 0 ? 'This week' : i === 1 ? 'Last week' : weekLabel(w)}
          </Link>
        ))}
      </div>

      {setupMissing && (
        <Card className="text-[15px] text-body">
          To save revenue, run <code>supabase/migrations/20261125010000_tech_bonus.sql</code> in Supabase → SQL Editor once.
        </Card>
      )}

      <Card className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-base font-bold">Week of {weekLabel(week)}</span>
          <span className="text-sm text-muted">Paid {payday(week)} · revenue = paid jobs before sales tax, no membership fees</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted">All vans</span>
          <span className="font-display text-3xl font-bold">${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
      </Card>

      {vans.length === 0 && <Card className="text-[15px] text-body">No vans yet. Set each tech&apos;s van under Team.</Card>}

      <div className="grid gap-3.5 lg:grid-cols-2">
        {vans.map((v) => (
          <Card key={v.van} className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-lg font-bold">{v.van}</span>
              <span className="text-sm text-muted">{v.techs.join(', ') || 'No tech assigned'}</span>
            </div>
            <form action={saveVanRevenue} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="week" value={week} />
              <input type="hidden" name="van" value={v.van} />
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Paid revenue (from Housecall Pro)</span>
                <input
                  name="revenue"
                  inputMode="decimal"
                  className={`${input} w-40`}
                  defaultValue={v.revenueEntered ? String(v.bonus.revenue) : ''}
                  placeholder="$0"
                  required
                />
              </label>
              <label className="flex min-w-40 flex-1 flex-col gap-1">
                <span className="text-sm font-semibold">Note (optional)</span>
                <input name="note" className={input} defaultValue={v.note} />
              </label>
              <button type="submit" className="h-11 rounded-[10px] bg-navy px-4 text-[15px] font-bold text-white">
                Save
              </button>
            </form>
            {v.enteredBy && <div className="-mt-2 text-xs text-muted">Entered by {v.enteredBy}</div>}
            <BonusLines b={v.bonus} revenueEntered={v.revenueEntered} />
            {v.items.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-link">Report items sold ({v.items.length})</summary>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {v.items.map((i, n) => (
                    <li key={n} className="text-body">
                      {i.title} · {i.customer}
                      {i.tech && <span className="text-muted"> · found by {i.tech}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted">
        A report item counts as sold when the customer approves it on their report page. When Housecall Pro is connected, paid revenue will fill in by itself.
      </p>
    </main>
  )
}
