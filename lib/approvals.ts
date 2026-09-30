import 'server-only'
import { visitSlots } from '@/config/business'
import { adminClient } from './supabase/server'

// What the customer approved, for the tech who sent the link.
export type ApprovalSummary = { at: string; total: number; lines: string[]; joinedClub: boolean }

type Row = { created_at: string; details: Record<string, unknown>; customer_links: { visit_id: string } }

// Latest approval per visit. Only call with visit ids the signed-in tech is allowed
// to see (they come from a Row Level Security query).
export async function approvalsFor(visitIds: string[]): Promise<Record<string, ApprovalSummary>> {
  if (!visitIds.length) return {}
  const { data } = await adminClient()
    .from('approvals')
    .select('created_at, details, customer_links!inner(visit_id)')
    .in('customer_links.visit_id', visitIds)
    .order('created_at', { ascending: true })
    .returns<Row[]>()
  const out: Record<string, ApprovalSummary> = {}
  for (const r of data ?? []) out[r.customer_links.visit_id] = summarize(r.created_at, r.details)
  return out
}

function summarize(at: string, d: Record<string, unknown>): ApprovalSummary {
  const money = (n: unknown) => '$' + Math.round(Number(n ?? 0)).toLocaleString('en-US')
  const lines: string[] = []
  if (Array.isArray(d.items)) {
    for (const i of d.items as { title: string; price: number }[]) lines.push(`${i.title} — ${money(i.price)}`)
    const slot = visitSlots.find((s) => s.id === d.slot)?.short ?? ''
    if (d.dayLabel) lines.push(`Come back: ${d.dayLabel} ${slot}`.trim())
    const remind = (d.remind as { title: string }[] | undefined) ?? []
    if (remind.length) lines.push(`Remind later: ${remind.map((r) => r.title).join(', ')}`)
  } else if (d.option) {
    const o = d.option as { name: string; what: string; price: number }
    lines.push(`${o.name} — ${o.what} — ${money(o.price)}`)
    lines.push(`Service call — ${money(d.serviceCall)}`)
  }
  return { at, total: Number(d.total ?? 0), lines, joinedClub: d.joinedClub === true }
}
