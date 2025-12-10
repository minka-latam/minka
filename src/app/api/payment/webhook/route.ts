import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { TriptoWebhookEvent } from '@/lib/tripto/types'

export const config = {
  api: { bodyParser: false },
}

export async function POST(req: Request) {
  try {
    const secret = process.env.TRIPTO_WEBHOOK_SECRET
    if (!secret)
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 500 },
      )

    const rawBody = await req.text()
    const signature = req.headers.get('X-Webhook-Signature')
    if (!signature)
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 },
      )

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

    const event = JSON.parse(rawBody) as TriptoWebhookEvent

    if (event.event === 'payment.completed') {
      const metadata = event.metadata || {}
      const prismaPaymentMethod =
        metadata.paymentMethod === 'card'
          ? 'credit_card'
          : metadata.paymentMethod

      const exists = await db.donation.findFirst({
        where: { triptoPaymentId: event.paymentId },
      })

      if (!exists) {
        await db.donation.create({
          data: {
            campaignId: metadata.campaignId,
            donorId: metadata.donorId,
            amount: Number(metadata.amount || 0),
            tipAmount: Number(metadata.tipAmount || 0),
            totalAmount: event.amount / 100,
            currency: event.currency,
            paymentStatus: 'completed',
            paymentProvider: 'tripto',
            paymentMethod: prismaPaymentMethod as any,
            isAnonymous: metadata.isAnonymous === 'true',
            notificationEnabled:
              metadata.notificationEnabled === 'true',
            message: metadata.message || null,
            triptoPaymentId: event.paymentId,
            triptoSessionId: event.stripeSessionId || null,
            triptoCheckoutUrl: null,
          },
        })

        await db.campaign.update({
          where: { id: metadata.campaignId },
          data: {
            collectedAmount: {
              increment: Number(metadata.amount || 0),
            },
            donorCount: { increment: 1 },
          },
        })
      }

      return NextResponse.json(
        { received: true },
        { status: 200 },
      )
    }

    if (event.event === 'payment.failed') {
      const metadata = event.metadata || {}

      await db.paymentLog.create({
        data: {
          paymentProvider: 'tripto',
          status: 'failed',
          paymentId: event.paymentId,
          amount: event.amount / 100,
          currency: event.currency,
          metadata: JSON.stringify(metadata),
          campaignId: metadata.campaignId,
          donorId: metadata.donorId,
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
  } catch (err) {
    console.error('Tripto webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 },
    )
  }
}
