import Link from 'next/link'
import { signOut } from '@/app/tech/actions'
import { Card, Logo } from '@/components/ui'
import { currentStaff } from '@/lib/staff'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Office · MVP Club' }

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const staff = await currentStaff()
  const nav = [
    { href: '/office', label: 'Approved jobs', ready: true, admin: false },
    { href: '/office/team', label: 'Team', ready: true, admin: true },
    { href: '/office/prices', label: 'Price list', ready: true, admin: true },
    { href: '#', label: 'Bonuses', ready: false, admin: true },
  ]
  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 pt-[18px] pb-4">
          <div className="flex items-center justify-between gap-3">
            <Logo tagline="OFFICE" />
            {staff && (
              <div className="flex items-center gap-4 text-sm text-sub">
                <span>
                  {staff.name || staff.email} · {staff.role === 'admin' ? 'Admin' : 'Office'}
                </span>
                <form action={signOut}>
                  <button type="submit" className="flex h-11 items-center font-semibold">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
          {staff && (
            <nav className="flex flex-wrap gap-2">
              {nav
                .filter((n) => !n.admin || staff.role === 'admin')
                .map((n) =>
                  n.ready ? (
                    <Link
                      key={n.label}
                      href={n.href}
                      className="flex h-11 items-center rounded-[10px] bg-white px-4 text-[15px] font-bold text-navy"
                    >
                      {n.label}
                    </Link>
                  ) : (
                    <span
                      key={n.label}
                      className="flex h-11 items-center rounded-[10px] border border-sub/40 px-4 text-[15px] font-semibold text-sub"
                    >
                      {n.label} · soon
                    </span>
                  ),
                )}
            </nav>
          )}
        </div>
      </header>
      {staff ? (
        children
      ) : (
        <main className="mx-auto max-w-xl px-4 py-6">
          <Card className="flex flex-col gap-2">
            <div className="text-base font-bold">No office access</div>
            <div className="text-[15px] text-body">This login is not set up for the office. Ask the admin to add you.</div>
            <Link href="/tech" className="text-[15px] font-semibold text-link">
              Go to the tech app
            </Link>
          </Card>
        </main>
      )}
    </>
  )
}
