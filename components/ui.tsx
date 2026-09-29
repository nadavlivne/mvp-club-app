// Small shared pieces used by the customer pages.
import { money } from '@/lib/pricing'

export function Logo({ tagline }: { tagline: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-[3px] -skew-x-[14deg]" aria-hidden>
        <div className="h-6 w-1.5 bg-[#F2B705]" />
        <div className="h-6 w-1.5 bg-[#2F8FE0]" />
        <div className="h-6 w-1.5 bg-[#F2672A]" />
      </div>
      <div className="font-logo text-2xl leading-none">MVP</div>
      <div className="font-display text-[13px] font-bold tracking-[0.2em] text-sub">{tagline}</div>
    </div>
  )
}

export function Header({ tagline, title, sub }: { tagline: string; title: string; sub?: string }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-xl flex-col gap-3 px-5 pt-[18px] pb-4">
        <Logo tagline={tagline} />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-[1.05] font-bold">{title}</h1>
          {sub && <div className="text-sm text-sub">{sub}</div>}
        </div>
      </div>
    </header>
  )
}

export function Card({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`rounded-xl bg-white px-4 py-3.5 ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 font-display text-lg font-bold tracking-[0.06em] text-muted">{children}</h2>
}

export function PhotoPlaceholder({ label, src }: { label: string; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label} className="size-[72px] shrink-0 rounded-lg object-cover" />
  }
  return (
    <div role="img" aria-label={label} className="flex size-[72px] shrink-0 items-center justify-center rounded-lg bg-photo">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B7688" strokeWidth="1.6">
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <circle cx="12" cy="13" r="3.5" />
        <path d="M8 6l1.5-2h5L16 6" />
      </svg>
    </div>
  )
}

export function LineItems({ lines, footer }: { lines: { label: string; amount: number }[]; footer?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2.5">
      {lines.map((l, i) => (
        <div key={i} className="flex justify-between gap-3 text-[15px]">
          <span>{l.label}</span>
          <span className="font-bold">{l.amount === 0 ? 'Included' : money(l.amount)}</span>
        </div>
      ))}
      {footer}
    </Card>
  )
}

export function ApproveButton({ ready, label, onClick }: { ready: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!ready}
      className={`h-[52px] rounded-xl text-[17px] font-bold ${ready ? 'bg-approve text-white' : 'bg-line text-muted'}`}
    >
      {label}
    </button>
  )
}

export function LinkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-11 rounded-[10px] text-[15px] font-semibold text-link">
      {children}
    </button>
  )
}

export function DoneCard({ line }: { line: string }) {
  return (
    <Card className="flex flex-col items-center gap-2.5 px-4 py-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success-bg">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E7B45" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div className="font-display text-[26px] font-bold">Approved</div>
      <div className="text-[15px] leading-[1.45] text-body">{line}</div>
    </Card>
  )
}

// Sticky bar at the bottom of the screen with the running total.
export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-white">
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  )
}
