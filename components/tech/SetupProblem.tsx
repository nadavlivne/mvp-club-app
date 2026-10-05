import { signOut } from '@/app/tech/actions'
import { Card, Logo } from '../ui'

// Shown instead of the tech app when the database isn't ready yet.
export default function SetupProblem({ problems }: { problems: string[] }) {
  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <Logo tagline="TECH" />
          <h1 className="font-display text-[28px] leading-[1.05] font-bold">Almost ready</h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-col gap-3.5 px-4 py-5">
        <Card className="flex flex-col gap-2 border-2 border-[#F2B705]">
          <div className="text-base font-bold">The database needs one more setup step</div>
          {problems.map((p) => (
            <div key={p} className="text-[15px] text-body">
              {p}
            </div>
          ))}
          <div className="text-sm text-muted">After fixing it, reload this page.</div>
        </Card>
        <form action={signOut}>
          <button type="submit" className="h-11 text-sm font-semibold text-link">
            Sign out
          </button>
        </form>
      </main>
    </>
  )
}
