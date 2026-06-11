import { NextResponse } from 'next/server'
import { TriptoClient } from '@/lib/tripto/client'
import { prisma as db } from '@/lib/prisma'
import { getOrCreateCampaignAnonymousProfileId } from '@/lib/donations/anonymous-donor'
import {
  generateDonationClaimToken,
  hashDonationClaimToken,
} from '@/lib/donations/claim-token'
import { canReceiveCampaignPayments } from '@/lib/campaigns/visibility'
import { parseDonationCreateBody } from '@/lib/api/donation-dto'
import { resolveTriptoCardCurrency } from '@/lib/payments/provider-validation'
import { addMoney, roundMoney } from '@/lib/money'
import {
  convertUsdToBob,
  getUsdToBobExchangeRate,
} from '@/lib/platform-settings'

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
      currency,
    } = parseDonationCreateBody(body)

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

    if (!canReceiveCampaignPayments(campaign)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign is not accepting donations',
        },
        { status: 400 },
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

    const donorProfileId = isAnonymous
      ? await getOrCreateCampaignAnonymousProfileId(campaignId)
      : donorId

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

    const rawDonationAmountUsd = Number(amount)
    const rawTipAmountUsd = Number(tipAmount)

    if (
      !Number.isFinite(rawDonationAmountUsd) ||
      rawDonationAmountUsd <= 0 ||
      !Number.isFinite(rawTipAmountUsd) ||
      rawTipAmountUsd < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid donation amount',
        },
        { status: 400 },
      )
    }

    const donationAmountUsd = roundMoney(rawDonationAmountUsd)
    const tipAmountUsd = roundMoney(rawTipAmountUsd)
    const totalAmountUsd = addMoney(
      donationAmountUsd,
      tipAmountUsd,
    )
    const expectedAmountMinor = Math.round(totalAmountUsd * 100)
    const cardCurrency = resolveTriptoCardCurrency(currency)
    const usdToBobExchangeRate = await getUsdToBobExchangeRate()
    const donationAmountBob = convertUsdToBob(
      donationAmountUsd,
      usdToBobExchangeRate,
    )
    const tipAmountBob = convertUsdToBob(
      tipAmountUsd,
      usdToBobExchangeRate,
    )
    const totalAmountBob = addMoney(
      donationAmountBob,
      tipAmountBob,
    )
    const claimToken = isAnonymous
      ? generateDonationClaimToken()
      : null
    const claimTokenHash = claimToken
      ? hashDonationClaimToken(claimToken)
      : null

    const pendingDonation = await db.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          campaignId,
          donorId: donorProfileId,
          amount: donationAmountBob,
          tip_amount: tipAmountBob,
          total_amount: totalAmountBob,
          currency: 'BOB',
          paymentStatus: 'pending',
          paymentProvider: 'tripto',
          paymentMethod: 'credit_card' as any,
          isAnonymous: !!isAnonymous,
          notificationEnabled: !!notificationEnabled,
          message: message || null,
        },
        select: { id: true },
      })

      await tx.$executeRaw`
        update "donations"
        set
          "exchange_rate" = ${usdToBobExchangeRate},
          "provider_amount" = ${donationAmountUsd},
          "provider_tip_amount" = ${tipAmountUsd},
          "provider_total_amount" = ${totalAmountUsd},
          "provider_currency" = ${cardCurrency},
          "claim_token_hash" = ${claimTokenHash}
        where "id" = ${donation.id}::uuid
      `

      return donation
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
      amount: String(donationAmountUsd),
      tipAmount: String(tipAmountUsd),
      expectedTotalAmount: String(totalAmountUsd),
      expectedAmountMinor: String(expectedAmountMinor),
      expectedCurrency: cardCurrency,
      exchangeRate: String(usdToBobExchangeRate),
      storedAmountBob: String(donationAmountBob),
      storedTipAmountBob: String(tipAmountBob),
      storedTotalAmountBob: String(totalAmountBob),
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
      suggestedAmount: expectedAmountMinor,
      minAmount: expectedAmountMinor - 1,
      maxAmount: expectedAmountMinor + 1,
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
      claimToken,
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
