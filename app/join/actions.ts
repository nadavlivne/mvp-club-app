'use server'

import { cookies } from 'next/headers'
import { after } from 'next/server'
import { membership, membershipPrice } from '@/config/business'
import { legal } from '@/config/legal'
import { checkJoin, joinRow, SAVE_ERROR, validSignature, type JoinData, type JoinResult } from '@/lib/join'
import { money } from '@/lib/pricing'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient } from '@/lib/supabase/server'
import { notifyOffice } from '@/lib/notify'
import { limits, passedTurnstile, tooManyMessage, visitorKey } from '@/lib/spamGuard'
import { site } from '@/config/site'

// The sign-up form saves after every step. The first step (name + phone) creates the lead,
// so people who stop halfway still reach the office. A cookie remembers which lead is theirs.
const COOKIE = 'mvp_join'

// Saves the form up to `step` (1 = contact, 2 = home, 3 = plan, 4 = details before signing).
// `humanCheck` is the Cloudflare Turnstile answer (only needed when a new lead is created).
export async function saveJoinStep(step: number, data: JoinData, humanCheck?: string): Promise<JoinResult> {
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
      // New lead: bot checks first.
      if (!(await passedTurnstile(humanCheck))) return { ok: false, error: 'Please wait for the security check under the form, then press Continue again.' }
      const key = await visitorKey()
      const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
      const { count, error: countError } = await db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('visitor_key', key)
        .gte('created_at', hourAgo)
      // countError = the protection column isn't set up yet; never block a real person because of it.
      if (!countError && (count ?? 0) >= limits.newLeadsPerHourPerConnection) {
        return { ok: false, error: `${tooManyMessage} ${site.phoneDisplay}.` }
      }
      let res = await db.from('leads').insert({ ...values, visitor_key: key }).select('id').single<{ id: string }>()
      if (res.error && /visitor_key/.test(res.error.message)) res = await db.from('leads').insert(values).select('id').single<{ id: string }>()
      if (res.error) throw res.error
      const created = res.data
      jar.set(COOKIE, created.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' })
      // Sent after the page answers, so the customer never waits for the email.
      after(() =>
        notifyOffice(`New MVP Club lead: ${values.first_name} ${values.last_name}`, [
          `${values.first_name} ${values.last_name} started signing up on the website.`,
          `Phone: ${values.phone}`,
          values.email ? `Email: ${values.email}` : '',
          '',
          'If they don\'t finish, call or text them. Details: ' + `${site.url}/office/leads`,
        ]),
      )
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
  after(() =>
    notifyOffice(`Signed up: ${data.firstName} ${data.lastName} (${priceText})`, [
      `${data.firstName} ${data.lastName} finished signing up for MVP Club on the website.`,
      `Plan: ${priceText}, ${data.systems} heating & cooling system${data.systems === 1 ? '' : 's'}`,
      `Phone: ${data.phone}`,
      data.email ? `Email: ${data.email}` : '',
      `Address: ${data.street}, ${data.city} ${data.zip}`,
      data.preferredTime ? `Best time for the first check-up: ${data.preferredTime}` : '',
      data.notes ? `Notes: ${data.notes}` : '',
      '',
      'Next: call or text within one business day, and send the Housecall Pro payment link.',
      `${site.url}/office/leads`,
    ]),
  )
  return { ok: true }
}
