import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckList, HowWeWork, MemberPitch, PageHero } from '@/components/site/LocalPage'
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome'
import { tradeInfo } from '@/config/business'
import { areaPages, findService, servicePages } from '@/config/seo-pages'
import { site } from '@/config/site'
import { serviceCallPrices } from '@/lib/serviceCall'

export function generateStaticParams() {
  return servicePages.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = findService((await params).slug)
  if (!s) return {}
  return {
    title: `${s.title} | MVP Club`,
    description: `${s.intro} Serving Greater Cincinnati.`,
    alternates: { canonical: `${site.url}/services/${s.slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = findService((await params).slug)
  if (!s) notFound()
  const { memberCall, regularCall } = await serviceCallPrices()
  const color = tradeInfo[s.trade].color
  const parent = s.parent ? findService(s.parent) : undefined
  const children = servicePages.filter((c) => c.parent === s.slug)
  const related = servicePages.filter((c) => c.trade === s.trade && c.slug !== s.slug && c.slug !== s.parent && c.parent !== s.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.h1,
    serviceType: s.name,
    description: s.intro,
    provider: { '@type': 'HomeAndConstructionBusiness', name: site.name, telephone: `+1-${site.phone}`, url: site.url },
    areaServed: areaPages.map((a) => ({ '@type': 'City', name: `${a.name}, OH` })),
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page text-navy">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="flex-1">
        <PageHero eyebrow={tradeInfo[s.trade].label.toUpperCase()} title={s.h1} intro={s.intro} memberCall={memberCall} regularCall={regularCall} />
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
          {parent && (
            <Link href={`/services/${parent.slug}`} className="text-sm font-semibold text-link underline">
              ← All {parent.name.toLowerCase()} services
            </Link>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <CheckList title="Call us if…" items={s.signs} color={color} />
            <CheckList title="What we do" items={s.jobs} color={color} />
          </div>
          <HowWeWork />
          {children.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">More about</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {children.map((c) => (
                  <Link key={c.slug} href={`/services/${c.slug}`} className="rounded-full bg-white px-4 py-2.5 font-semibold ring-1 ring-line">
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <MemberPitch memberCall={memberCall} regularCall={regularCall} text={s.checkup} />
          {related.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Related services</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {related.map((c) => (
                  <Link key={c.slug} href={`/services/${c.slug}`} className="rounded-full bg-white px-4 py-2.5 font-semibold ring-1 ring-line">
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="font-display text-2xl font-bold">{s.name} near you</h2>
            <p className="mt-1 text-body">We work across Greater Cincinnati, including:</p>
            <ul className="mt-3 columns-2 gap-4 text-[15px] leading-8 sm:columns-3">
              {areaPages.map((a) => (
                <li key={a.slug}>
                  <Link href={`/areas/${a.slug}`} className="text-link underline">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/service-area" className="mt-2 inline-block text-sm font-semibold text-link underline">
              See every town we serve
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
