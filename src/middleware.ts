import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSafeAuthRedirectPath } from '@/lib/auth-redirect'
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_OPTIONS,
} from '@/lib/password-recovery-session'

function isRecoverySession(session: unknown) {
  if (!session || typeof session !== 'object') {
    return false
  }

  const user = (session as {
    user?: { app_metadata?: Record<string, unknown> }
  }).user
  const amr = user?.app_metadata?.amr

  return Array.isArray(amr)
    ? amr.some((entry) => {
        if (!entry || typeof entry !== 'object') {
          return false
        }

        return (
          (entry as { method?: unknown }).method ===
          'recovery'
        )
      })
    : false
}

export async function middleware(req: NextRequest) {
  const pathname =
    req.nextUrl.pathname.replace(/\/$/, '') || '/'
  const isOAuthCallbackFallback =
    req.nextUrl.searchParams.has('code') &&
    ['/', '/sign-in', '/sign-up'].includes(
      pathname,
    )

  if (isOAuthCallbackFallback) {
    const callbackUrl = new URL('/auth/callback', req.url)
    callbackUrl.search = req.nextUrl.search
    return NextResponse.redirect(callbackUrl)
  }

  const isPasswordRecoveryLanding =
    pathname === '/reset-password' &&
    req.nextUrl.searchParams.get('type') === 'recovery' &&
    req.nextUrl.searchParams.has('code')

  if (isPasswordRecoveryLanding) {
    const recoveryResponse = NextResponse.next({
      request: { headers: req.headers },
    })
    recoveryResponse.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      '1',
      PASSWORD_RECOVERY_COOKIE_OPTIONS,
    )

    return recoveryResponse
  }

  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              req.cookies.set(name, value)
              res = NextResponse.next({
                request: { headers: req.headers },
              })
              res.cookies.set(name, value, options)
            },
          )
        },
      },
    },
  )

  // Safely get session - ignore cookie parse errors
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch {
    console.log(
      'Session parse error - treating as unauthenticated',
    )
  }

  const isAuthenticated = !!session
  const hasPasswordRecoveryCookie =
    req.cookies.get(PASSWORD_RECOVERY_COOKIE)?.value === '1'
  const isPasswordRecoverySession =
    isAuthenticated &&
    (hasPasswordRecoveryCookie || isRecoverySession(session))

  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/campaign-verification') ||
    req.nextUrl.pathname.startsWith('/campaign/create') ||
    req.nextUrl.pathname.startsWith('/create-campaign')

  const isAuthRoute =
    req.nextUrl.pathname.startsWith('/sign-in') ||
    req.nextUrl.pathname.startsWith('/sign-up')

  if (
    isPasswordRecoverySession &&
    (isProtectedRoute || isAuthRoute || pathname === '/')
  ) {
    return NextResponse.redirect(
      new URL('/reset-password', req.url),
    )
  }

  if (hasPasswordRecoveryCookie && !isAuthenticated) {
    res.cookies.delete(PASSWORD_RECOVERY_COOKIE)
  }

  if (isAuthenticated && isAuthRoute) {
    const returnUrl =
      req.nextUrl.searchParams.get('returnUrl')
    return NextResponse.redirect(
      new URL(getSafeAuthRedirectPath(returnUrl), req.url),
    )
  }

  if (!isAuthenticated && isProtectedRoute) {
    const returnUrl =
      req.nextUrl.pathname + req.nextUrl.search
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('returnUrl', returnUrl)
    return NextResponse.redirect(signInUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/campaign-verification',
    '/campaign-verification/:path*',
    '/campaign/create/:path*',
    '/create-campaign/:path*',
    '/create-campaign',
    '/sign-in/:path*',
    '/sign-up/:path*',
    '/reset-password',
  ],
}
