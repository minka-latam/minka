import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

// Never runs against the application's configured Supabase database.
const testUrl = process.env.TEST_DATABASE_URL;
test('checkout, callbacks, concurrent completion and reconciliation on isolated PostgreSQL', { skip: !testUrl }, async t => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(testUrl!).hostname));
  process.env.DATABASE_URL = testUrl;
  process.env.LIBELULA_CHECKOUT_SECRET = 'isolated-integration-test-secret';
  process.env.LIBELULA_APP_KEY = 'isolated-test-key';
  process.env.LIBELULA_MERCHANT_BASE_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_CARD_PAYMENTS_ENABLED = 'true';
  const { prisma } = await import('@/lib/prisma');
  const { libelulaClient } = await import('./client');
  const { createCardCheckout } = await import('./checkout');
  const { completeLibelulaPayment } = await import('./payment-completion');
  const { refreshLibelulaDonation, reconcileLibelulaPayments } = await import('./reconciliation');
  const { GET: callback } = await import('@/app/api/libelula/callback/route');
  const { GET: status } = await import('@/app/api/donation/status/route');
  const profile = await prisma.profile.create({ data: { name: 'Isolated test', email: `${randomUUID()}@example.com`, passwordHash: '' } });
  const campaign = await prisma.campaign.create({ data: { title: 'Isolated payment test', subtitle: '', description: '', beneficiariesDescription: '', category: 'educacion', goalAmount: 1000, percentageFunded: 0, endDate: new Date('2030-01-01'), organizerId: profile.id, campaignStatus: 'active', location: 'la_paz' } });
  await prisma.platformSettings.update({ where: { id: 'default' }, data: { updatedById: profile.id, usdToBobExchangeRate: 7 } });
  const debts = new Map<string, any>();
  let registrations = 0;
  let timeoutOnce = false;
  t.mock.method(libelulaClient, 'lookup', async (id: string) => debts.get(id) ?? null);
  t.mock.method(libelulaClient, 'register', async (payload: any) => {
    registrations++;
    const url = `https://pagos.libelula.bo/?id=${randomUUID()}`;
    debts.set(payload.identificador, { identificador: payload.identificador, valor_total: payload.lineas_detalle_deuda.reduce((sum: number, line: any) => sum + line.costo_unitario, 0), moneda: payload.moneda, pagado: false, url_pasarela_pagos: url, email_cliente: payload.email_cliente });
    if (timeoutOnce) { timeoutOnce = false; throw new Error('simulated network timeout after registration'); }
    return { paymentId: randomUUID(), url };
  });
  t.mock.method(libelulaClient, 'payments', async () => []);
  const input = { campaignId: campaign.id, amount: 10, tipAmount: 2, currency: 'BOB', paymentEmail: 'private@example.com', clientAuthState: 'anonymous', idempotencyKey: randomUUID() };
  try {
    const responses = await Promise.all([createCardCheckout(input), createCardCheckout(input)]);
    const successful = responses.find(response => response.status === 200)!;
    assert.ok(successful);
    const first = await successful.json();
    const repeated = await (await createCardCheckout(input)).json();
    assert.equal(repeated.donationId, first.donationId);
    assert.equal(repeated.claimToken, first.claimToken);
    assert.equal(registrations, 1);
    assert.equal((await createCardCheckout({ ...input, amount: 11 })).status, 409);
    const donation = await prisma.donation.findUniqueOrThrow({ where: { id: first.donationId } });
    assert.equal(Number(donation.amount), 10);
    assert.equal(Number(donation.tip_amount), 2);
    assert.equal(Number(donation.providerTotalAmount), 12);
    assert.equal(donation.isAnonymous, true);
    assert.equal((await callback(new Request(`http://localhost/api/libelula/callback?donationId=${donation.id}&transaction_id=${randomUUID()}`))).status, 503);
    await prisma.donation.update({ where: { id: donation.id }, data: { providerNextCheckAt: new Date(0) } });
    await callback(new Request(`http://localhost/api/libelula/callback?donationId=${donation.id}&transaction_id=${donation.providerPaymentId}`));
    assert.equal((await prisma.donation.findUniqueOrThrow({ where: { id: donation.id } })).paymentStatus, 'pending');
    const debt = { ...debts.get(donation.id), pagado: true, fecha_pago: '2026-09-08 12:00:00' };
    await assert.rejects(() => completeLibelulaPayment(donation, { ...debt, valor_total: 999 }, 'test'), /PAYMENT_DETAILS_MISMATCH/);
    await assert.rejects(() => completeLibelulaPayment(donation, { ...debt, moneda: 'USD' }, 'test'), /PAYMENT_DETAILS_MISMATCH/);
    const outcomes = await Promise.all(Array.from({ length: 4 }, () => completeLibelulaPayment(donation, debt, 'test')));
    assert.equal(outcomes.filter(Boolean).length, 1);
    const totals = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    assert.equal(Number(totals.collectedAmount), 10);
    assert.equal(Number(totals.tipCollected), 2);
    assert.equal(totals.donorCount, 1);
    assert.equal(await prisma.paymentLog.count({ where: { paymentid: donation.id } }), 1);
    assert.equal(await prisma.notification.count({ where: { donationId: donation.id } }), 1);
    const publicStatus = await (await status(new Request(`http://localhost/api/donation/status?donationId=${donation.id}`))).json();
    assert.equal(publicStatus.donation.providerCurrency, 'BOB');
    assert.equal(publicStatus.donation.providerAmount, 10);
    assert.equal(JSON.stringify(publicStatus).includes('private@example.com'), false);
    assert.equal(JSON.stringify(publicStatus).includes('checkoutKey'), false);

    timeoutOnce = true;
    const bobInput = { ...input, idempotencyKey: randomUUID() };
    assert.equal((await createCardCheckout(bobInput)).status, 502);
    const unknown = await prisma.donation.findUniqueOrThrow({ where: { checkoutKey: bobInput.idempotencyKey } });
    assert.equal(unknown.paymentStatus, 'pending');
    await prisma.donation.update({ where: { id: unknown.id }, data: { providerRegistrationStartedAt: new Date(0) } });
    const recovered = await (await createCardCheckout(bobInput)).json();
    assert.equal(recovered.donationId, unknown.id);
    assert.equal(registrations, 2);
    debts.set(unknown.id, { ...debts.get(unknown.id), pagado: true });
    await prisma.donation.update({ where: { id: unknown.id }, data: { providerNextCheckAt: new Date(0) } });
    await refreshLibelulaDonation(unknown.id, 'status');
    assert.equal((await prisma.donation.findUniqueOrThrow({ where: { id: unknown.id } })).paymentStatus, 'completed');
    const thirdInput = { ...input, idempotencyKey: randomUUID() };
    const third = await (await createCardCheckout(thirdInput)).json();
    debts.set(third.donationId, { ...debts.get(third.donationId), pagado: true });
    await prisma.donation.update({ where: { id: third.donationId }, data: { providerNextCheckAt: new Date(0) } });
    const sweep = await reconcileLibelulaPayments();
    assert.equal(sweep.completed, 1);
    const final = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    assert.equal(Number(final.collectedAmount), 30);
    assert.equal(Number(final.tipCollected), 6);
    assert.equal(final.donorCount, 3);
  } finally {
    await prisma.$disconnect();
  }
});
