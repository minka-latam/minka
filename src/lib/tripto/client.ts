const TRIPTO_BASE_URL = 'https://api.triptoverse.xyz'
export class TriptoClient {
  apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  async createCheckoutSession(params: {
    productId: string
    quantity: number
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, any>
  }) {
    const url = `${TRIPTO_BASE_URL}/api/v1/checkout`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(
        '[Tripto] Error creating checkout session:',
        error,
      )
      throw new Error(
        `Tripto error: ${response.status} ${error}`,
      )
    }

    return response.json()
  }

  async getPayment(paymentId: string) {
    const url = `${TRIPTO_BASE_URL}/payment/${paymentId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(
        '[Tripto] Error fetching payment:',
        error,
      )
      throw new Error(
        `Tripto error: ${response.status} ${error}`,
      )
    }

    return response.json()
  }

  async createDonationLink(payload: {
    name: string
    description: string
    suggestedAmount: number
    metadata: Record<string, string>
  }) {
    const response = await fetch(
      'https://api.triptoverse.xyz/api/v1/payment-links/custom-amount',
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
    return data
  }
}
