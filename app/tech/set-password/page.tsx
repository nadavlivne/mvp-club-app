import { Logo } from '@/components/ui'
import SetPasswordForm from './SetPasswordForm'

export const metadata = { title: 'Choose your password · MVP' }
export const dynamic = 'force-dynamic'

export default function SetPasswordPage() {
  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-[18px] pb-4">
          <Logo tagline="TEAM" />
          <h1 className="font-display text-[28px] leading-[1.05] font-bold">Choose your password</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-3.5 px-4 py-5">
        <p className="text-[15px] text-body">You signed in with a temporary password. Pick your own — at least 8 characters.</p>
        <SetPasswordForm />
      </main>
    </>
  )
}
