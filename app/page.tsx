import { redirect } from 'next/navigation'

// The main address is for staff: it opens the tech app (sign-in when needed).
// Customers only ever get their own private link (/r/...); samples are at /demo.
export default function Home() {
  redirect('/tech')
}
