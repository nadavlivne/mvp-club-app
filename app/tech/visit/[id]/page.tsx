import { notFound } from 'next/navigation'
import VisitApp from '@/components/tech/VisitApp'
import { loadCatalog, readSample } from '@/lib/data'
import type { TechDay } from '@/lib/tech'

export const metadata = { title: 'Visit · MVP Tech' }

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const day = readSample<TechDay>('tech-day.json')
  const visit = day.visits.find((v) => v.id === id)
  if (!visit) notFound()
  const van = day.vans.find((v) => v.id === visit.vanId)!
  const { guide, book } = loadCatalog()
  return <VisitApp visit={visit} techName={van.tech} guide={[...guide.values()]} book={[...book.values()]} />
}
