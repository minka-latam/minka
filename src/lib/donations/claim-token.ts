import crypto from 'crypto'

export function generateDonationClaimToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashDonationClaimToken(token: string) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}
