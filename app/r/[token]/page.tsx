import { notFound } from 'next/navigation'
import CheckupReport from '@/components/CheckupReport'
import ServiceEstimate from '@/components/ServiceEstimate'
import { PHOTO_REF } from '@/lib/photoRef'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient } from '@/lib/supabase/server'
import type { EstimateView, ReportView } from '@/lib/views'

export const metadata = { title: 'MVP Club' }
export const dynamic = 'force-dynamic'

// The customer's private page. No login: the long random token in the link is the key.
export default async function CustomerLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!supabaseConfigured || !/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound()
  const db = adminClient()
  const { data: link } = await db.from('customer_links').select('id, kind, view').eq('token', token).maybeSingle()
  if (!link) notFound()
  const { data: approval } = await db.from('approvals').select('created_at, details').eq('link_id', link.id).maybeSingle()

  // Stored photos are private: give the customer short-lived links to their own photos only.
  const sign = async (ref?: string) => {
    if (!ref?.startsWith(PHOTO_REF)) return ref
    const { data } = await db.storage.from('photos').createSignedUrl(ref.slice(PHOTO_REF.length), 60 * 60 * 24)
    return data?.signedUrl
  }
  const approved = approval ? { at: approval.created_at as string, details: approval.details as Record<string, unknown> } : null

  if (link.kind === 'report') {
    const view = link.view as ReportView
    const items = await Promise.all(view.items.map(async (i) => ({ ...i, photo: await sign(i.photo) })))
    return <CheckupReport report={{ ...view, items }} token={token} approved={approved} />
  }
  const view = link.view as EstimateView
  return <ServiceEstimate estimate={{ ...view, found: { ...view.found, photo: await sign(view.found.photo) } }} token={token} approved={approved} />
}
