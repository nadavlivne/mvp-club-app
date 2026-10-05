'use server'

import { membership, membershipPrice } from '@/config/business'
import { legal } from '@/config/legal'
import { checkJoin, joinRow, SAVE_ERROR, validSignature, type JoinData, type JoinResult } from '@/lib/join'
import { money } from '@/lib/pricing'
import { adminClient, userClient } from '@/lib/supabase/server'

// Sign-up on the tech's tablet during a visit: one screen, signed on the spot.
// The card is taken in the Housecall Pro app; the office confirms and marks the lead "Joined".
export async function techJoin(visitId: string, data: JoinData, signature: string | null, agreed: boolean): Promise<JoinResult> {
  const problem = checkJoin(3, data)
  if (problem) return { ok: false, error: problem }
  if (!agreed) return { ok: false, error: 'The customer needs to tick the box to agree to the membership terms.' }
  if (!validSignature(signature)) return { ok: false, error: 'The customer needs to sign with a finger in the box.' }

  // Row Level Security: the tech can only see their own visits.
  const supabase = await userClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You are signed out. Sign in again and retry.' }
  const { data: visit } = await supabase.from('visits').select('id').eq('id', visitId).maybeSingle()
  if (!visit) return { ok: false, error: 'This visit is not on your list.' }

  const db = adminClient()
  const { data: existing } = await db.from('leads').select('id').eq('visit_id', visitId).not('signed_at', 'is', null).limit(1)
  if (existing?.length) return { ok: false, error: 'This customer is already signed up from this visit.' }

  const price = membershipPrice(data.plan, data.systems)
  const now = new Date().toISOString()
  const { error } = await db.from('leads').insert({
    ...joinRow(3, data),
    source: 'tech',
    status: 'signed_up',
    step: 5,
    tech_id: user.id,
    visit_id: visitId,
    signature,
    signed_at: now,
    terms_text: legal.techJoinTerms(`${money(price)}/${data.plan === 'monthly' ? 'month' : 'year'}`, membership.firstTermMonths),
  })
  if (error) {
    console.error('tech join failed', error)
    return { ok: false, error: SAVE_ERROR }
  }
  return { ok: true }
}
