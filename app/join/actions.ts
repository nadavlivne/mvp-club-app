'use server'

import { cookies } from 'next/headers'
import { membership, membershipPrice } from '@/config/business'
import { legal } from '@/config/legal'
import { checkJoin, joinRow, SAVE_ERROR, validSignature, type JoinData, type JoinResult } from '@/lib/join'
import { money } from '@/lib/pricing'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient } from '@/lib/supabase/server'

// The sign-up form saves after every step. The first step (name + phone) creates the lead,
// so people who stop halfway still reach the office. A cookie remembers which lead is theirs.
const COOKIE = 'mvp_join'

// Saves the form up to `step` (1 = contact, 2 = home, 3 = plan, 4 = details before signing).
export async function saveJoinStep(step: number, data: JoinData, trap?: string): Promise<JoinResult> {
  if (trap) return { ok: true } // hidden field only bots fill in
  const problem = checkJoin(step, data)
  if (problem) return { ok: false, error: problem }
  if (!supabaseConfigured) return { ok: false, error: SAVE_ERROR }

  const values = joinRow(step, data)
  const db = adminClient()
  const jar = await cookies()
  const id = jar.get(COOKIE)?.value
  try {
    let saved = false
    if (id) {
      // Only an unsigned sign-up can be changed from the website; never lower the step reached.
      const { data: cur } = await db.from('leads').select('step, signed_at').eq('id', id).maybeSingle<{ step: number; signed_at: string | null }>()
      if (cur && !cur.signed_at) {
        const { error } = await db.from('leads').update({ ...values, step: Math.max(cur.step, step) }).eq('id', id)
        if (error) throw error
        saved = true
      }
    }
    if (!saved) {
      const { data: created, error } = await db.from('leads').insert(values).select('id').single<{ id: string }>()
      if (error) throw error
      jar.set(COOKIE, created.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' })
    }
    return { ok: true, inArea: step >= 2 ? Boolean(values.in_area) : undefined }
  } catch (e) {
    console.error('join save failed', e)
    return { ok: false, error: SAVE_ERROR }
  }
}

// Last step: signature. Marks the lead as a finished sign-up.
export async function finishJoin(data: JoinData, signature: string | null, agreed: boolean): Promise<JoinResult> {
  const problem = checkJoin(4, data)
  if (problem) return { ok: false, error: problem }
  if (!agreed) return { ok: false, error: 'Please tick the box to agree to the membership terms.' }
  if (!validSignature(signature)) return { ok: false, error: 'Please sign with your finger in the box.' }

  const saved = await saveJoinStep(4, data)
  if (!saved.ok) return saved
  const jar = await cookies()
  const id = jar.get(COOKIE)?.value
  if (!id) return { ok: false, error: SAVE_ERROR }
  const price = membershipPrice(data.plan, data.systems)
  const priceText = `${money(price)}/${data.plan === 'monthly' ? 'month' : 'year'}`
  const { error } = await adminClient()
    .from('leads')
    .update({
      status: 'signed_up',
      step: 5,
      signature,
      signed_at: new Date().toISOString(),
      terms_text: legal.joinTerms(priceText, membership.firstTermMonths),
    })
    .eq('id', id)
    .is('signed_at', null)
  if (error) {
    console.error('join finish failed', error)
    return { ok: false, error: SAVE_ERROR }
  }
  // A new visit to /join starts a fresh form.
  jar.delete(COOKIE)
  return { ok: true }
}
