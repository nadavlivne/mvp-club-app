import 'server-only'
import { ratings, reportReminders, type Rating } from '@/config/business'
import { site } from '@/config/site'
import { streetKey } from './nearby'
import { adminClient } from './supabase/server'
import { dateET } from './staff'
import { todayET } from './supabase/config'
import type { ReportView } from './views'

// Reminders for check-up report items the customer didn't approve (ORANGE and YELLOW),
// grouped per customer and due date so the office sends one text, not one per item.

export type ReminderItem = { key: string; title: string; rating: Rating; stage: number; askedForReminder: boolean }
export type Reminder = {
  id: string // link + due date, used as the card key
  linkId: string
  token: string
  customer: string
  firstName: string
  phone: string
  address: string
  tech: string
  reportDate: string
  due: string
  label: string
  items: ReminderItem[]
  done: { outcome: 'sent' | 'skipped'; by: string; at: string } | null
}

type LinkRow = {
  id: string
  token: string
  created_at: string
  view: ReportView
  visits: { address: string; customer: { name: string }; techs: { name: string } | null }
  approvals: { details: { items?: { key: string }[]; remind?: { key: string }[] } }[]
}

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function loadReminders() {
  const db = adminClient()
  const longest = Math.max(...Object.values(reportReminders).flatMap((s) => s!.map((x) => x.days)))
  const since = addDays(todayET(), -(longest + 60)) + 'T00:00:00Z'
  const [links, done, leads] = await Promise.all([
    db
      .from('customer_links')
      .select('id, token, created_at, view, visits!inner(address, customer, techs(name)), approvals(details)')
      .eq('kind', 'report')
      .gte('created_at', since)
      .returns<LinkRow[]>(),
    db.from('report_reminders').select('link_id, item_key, stage, outcome, done_by, done_at').returns<{ link_id: string; item_key: string; stage: number; outcome: 'sent' | 'skipped'; done_by: string; done_at: string }[]>(),
    db.from('leads').select('first_name, phone, street').neq('phone', '').returns<{ first_name: string; phone: string; street: string }[]>(),
  ])
  const doneMap = new Map((done.data ?? []).map((d) => [`${d.link_id}|${d.item_key}|${d.stage}`, d]))
  // Phone numbers we know, by street address (Housecall Pro will provide them in phase 3).
  const phones = new Map((leads.data ?? []).map((l) => [streetKey(l.street), l]))

  const groups = new Map<string, Reminder>()
  for (const link of links.data ?? []) {
    const reportDate = dateET(link.created_at)
    const approved = new Set(link.approvals.flatMap((a) => (a.details.items ?? []).map((i) => i.key)))
    const asked = new Set(link.approvals.flatMap((a) => (a.details.remind ?? []).map((i) => i.key)))
    const name = link.visits.customer?.name ?? ''
    const contact = phones.get(streetKey(link.visits.address))
    for (const item of link.view.items) {
      if (approved.has(item.key)) continue
      const stages = reportReminders[item.rating] ?? []
      stages.forEach((s, stage) => {
        const due = addDays(reportDate, s.days)
        const id = `${link.id}|${due}`
        const g =
          groups.get(id) ??
          ({
            id,
            linkId: link.id,
            token: link.token,
            customer: name,
            firstName: contact?.first_name || name.split(' ')[0] || '',
            phone: contact?.phone ?? '',
            address: link.visits.address,
            tech: link.visits.techs?.name ?? '',
            reportDate,
            due,
            label: s.label,
            items: [],
            done: null,
          } satisfies Reminder)
        g.items.push({ key: item.key, title: item.title, rating: item.rating, stage, askedForReminder: asked.has(item.key) })
        const d = doneMap.get(`${link.id}|${item.key}|${stage}`)
        if (d) g.done = { outcome: d.outcome, by: d.done_by, at: d.done_at }
        groups.set(id, g)
      })
    }
  }
  // A group counts as done only when every item in it was handled.
  for (const g of groups.values()) if (g.items.some((i) => !doneMap.has(`${g.linkId}|${i.key}|${i.stage}`))) g.done = null
  // When a later reminder for the same item is already due, the earlier unsent one is dropped (one text, not two).
  const today = todayET()
  const laterDue = new Set<string>()
  for (const g of groups.values()) if (g.due <= today) for (const i of g.items) if (i.stage > 0) laterDue.add(`${g.linkId}|${i.key}`)
  for (const g of groups.values()) {
    if (g.done) continue
    g.items = g.items.filter((i) => !(i.stage === 0 && laterDue.has(`${g.linkId}|${i.key}`) && !doneMap.has(`${g.linkId}|${i.key}|0`)))
  }
  const all = [...groups.values()].filter((g) => g.items.length).sort((a, b) => a.due.localeCompare(b.due))
  return { all, setupMissing: !!done.error }
}

export function reminderText(r: Reminder) {
  const list = r.items.map((i) => i.title.charAt(0).toLowerCase() + i.title.slice(1)).join('; ')
  const when = r.items.some((i) => i.rating === 'ORANGE') ? 'within 6 months' : 'before your next check-up'
  return (
    `Hi ${r.firstName || 'there'}, it's MVP Club with a friendly reminder. At your check-up we found: ${list}. ` +
    `We recommend taking care of it ${when}. Reply YES and we'll schedule it, or approve it yourself here: ${site.url}/r/${r.token}`
  )
}

export const ratingStyle = (r: Rating) => ratings[r]
