import { membership, replacementCredits } from '@/config/business'

// What a member gets — shown on the website sign-up page and the tech's tablet sign-up.
export default function MemberBenefits({ memberCall, regularCall }: { memberCall: string; regularCall: string }) {
  const items: [string, string][] = [
    ['Two full-home check-ups a year', 'Spring (AC) and fall (furnace) — every visit covers heating & cooling, plumbing and electrical.'],
    [`${memberCall} service calls`, `Non-members pay ${regularCall}.`],
    ['15% off repairs', 'Member prices on every repair and service job.'],
    [
      `$${replacementCredits.Small}–$${replacementCredits.Large} replacement credits`,
      `Off a new water heater, furnace, AC or panel, after ${membership.creditWaitDays} days of membership.`,
    ],
    ['A file on your house', 'Equipment ages, photos and every report saved — and reminders before small problems get big.'],
    ['No surprises', 'Clear report on your phone with photos. Nothing is done without your OK.'],
  ]
  return (
    <div className="rounded-xl bg-navy p-5 text-white">
      <div className="font-display text-sm font-bold tracking-[0.2em] text-sub">WHAT YOU GET</div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map(([title, text]) => (
          <li key={title} className="flex gap-2.5">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-sm font-bold">✓</span>
            <span className="flex flex-col">
              <span className="font-bold">{title}</span>
              <span className="text-sm text-sub">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
