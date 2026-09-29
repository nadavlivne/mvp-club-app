import { redirect } from 'next/navigation'
import TechToday from '@/components/tech/TechToday'
import { loadCatalog, readSample } from '@/lib/data'
import { supabaseConfigured, todayET } from '@/lib/supabase/config'
import { userClient } from '@/lib/supabase/server'
import type { TechDay, VisitWork } from '@/lib/tech'
import { fromRow, type VisitRow } from '@/lib/visits'

export const metadata = { title: "Today's visits · MVP Tech" }

// Rendered on each request so the date and the visits are today's.
export const dynamic = 'force-dynamic'

export default async function TechPage() {
  const guide = [...loadCatalog().guide.values()]
  const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })

  // No database keys yet: the sample day, saved on the device.
  if (!supabaseConfigured) {
    return <TechToday mode="sample" day={readSample<TechDay>('tech-day.json')} guide={guide} dateText={dateText} />
  }

  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/tech/login')

  // Row Level Security returns only this tech's own visits.
  const [{ data: tech }, { data: rows }] = await Promise.all([
    supabase.from('techs').select('name, van').eq('id', user.id).single<{ name: string; van: string }>(),
    supabase.from('visits').select('*').eq('visit_date', todayET()).order('time_window').returns<VisitRow[]>(),
  ])
  const visits = (rows ?? []).map(fromRow)
  const { data: workRows } = visits.length
    ? await supabase
        .from('visit_work')
        .select('visit_id, work')
        .in(
          'visit_id',
          visits.map((v) => v.id),
        )
        .returns<{ visit_id: string; work: VisitWork }[]>()
    : { data: [] }
  const works = Object.fromEntries((workRows ?? []).map((r) => [r.visit_id, r.work]))

  return (
    <TechToday mode="db" tech={tech ?? { name: user.email ?? '', van: '' }} visits={visits} works={works} guide={guide} dateText={dateText} />
  )
}
