'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { tradeInfo } from '@/config/business'
import { loadCatalog, readSample } from '@/lib/data'
import { todayET } from '@/lib/supabase/config'
import { adminClient, userClient } from '@/lib/supabase/server'
import { checkSetup, explain } from '@/lib/supabase/setupCheck'
import { checklistAreas, estimateBlockers, sendBlockers, toCheckupInput, toEstimateInput, type TechDay, type VisitWork } from '@/lib/tech'
import { fromRow, toRow, type VisitRow } from '@/lib/visits'
import { buildEstimate, buildReport } from '@/lib/views'

export async function signIn(_: unknown, form: FormData): Promise<{ error: string; email: string } | undefined> {
  const supabase = await userClient()
  const email = String(form.get('email') ?? '').trim()
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(form.get('password') ?? '') })
  // Hand the email back so the tech only retypes the password.
  if (error) return { error: 'Wrong email or password.', email }
  // Office staff land in the office, techs on today's visits.
  const { data: staff } = await supabase.from('staff').select('role').maybeSingle()
  redirect(staff ? '/office' : '/tech')
}

export async function signOut() {
  const supabase = await userClient()
  await supabase.auth.signOut()
  redirect('/tech/login')
}

// Testing only, until Housecall Pro fills the schedule: gives the signed-in tech
// today's sample visits.
export async function loadSampleDay(): Promise<{ error: string } | undefined> {
  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/tech/login')
  const problems = await checkSetup(supabase, user.id, user.email ?? '')
  if (problems.length) return { error: problems[0] }
  const day = readSample<TechDay>('tech-day.json')
  const picks = ['v101', 'v102', 'v103', 'v202']
  const rows = day.visits.filter((v) => picks.includes(v.id)).map((v) => toRow(v, user.id, todayET()))
  const { error } = await adminClient().from('visits').insert(rows)
  if (error) return { error: explain(error, true) }
  revalidatePath('/tech')
}

// Freezes the report / estimate with price book prices and creates the customer's private link.
export async function sendToCustomer(visitId: string): Promise<{ path: string } | { error: string }> {
  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in again.' }

  // Row Level Security: these only return rows for the signed-in tech's own visit.
  const [{ data: visitRow }, { data: workRow }, { data: tech }] = await Promise.all([
    supabase.from('visits').select('*').eq('id', visitId).single<VisitRow>(),
    supabase.from('visit_work').select('work').eq('visit_id', visitId).single<{ work: VisitWork }>(),
    supabase.from('techs').select('name').eq('id', user.id).single<{ name: string }>(),
  ])
  if (!visitRow || !workRow) return { error: 'Visit not found, or nothing saved yet.' }

  const visit = fromRow(visitRow)
  const work = workRow.work
  const catalog = loadCatalog()
  const techName = tech?.name || 'your MVP tech'
  const today = todayET()

  let kind: 'report' | 'estimate'
  let view: unknown
  if (visit.kind === 'checkup') {
    const areas = checklistAreas([...catalog.guide.values()])
    const blockers = sendBlockers(work, areas, catalog.guide, (t) => tradeInfo[t]?.label ?? t)
    if (blockers.length) return { error: blockers.map((b) => b.text).join(' · ') }
    kind = 'report'
    view = buildReport(toCheckupInput(visit, work, areas, catalog.guide, techName, today), catalog)
  } else {
    const blockers = estimateBlockers(work.estimate)
    if (blockers.length || !work.estimate) return { error: blockers.map((b) => b.text).join(' · ') }
    kind = 'estimate'
    const taskOf = (c: string) => catalog.book.get(c)?.task ?? c
    view = buildEstimate(toEstimateInput(visit, work.estimate, techName, today, taskOf), catalog)
  }

  const token = randomBytes(18).toString('base64url')
  const { error } = await adminClient().from('customer_links').insert({ token, visit_id: visit.id, kind, view, created_by: user.id })
  if (error) return { error: 'Could not create the link. Try again.' }
  // The tablet records sentAt and the link in the visit's work (its own save keeps it).
  return { path: `/r/${token}` }
}
