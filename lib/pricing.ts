// Price rules from CLAUDE.md. Amounts always come from the price book.
import { membership, replacementCredits } from '@/config/business'
import type { Customer, Price, PriceBookRow } from './types'

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

export function daysAsMember(c: Customer, today = new Date()): number {
  if (!c.isMember || !c.memberSince) return 0
  return Math.floor((today.getTime() - new Date(c.memberSince).getTime()) / 86_400_000)
}

export function creditFor(row: PriceBookRow): number {
  return replacementCredits[row.creditTier] ?? 0
}

// Price of one price book line for this customer.
export function priceLine(row: PriceBookRow, c: Customer, today = new Date()): Price {
  const standard = row.standardPrice
  const credit = creditFor(row)

  // Replacements: members get a credit instead of a discount, after 90 days.
  if (row.rateType === 'Install' && credit > 0) {
    if (c.isMember && daysAsMember(c, today) >= membership.creditWaitDays) {
      return { price: row.memberPrice, standard, note: `with ${money(credit)} member credit` }
    }
    return {
      price: standard,
      standard,
      note: `${money(credit)} member credit after ${membership.creditWaitDays} days`,
    }
  }

  // A member price of $0 in the price book means the membership includes it.
  const memberPrice = row.memberPrice
  if (c.isMember) return { price: memberPrice, standard, note: memberPrice === 0 ? 'with your membership' : 'member price' }
  return { price: standard, standard, note: memberPrice === 0 ? 'included for members' : `members ${money(memberPrice)}` }
}

// Sum of several price book lines (an estimate option).
export function priceLines(rows: PriceBookRow[], c: Customer, today = new Date()) {
  const parts = rows.map((r) => priceLine(r, c, today))
  return {
    price: parts.reduce((a, p) => a + p.price, 0),
    standard: parts.reduce((a, p) => a + p.standard, 0),
    // Replacement credit a new member would get after the waiting period.
    laterCredit: rows.reduce((a, r) => a + (r.rateType === 'Install' ? creditFor(r) : 0), 0),
  }
}
