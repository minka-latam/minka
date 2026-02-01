import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client'

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.TRIPTO_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Missing TRIPTO_WEBHOOK_SECRET' },
        { status: 500 },
      )
    }
    console.log('[TRIPTO][WEBHOOK] hit', {
      hasSig: !!req.headers.get('x-signature'),
      ua: req.headers.get('user-agent'),
    })

    const signature = req.headers.get('x-signature')
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing X-Signature' },
        { status: 400 },
      )
    }

    // Tripto spec: signature is computed on JSON.stringify(req.body)
    const body = await req.json()
    const payload = JSON.stringify(body)

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    console.error('[TRIPTO][WEBHOOK] invalid signature', {
      received: signature?.slice(0, 12),
      expected: expectedSignature.slice(0, 12),
      event: body?.event,
      paymentId: body?.data?.paymentId,
      donationId: body?.data?.metadata?.donationId,
    })

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const event = body?.event
    const data = body?.data

    console.log('[TRIPTO][WEBHOOK] event', body, data)

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 },
      )
    }

    const metadata: Record<string, string> =
      data.metadata || {}

    const donationId = metadata.donationId || null
    const campaignId = metadata.campaignId || null
    const donorId = metadata.donorId || null

    const paymentId = data.paymentId
      ? String(data.paymentId)
      : null
    const currency = String(data.currency || 'BOB')

    // Tripto amount comes in cents
    const providerTotalAmount =
      toNumber(data.amount, 0) / 100

    // Amount breakdown (stored primarily in Donation; also persisted in PaymentLog.metadata)
    const baseAmount = toNumber(metadata.amount, 0)
    const tipAmount = toNumber(metadata.tipAmount, 0)
    const computedTotal = baseAmount + tipAmount

    const isCompletedEvent = event === 'payment.completed'
    const isFailedEvent = event === 'payment.failed'

    if (!isCompletedEvent && !isFailedEvent) {
      return NextResponse.json(
        { received: true },
        { status: 200 },
      )
    }

    await db.$transaction(async (tx) => {
      // Idempotent PaymentLog handling (one row per paymentprovider + paymentid)
      const ensurePaymentLog = async (
        incomingStatus: 'completed' | 'failed',
      ) => {
        if (!paymentId) return

        // Look up any existing log for this payment id (regardless of status)
        const existing = await tx.paymentLog.findFirst({
          where: {
            paymentprovider: PaymentProvider.tripto,
            paymentid: paymentId,
          },
          select: { id: true, status: true },
        })

        // If completed already exists, never downgrade or add a second row
        if (existing?.status === 'completed') {
          return
        }

        const metadataJson = JSON.stringify({
          event,
          donationId,
          campaignId,
          donorId,
          paymentId,
          currency,
          amount_base: baseAmount,
          tip_amount: tipAmount,
          total_amount: computedTotal,
          provider_total_amount: providerTotalAmount,
          provider_data: data,
          provider_metadata: metadata,
        })

        // If a failed log exists and we now get completed, upgrade it
        if (
          existing &&
          existing.status === 'failed' &&
          incomingStatus === 'completed'
        ) {
          await tx.paymentLog.update({
            where: { id: existing.id },
            data: {
              status: 'completed',
              amount: providerTotalAmount,
              currency,
              paymentmethod: PaymentMethod.credit_card,
              campaignid: campaignId,
              donorid: donorId,
              metadata: metadataJson,
            },
          })
          return
        }

        // If a failed log exists and we receive failed again, do nothing
        if (
          existing &&
          existing.status === 'failed' &&
          incomingStatus === 'failed'
        ) {
          return
        }

        // Otherwise create the first log row for this payment id
        await tx.paymentLog.create({
          data: {
            paymentprovider: PaymentProvider.tripto,
            paymentmethod: PaymentMethod.credit_card,
            paymentid: paymentId,
            status: incomingStatus,
            amount: providerTotalAmount,
            currency,
            campaignid: campaignId,
            donorid: donorId,
            metadata: metadataJson,
          },
        })
      }

      // If donationId is missing, record PaymentLog (if possible) and exit.
      if (!donationId) {
        await ensurePaymentLog(
          isCompletedEvent ? 'completed' : 'failed',
        )
        return
      }

      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      })

      // If donation row is missing, record PaymentLog and exit.
      // This avoids webhook retries causing duplicates; investigate via logs/metadata.
      if (!donation) {
        await ensurePaymentLog(
          isCompletedEvent ? 'completed' : 'failed',
        )
        return
      }

      if (isCompletedEvent) {
        // Idempotency: only first transition to completed should increment campaign.
        if (
          donation.paymentStatus !== PaymentStatus.completed
        ) {
          await tx.donation.update({
            where: { id: donation.id },
            data: {
              paymentStatus: PaymentStatus.completed,
              paymentProvider: 'tripto',
              paymentMethod: PaymentMethod.credit_card,
              currency,
              triptoPaymentId: paymentId,
              triptoSessionId: data.stripeSessionId
                ? String(data.stripeSessionId)
                : null,
              // Persist breakdown if not already present on the pending row
              tip_amount:
                donation.tip_amount ?? (tipAmount || null),
              total_amount:
                donation.total_amount ??
                (providerTotalAmount || computedTotal),
            },
          })

          // Campaign totals: base amount only (tips excluded)
          const updatedCampaign = await tx.campaign.update({
            where: { id: donation.campaignId },
            data: {
              collectedAmount: {
                increment: donation.amount,
              },
              donorCount: { increment: 1 },
            },
            select: {
              collectedAmount: true,
              goalAmount: true,
            },
          })

          // Recompute percentageFunded after collectedAmount changes
          const goal = Number(updatedCampaign.goalAmount)
          const collected = Number(
            updatedCampaign.collectedAmount,
          )
          const percentageFunded =
            goal > 0 ? (collected / goal) * 100 : 0

          await tx.campaign.update({
            where: { id: donation.campaignId },
            data: {
              percentageFunded,
            },
          })
        }

        await ensurePaymentLog('completed')
        return
      }

      // payment.failed
      // Do not downgrade a completed donation.
      if (
        donation.paymentStatus !== PaymentStatus.completed
      ) {
        await tx.donation.update({
          where: { id: donation.id },
          data: {
            paymentStatus: PaymentStatus.failed,
            paymentProvider: 'tripto',
            paymentMethod: PaymentMethod.credit_card,
            currency,
            triptoPaymentId: paymentId,
            triptoSessionId: data.stripeSessionId
              ? String(data.stripeSessionId)
              : null,
            tip_amount:
              donation.tip_amount ?? (tipAmount || null),
            total_amount:
              donation.total_amount ??
              (providerTotalAmount || computedTotal),
          },
        })
      }

      await ensurePaymentLog('failed')
    })

    return NextResponse.json(
      { received: true },
      { status: 200 },
    )
  } catch (err) {
    console.error('[TRIPTO][WEBHOOK_ERROR]', err)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 },
    )
  }
}
