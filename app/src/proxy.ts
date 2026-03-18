import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // If Supabase env vars are missing, skip auth middleware entirely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValidUrl = (url: string) => {
    try { return ['http:', 'https:'].includes(new URL(url).protocol) } catch { return false }
  }
  if (!supabaseUrl || !supabaseKey || !isValidUrl(supabaseUrl)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // Protected routes
    const protectedPaths = ['/dashboard', '/workspace']
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirect logged-in users away from auth pages
    if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch {
    // If Supabase is misconfigured, let the request through rather than crashing
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
