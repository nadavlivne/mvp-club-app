'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabasePublishableKey, supabaseUrl } from './config'

let client: ReturnType<typeof createBrowserClient> | null = null

// Signed-in tech's client in the browser (Row Level Security applies).
export function browserClient() {
  client ??= createBrowserClient(supabaseUrl, supabasePublishableKey)
  return client
}
