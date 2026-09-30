import { notFound } from 'next/navigation'
import CheckupReport from '@/components/CheckupReport'
import { loadCatalog, readSample } from '@/lib/data'
import { buildReport, type CheckupInput } from '@/lib/views'

export const metadata = { title: 'Your home check-up · MVP Club' }

// Phase 1: only the sample check-up exists. Phase 2 loads it from the database.
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id !== 'demo') notFound()
  const report = buildReport(readSample<CheckupInput>('checkup-demo.json'), loadCatalog())
  return <CheckupReport report={report} />
}
