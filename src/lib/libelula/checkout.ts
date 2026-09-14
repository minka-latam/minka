import { createHash, createHmac, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { canReceiveCampaignPayments } from '@/lib/campaigns/visibility';
import { getOrCreateCampaignAnonymousProfileId } from '@/lib/donations/anonymous-donor';
import { hashDonationClaimToken } from '@/lib/donations/claim-token';
import { addMoney } from '@/lib/money';
import { convertUsdToBob, getUsdToBobExchangeRate } from '@/lib/platform-settings';
import { cardInputSchema, validateDebt } from './validation';
import { libelulaClient, LibelulaError } from './client';

export async function createCardCheckout(body: unknown) {
  const input = cardInputSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ success: false, error: 'INVALID_PAYMENT_INPUT' }, { status: 400 });
  const value = input.data;
  const secret = process.env.LIBELULA_CHECKOUT_SECRET;
  const origin = process.env.LIBELULA_MERCHANT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NEXT_PUBLIC_CARD_PAYMENTS_ENABLED !== 'true' || !secret || !origin || !process.env.LIBELULA_APP_KEY) {
    return NextResponse.json({ success: false, error: 'CARD_PAYMENTS_UNAVAILABLE' }, { status: 503 });
  }
  try {
    const session = value.clientAuthState === 'authenticated' ? await getAuthSession() : null;
    const userId = value.clientAuthState === 'authenticated' ? session?.user?.id : null;
    if (value.clientAuthState === 'authenticated' && !userId) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    const campaign = await prisma.campaign.findUnique({ where: { id: value.campaignId } });
    if (!campaign || !canReceiveCampaignPayments(campaign)) return NextResponse.json({ success: false, error: 'CAMPAIGN_UNAVAILABLE' }, { status: 400 });
    const fingerprint = createHash('sha256').update(JSON.stringify({ ...value, userId: userId ?? null })).digest('hex');
    const claimToken = !userId ? createHmac('sha256', secret).update(value.idempotencyKey).digest('hex') : null;
    let donation = await prisma.donation.findUnique({ where: { checkoutKey: value.idempotencyKey } });
    if (!donation) {
      const id = randomUUID();
      const rate = value.currency === 'USD' ? await getUsdToBobExchangeRate() : 1;
      const bobAmount = convertUsdToBob(value.amount, rate);
      const bobTip = convertUsdToBob(value.tipAmount, rate);
      const donorId = userId || await getOrCreateCampaignAnonymousProfileId(value.campaignId);
      try {
        donation = await prisma.donation.create({ data: {
          id, campaignId: campaign.id, donorId, paymentProvider: 'libelula', paymentMethod: 'credit_card',
          paymentStatus: 'pending', amount: bobAmount, tip_amount: bobTip, total_amount: addMoney(bobAmount, bobTip), currency: 'BOB',
          providerAmount: value.amount, providerTipAmount: value.tipAmount, providerTotalAmount: addMoney(value.amount, value.tipAmount),
          providerCurrency: value.currency, exchangeRate: rate, providerReference: id,
          checkoutKey: value.idempotencyKey, checkoutFingerprint: fingerprint, providerNextCheckAt: new Date(),
          isAnonymous: !userId || value.isAnonymous, notificationEnabled: value.notificationEnabled,
          message: value.message || null, predefinedAmount: !value.customAmount,
          claimTokenHash: claimToken ? hashDonationClaimToken(claimToken) : null,
        } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        donation = await prisma.donation.findUniqueOrThrow({ where: { checkoutKey: value.idempotencyKey } });
      }
    }
    if (donation.checkoutFingerprint !== fingerprint) return NextResponse.json({ success: false, error: 'CHECKOUT_CHANGED' }, { status: 409 });
    const response = (url: string) => NextResponse.json({ success: true, url, donationId: donation.id, claimToken });
    if (donation.providerCheckoutUrl && donation.paymentStatus === 'pending') return response(donation.providerCheckoutUrl);
    if (donation.paymentStatus !== 'pending') return NextResponse.json({ success: false, error: 'CHECKOUT_FINISHED', donationId: donation.id, claimToken }, { status: 409 });
    // A database lease prevents concurrent registration; a crashed request can recover after 30 seconds.
    const now = new Date();
    const lease = await prisma.donation.updateMany({ where: {
      id: donation.id, paymentStatus: 'pending', providerCheckoutUrl: null,
      OR: [{ providerRegistrationStartedAt: null }, { providerRegistrationStartedAt: { lt: new Date(now.getTime() - 30000) } }],
    }, data: { providerRegistrationStartedAt: now } });
    if (!lease.count) return NextResponse.json({ success: false, error: 'CHECKOUT_IN_PROGRESS', donationId: donation.id }, { status: 409 });
    const existing = await libelulaClient.lookup(donation.id);
    if (existing) {
      if (!validateDebt(donation, existing)) throw new LibelulaError('PAYMENT_PROVIDER_INVALID_RESPONSE');
      await prisma.donation.update({ where: { id: donation.id }, data: { providerCheckoutUrl: existing.url_pasarela_pagos } });
      return response(existing.url_pasarela_pagos);
    }
    const callback = new URL('/api/libelula/callback', origin);
    callback.searchParams.set('donationId', donation.id);
    const returnUrl = new URL(`/donate/${campaign.id}`, origin);
    returnUrl.searchParams.set('donationId', donation.id);
    const result = await libelulaClient.register({
      identificador: donation.id, email_cliente: value.paymentEmail,
      descripcion: `Aporte a la campaña: ${campaign.title}`.slice(0, 250), moneda: value.currency, emite_factura: false,
      callback_url: callback.href, url_retorno: returnUrl.href,
      lineas_detalle_deuda: [
        { concepto: `Aporte a la campaña: ${campaign.title}`.slice(0, 250), cantidad: 1, costo_unitario: value.amount },
        ...(value.tipAmount > 0 ? [{ concepto: 'Aporte adicional a Minka', cantidad: 1, costo_unitario: value.tipAmount }] : []),
      ],
    });
    await prisma.donation.update({ where: { id: donation.id }, data: { providerPaymentId: result.paymentId, providerCheckoutUrl: result.url } });
    return response(result.url);
  } catch (error) {
    const code = error instanceof LibelulaError ? error.code : 'PAYMENT_PROVIDER_UNAVAILABLE';
    console.error('[LIBELULA][CHECKOUT]', code);
    return NextResponse.json({ success: false, error: code }, { status: 502 });
  }
}
