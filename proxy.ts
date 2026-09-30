import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfigured, supabasePublishableKey, supabaseUrl } from './lib/supabase/config'

// Keeps the tech's login fresh and sends signed-out visitors of the tech app to the login page.
// Customer pages (/r/...) and the sample pages never need a login.
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })
  let user = null
  try {
    user = (await supabase.auth.getUser()).data.user
  } catch {
    // Supabase unreachable or misconfigured: let the page show what to fix.
    return response
  }

  const onLogin = request.nextUrl.pathname === '/tech/login'
  if (!user && !onLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/tech/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (user && onLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/tech'
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: ['/tech/:path*', '/office/:path*'],
}
