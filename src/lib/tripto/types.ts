export interface TriptoPaymentLinkResponse {
  id: string
  paymentId: string
  checkoutUrl: string
  status: string
  createdAt: string
}

export interface TriptoWebhookPayload {
  event: string // payment.completed, payment.failed
  data: {
    id: string
    paymentId: string
    amount: number
    currency: string
    metadata?: Record<string, any>
  }
}
