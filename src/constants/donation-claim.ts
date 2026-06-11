export const DONATION_CLAIM_INTENT_KEY =
  'minka_donation_claim_intent'

export type DonationClaimIntent = {
  donationId: string
  claimToken: string
  campaignId: string
  createdAt: string
}
