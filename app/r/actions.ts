'use server'

import { headers } from 'next/headers'
import { legal } from '@/config/legal'
import { membership } from '@/config/business'
import { adminClient } from '@/lib/supabase/server'
import type { EstimateView, ReportView } from '@/lib/views'

export type ReportChoice = { kind: 'report'; keys: string[]; remind: string[]; day: string; dayLabel: string; slot: string }
export type EstimateChoice = { kind: 'estimate'; optionKey: string; joined: boolean }

const MAX_SIGNATURE = 400_000

// Saves the customer's approval. Prices come from the frozen copy sent by the tech,
// never from the browser.
export async function submitApproval(token: string, choice: ReportChoice | EstimateChoice, signature: string): Promise<{ ok: true } | { error: string }> {
  if (!signature.startsWith('data:image/png;base64,') || signature.length > MAX_SIGNATURE) return { error: 'Please sign again.' }
  const db = adminClient()
  const { data: link } = await db.from('customer_links').select('id, kind, view').eq('token', token).maybeSingle()
  if (!link || link.kind !== choice.kind) return { error: 'This link is not valid any more. Please call us.' }
  const { count } = await db.from('approvals').select('id', { count: 'exact', head: true }).eq('link_id', link.id)
  if (count) return { error: 'This was already approved. Thank you!' }

  let details: Record<string, unknown>
  let legalText: string
  if (choice.kind === 'report') {
    const view = link.view as ReportView
    const items = view.items.filter((i) => choice.keys.includes(i.key) && i.price !== null)
    if (!items.length) return { error: 'Please add at least one item.' }
    details = {
      items: items.map((i) => ({ key: i.key, title: i.title, price: i.price })),
      total: items.reduce((a, i) => a + (i.price ?? 0), 0),
      remind: view.items.filter((i) => choice.remind.includes(i.key)).map((i) => ({ key: i.key, title: i.title, rating: i.rating })),
      day: choice.day,
      dayLabel: choice.dayLabel,
      slot: choice.slot,
    }
    legalText = legal.checkupApproval
  } else {
    const view = link.view as EstimateView
    const option = view.options.find((o) => o.key === choice.optionKey)
    if (!option) return { error: 'Please pick an option.' }
    const member = view.alreadyMember || choice.joined
    const price = member ? option.member : option.standard
    const fee = member ? view.serviceCall.member : view.serviceCall.standard
    details = {
      option: { key: option.key, name: option.name, what: option.what, price },
      serviceCall: fee,
      total: price + fee,
      joinedClub: !view.alreadyMember && choice.joined,
    }
    legalText = legal.emergencyWaiver
    if (details.joinedClub) legalText += ` MVP Club membership ${legal.membershipTerms(membership.monthly, membership.firstTermMonths)}`
  }

  const { error } = await db.from('approvals').insert({
    link_id: link.id,
    details,
    signature,
    legal_text: legalText,
    user_agent: (await headers()).get('user-agent')?.slice(0, 300) ?? null,
  })
  if (error) return { error: 'Something went wrong saving your approval. Please try again.' }
  return { ok: true }
}
