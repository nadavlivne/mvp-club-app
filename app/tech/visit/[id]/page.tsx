import { notFound, redirect } from 'next/navigation'
import SetupProblem from '@/components/tech/SetupProblem'
import VisitApp from '@/components/tech/VisitApp'
import { loadCatalogLive, readSample } from '@/lib/data'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient, userClient } from '@/lib/supabase/server'
import { checkSetup } from '@/lib/supabase/setupCheck'
import { approvalsFor } from '@/lib/approvals'
import type { TechDay, VisitWork } from '@/lib/tech'
import { fromRow, type VisitRow } from '@/lib/visits'

export const metadata = { title: 'Visit · MVP Tech' }

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { guide, book } = await loadCatalogLive()
  const catalog = { guide: [...guide.values()], book: [...book.values()] }

  // No database keys yet: the sample day, saved on the device.
  if (!supabaseConfigured) {
    const day = readSample<TechDay>('tech-day.json')
    const visit = day.visits.find((v) => v.id === id)
    if (!visit) notFound()
    const van = day.vans.find((v) => v.id === visit.vanId)!
    return <VisitApp visit={visit} techName={van.tech} {...catalog} />
  }

  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/tech/login')

  const problems = await checkSetup(supabase, user.id, user.email ?? '')
  if (problems.length) return <SetupProblem problems={problems} />

  // Row Level Security: a tech can only open their own visits.
  const { data: row } = await supabase.from('visits').select('*').eq('id', id).maybeSingle<VisitRow>()
  if (!row) notFound()
  const [{ data: work }, { data: tech }] = await Promise.all([
    supabase.from('visit_work').select('work').eq('visit_id', id).maybeSingle<{ work: VisitWork }>(),
    supabase.from('techs').select('name').eq('id', user.id).single<{ name: string }>(),
  ])
  const approval = (await approvalsFor([id]))[id] ?? null
  const { data: signups } = await adminClient()
    .from('leads')
    .select('first_name, last_name, signed_at')
    .eq('visit_id', id)
    .not('signed_at', 'is', null)
    .limit(1)
    .returns<{ first_name: string; last_name: string; signed_at: string }[]>()
  const memberSignup = signups?.[0] ? { name: `${signups[0].first_name} ${signups[0].last_name}`, at: signups[0].signed_at } : null
  return (
    <VisitApp visit={fromRow(row)} techName={tech?.name ?? ''} db initialWork={work?.work ?? null} approval={approval} memberSignup={memberSignup} {...catalog} />
  )
}
