import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { TriptoWebhookEvent } from '@/lib/tripto/types'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: Request) {
  try {
    const secret = process.env.TRIPTO_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 500 },
      )
    }

    // Read raw body as text
    const rawBody = await req.text()

    // Read Tripto signature
    const signature = req.headers.get('X-Webhook-Signature')
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 },
      )
    }

    // Compute HMAC
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    if (expected !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 },
      )
    }

    // Safe to parse now
    const event = JSON.parse(rawBody) as TriptoWebhookEvent

    // ============================
    // PAYMENT COMPLETED
    // ============================
    if (event.event === 'payment.completed') {
      const total = event.amount / 100

      const metadata = event.metadata || {}
      const campaignId = metadata.campaignId
      const donorId = metadata.donorId
      const amount = Number(metadata.amount || '0')
      const tipAmount = Number(metadata.tipAmount || '0')
      const message = metadata.message || null
      const isAnonymous = metadata.isAnonymous === 'true'
      const notificationEnabled =
        metadata.notificationEnabled === 'true'

      // Avoid duplicate insert if Tripto retries webhook
      const exists = await db.donation.findFirst({
        where: { triptoPaymentId: event.paymentId },
      })

      if (!exists) {
        await db.donation.create({
          data: {
            campaignId,
            donorId,
            amount,
            tipAmount,
            totalAmount: total,
            currency: event.currency,
            paymentStatus: 'completed',
            paymentProvider: 'tripto',
            paymentMethod: 'credit_card',
            message,
            isAnonymous,
            notificationEnabled,
            triptoPaymentId: event.paymentId,
            triptoSessionId: event.stripeSessionId || null,
            triptoCheckoutUrl: null,
          },
        })

        // Update campaign counters
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            collectedAmount: { increment: amount },
            donorCount: { increment: 1 },
          },
        })
      }

      return NextResponse.json(
        { received: true },
        { status: 200 },
      )
    }

    // ============================
    // PAYMENT FAILED
    // ============================
    if (event.event === 'payment.failed') {
      const metadata = event.metadata || {}
      const campaignId = metadata.campaignId
      const donorId = metadata.donorId

      await db.paymentLog.create({
        data: {
          paymentProvider: 'tripto',
          status: 'failed',
          paymentId: event.paymentId,
          amount: event.amount / 100,
          currency: event.currency,
          metadata: JSON.stringify(metadata),
          campaignId,
          donorId,
        },
      })

      return NextResponse.json(
        { received: true },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { received: true },
      { status: 200 },
    )
  } catch (err: any) {
    console.error('Tripto webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 },
    )
  }
}
