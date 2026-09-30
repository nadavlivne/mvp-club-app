import { redirect } from 'next/navigation'
import { supabaseConfigured } from '@/lib/supabase/config'
import { Logo } from '@/components/ui'
import LoginForm from './LoginForm'

export const metadata = { title: 'Sign in · MVP Tech' }
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  if (!supabaseConfigured) redirect('/tech')
  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-[18px] pb-4">
          <Logo tagline="TEAM" />
          <h1 className="font-display text-[28px] leading-[1.05] font-bold">Sign in</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-3.5 px-4 py-5">
        <LoginForm />
        <p className="text-center text-sm text-muted">No login yet, or forgot your password? Ask the office.</p>
      </main>
    </>
  )
}
