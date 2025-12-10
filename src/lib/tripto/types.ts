// ============================
// Donation Link
// ============================

export interface TriptoCreateDonationPayload {
  slug: string
  name: string
  description?: string | null
  imageUrl: string
  minAmount?: number
  maxAmount?: number
  suggestedAmount?: number
  submitType: 'pay' | 'donate' | 'book'
  afterPayment: {
    type: 'redirect'
    redirectUrl: string
  }
  campaign?: string
  metadata?: Record<string, string>
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
// Webhook Payload
// ============================

export interface TriptoWebhookPayload {
  event: string
  timestamp: string
  data: {
    paymentId: string
    amount: number
    currency: string
    metadata?: Record<string, string>
    stripeSessionId?: string
    stripePaymentId?: string
    stripeChargeId?: string
  }
}

// To validate HMAC signature in the  webhook
export interface TriptoWebhookHeaders {
  signature: string // X-Webhook-Signature
  timestamp: string // X-Webhook-Timestamp
}
