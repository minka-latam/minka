const TRIPTO_BASE_URL = 'https://api.triptoverse.xyz/api/v1'

export class TriptoClient {
  apiKey: string

  constructor() {
    if (!process.env.TRIPTO_API_KEY) {
      throw new Error('Missing TRIPTO_API_KEY')
    }
    this.apiKey = process.env.TRIPTO_API_KEY!
  }

  async createPaymentLink(params: {
    amount: number
    currency: string
    metadata?: Record<string, any>
  }) {
    const url = `${TRIPTO_BASE_URL}/payments/link`

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
        '[Tripto] Error creating payment link:',
        error,
      )
      throw new Error(
        `Tripto error: ${response.status} ${error}`,
      )
    }

    return response.json()
  }

  async getPayment(paymentId: string) {
    const url = `${TRIPTO_BASE_URL}/payments/${paymentId}`

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
}

// Singleton (para evitar crear múltiples clientes)
export const triptoClient = new TriptoClient()
