import Link from 'next/link'
import { Card } from '@/components/ui'
import { loadReminders, ratingStyle, reminderText, type Reminder } from '@/lib/reminders'
import { requireStaff } from '@/lib/staff'
import { todayET } from '@/lib/supabase/config'
import ReminderButtons from './ReminderButtons'

const fmtDay = (ymd: string) => new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const fmtWhen = (iso: string) => new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })
const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Follow-ups on check-up items the customer didn't approve yet.
export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireStaff()
  const { show = 'due' } = await searchParams
  const { all, setupMissing } = await loadReminders()
  const today = todayET()
  const soon = addDays(today, 30)
  const tabs: { id: string; label: string; list: Reminder[] }[] = [
    { id: 'due', label: 'Due now', list: all.filter((r) => !r.done && r.due <= today) },
    { id: 'soon', label: 'Next 30 days', list: all.filter((r) => !r.done && r.due > today && r.due <= soon) },
    { id: 'done', label: 'Done', list: all.filter((r) => r.done).reverse() },
  ]
  const tab = tabs.find((t) => t.id === show) ?? tabs[0]
  const pill = (on: boolean) =>
    `flex h-11 items-center rounded-[10px] border px-4 text-[15px] font-semibold ${on ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'}`

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.id} href={`/office/reminders?show=${t.id}`} className={pill(t.id === tab.id)}>
            {t.label} ({t.list.length})
          </Link>
        ))}
      </div>
      <div className="text-xs text-muted">
        Orange items (within 6 months): reminders about 3 and 5 months after the check-up. Yellow items (within 12 months): one reminder before the next check-up.
        Only items the customer didn&apos;t approve.
      </div>

      {setupMissing && (
        <Card className="text-[15px] text-body">
          To mark reminders as sent, run <code>supabase/migrations/20261125030000_report_reminders.sql</code> in Supabase → SQL Editor once.
        </Card>
      )}
      {tab.list.length === 0 && <Card className="text-[15px] text-body">{tab.id === 'done' ? 'Nothing sent yet.' : 'No reminders here.'}</Card>}

      <div className="grid gap-3.5 lg:grid-cols-2">
        {tab.list.map((r) => (
          <Card key={r.id} className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-lg font-bold">{r.customer}</span>
                <span className="text-sm text-body">{r.address}</span>
                <span className="text-sm text-body">{r.phone || 'No phone on file yet: look it up in Housecall Pro'}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-sm font-bold">{r.label}</span>
                <span className="text-xs text-muted">Due {fmtDay(r.due)}</span>
                <span className="text-xs text-muted">
                  Check-up {fmtDay(r.reportDate)}
                  {r.tech && ` · ${r.tech}`}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {r.items.map((i) => {
                const s = ratingStyle(i.rating)
                return (
                  <div key={i.key + i.stage} className="flex flex-wrap items-center gap-2 text-[15px]">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: s.bg, color: s.fg }}>
                      {s.badge}
                    </span>
                    <span>{i.title}</span>
                    {i.askedForReminder && <span className="text-xs font-semibold text-success">customer asked for a reminder</span>}
                  </div>
                )
              })}
            </div>
            {r.done && (
              <div className="text-sm text-muted">
                {r.done.outcome === 'sent' ? 'Sent' : 'Skipped'} {fmtWhen(r.done.at)}
                {r.done.by && ` by ${r.done.by}`}
              </div>
            )}
            <ReminderButtons linkId={r.linkId} items={r.items.map((i) => ({ key: i.key, stage: i.stage }))} phone={r.phone} text={reminderText(r)} done={!!r.done} />
          </Card>
        ))}
      </div>
    </main>
  )
}
