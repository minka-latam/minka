import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const donationId = url.searchParams.get('donationId')

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donationId' },
        { status: 400 },
      )
    }

    const donation = await db.donation.findUnique({
      where: { id: donationId },
      select: {
        id: true,
        paymentStatus: true,
        paymentProvider: true,
        paymentMethod: true,
        amount: true,
        tip_amount: true,
        total_amount: true,
        currency: true,
        updatedAt: true,
        triptoPaymentId: true,
      },
    })

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      donation: {
        ...donation,
        // normaliza decimals si Prisma devuelve Decimal/string
        amount: Number(donation.amount),
        tip_amount:
          donation.tip_amount == null
            ? null
            : Number(donation.tip_amount),
        total_amount:
          donation.total_amount == null
            ? null
            : Number(donation.total_amount),
      },
    })
  } catch (err) {
    console.error('[DONATION_STATUS][ERROR]', err)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const donationId = body?.donationId as
      | string
      | undefined

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: 'Missing donationId' },
        { status: 400 },
      )
    }

    // Mark only pending Tripto-card donations as failed (never downgrade completed)
    const result = await db.donation.updateMany({
      where: {
        id: donationId,
        paymentStatus: PaymentStatus.pending,
        paymentProvider: 'tripto',
        // optional extra safety:
        paymentMethod: 'credit_card',
      },
      data: {
        paymentStatus: PaymentStatus.failed,
      },
    })

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    })
  } catch (err) {
    console.error('[DONATION_STATUS][POST]', err)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 },
    )
  }
}
