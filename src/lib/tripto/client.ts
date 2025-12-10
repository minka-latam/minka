import {
  TriptoCreateDonationPayload,
  TriptoCreateDonationResponse,
  TriptoWebhookSecretResponse,
} from './types'

export class TriptoClient {
  private apiKey: string
  private baseUrl = process.env.TRIPTO_BASE_URL

  constructor(apiKey: string) {
    console.log('TRIPTO_CLIENT INIT → apiKey:', apiKey)
    this.apiKey = apiKey
  }

  // -------------------------------
  // 1) Create Donation Link
  // -------------------------------
  async createDonationLink(
    payload: TriptoCreateDonationPayload,
  ): Promise<TriptoCreateDonationResponse> {
    console.log(
      '[TRIPTO] POST',
      `${this.baseUrl}/payment-links/custom-amount`,
    )

    if (!this.baseUrl) {
      return {
        success: false,
        error: 'TRIPTO_BASE_URL is not configured',
      }
    }

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

    const data = await response.json()
    console.log('[DEBUG][TRIPTO_RESPONSE]', data)

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error || `Tripto error: ${response.status}`,
      }
    }

    return {
      success: true,
      url: data?.data?.url,
    }
  }

  // -------------------------------
  // 2) Create Webhook Secret
  // -------------------------------
  async createWebhookSecret(
    webhookUrl: string,
  ): Promise<TriptoWebhookSecretResponse> {
    if (!this.baseUrl) {
      return {
        success: false,
        error: 'TRIPTO_BASE_URL is not configured',
      }
    }

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
