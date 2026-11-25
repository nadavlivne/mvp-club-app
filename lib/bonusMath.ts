import { techBonus as B } from '@/config/business'

// The weekly tech bonus for one van. Pure math, used by the office and the tech app.
// Example from the partner deck: a $10,000 week = $40 + $100 + $250 = $390 (+ $25 per report item sold).
export type BonusBreakdown = {
  revenue: number
  itemsSold: number
  floorPart: number // 5% of $6,700–$7,500
  targetPart: number // $100 at $7,500 or more
  abovePart: number // 10% above $7,500
  itemsPart: number // $25 per report item sold
  total: number
  toNextStep: { amount: number; label: string } | null
}

const cents = (n: number) => Math.round(n * 100) / 100

export function weeklyBonus(revenue: number, itemsSold: number): BonusBreakdown {
  const r = Math.max(0, revenue)
  const floorPart = cents(Math.max(0, Math.min(r, B.target) - B.floor) * B.floorRate)
  const targetPart = r >= B.target ? B.targetBonus : 0
  const abovePart = cents(Math.max(0, r - B.target) * B.aboveRate)
  const itemsPart = Math.max(0, itemsSold) * B.perItemSold
  const toNextStep =
    r < B.floor
      ? { amount: B.floor - r, label: `to start earning 5%` }
      : r < B.target
        ? { amount: B.target - r, label: `to reach $${B.target.toLocaleString()} (+$${B.targetBonus} and 10% above)` }
        : null
  return {
    revenue: r,
    itemsSold,
    floorPart,
    targetPart,
    abovePart,
    itemsPart,
    total: cents(floorPart + targetPart + abovePart + itemsPart),
    toNextStep,
  }
}
