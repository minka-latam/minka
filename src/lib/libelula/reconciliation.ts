import { prisma } from '@/lib/prisma';
import { libelulaClient } from './client';
import { completeLibelulaPayment, parsePaymentDate } from './payment-completion';
import { validateDebt } from './validation';

export async function refreshLibelulaDonation(donationId: string, source: 'status' | 'callback' | 'reconcile', transactionId?: string) {
  const donation = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!donation || donation.paymentProvider !== 'libelula' || donation.paymentStatus !== 'pending') return;
  if (transactionId && donation.providerPaymentId && donation.providerPaymentId !== transactionId) throw new Error('PAYMENT_ID_MISMATCH');
  const now = new Date();
  // Across server instances, one lookup per donation per 15 seconds; callbacks share this throttle.
  const lease = await prisma.donation.updateMany({ where: {
    id: donation.id, paymentStatus: 'pending',
    OR: [{ providerNextCheckAt: null }, { providerNextCheckAt: { lte: now } }],
  }, data: { providerNextCheckAt: new Date(now.getTime() + (source === 'reconcile' ? 15 * 60000 : 15000)) } });
  if (!lease.count) return;
  const debt = await libelulaClient.lookup(donation.id);
  if (!debt) return;
  if (!validateDebt(donation, debt)) throw new Error('PAYMENT_DETAILS_MISMATCH');
  await prisma.donation.update({ where: { id: donation.id }, data: {
    providerCheckoutUrl: debt.url_pasarela_pagos,
    providerSessionExpiresAt: parsePaymentDate(debt.fecha_vencimiento),
    // A recovered checkout lookup has no transaction ID. The authenticated
    // callback does, so preserve it once the debt has been independently
    // matched to this Minka donation.
    ...(transactionId && !donation.providerPaymentId
      ? { providerPaymentId: transactionId }
      : {}),
  } });
  if (debt.pagado && !debt.pago_anulado) return completeLibelulaPayment(donation, debt, source);
  // Expired debts remain reconcilable through the paid-range sweep. Do not infer failure from browser timeouts.
  if (debt.deuda_expirada) await prisma.donation.updateMany({
    where: { id: donation.id, paymentStatus: 'pending' }, data: { paymentStatus: 'cancelled', providerNextCheckAt: null },
  });
}

function boliviaTimestamp(date: Date) {
  return new Date(date.getTime() - 4 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
}

export async function reconcileLibelulaPayments() {
  const due = await prisma.donation.findMany({
    where: { paymentProvider: 'libelula', paymentStatus: 'pending', OR: [{ providerNextCheckAt: null }, { providerNextCheckAt: { lte: new Date() } }] },
    orderBy: [{ providerNextCheckAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }], take: 10, select: { id: true },
  });
  const result = { checked: due.length, completed: 0, errors: 0, rangePayments: 0 };
  const queue = [...due];
  await Promise.all(Array.from({ length: 2 }, async () => {
    for (let donation = queue.shift(); donation; donation = queue.shift()) {
      try { if (await refreshLibelulaDonation(donation.id, 'reconcile')) result.completed++; }
      catch (error) { result.errors++; console.error('[LIBELULA][RECONCILE]', donation.id, error instanceof Error ? error.message : 'LOOKUP_FAILED'); }
    }
  }));
  const earliest = await prisma.donation.findFirst({ where: { paymentProvider: 'libelula' }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  if (!earliest) return result;
  const cursor = await prisma.paymentReconciliationCursor.upsert({ where: { provider: 'libelula' }, create: { provider: 'libelula', through: earliest.createdAt }, update: {} });
  const from = new Date(cursor.through.getTime() - 24 * 3600000);
  const to = new Date(Math.min(Date.now(), cursor.through.getTime() + 24 * 3600000));
  const payments = await libelulaClient.payments(boliviaTimestamp(from), boliviaTimestamp(to));
  let rangeFailed = false;
  for (const payment of payments) {
    const donation = await prisma.donation.findFirst({ where: { paymentProvider: 'libelula', providerReference: payment.identificador } });
    if (!donation || donation.paymentStatus === 'completed') continue;
    try {
      if (donation.providerPaymentId && donation.providerPaymentId !== payment.id_transaccion) throw new Error('PAYMENT_ID_MISMATCH');
      const debt = await libelulaClient.lookup(donation.id);
      if (!debt) throw new Error('PAID_DEBT_NOT_FOUND');
      if (await completeLibelulaPayment(donation, debt, 'reconcile-range')) result.completed++;
      if (!donation.providerPaymentId && validateDebt(donation, debt)) await prisma.donation.update({ where: { id: donation.id }, data: { providerPaymentId: payment.id_transaccion } });
      result.rangePayments++;
    } catch (error) {
      rangeFailed = true; result.errors++;
      console.error('[LIBELULA][RANGE_REVIEW]', donation.id, error instanceof Error ? error.message : 'LOOKUP_FAILED');
    }
  }
  if (!rangeFailed) await prisma.paymentReconciliationCursor.updateMany({ where: { provider: 'libelula', through: cursor.through }, data: { through: to } });
  return result;
}
