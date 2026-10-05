'use server'

import { cookies } from 'next/headers'
import { membership, membershipPrice } from '@/config/business'
import { legal } from '@/config/legal'
import { site } from '@/config/site'
import { loadServiceArea } from '@/lib/data'
import { money } from '@/lib/pricing'
import { supabaseConfigured } from '@/lib/supabase/config'
import { adminClient } from '@/lib/supabase/server'

// The sign-up form saves after every step. The first step (name + phone) creates the lead,
// so people who stop halfway still reach the office. A cookie remembers which lead is theirs.
const COOKIE = 'mvp_join'

export type JoinData = {
  firstName: string
  lastName: string
  phone: string
  email: string
  street: string
  city: string
  zip: string
  systems: number
  plan: 'monthly' | 'yearly'
  preferredTime: string
  notes: string
}
export type JoinResult = { ok: true; inArea?: boolean } | { ok: false; error: string }

const SAVE_ERROR = `Sorry, we couldn't save that. Please try again, or call or text ${site.phoneDisplay}.`
const digits = (s: string) => s.replace(/\D/g, '')
const clip = (s: unknown, n = 200) => String(s ?? '').trim().slice(0, n)

function checkStep(step: number, d: JoinData): string | null {
  if (step >= 1) {
    if (!clip(d.firstName) || !clip(d.lastName)) return 'Please enter your first and last name.'
    const p = digits(d.phone)
    if (!(p.length === 10 || (p.length === 11 && p.startsWith('1')))) return 'Please enter a 10-digit mobile number.'
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'That email doesn’t look right.'
  }
  if (step >= 2) {
    if (!clip(d.street) || !clip(d.city)) return 'Please enter your street address and city.'
    if (digits(d.zip).length !== 5) return 'Please enter your 5-digit zip code.'
    if (!(d.systems >= 1 && d.systems <= membership.maxSystems)) return 'Please choose how many heating & cooling systems you have.'
  }
  if (step >= 3 && d.plan !== 'monthly' && d.plan !== 'yearly') return 'Please choose monthly or yearly.'
  return null
}

function row(step: number, d: JoinData) {
  const p = digits(d.phone).slice(-10)
  const out: Record<string, unknown> = {
    step,
    updated_at: new Date().toISOString(),
    first_name: clip(d.firstName, 80),
    last_name: clip(d.lastName, 80),
    phone: `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`,
    email: clip(d.email, 160).toLowerCase(),
  }
  if (step >= 2) {
    const zip = digits(d.zip).slice(0, 5)
    Object.assign(out, {
      street: clip(d.street),
      city: clip(d.city, 80),
      zip,
      in_area: loadServiceArea(site.serviceRadiusMiles).some((a) => a.zip === zip),
      systems: d.systems,
    })
  }
  if (step >= 3) Object.assign(out, { plan: d.plan, price: membershipPrice(d.plan, d.systems) })
  if (step >= 4) Object.assign(out, { preferred_time: clip(d.preferredTime, 80), notes: clip(d.notes, 1000) })
  return out
}

// Saves the form up to `step` (1 = contact, 2 = home, 3 = plan, 4 = details before signing).
export async function saveJoinStep(step: number, data: JoinData, trap?: string): Promise<JoinResult> {
  if (trap) return { ok: true } // hidden field only bots fill in
  const problem = checkStep(step, data)
  if (problem) return { ok: false, error: problem }
  if (!supabaseConfigured) return { ok: false, error: SAVE_ERROR }

  const values = row(step, data)
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
  const problem = checkStep(4, data)
  if (problem) return { ok: false, error: problem }
  if (!agreed) return { ok: false, error: 'Please tick the box to agree to the membership terms.' }
  if (!signature || !signature.startsWith('data:image/png;base64,') || signature.length > 400_000) return { ok: false, error: 'Please sign with your finger in the box.' }

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
