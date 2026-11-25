import Link from 'next/link'
import { Card } from '@/components/ui'
import { nearbyCheckup as N, visitSlots } from '@/config/business'
import { loadNearby, offerText, type Anchor } from '@/lib/nearby'
import { requireStaff } from '@/lib/staff'
import OfferButtons from './OfferButtons'

const fmtDay = (ymd: string) => new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtWhen = (iso: string) => new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' })
const input = 'h-11 rounded-lg border border-edge bg-white px-3 text-[16px] outline-none focus:border-navy'

// Fill a tech's trip: members near a booked job who are due a check-up.
export default async function NearbyPage({ searchParams }: { searchParams: Promise<{ visit?: string; zip?: string; date?: string; window?: string }> }) {
  await requireStaff()
  const q = await searchParams
  const { anchors, near, setupMissing, knownZip, memberCount } = await loadNearby()

  // The job picked from the list, or a zip + day typed in by hand.
  let anchor: Anchor | null = anchors.find((a) => a.id === q.visit) ?? null
  if (!anchor && q.zip && q.date && /^\d{5}$/.test(q.zip) && /^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
    anchor = { id: '', date: q.date, window: q.window ?? '', kind: 'manual', customer: '', address: '', zip: q.zip, van: '' }
  }
  const list = anchor ? near(anchor.zip, anchor.address) : []

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <Card className="flex flex-col gap-1">
        <div className="text-base font-bold">Nearby check-ups</div>
        <div className="text-[15px] text-body">
          Pick a booked job. You&apos;ll see members within {N.radiusMiles} miles who are due a check-up (none in the last {N.dueAfterDays} days), with a text
          ready to send offering them a slot on the same trip.
        </div>
        <div className="text-xs text-muted">
          {memberCount} members (leads marked &quot;Joined&quot;). Distances are zip to zip. Housecall Pro will feed members and jobs here once it&apos;s connected.
        </div>
      </Card>

      {setupMissing && (
        <Card className="text-[15px] text-body">
          To save offers, run <code>supabase/migrations/20261125020000_nearby_offers.sql</code> in Supabase → SQL Editor once.
        </Card>
      )}

      <div className="grid gap-3.5 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-bold text-muted">BOOKED JOBS · NEXT 14 DAYS</div>
          {anchors.length === 0 && <Card className="text-sm text-muted">No jobs booked yet.</Card>}
          {anchors.map((a) => {
            const count = near(a.zip, a.address).length
            const on = anchor?.id === a.id
            return (
              <Link key={a.id} href={`/office/nearby?visit=${a.id}`} className={`flex flex-col rounded-xl px-4 py-3 ${on ? 'bg-navy text-white' : 'bg-white'}`}>
                <span className="flex justify-between gap-2 text-[15px] font-bold">
                  <span>
                    {fmtDay(a.date)} · {a.window || 'any time'}
                  </span>
                  {a.zip ? (
                    <span className={count ? 'text-success' : 'opacity-60'}>{count} nearby</span>
                  ) : (
                    <span className="opacity-60">no zip</span>
                  )}
                </span>
                <span className="text-sm opacity-80">
                  {a.customer} · {a.address}
                </span>
                {a.van && <span className="text-xs opacity-70">{a.van}</span>}
              </Link>
            )
          })}

          <form action="/office/nearby" className="mt-2 flex flex-col gap-2 rounded-xl bg-white p-4">
            <div className="text-sm font-bold">Or type a zip and day</div>
            <div className="flex flex-wrap gap-2">
              <input name="zip" inputMode="numeric" maxLength={5} placeholder="Zip" defaultValue={q.zip ?? ''} className={`${input} w-24`} required />
              <input name="date" type="date" defaultValue={q.date ?? ''} className={input} required />
              <select name="window" defaultValue={q.window ?? ''} className={input}>
                <option value="">Any time</option>
                {visitSlots.map((s) => (
                  <option key={s.id} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-11 rounded-[10px] bg-navy text-[15px] font-bold text-white">
              Find members nearby
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2">
          {!anchor && <Card className="text-[15px] text-body">Pick a job on the left.</Card>}
          {anchor && !anchor.zip && <Card className="text-[15px] text-body">This job&apos;s address has no zip code, so we can&apos;t find neighbors.</Card>}
          {anchor?.zip && !knownZip(anchor.zip) && <Card className="text-[15px] text-body">Zip {anchor.zip} is outside our service area list.</Card>}
          {anchor?.zip && knownZip(anchor.zip) && (
            <>
              <div className="text-sm font-bold text-muted">
                {list.length} MEMBER{list.length === 1 ? '' : 'S'} DUE NEAR {anchor.zip} · {fmtDay(anchor.date).toUpperCase()}
              </div>
              {list.length === 0 && <Card className="text-[15px] text-body">No members due nearby for this trip.</Card>}
              {list.map((c) => (
                <Card key={c.leadId} className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">{c.name}</span>
                      <span className="text-sm text-body">{c.address}</span>
                      <span className="text-sm text-body">{c.phone}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="font-display text-2xl font-bold">{c.miles === 0 ? 'Same zip' : `${c.miles} mi`}</span>
                      <span className="text-xs text-muted">{c.lastCheckup ? `Last check-up ${fmtDay(c.lastCheckup)}` : 'No check-up yet'}</span>
                    </div>
                  </div>
                  {c.lastOffer && (
                    <div className="rounded-[10px] bg-[#FFF1CC] px-3 py-2 text-sm font-semibold text-[#6B4700]">Already offered a nearby slot on {fmtWhen(c.lastOffer)}</div>
                  )}
                  <OfferButtons leadId={c.leadId} visitId={anchor.id || null} date={anchor.date} phone={c.phone} text={offerText(c.firstName, anchor.date, anchor.window)} />
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
