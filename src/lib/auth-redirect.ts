const DEFAULT_AUTH_REDIRECT_PATH = '/dashboard'

export function getSafeAuthRedirectPath(
  returnUrl: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT_PATH,
) {
  if (
    !returnUrl ||
    !returnUrl.startsWith('/') ||
    returnUrl.startsWith('//')
  ) {
    return fallback
  }

  try {
    // dummy base URL
    const url = new URL(
      returnUrl,
      'https://minka-comunidad.org',
    )
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
