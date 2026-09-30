import type { Rating } from '@/config/business'

export type PriceBookRow = {
  code: string
  trade: string
  category: string
  task: string
  standardPrice: number
  memberPrice: number
  rateType: 'Service' | 'Install'
  creditTier: string
  notes: string
}

export type GuideRow = {
  id: string
  trade: string
  area: string
  howToCheck: string // "Same" in the CSV is filled in from the row above
  whoCanCheck: string
  finding: string
  rating: Rating
  recommend: string
  pricebookCode: string // a price book code, "Quote", or empty
  customerTitle: string // plain-words name the customer sees
  customerMessage: string
}

// Who is looking at the page — decides which price applies.
export type Customer = {
  isMember: boolean
  memberSince?: string // ISO date
}

export type Price = {
  price: number // what this customer pays
  standard: number // non-member price (shown crossed out when lower)
  note: string // e.g. "member price", "$250 member credit after 90 days"
}
