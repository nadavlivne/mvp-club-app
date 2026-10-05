// Business rules for MVP Club. Change these only with Nadav's OK (see CLAUDE.md).
// Prices themselves live in data/pricebook.csv — never type prices here.

export const membership = {
  monthly: 30,
  yearly: 330,
  firstTermMonths: 12,
  // Membership covers one heating & cooling system; each extra one adds this much.
  extraSystemMonthly: 10,
  // Yearly plan: 12 × $10 per extra system (confirmed by Nadav).
  extraSystemYearly: 120,
  // Most systems someone can pick on the sign-up form (more = office follows up).
  maxSystems: 4,
  // Replacement credits only apply after this many days of membership.
  creditWaitDays: 90,
}

// Replacement credit by the price book's credit_tier column.
export const replacementCredits: Record<string, number> = {
  Small: 100,
  Medium: 250,
  Large: 500,
}

// Diagnostic / service call code per trade (members $19, non-members $119 —
// the amounts come from the price book).
export const serviceCallCode: Record<string, string> = {
  Electrical: 'EL-100',
  Plumbing: 'PL-100',
  HVAC: 'HV-100',
}

export const tradeInfo: Record<string, { label: string; color: string }> = {
  Electrical: { label: 'Electrical', color: '#F2B705' },
  Plumbing: { label: 'Plumbing', color: '#2F8FE0' },
  HVAC: { label: 'Heating & Cooling', color: '#F2672A' },
}

export type Rating = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'

// Urgency ratings from the Inspection Guide. Badge colors follow the approved mockup.
export const ratings: Record<Rating, { badge: string; bg: string; fg: string }> = {
  RED: { badge: 'Red · fix now', bg: '#FDE7E4', fg: '#8A1C12' },
  ORANGE: { badge: 'Orange · within 6 months', bg: '#FFF1CC', fg: '#6B4700' },
  YELLOW: { badge: 'Yellow · within 12 months', bg: '#E3EEFB', fg: '#174F8C' },
  GREEN: { badge: 'Green · monitor', bg: '#E3F2E8', fg: '#1E5C36' },
}

// Time windows the customer can pick on the approve screen.
export const visitSlots = [
  { id: 'am', label: 'Morning 8–12', short: 'morning' },
  { id: 'pm', label: 'Afternoon 12–5', short: 'afternoon' },
]
// How many upcoming weekdays to offer.
export const visitDaysOffered = 4

// Customer-facing wording for price book lines in the "Diagnostic" category
// (the $19 member / $119 non-member specialist visit).
export const diagnosticCopy = {
  note: 'specialist visit',
  detail: 'A specialist comes out to find the cause. Any repair is priced for you before we do it.',
}

// Service-call estimates: the customer always gets this many options
// (good / better / best, e.g. Repair, Repair + tune-up, Replace).
export const estimateOptions = 3

export const company = {
  phone: '(513) 909-9656', // temporary number (same as config/site.ts)
}

// Membership price for a plan and number of heating & cooling systems.
export function membershipPrice(plan: 'monthly' | 'yearly', systems: number) {
  const extra = Math.max(0, systems - 1)
  return plan === 'monthly' ? membership.monthly + extra * membership.extraSystemMonthly : membership.yearly + extra * membership.extraSystemYearly
}
