import { techBonus as B } from '@/config/business'
import { money } from '@/lib/pricing'

// Bonus amounts can have cents (5% of $7,012 = $15.60).
const pay = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
import type { BonusBreakdown } from '@/lib/bonusMath'

// One van's weekly bonus, line by line, so a tech can check the math himself.
export default function BonusLines({ b, revenueEntered }: { b: BonusBreakdown; revenueEntered: boolean }) {
  const line = (label: string, value: number, muted = false) => (
    <div className={`flex justify-between gap-3 text-[15px] ${muted ? 'text-muted' : ''}`}>
      <span>{label}</span>
      <span className="font-semibold">{pay(value)}</span>
    </div>
  )
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-3 text-[15px]">
        <span>Paid revenue this week</span>
        <span className="font-semibold">{revenueEntered ? money(b.revenue) : 'not entered yet'}</span>
      </div>
      {line(`5% from ${money(B.floor)} to ${money(B.target)}`, b.floorPart, !b.floorPart)}
      {line(`Reached ${money(B.target)}`, b.targetPart, !b.targetPart)}
      {line(`10% above ${money(B.target)}`, b.abovePart, !b.abovePart)}
      {line(`Report items sold: ${b.itemsSold} × ${money(B.perItemSold)}`, b.itemsPart, !b.itemsPart)}
      <div className="mt-1 flex justify-between gap-3 border-t border-line pt-1.5">
        <span className="font-bold">Bonus</span>
        <span className="font-display text-2xl font-bold text-success">{pay(b.total)}</span>
      </div>
      {revenueEntered && b.toNextStep && (
        <div className="rounded-[10px] bg-[#FFF1CC] px-3 py-2 text-sm font-semibold text-[#6B4700]">
          {money(b.toNextStep.amount)} more {b.toNextStep.label}
        </div>
      )}
    </div>
  )
}
