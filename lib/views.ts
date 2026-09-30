// Turns a check-up / estimate into what the customer page shows, looking up
// every item in the inspection guide and the price book so nobody can type a
// price. Pure functions: used on the server (customer page) and in the tech
// app (report preview).
import { diagnosticCopy, membership, serviceCallCode, tradeInfo, type Rating } from '@/config/business'
import { daysAsMember, priceLine, priceLines } from './pricing'
import type { Customer, GuideRow, PriceBookRow } from './types'

export type Catalog = { guide: Map<string, GuideRow>; book: Map<string, PriceBookRow> }

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// ---------- Check-up report ----------

export type CheckupInput = {
  id: string
  customer: Customer
  address: string
  date: string
  techName: string
  findings: { key: string; guideId: string; title: string; techNote?: string; photo?: string }[]
  checkedOk: string[]
}

export type ReportItem = {
  key: string
  rating: Rating
  tradeLabel: string
  tradeColor: string
  title: string
  reason: string
  photo?: string
  detail: string // one plain line under the title on the approve screen (may be empty)
  price: number | null // null = needs a quote
  standard: number | null
  note: string
}

export type ReportView = {
  address: string
  dateText: string
  techName: string
  items: ReportItem[]
  checkedOk: string[]
}

export function buildReport(input: CheckupInput, { guide, book }: Catalog, today = new Date()): ReportView {
  const items = input.findings.map<ReportItem>((f) => {
    const g = guide.get(f.guideId)
    if (!g) throw new Error(`Finding ${f.key}: ${f.guideId} is not in data/inspection_guide.csv`)
    const trade = tradeInfo[g.trade]
    const base = {
      key: f.key,
      rating: g.rating,
      tradeLabel: trade.label,
      tradeColor: trade.color,
      title: f.title,
      photo: f.photo,
      reason: [f.techNote, g.customerMessage].filter(Boolean).join(' '),
    }
    if (!g.pricebookCode || g.pricebookCode === 'Quote') {
      return { ...base, detail: '', price: null, standard: null, note: '' }
    }
    const row = book.get(g.pricebookCode)
    if (!row) throw new Error(`${g.id}: price book code ${g.pricebookCode} not found`)
    const p = priceLine(row, input.customer, today)
    if (row.category === 'Diagnostic') {
      return { ...base, detail: diagnosticCopy.detail, price: p.price, standard: p.standard, note: diagnosticCopy.note }
    }
    return { ...base, detail: row.task, price: p.price, standard: p.standard, note: p.note }
  })
  return {
    address: input.address,
    dateText: fmtDate(input.date),
    techName: input.techName,
    items,
    checkedOk: input.checkedOk,
  }
}

// ---------- Service-call estimate ----------

export type EstimateInput = {
  id: string
  customer: Customer
  address: string
  date: string
  techName: string
  trade: string
  found: { title: string; detail: string; photo?: string }
  options: { key: string; name: string; what: string; why: string; codes: string[]; mostChosen?: boolean }[]
}

export type EstimateOption = {
  key: string
  name: string
  what: string
  why: string
  mostChosen: boolean
  standard: number // non-member price
  member: number // price once the customer is a member
  laterCredit: number // replacement credit after the waiting period
}

export type EstimateView = {
  address: string
  dateText: string
  techName: string
  tradeColor: string
  found: { title: string; detail: string; photo?: string }
  alreadyMember: boolean
  serviceCall: { standard: number; member: number }
  options: EstimateOption[]
}

export function buildEstimate(input: EstimateInput, { book }: Catalog, today = new Date()): EstimateView {
  const get = (code: string): PriceBookRow => {
    const row = book.get(code)
    if (!row) throw new Error(`Price book code ${code} not found`)
    return row
  }
  // A customer who joins today is a brand-new member (no replacement credit yet).
  const asMember: Customer = input.customer.isMember
    ? input.customer
    : { isMember: true, memberSince: today.toISOString().slice(0, 10) }
  const creditNow = daysAsMember(asMember, today) >= membership.creditWaitDays
  const fee = get(serviceCallCode[input.trade])

  return {
    address: input.address,
    dateText: fmtDate(input.date),
    techName: input.techName,
    tradeColor: tradeInfo[input.trade].color,
    found: input.found,
    alreadyMember: input.customer.isMember,
    serviceCall: { standard: fee.standardPrice, member: fee.memberPrice },
    options: input.options.map((o) => {
      const rows = o.codes.map(get)
      const nonMember = priceLines(rows, { isMember: false }, today)
      const member = priceLines(rows, asMember, today)
      return {
        key: o.key,
        name: o.name,
        what: o.what,
        why: o.why,
        mostChosen: !!o.mostChosen,
        standard: nonMember.price,
        member: member.price,
        laterCredit: creditNow ? 0 : member.laterCredit,
      }
    }),
  }
}
