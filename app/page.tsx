import Link from 'next/link'
import { Card, Logo } from '@/components/ui'

// Start page for testing. Customers never see this — they get a direct link by text.
export default function Home() {
  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-xl px-5 pt-[18px] pb-4">
          <Logo tagline="CLUB" />
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 py-5">
        <h1 className="font-display text-[28px] font-bold">Customer page previews</h1>
        <p className="text-[15px] text-body">Sample data. Items and prices come from the price book and Inspection Guide.</p>
        <Link href="/report/demo">
          <Card className="flex flex-col gap-1 border-l-4 border-[#2F8FE0]">
            <span className="text-lg font-bold">Check-up report</span>
            <span className="text-sm text-body">What a member sees after their check-up.</span>
          </Card>
        </Link>
        <Link href="/estimate/demo">
          <Card className="flex flex-col gap-1 border-l-4 border-[#F2672A]">
            <span className="text-lg font-bold">Service-call estimate</span>
            <span className="text-sm text-body">What a non-member sees on a repair call, with “Join MVP Club today”.</span>
          </Card>
        </Link>
      </main>
    </>
  )
}
