import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import TechJoinForm, { type JoinPrefill } from '@/components/tech/TechJoinForm'
import { Card, Logo } from '@/components/ui'
import { membership, serviceCallCode } from '@/config/business'
import { loadCatalogLive } from '@/lib/data'
import { money } from '@/lib/pricing'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient, userClient } from '@/lib/supabase/server'
import type { VisitWork } from '@/lib/tech'
import { fromRow, type VisitRow } from '@/lib/visits'

export const metadata = { title: 'Sign up for MVP Club · MVP Tech' }

// "123 Main St, Cincinnati, OH 45202" → street, city, zip (the customer can correct them).
function splitAddress(address: string) {
  const parts = address.split(',').map((p) => p.trim())
  const zip = address.match(/\b(\d{5})(?:-\d{4})?\b\s*$/)?.[1] ?? ''
  const city = (parts[1] ?? '').replace(/\b(OH|KY|IN)\b.*$/, '').trim()
  return { street: parts[0] ?? '', city, zip }
}

export default async function TechJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!supabaseConfigured) redirect(`/tech/visit/${id}`)

  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/tech/login')

  // Row Level Security: only the tech's own visits.
  const { data: row } = await supabase.from('visits').select('*').eq('id', id).maybeSingle<VisitRow>()
  if (!row) notFound()
  const visit = fromRow(row)
  const [{ data: work }, { data: signed }, { book }] = await Promise.all([
    supabase.from('visit_work').select('work').eq('visit_id', id).maybeSingle<{ work: VisitWork }>(),
    adminClient().from('leads').select('first_name, last_name, signed_at').eq('visit_id', id).not('signed_at', 'is', null).limit(1),
    loadCatalogLive(),
  ])

  // Systems: furnaces and heat pumps on file (at least one).
  const equipment = work?.work.equipment ?? visit.equipment
  const systems = Math.min(membership.maxSystems, Math.max(1, equipment.filter((e) => e.type === 'Furnace' || e.type === 'Heat pump').length))
  const [firstName, ...rest] = visit.customer.name.trim().split(/\s+/)
  const prefill: JoinPrefill = {
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    systems,
    ...splitAddress(visit.address),
  }
  const call = book.get(serviceCallCode.HVAC)
  const memberCall = money(call?.memberPrice ?? 19)
  const regularCall = money(call?.standardPrice ?? 119)

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <div className="flex items-center justify-between gap-3">
            <Logo tagline="TECH" />
            <Link href={`/tech/visit/${id}`} className="flex h-11 items-center text-sm font-semibold text-sub">
              ← Back to the visit
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[28px] leading-[1.05] font-bold">Sign up for MVP Club</h1>
            <div className="text-sm text-sub">
              {visit.customer.name} · {visit.address}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
        {visit.customer.isMember ? (
          <Card className="text-[15px] font-semibold text-success">{visit.customer.name} is already an MVP Club member.</Card>
        ) : signed?.length ? (
          <Card className="flex flex-col gap-1 border-2 border-success bg-success-bg">
            <div className="text-base font-bold text-success">
              ✓ {signed[0].first_name} {signed[0].last_name} signed up on this visit
            </div>
            <div className="text-sm text-body">Make sure the card was taken in the Housecall Pro app.</div>
          </Card>
        ) : (
          <TechJoinForm visitId={id} prefill={prefill} memberCall={memberCall} regularCall={regularCall} />
        )}
      </main>
    </>
  )
}
