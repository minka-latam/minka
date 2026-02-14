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

function parseTV1Signature(sig: string) {
  // "t=123,v1=abcdef..."
  const parts = sig.split(',').map((p) => p.trim())
  const out: Record<string, string> = {}
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (k && v) out[k] = v
  }
  return { t: out.t, v1: out.v1 }
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ab = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ab.length !== bb.length) return false
    return crypto.timingSafeEqual(ab, bb)
  } catch {
    return false
  }
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

    // Tripto now sends Stripe-style signature header: "t=...,v1=..."
    const signatureHeader =
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-signature')

    if (!signatureHeader) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 },
      )
    }

    // IMPORTANT: verify signature against the RAW body (not re-serialized JSON)
    const rawBody = await req.text()

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 },
      )
    }

    let expectedSignature = ''
    let receivedSignature = ''

    // New format: "t=...,v1=..."
    if (
      signatureHeader.includes('t=') &&
      signatureHeader.includes('v1=')
    ) {
      const { t, v1 } = parseTV1Signature(signatureHeader)
      if (!t || !v1) {
        return NextResponse.json(
          { error: 'Bad signature format' },
          { status: 400 },
        )
      }

      expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${t}.${rawBody}`)
        .digest('hex')

      receivedSignature = v1
    } else {
      // Legacy fallback: hex(HMAC(secret, rawBody))
      expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      receivedSignature = signatureHeader
    }

    if (
      !timingSafeEqualHex(
        expectedSignature,
        receivedSignature,
      )
    ) {
      console.error('[TRIPTO][WEBHOOK] invalid signature', {
        received: receivedSignature?.slice(0, 12),
        expected: expectedSignature.slice(0, 12),
        webhookEvent: req.headers.get('x-webhook-event'),
        webhookId: req.headers.get('x-webhook-id'),
      })

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const event =
      req.headers.get('x-webhook-event') || body?.event
    const data = body?.data

    console.log('[TRIPTO][WEBHOOK] event ok', {
      event,
      paymentId: data?.paymentId,
    })

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
