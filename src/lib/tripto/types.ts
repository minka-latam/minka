// ============================
// Donation Link
// ============================

export interface TriptoCreateDonationPayload {
  name: string
  description: string
  suggestedAmount: number // in cents
  successUrl: string
  failedUrl: string
  metadata: Record<string, string>
}

export interface TriptoDonationLinkData {
  url: string
  paymentLinkId?: string
  slug?: string
}

export interface TriptoCreateDonationResponse {
  success: boolean
  url?: string
  error?: string
}

// ============================
// Webhook Secret Creation
// ============================

export interface TriptoWebhookSecretResponse {
  success: boolean
  secret?: string
  error?: string
}

// ============================
// Webhook Events
// ============================

export interface TriptoWebhookEvent {
  event: string // "payment.completed", "payment.failed", etc.
  paymentId: string
  stripePaymentId?: string
  stripeChargeId?: string
  stripeSessionId?: string
  amount: number
  currency: string
  metadata: Record<string, string>
  createdAt: string
}

// To validate HMAC signature in the  webhook
export interface TriptoWebhookHeaders {
  signature: string // X-Webhook-Signature
  timestamp: string // X-Webhook-Timestamp
}
