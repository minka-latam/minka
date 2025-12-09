import {
  TriptoCreateDonationPayload,
  TriptoCreateDonationResponse,
  TriptoWebhookSecretResponse,
} from './types'

export class TriptoClient {
  private apiKey: string
  private baseUrl = 'https://api.triptoverse.xyz/api/v1'

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
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      return {
        success: false,
        error: `Tripto error: ${response.status}`,
      }
    }

    return (await response.json()) as TriptoCreateDonationResponse
  }

  // -------------------------------
  // 2) Create Webhook Secret
  // -------------------------------
  // can be don with the curl command --that's how I did it the first time
  async createWebhookSecret(
    webhookUrl: string,
  ): Promise<TriptoWebhookSecretResponse> {
    const response = await fetch(
      `${this.baseUrl}/settings/webhooks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
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
