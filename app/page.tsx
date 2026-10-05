import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ZipCheck from '@/components/site/ZipCheck'
import { membership, ratings, replacementCredits, serviceCallCode, type Rating } from '@/config/business'
import { site } from '@/config/site'
import { loadCatalogLive, loadServiceArea } from '@/lib/data'
import { money } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'MVP Club — Home check-ups for heating & cooling, plumbing and electrical | Cincinnati',
  description: `One membership for your whole home: two check-ups a year covering heating & cooling, plumbing and electrical, member prices on repairs and a $19 service call. $${membership.monthly}/month. Serving Greater Cincinnati, Northern Kentucky and Southeast Indiana.`,
  alternates: { canonical: site.url },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'MVP Club — your home’s all-star team',
    description: `Heating & cooling, plumbing and electrical check-ups twice a year. $${membership.monthly}/month.`,
    url: site.url,
    siteName: site.name,
    type: 'website',
  },
}

const trades = [
  {
    name: 'Heating & Cooling',
    color: '#F2672A',
    items: ['Furnace in the fall, AC in the spring', 'Filter, furnace, outdoor unit and drain line', 'Thermostat, blower and carbon monoxide check', 'Age and condition of every unit'],
  },
  {
    name: 'Plumbing',
    color: '#2F8FE0',
    items: ['Water heater, valves and pressure', 'Every faucet, toilet and drain', 'Leaks under sinks and around fixtures', 'Main shut-off and sump pump'],
  },
  {
    name: 'Electrical',
    color: '#F2B705',
    items: ['Panel inspected with the cover off', 'Meter base and service cable', 'Outlets, GFCI and smoke / CO alarms', 'Surge protection and wiring type'],
  },
]

const faqs: [string, string][] = [
  [
    'What does the membership cost?',
    `$${membership.monthly} a month, or $${membership.yearly} a year. The first term is 12 months, then it continues month to month. It covers one heating & cooling system; each extra system is +$10 a month.`,
  ],
  [
    'What happens if you find a problem?',
    'You get a clear report on your phone with photos and a color for how urgent each item is. You choose what to fix and when — nothing is done without your OK.',
  ],
  [
    'Is the non-member service call credited toward the repair?',
    'No. The non-member service call is a separate charge. Members pay $19 instead — and you can join on the same visit to get the member price.',
  ],
  ['Do you keep my card on file?', 'We never store card numbers ourselves. Billing runs through our secure payment system.'],
  ['Where do you work?', site.areaSummary],
]

export default async function Home() {
  // app.joinmvpclub.com is the staff app; the public site lives on the main domain.
  const host = (await headers()).get('host') ?? ''
  if (host.startsWith('app.')) redirect('/tech')

  const { book } = await loadCatalogLive()
  const call = book.get(serviceCallCode.HVAC)
  const memberCall = money(call?.memberPrice ?? 19)
  const regularCall = money(call?.standardPrice ?? 119)
  const areas = loadServiceArea(site.serviceRadiusMiles)
  const yearSaving = membership.monthly * 12 - membership.yearly
  const tel = `tel:${site.phoneHref}`
  const sms = `sms:${site.phoneHref}`
  const joinHref = site.bookingUrl ?? tel

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    telephone: `+1-${site.phone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: 'US',
    },
    openingHours: site.hours.schema,
    areaServed: ['Cincinnati, OH', 'Northern Kentucky', 'Southeast Indiana'],
    description: metadata.description,
  }

  return (
    <div className="bg-page text-navy">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-navy text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-2.5" aria-label="MVP Club home">
            <span className="flex gap-[3px] -skew-x-[14deg]" aria-hidden>
              <span className="h-6 w-1.5 bg-[#F2B705]" />
              <span className="h-6 w-1.5 bg-[#2F8FE0]" />
              <span className="h-6 w-1.5 bg-[#F2672A]" />
            </span>
            <span className="font-logo text-2xl leading-none">MVP</span>
            <span className="font-display text-[13px] font-bold tracking-[0.2em] text-sub">CLUB</span>
          </a>
          <a href={tel} className="flex h-11 items-center rounded-lg bg-white/10 px-3 font-semibold ring-1 ring-white/25">
            {site.phoneDisplay}
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-5xl px-4 pt-10 pb-14 md:pt-16 md:pb-20">
            <p className="font-display text-sm font-bold tracking-[0.2em] text-sub">CINCINNATI · NKY · SE INDIANA</p>
            <h1 className="mt-3 max-w-3xl font-display text-[44px] leading-[0.98] font-bold md:text-[64px]">
              One membership. Three trades. Your whole home covered.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-sub">
              Two full-home check-ups a year — heating &amp; cooling, plumbing and electrical — plus member prices on repairs and a{' '}
              <strong className="text-white">{memberCall} service call</strong>.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={joinHref} className="flex h-14 items-center justify-center rounded-xl bg-approve px-6 text-lg font-bold text-white">
                Join for ${membership.monthly}/month
              </a>
              <a href={sms} className="flex h-14 items-center justify-center rounded-xl bg-white/10 px-6 text-lg font-semibold ring-1 ring-white/30">
                Text us a question
              </a>
            </div>
            <p className="mt-4 text-sm text-sub">
              Call or text {site.phoneDisplay} · {site.hours.days} {site.hours.open}–{site.hours.close}
            </p>
          </div>
          <div className="flex h-2" aria-hidden>
            <div className="flex-1 bg-[#F2B705]" />
            <div className="flex-1 bg-[#2F8FE0]" />
            <div className="flex-1 bg-[#F2672A]" />
          </div>
        </section>

        {/* What every check-up covers */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-display text-[32px] leading-tight font-bold">Every check-up covers all three trades</h2>
          <p className="mt-2 max-w-2xl text-body">Spring visits focus on your AC, fall visits on your furnace — and every visit checks your plumbing and electrical too.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {trades.map((t) => (
              <div key={t.name} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-line">
                <div className="h-1.5" style={{ background: t.color }} />
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold">{t.name}</h3>
                  <ul className="mt-3 flex flex-col gap-2 text-[15px] text-body">
                    {t.items.map((i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-success">✓</span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="font-display text-[32px] leading-tight font-bold">How it works</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                ['Join', `Call or text us. $${membership.monthly}/month or $${membership.yearly}/year — we set up your first check-up.`],
                ['We check everything', 'A trained tech goes through heating & cooling, plumbing and electrical, and photographs what matters.'],
                ['You decide', 'You get a simple report on your phone. Add what you want fixed, pick a day and approve with your finger.'],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xl font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <p className="mt-1 text-body">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-xl bg-page p-5">
              <h3 className="font-display text-lg font-bold">Your report, in plain words</h3>
              <p className="mt-1 text-[15px] text-body">Every finding gets a color, so you know what matters now and what can wait.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(ratings) as Rating[]).map((r) => (
                  <span key={r} className="rounded-full px-3 py-1.5 text-sm font-semibold" style={{ background: ratings[r].bg, color: ratings[r].fg }}>
                    {ratings[r].badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Price + member benefits */}
        <section id="join" className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-display text-[32px] leading-tight font-bold">Membership</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-navy p-6 text-white">
              <div className="font-display text-sm font-bold tracking-[0.2em] text-sub">MVP CLUB MEMBER</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-display text-6xl leading-none font-bold">${membership.monthly}</span>
                <span className="pb-1 text-lg text-sub">/ month</span>
              </div>
              <p className="mt-2 text-sub">
                or ${membership.yearly}/year (save ${yearSaving})
              </p>
              <ul className="mt-5 flex flex-col gap-2">
                <li>✓ Two full-home check-ups a year</li>
                <li>✓ Covers one heating &amp; cooling system (+$10/month each extra)</li>
                <li>✓ First term 12 months, then month to month</li>
              </ul>
              <a href={joinHref} className="mt-6 flex h-14 items-center justify-center rounded-xl bg-approve text-lg font-bold text-white">
                Join now — call {site.phoneDisplay}
              </a>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
              <h3 className="font-display text-xl font-bold">Member benefits</h3>
              <table className="mt-4 w-full text-[15px]">
                <thead>
                  <tr className="text-left text-sm text-muted">
                    <th className="pb-2 font-semibold"></th>
                    <th className="pb-2 font-semibold">Member</th>
                    <th className="pb-2 font-semibold">Non-member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="py-3 pr-2">Service call</td>
                    <td className="py-3 font-bold text-success">{memberCall}</td>
                    <td className="py-3 text-body">{regularCall}</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2">Repairs &amp; service work</td>
                    <td className="py-3 font-bold text-success">15% off</td>
                    <td className="py-3 text-body">Regular price</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2">Replacements</td>
                    <td className="py-3 font-bold text-success">
                      ${replacementCredits.Small}–${replacementCredits.Large} credit
                    </td>
                    <td className="py-3 text-body">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2">Check-ups</td>
                    <td className="py-3 font-bold text-success">2 a year</td>
                    <td className="py-3 text-body">—</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted">Replacement credits apply after {membership.creditWaitDays} days of membership.</p>
            </div>
          </div>
        </section>

        {/* Service area */}
        <section id="area" className="bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-[32px] leading-tight font-bold">Where we work</h2>
              <p className="mt-2 text-body">{site.areaSummary}</p>
            </div>
            <ZipCheck areas={areas} phone={site.phoneDisplay} phoneHref={site.phoneHref} />
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="font-display text-[32px] leading-tight font-bold">Questions</h2>
          <div className="mt-4 flex flex-col gap-2">
            {faqs.map(([q, a]) => (
              <details key={q} className="group rounded-xl bg-white shadow-sm ring-1 ring-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-semibold">
                  {q}
                  <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-body">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Contact */}
      <footer className="bg-navy text-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="font-logo text-2xl">MVP</div>
            <p className="mt-1 text-sm text-sub">{site.legalName}</p>
          </div>
          <div className="text-sm leading-6">
            <div className="font-display text-base font-bold tracking-wide">Call or text</div>
            <a href={tel} className="text-lg font-semibold underline">
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
        </div>
        <div className="mx-auto flex max-w-5xl justify-between px-4 pb-8 text-xs text-sub">
          <span>© {new Date().getFullYear()} {site.legalName}</span>
          <a href="/tech/login" className="underline">
            Staff sign-in
          </a>
        </div>
      </footer>
    </div>
  )
}
