import {
  TriptoCreateDonationPayload,
  TriptoCreateDonationResponse,
  TriptoWebhookSecretResponse,
} from './types'

export class TriptoClient {
  private apiKey: string
  private baseUrl = process.env.TRIPTO_BASE_URL

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // -------------------------------
  // 1) Create Donation Link
  // -------------------------------
  async createDonationLink(
    payload: TriptoCreateDonationPayload,
  ): Promise<TriptoCreateDonationResponse> {
    const response = await fetch(
      `${this.baseUrl}/payment-links/custom-amount`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error || `Tripto error: ${response.status}`,
      }
    }

    // Tripto returns: { success: true, url: "..." }
    return {
      success: true,
      url: data.url,
    }
  }

  // -------------------------------
  // 2) Create Webhook Secret
  // -------------------------------
  async createWebhookSecret(
    webhookUrl: string,
  ): Promise<TriptoWebhookSecretResponse> {
    const response = await fetch(
      `${this.baseUrl}/settings/webhooks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ webhookUrl }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      }
    }

    return { success: true, secret: data.webhookSecret }
  }
}
