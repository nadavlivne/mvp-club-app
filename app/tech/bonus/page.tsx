import Link from 'next/link'
import { redirect } from 'next/navigation'
import BonusLines from '@/components/BonusCard'
import { Card, Logo } from '@/components/ui'
import { bonusWeek, payday, recentWeeks, weekLabel } from '@/lib/bonus'
import { supabaseConfigured } from '@/lib/supabase/config'
import { userClient } from '@/lib/supabase/server'
import { weekStartET } from '@/lib/staff'

export const metadata = { title: 'My bonus · MVP Tech' }
export const dynamic = 'force-dynamic'

// The tech's own van: this week and last week.
export default async function TechBonusPage() {
  if (!supabaseConfigured) redirect('/tech')
  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/tech/login')
  const { data: tech } = await supabase.from('techs').select('name, van').eq('id', user.id).single<{ name: string; van: string }>()
  const van = tech?.van ?? ''
  const [thisWeek, lastWeek] = recentWeeks(weekStartET(), 2)
  const weeks = van ? await Promise.all([thisWeek, lastWeek].map(async (w) => ({ w, data: (await bonusWeek(w, van)).vans[0] }))) : []

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <div className="flex items-center justify-between">
            <Logo tagline="TECH" />
            <Link href="/tech" className="flex h-11 items-center text-sm font-semibold text-sub">
              ← Today
            </Link>
          </div>
          <h1 className="font-display text-[28px] leading-[1.05] font-bold">My bonus</h1>
          <div className="text-sm text-sub">{[van, tech?.name].filter(Boolean).join(' · ')}</div>
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 py-4">
        {!van && <Card className="text-[15px] text-body">No van is set for you yet. Ask the office.</Card>}
        {weeks.map(({ w, data }, i) => (
          <Card key={w} className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-base font-bold">{i === 0 ? 'This week' : 'Last week'}</span>
              <span className="text-sm text-muted">
                {weekLabel(w)} · paid {payday(w)}
              </span>
            </div>
            {data ? <BonusLines b={data.bonus} revenueEntered={data.revenueEntered} /> : <span className="text-sm text-muted">Nothing yet.</span>}
          </Card>
        ))}
        <p className="text-xs text-muted">
          Revenue is paid jobs before sales tax (membership fees don&apos;t count). Until it&apos;s automatic, the office enters it from Housecall Pro, so this
          week&apos;s number can lag.
        </p>
      </main>
    </>
  )
}
