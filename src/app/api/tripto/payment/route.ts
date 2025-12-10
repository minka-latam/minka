import { NextResponse } from 'next/server'
import { TriptoClient } from '@/lib/tripto/client'
import { db } from '@/lib/db'

// Create Tripto payment link
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      campaignId,
      donorId,
      amount,
      tipAmount,
      message,
      isAnonymous,
      notificationEnabled,
      paymentMethod,
    } = body

    if (!campaignId || !donorId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 },
      )
    }

    const totalAmount =
      Number(amount) + Number(tipAmount || 0)

    const apiKey = process.env.TRIPTO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing TRIPTO_API_KEY' },
        { status: 500 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
    const successUrl = `${baseUrl}/donate/${campaignId}?status=success`
    const failedUrl = `${baseUrl}/donate/${campaignId}?status=failed`

    const client = new TriptoClient(apiKey)

    // Metadata passed to webhook
    const metadata = {
      campaignId,
      donorId,
      amount: String(amount),
      tipAmount: String(tipAmount || 0),
      message: message || '',
      isAnonymous: isAnonymous ? 'true' : 'false',
      notificationEnabled: notificationEnabled
        ? 'true'
        : 'false',
      paymentMethod: paymentMethod || 'card',
    }

    // Tripto donation link request
    const result = await client.createDonationLink({
      name: 'Donación en Minka',
      description: 'Apoyo directo a una campaña',
      suggestedAmount: totalAmount * 100,
      successUrl,
      failedUrl,
      metadata,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      )
    }

    const checkoutUrl = result.url

    return NextResponse.json({
      success: true,
      url: checkoutUrl,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Server error',
      },
      { status: 500 },
    )
  }
}
