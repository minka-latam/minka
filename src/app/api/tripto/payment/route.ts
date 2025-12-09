import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { TriptoClient } from '@/lib/tripto/client'

export async function POST(req: Request) {
  try {
    // 1. Leer payload del frontend
    const body = await req.json()

    const {
      campaignId,
      donationAmount,
      tipAmount,
      totalAmount,
      isAnonymous,
      notificationEnabled,
    } = body

    // 2. Validar campaña y usuario
    const user = await getUser()
    const donorId = user?.id ?? null

    if (!campaignId || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 3. Construir metadata para Tripto
    const metadata = {
      campaignId,
      donationAmount: String(donationAmount),
      tipAmount: String(tipAmount),
      totalAmount: String(totalAmount),
      donorId: donorId ?? 'anonymous',
      isAnonymous: String(isAnonymous),
      notificationEnabled: String(notificationEnabled),
    }

    // 4. Llamar a Tripto (según 05-DONATIONS)
    // 🌐 POST /api/v1/payment-links/custom-amount
    // Doc referencia: 05-DONATIONS.pdf, sección "Crear Payment Link de Donaciones"
    const tripto = new TriptoClient(
      process.env.TRIPTO_API_KEY!,
    )

    const response = await tripto.createDonationLink({
      name: 'Donación en Minka',
      description: 'Apoyo directo a una campaña',
      suggestedAmount: Number(totalAmount) * 100,
      metadata,
    })

    if (!response.success) {
      return NextResponse.json(
        { error: 'Tripto error', details: response.error },
        { status: 500 },
      )
    }

    const checkoutUrl = response.data.url

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    console.error('Tripto payment error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error?.message,
      },
      { status: 500 },
    )
  }
}
