import { NextResponse } from 'next/server'
import { TriptoClient } from '@/lib/tripto/client'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      campaignId,
      donorId,
      amount,
      tipAmount = 0,
      message = '',
      isAnonymous = false,
      notificationEnabled = false,
      paymentMethod = 'card',
    } = body

    if (!campaignId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields (campaignId, amount)',
        },
        { status: 400 },
      )
    }

    // Fetch campaign
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 },
      )
    }

    // Prepare environment & client
    const apiKey = process.env.TRIPTO_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const triptoBaseUrl = process.env.TRIPTO_BASE_URL

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing TRIPTO_API_KEY' },
        { status: 500 },
      )
    }

    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing NEXT_PUBLIC_BASE_URL',
        },
        { status: 500 },
      )
    }

    if (!triptoBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing TRIPTO_BASE_URL',
        },
        { status: 500 },
      )
    }

    console.log(
      '🚀 ~ POST /api/tripto/payment ~ baseUrl:',
      baseUrl,
    )

    const client = new TriptoClient(apiKey)

    const totalAmount = amount + tipAmount
    const slug = `donacion-${campaignId}-${Date.now()}`
    // Find primary image
    const primaryImage = await db.campaignMedia.findFirst({
      where: { campaignId, isPrimary: true },
    })

    const imageUrl =
      primaryImage?.mediaUrl ||
      'https://pub-840a7677467645169a67fce420658392.r2.dev/minka-logo.png'

    // Metadata for webhook
    const metadata = {
      campaignId,
      donorId,
      amount: String(amount),
      tipAmount: String(tipAmount),
      message,
      isAnonymous: isAnonymous ? 'true' : 'false',
      notificationEnabled: notificationEnabled
        ? 'true'
        : 'false',
      paymentMethod: paymentMethod || 'card',
    }

    const payload = {
      slug,
      name: campaign.title,
      description: campaign.description || null,
      imageUrl,
      suggestedAmount: totalAmount * 100,
      submitType: 'pay' as const,
      afterPayment: {
        type: 'redirect' as const,
        redirectUrl: `${baseUrl}/donate/${campaignId}`,
      },
      campaign: slug || campaignId,
      metadata,
    }

    console.log(
      '[DEBUG][PAYLOAD_TO_TRIPTO]',
      JSON.stringify(payload, null, 2),
    )

    // Call Tripto
    const result = await client.createDonationLink(payload)

    console.log('[DEBUG][TRIPTO_RESPONSE]', result)

    if (!result.success || !result.url) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Tripto error',
        },
        { status: 500 },
      )
    }

    console.log(
      'Redirecting user to Tripto checkout:',
      result.url,
    )

    return NextResponse.json({
      success: true,
      url: result.url,
    })
  } catch (err: any) {
    console.error('❌ Error in /api/tripto/payment:', err)
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Server error',
      },
      { status: 500 },
    )
  }
}
