import { NextResponse } from 'next/server'

import { getAuthSession } from '@/lib/auth'
import { hashDonationClaimToken } from '@/lib/donations/claim-token'
import { prisma } from '@/lib/prisma'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ClaimableDonationRow = {
  id: string
  donor_id: string
  payment_status: string
  is_anonymous: boolean
  claim_token_hash: string | null
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = (await request
      .json()
      .catch(() => null)) as {
      donationId?: unknown
      claimToken?: unknown
    } | null

    const donationId =
      typeof body?.donationId === 'string'
        ? body.donationId
        : ''
    const claimToken =
      typeof body?.claimToken === 'string'
        ? body.claimToken
        : ''

    if (!UUID_REGEX.test(donationId) || !claimToken) {
      return NextResponse.json(
        { error: 'Invalid donation claim' },
        { status: 400 },
      )
    }

    const userProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 },
      )
    }

    const [donation] = await prisma.$queryRaw<
      ClaimableDonationRow[]
    >`
      select
        "id",
        "donor_id",
        "payment_status"::text as "payment_status",
        "is_anonymous",
        "claim_token_hash"
      from "donations"
      where "id" = ${donationId}::uuid
      limit 1
    `

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 },
      )
    }

    if (
      !donation.is_anonymous &&
      donation.donor_id === session.user.id
    ) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
      })
    }

    if (donation.payment_status !== 'completed') {
      return NextResponse.json(
        { error: 'Donation is not completed yet' },
        { status: 409 },
      )
    }

    if (
      !donation.is_anonymous ||
      !donation.claim_token_hash
    ) {
      return NextResponse.json(
        { error: 'Donation cannot be claimed' },
        { status: 409 },
      )
    }

    const claimTokenHash =
      hashDonationClaimToken(claimToken)

    if (claimTokenHash !== donation.claim_token_hash) {
      return NextResponse.json(
        { error: 'Invalid donation claim' },
        { status: 403 },
      )
    }

    const updated = await prisma.$executeRaw`
      update "donations"
      set
        "donor_id" = ${session.user.id}::uuid,
        "is_anonymous" = false,
        "claim_token_hash" = null,
        "claimed_at" = now(),
        "updated_at" = now()
      where "id" = ${donationId}::uuid
        and "payment_status" = 'completed'::"PaymentStatus"
        and "is_anonymous" = true
        and "claim_token_hash" = ${claimTokenHash}
    `

    if (updated === 0) {
      return NextResponse.json(
        { error: 'Donation could not be claimed' },
        { status: 409 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Donation claim error:', error)
    return NextResponse.json(
      { error: 'Failed to claim donation' },
      { status: 500 },
    )
  }
}
