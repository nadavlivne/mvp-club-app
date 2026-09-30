import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { adminClient } from './server'

// Plain-words explanations for setup problems, so the tech app shows what to fix
// instead of crashing.
type DbError = { code?: string; message?: string } | null

export function explain(error: DbError, usingSecretKey: boolean): string {
  const code = error?.code ?? ''
  const msg = error?.message ?? ''
  if (code === 'PGRST205' || code === '42P01' || /could not find the table/i.test(msg))
    return 'The database tables are not created yet. In Supabase open SQL Editor, paste the setup text (supabase/migrations/…_init.sql) and press Run.'
  if (code === '42501' && usingSecretKey)
    return 'Supabase did not accept the secret key. In Vercel, re-paste SUPABASE_SECRET_KEY from Supabase → Project Settings → API Keys → Secret key, then redeploy.'
  if (code === '42501') return 'The database setup did not finish. Run the setup text again in Supabase → SQL Editor.'
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(msg))
    return 'The app cannot reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in Vercel (it looks like https://abcd.supabase.co).'
  if (/invalid api key|no api key/i.test(msg))
    return 'Supabase did not accept a key. Re-paste the keys from Supabase → Project Settings → API Keys into Vercel, then redeploy.'
  return `Database error: ${msg || code || 'unknown'}`
}

// Checks the database is ready for this tech. Returns problems (empty = all good).
// Also creates the tech's row if their login was made before the setup text was run.
export async function checkSetup(user: SupabaseClient, userId: string, email: string): Promise<string[]> {
  if (!process.env.SUPABASE_SECRET_KEY) return ['SUPABASE_SECRET_KEY is missing in Vercel (Settings → Environment Variables), then redeploy.']
  const admin = adminClient()
  const probe = await admin.from('techs').select('id').eq('id', userId).maybeSingle()
  if (probe.error) return [explain(probe.error, true)]
  if (!probe.data) {
    const { error } = await admin.from('techs').insert({ id: userId, name: email.split('@')[0] })
    if (error) return [explain(error, true)]
  }
  const mine = await user.from('visits').select('id').limit(1)
  if (mine.error) return [explain(mine.error, false)]
  return []
}
