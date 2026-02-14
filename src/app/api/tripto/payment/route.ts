import { NextResponse } from 'next/server'
import { TriptoClient } from '@/lib/tripto/client'
import { db } from '@/lib/db'

async function getOrCreateAnonymousProfileId() {
  const existing = await db.profile.findFirst({
    where: {
      email: 'anonymous@minka.org',
      identityNumber: 'ANONYMOUS',
      name: 'Donante Anónimo',
    },
    select: { id: true },
  })

  if (existing?.id) return existing.id

  const created = await db.profile.create({
    data: {
      email: 'anonymous@minka.org',
      identityNumber: 'ANONYMOUS',
      name: 'Donante Anónimo',
      passwordHash: 'not-applicable',
      phone: '0000000000',
      birthDate: new Date(), // Add a default birthDate to fulfill schema
    },
    select: { id: true },
  })

  return created.id
}

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

    const donorProfileId =
      donorId ??
      (isAnonymous
        ? await getOrCreateAnonymousProfileId()
        : null)

    if (!donorProfileId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing donorId for non-anonymous donation',
        },
        { status: 400 },
      )
    }

    const totalAmount = Number(amount) + Number(tipAmount)

    const pendingDonation = await db.donation.create({
      data: {
        campaignId,
        donorId: donorProfileId,
        amount: Number(amount),
        tip_amount: Number(tipAmount),
        total_amount: totalAmount,
        paymentStatus: 'pending',
        paymentProvider: 'tripto',
        paymentMethod: 'credit_card' as any,
        isAnonymous: !!isAnonymous,
        notificationEnabled: !!notificationEnabled,
        message: message || null,
      },
      select: { id: true },
    })

    const slug = `donacion-${campaignId}-${pendingDonation.id}`

    const primaryImage = await db.campaignMedia.findFirst({
      where: { campaignId, isPrimary: true },
    })
    const imageUrl =
      primaryImage?.mediaUrl ||
      `${baseUrl}/assets/minka-logo.png`

    const metadata = {
      donationId: pendingDonation.id,
      campaignId,
      donorId: donorProfileId,
      amount: String(amount),
      tipAmount: String(tipAmount),
      message,
      isAnonymous: isAnonymous ? 'true' : 'false',
      notificationEnabled: notificationEnabled
        ? 'true'
        : 'false',
      paymentMethod: paymentMethod || 'card',
    }

    const client = new TriptoClient(apiKey)

    const payload = {
      slug,
      name: campaign.title,
      description: campaign.description || null,
      imageUrl,
      suggestedAmount: Math.round(totalAmount * 100),
      minAmount: Math.round(totalAmount * 100 - 1),
      maxAmount: Math.round(totalAmount * 100 + 1),
      submitType: 'pay' as const,
      afterPayment: {
        type: 'redirect' as const,
        redirectUrl: `${baseUrl}/donate/${campaignId}?donationId=${pendingDonation.id}`,
      },
      campaign: slug || campaignId,
      metadata,
    }

    const result = await client.createDonationLink(
      payload as any,
    )

    if (!result.success || !result.url) {
      await db.donation.update({
        where: { id: pendingDonation.id },
        data: { paymentStatus: 'failed' },
      })

      return NextResponse.json(
        {
          success: false,
          error: result.error ?? 'PAYMENT_PROVIDER_ERROR',
        },
        { status: 502 },
      )
    }

    await db.donation.update({
      where: { id: pendingDonation.id },
      data: { triptoCheckoutUrl: result.url },
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      donationId: pendingDonation.id,
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
