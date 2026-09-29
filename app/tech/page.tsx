import TechToday from '@/components/tech/TechToday'
import { loadCatalog, readSample } from '@/lib/data'
import type { TechDay } from '@/lib/tech'

export const metadata = { title: "Today's visits · MVP Tech" }

// Rendered on each request so the date is today's.
export const dynamic = 'force-dynamic'

// Phase 2 step 1: sample day. The database and Housecall Pro supply this later.
export default function TechPage() {
  const day = readSample<TechDay>('tech-day.json')
  const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
  return <TechToday day={day} guide={[...loadCatalog().guide.values()]} dateText={dateText} />
}
