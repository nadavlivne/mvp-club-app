// Business rules for MVP Club. Change these only with Nadav's OK (see CLAUDE.md).
// Prices themselves live in data/pricebook.csv — never type prices here.

export const membership = {
  monthly: 30,
  yearly: 330,
  firstTermMonths: 12,
  // Replacement credits only apply after this many days of membership.
  creditWaitDays: 90,
}

// Replacement credit by the price book's credit_tier column.
export const replacementCredits: Record<string, number> = {
  Small: 100,
  Medium: 250,
  Large: 500,
}

// Price book codes whose member price is $0 because the membership already
// includes them (the two yearly check-ups include the AC and furnace tune-up).
// GUESS — confirm with Nadav: PL-150 (water heater flush) also says
// "Included in membership" in the price book, but the approved check-up mockup
// charges members $160 for it, so it is left out of this list for now.
export const includedInMembership = ['HV-110', 'HV-111']

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

export const company = {
  phone: '[MVP PHONE]',
}
