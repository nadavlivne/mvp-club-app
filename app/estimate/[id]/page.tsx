import { notFound } from 'next/navigation'
import ServiceEstimate from '@/components/ServiceEstimate'
import { readSample } from '@/lib/data'
import { buildEstimate, type EstimateInput } from '@/lib/views'

export const metadata = { title: 'Your estimate · MVP Home Services' }

// Phase 1: only the sample estimate exists. Phase 2 loads it from the database.
export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id !== 'demo') notFound()
  const estimate = buildEstimate(readSample<EstimateInput>('estimate-demo.json'))
  return <ServiceEstimate estimate={estimate} />
}
