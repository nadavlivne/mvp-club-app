import Link from 'next/link'
import { Card } from '@/components/ui'
import { site } from '@/config/site'
import { money } from '@/lib/pricing'
import { adminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/staff'
import LeadActions from './LeadActions'
import type { LeadStatus } from './actions'

type Lead = {
  id: string
  created_at: string
  updated_at: string
  status: LeadStatus
  step: number
  first_name: string
  last_name: string
  phone: string
  email: string
  street: string
  city: string
  zip: string
  in_area: boolean | null
  systems: number | null
  plan: 'monthly' | 'yearly' | null
  price: number | null
  preferred_time: string
  notes: string
  signature: string | null
  signed_at: string | null
  office_notes: string
  handled_by: string
  handled_at: string | null
  source: string
  techs: { name: string; van: string } | null
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// What the customer got through before they stopped (step = furthest step saved).
const STOPPED_AT: Record<number, string> = {
  1: 'Gave name and phone, stopped before the home address',
  2: 'Gave their home, stopped before choosing a plan',
  3: 'Chose a plan, stopped before signing',
  4: 'Got to the signature, did not sign',
}

const TABS: { id: string; label: string; statuses: LeadStatus[] }[] = [
  { id: 'new', label: 'New', statuses: ['signed_up', 'started'] },
  { id: 'contacted', label: 'Contacted', statuses: ['contacted'] },
  { id: 'joined', label: 'Joined', statuses: ['joined'] },
  { id: 'lost', label: 'Not interested', statuses: ['lost'] },
]

// Website sign-ups and people who started signing up but stopped.
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireStaff()
  const { show = 'new' } = await searchParams
  const tab = TABS.find((t) => t.id === show) ?? TABS[0]

  const since = new Date(Date.now() - 180 * 86_400_000).toISOString()
  const { data, error } = await adminClient().from('leads').select('*, techs(name, van)').gte('created_at', since).order('created_at', { ascending: false }).returns<Lead[]>()
  const all = data ?? []
  const count = (t: (typeof TABS)[number]) => all.filter((l) => t.statuses.includes(l.status)).length
  // Finished sign-ups first, then people who stopped.
  const list = all.filter((l) => tab.statuses.includes(l.status)).sort((a, b) => Number(!!b.signed_at) - Number(!!a.signed_at))
  const recent = (l: Lead) => Date.now() - new Date(l.updated_at).getTime() < 30 * 60_000

  const pill = (on: boolean) =>
    `flex h-11 items-center rounded-[10px] border px-4 text-[15px] font-semibold ${on ? 'border-navy bg-navy text-white' : 'border-edge bg-white text-navy'}`

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-3.5 px-4 py-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.id} href={`/office/leads?show=${t.id}`} className={pill(t.id === tab.id)}>
            {t.label} ({count(t)})
          </Link>
        ))}
      </div>
      <div className="text-sm text-muted">
        Sign-ups from the website ({site.url.replace('https://www.', '')}/join) and from the techs&apos; tablets. On the website, someone who gives their name and phone
        shows up here right away, even if they stop before signing.
      </div>

      {error && (
        <Card className="border-2 border-alert text-[15px] font-semibold text-alert">
          Leads can&apos;t be read yet. In Supabase → SQL Editor, run the file supabase/migrations/20261007000000_leads.sql.
        </Card>
      )}

      {!error && list.length === 0 && <Card className="text-[15px] text-body">{tab.id === 'new' ? 'No new leads — all caught up.' : 'Nothing here yet.'}</Card>}

      <div className="grid gap-3.5 lg:grid-cols-2">
        {list.map((l) => {
          const phoneHref = '+1' + l.phone.replace(/\D/g, '')
          return (
            <Card key={l.id} className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">
                    {l.first_name} {l.last_name}
                  </span>
                  {l.street && (
                    <span className="text-sm text-body">
                      {l.street}, {l.city} {l.zip}
                    </span>
                  )}
                </div>
                {l.plan && l.price != null && (
                  <span className="text-right">
                    <span className="font-display text-2xl font-bold">{money(l.price)}</span>
                    <span className="text-sm text-muted">/{l.plan === 'monthly' ? 'mo' : 'yr'}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {l.source === 'tech' ? (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-success">
                    Signed up on site ✓ — {l.techs ? `${l.techs.name}${l.techs.van ? ` (${l.techs.van})` : ''}` : 'tech'} · check the card was taken in Housecall Pro
                  </span>
                ) : l.signed_at ? (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-success">Signed up on the website ✓ — call to schedule + send payment link</span>
                ) : recent(l) ? (
                  <span className="rounded-full bg-[#E3EEFB] px-2 py-0.5 text-[#174F8C]">Filling in the form now</span>
                ) : (
                  <span className="rounded-full bg-[#FFF1CC] px-2 py-0.5 text-[#6B4700]">Stopped: {STOPPED_AT[l.step] ?? 'did not finish'}</span>
                )}
                {l.in_area === false && <span className="rounded-full bg-[#FDE7E4] px-2 py-0.5 text-[#8A1C12]">Outside service area</span>}
                {l.systems != null && (
                  <span className="rounded-full bg-page px-2 py-0.5 text-muted">
                    {l.systems} heating &amp; cooling {l.systems === 1 ? 'system' : 'systems'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={`tel:${phoneHref}`} className="flex h-11 items-center rounded-[10px] border border-edge bg-white px-3 text-[15px] font-semibold">
                  📞 {l.phone}
                </a>
                <a href={`sms:${phoneHref}`} className="flex h-11 items-center rounded-[10px] border border-edge bg-white px-3 text-[15px] font-semibold">
                  Text
                </a>
                {l.email && (
                  <a href={`mailto:${l.email}`} className="flex h-11 items-center rounded-[10px] border border-edge bg-white px-3 text-[15px] font-semibold">
                    {l.email}
                  </a>
                )}
              </div>

              {(l.preferred_time || l.notes) && (
                <div className="flex flex-col gap-1 text-[15px]">
                  {l.preferred_time && (
                    <div>
                      <span className="text-muted">Best time:</span> {l.preferred_time}
                    </div>
                  )}
                  {l.notes && (
                    <div>
                      <span className="text-muted">Customer note:</span> {l.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted">
                {l.signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.signature} alt="Customer signature" className="h-10 rounded border border-line bg-white" />
                )}
                <span>
                  Started {fmt(l.created_at)}
                  {l.signed_at && <> · Signed {fmt(l.signed_at)}</>}
                  {l.handled_at && (
                    <>
                      <br />
                      Marked by {l.handled_by} · {fmt(l.handled_at)}
                    </>
                  )}
                </span>
              </div>

              <LeadActions id={l.id} status={l.status} notes={l.office_notes} />
            </Card>
          )
        })}
      </div>
    </main>
  )
}
