import { Card } from '@/components/ui'
import { money } from '@/lib/pricing'
import { getPriceSettings, livePriceBook, priceBookSource, type PriceChanges } from '@/lib/priceBook'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'
import PricesClient from './PricesClient'

export const metadata = { title: 'Price list · MVP Club office' }

type Version = { id: string; published_at: string; published_by_name: string; file_name: string; row_count: number; changes: PriceChanges }

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// Admin only: where prices come from, keeping them in sync, and the change history.
export default async function PricesPage() {
  await requireStaff('admin')
  const [settings, source, book, versions] = await Promise.all([
    getPriceSettings().catch(() => null),
    priceBookSource(),
    livePriceBook(),
    adminClient()
      .from('price_book_versions')
      .select('id, published_at, published_by_name, file_name, row_count, changes')
      .order('published_at', { ascending: false })
      .limit(15)
      .returns<Version[]>()
      .then((r) => r.data ?? []),
  ])
  const notSetUp = settings === null
  const rows = [...book.values()].sort((a, b) => a.code.localeCompare(b.code))

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <h1 className="font-display text-[28px] font-bold">Price list</h1>
      {notSetUp ? (
        <Card className="border-2 border-[#F2B705] text-[15px]">
          One more setup step: run <b>supabase/migrations/20261005000000_price_book.sql</b> in Supabase → SQL Editor. Until then the app uses the price
          list file that came with it.
        </Card>
      ) : (
        <PricesClient
          sheetUrl={settings.sheetUrl}
          tabs={settings.tabs}
          lastSync={settings.lastSync}
          source={source}
          count={rows.length}
        />
      )}

      {versions.length > 0 && (
        <Card className="flex flex-col gap-2">
          <div className="text-base font-bold">History</div>
          {versions.map((v) => {
            const c = v.changes
            const n = c.added.length + c.removed.length + c.changed.length
            return (
              <details key={v.id} className="border-t border-line pt-2 first-of-type:border-0">
                <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 text-[15px]">
                  <b>{fmt(v.published_at)}</b>
                  <span className="text-body">
                    {n} {n === 1 ? 'change' : 'changes'} · from {v.file_name || 'upload'} · by {v.published_by_name || '—'}
                  </span>
                </summary>
                <div className="flex flex-col gap-1 py-2 pl-4 text-sm text-body">
                  {c.changed.map((x) => (
                    <div key={x.code}>
                      <b>{x.code}</b> {x.task}: {x.fields.map((f) => `${f.field} ${f.from} → ${f.to}`).join(' · ')}
                    </div>
                  ))}
                  {c.added.map((x) => (
                    <div key={x.code}>
                      <b>Added</b> {x.code} {x.task}
                    </div>
                  ))}
                  {c.removed.map((x) => (
                    <div key={x.code}>
                      <b>Removed</b> {x.code} {x.task}
                    </div>
                  ))}
                </div>
              </details>
            )
          })}
        </Card>
      )}

      <Card className="flex flex-col gap-2">
        <div className="text-base font-bold">Current prices ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3">Code</th>
                <th className="py-1 pr-3">Task</th>
                <th className="py-1 pr-3 text-right">Regular</th>
                <th className="py-1 pr-3 text-right">Member</th>
                <th className="py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t border-line">
                  <td className="py-1.5 pr-3 font-mono text-xs whitespace-nowrap">{r.code}</td>
                  <td className="py-1.5 pr-3">{r.task}</td>
                  <td className="py-1.5 pr-3 text-right">{money(r.standardPrice)}</td>
                  <td className="py-1.5 pr-3 text-right">{r.memberPrice === 0 ? 'Included' : money(r.memberPrice)}</td>
                  <td className="py-1.5 text-xs text-muted">{[r.creditTier && `${r.creditTier} credit`, r.notes].filter(Boolean).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}
