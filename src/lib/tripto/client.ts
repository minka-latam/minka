import {
  TriptoCreateDonationPayload,
  TriptoCreateDonationResponse,
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
  async createWebhookSecret(): Promise<{
    success: boolean
    secret?: string
  }> {
    const response = await fetch(
      `${this.baseUrl}/settings/webhooks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({}),
      },
    )

    if (!response.ok) {
      return {
        success: false,
      }
    }

    const data = await response.json()

    // Tripto returns:
    // { "webhookSecret": "whsec_xxx" }
    return {
      success: true,
      secret: data.webhookSecret,
    }
  }
}
