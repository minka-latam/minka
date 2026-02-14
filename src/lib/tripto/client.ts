import {
  TriptoCreateDonationPayload,
  TriptoCreateDonationResponse,
  TriptoWebhookSecretResponse,
} from './types'

export class TriptoClient {
  private apiKey: string
  private baseUrl = process.env.TRIPTO_BASE_URL
  private tenantAuth: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    const tenantAuth = process.env.TRIPTO_CF_BYPASS
    if (!tenantAuth) {
      throw new Error('TRIPTO_CF_BYPASS is not configured')
    }
    this.tenantAuth = tenantAuth
  }

  // -------------------------------
  // 1) Create Donation Link
  // -------------------------------
  async createDonationLink(
    payload: TriptoCreateDonationPayload,
  ): Promise<TriptoCreateDonationResponse> {
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
        headers: (() => {
          const headers = new Headers({
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          })
          if (this.tenantAuth) {
            headers.set('x-tenant-auth', this.tenantAuth)
          }
          console.log(
            'tripto headers',
            Object.fromEntries(headers.entries()),
          )
          return headers
        })(),
        body: JSON.stringify(payload),
      },
    )

    const text = await response.text()
    let data: any

    try {
      data = JSON.parse(text)
    } catch {
      console.error('[TRIPTO][NON_JSON_RESPONSE]', text)
      return {
        success: false,
        error: 'PAYMENT_PROVIDER_UNAVAILABLE',
      }
    }

    if (!response.ok || !data?.success) {
      console.error('[TRIPTO][ERROR_RESPONSE]', data)
      return {
        success: false,
        error: 'PAYMENT_PROVIDER_ERROR',
      }
    }

    const url = data?.data?.url
    if (!url) {
      console.error('[TRIPTO][INVALID_RESPONSE]', data)
      return {
        success: false,
        error: 'PAYMENT_PROVIDER_INVALID_RESPONSE',
      }
    }

    return {
      success: true,
      url,
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
