import type { Metadata } from 'next'
import JoinForm from '@/components/site/JoinForm'
import { SiteFooter, SiteHeader } from '@/components/site/SiteChrome'
import { serviceCallCode } from '@/config/business'
import { site } from '@/config/site'
import { loadCatalogLive } from '@/lib/data'
import { money } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Join MVP Club | Home check-ups in Cincinnati',
  description: 'Sign up for MVP Club in two minutes: two full-home check-ups a year, member prices on repairs and a low service call.',
  alternates: { canonical: `${site.url}/join` },
  robots: { index: true, follow: true },
}

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams
  const { book } = await loadCatalogLive()
  const memberCall = money(book.get(serviceCallCode.HVAC)?.memberPrice ?? 19)
  return (
    <div className="flex min-h-dvh flex-col bg-page text-navy">
      <SiteHeader join={false} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-12">
        <h1 className="font-display text-[34px] leading-tight font-bold">Join MVP Club</h1>
        <p className="mt-1 mb-5 text-body">Takes about two minutes. No card needed here.</p>
        <JoinForm initialPlan={plan === 'yearly' ? 'yearly' : 'monthly'} memberCall={memberCall} />
      </main>
      <SiteFooter />
    </div>
  )
}
