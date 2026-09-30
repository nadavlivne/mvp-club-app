// Supabase is switched on when Nadav has entered the keys in Vercel.
// Without them the app runs on the sample data (and saves on the device).
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

// Today's date in Cincinnati, as YYYY-MM-DD.
export const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
