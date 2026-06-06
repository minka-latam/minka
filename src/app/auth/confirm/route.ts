import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_OPTIONS,
} from '@/lib/password-recovery-session'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null

  if (code) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.search = requestUrl.search
    if (!callbackUrl.searchParams.get('type') && type) {
      callbackUrl.searchParams.set('type', type)
    }

    return NextResponse.redirect(callbackUrl)
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL(
        '/sign-in?error=Invalid or expired recovery link',
        request.url,
      ),
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) =>
              cookieStore.set(name, value, options),
          )
        },
      },
    },
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  })

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    )
  }

  if (type === 'recovery') {
    const response = NextResponse.redirect(
      new URL('/reset-password', request.url),
    )
    response.cookies.set(
      PASSWORD_RECOVERY_COOKIE,
      '1',
      PASSWORD_RECOVERY_COOKIE_OPTIONS,
    )

    return response
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
