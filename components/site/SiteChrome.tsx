import Link from 'next/link'
import { legal } from '@/config/legal'
import { site } from '@/config/site'

export function SiteLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="MVP Club home">
      <span className="flex gap-[3px] -skew-x-[14deg]" aria-hidden>
        <span className="h-6 w-1.5 bg-[#F2B705]" />
        <span className="h-6 w-1.5 bg-[#2F8FE0]" />
        <span className="h-6 w-1.5 bg-[#F2672A]" />
      </span>
      <span className="font-logo text-2xl leading-none">MVP</span>
      <span className="font-display text-[13px] font-bold tracking-[0.2em] text-sub">CLUB</span>
    </Link>
  )
}

const links = [
  { href: '/#checkup', label: 'What we check' },
  { href: '/#membership', label: 'Membership' },
  { href: '/service-area', label: 'Service area' },
  { href: '/#faq', label: 'Questions' },
]

export function SiteHeader({ join = true }: { join?: boolean }) {
  return (
    <header className="sticky top-0 z-20 bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <SiteLogo />
        <nav className="hidden items-center gap-5 text-[15px] font-semibold text-sub md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${site.phoneHref}`} className="hidden h-11 items-center rounded-lg px-3 font-semibold ring-1 ring-white/25 sm:flex">
            {site.phoneDisplay}
          </a>
          {join && (
            <Link href="/join" className="flex h-11 items-center rounded-lg bg-approve px-4 font-bold">
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-4">
        <div>
          <SiteLogo />
          <p className="mt-2 text-sm text-sub">{site.legalName}</p>
        </div>
        <div className="text-sm leading-6">
          <div className="font-display text-base font-bold tracking-wide">Call or text</div>
          <a href={`tel:${site.phoneHref}`} className="text-lg font-semibold underline">
            {site.phoneDisplay}
          </a>
          <div className="text-sub">
            {site.hours.days}, {site.hours.open}–{site.hours.close}
          </div>
        </div>
        <div className="text-sm leading-6">
          <div className="font-display text-base font-bold tracking-wide">Office</div>
          <div>{site.address.street}</div>
          <div>
            {site.address.city}, {site.address.state} {site.address.zip}
          </div>
        </div>
        <nav className="flex flex-col text-sm leading-7">
          <div className="font-display text-base font-bold tracking-wide">MVP Club</div>
          <Link href="/join" className="underline">
            Join the club
          </Link>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-3 text-xs text-sub">{legal.notInsurance}</p>
      <div className="mx-auto flex max-w-5xl justify-between px-4 pb-8 text-xs text-sub">
        <span>
          © {new Date().getFullYear()} {site.legalName}
        </span>
        <Link href="/tech/login" className="underline">
          Staff sign-in
        </Link>
      </div>
    </footer>
  )
}
