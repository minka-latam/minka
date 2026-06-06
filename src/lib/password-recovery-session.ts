export const PASSWORD_RECOVERY_COOKIE = 'minka-password-recovery'

export const PASSWORD_RECOVERY_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 30,
}
