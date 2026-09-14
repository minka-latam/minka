import assert from 'node:assert/strict';
import test from 'node:test';
import { LibelulaClient, checkoutUrl, parseDebtResponse } from './client';
import { cardInputSchema, validateDebt } from './validation';
import { parsePaymentDate } from './payment-completion';

const id = '00000000-0000-4000-8000-000000000001';
const debt = { identificador: id, valor_total: 12.5, moneda: 'USD', pagado: true, url_pasarela_pagos: 'https://pagos.libelula.bo/?id=test' };
const input = { campaignId: id, idempotencyKey: id, amount: 10, tipAmount: 2.5, currency: 'BOB', paymentEmail: 'donor@example.com' };

test('accepts observed lookup envelopes and explicit false/zero boolean values', () => {
  assert.equal(parseDebtResponse({ error: 0, datos: null }, id), null);
  assert.equal(parseDebtResponse({ error: false, datos: [] }, id), null);
  assert.equal(parseDebtResponse({ error: 0, datos: { ...debt, pagado: '0' } }, id)?.pagado, false);
  assert.equal(parseDebtResponse({ error: 0, datos: [debt] }, id)?.pagado, true);
});
test('rejects ambiguous/mismatched lookup records and provider errors', () => {
  for (const payload of [{ error: 1, datos: debt }, { error: 0, datos: [debt, debt] }, { error: 0, datos: { ...debt, identificador: 'another' } }, { error: 0, datos: { ...debt, valor_total: '' } }]) {
    assert.throws(() => parseDebtResponse(payload, id));
  }
});
test('only redirects to HTTPS Libelula checkout hosts', () => {
  assert.equal(checkoutUrl(debt.url_pasarela_pagos), debt.url_pasarela_pagos);
  for (const url of ['https://libelula.bo.evil.test/', 'http://pagos.libelula.bo/', 'javascript:alert(1)', 'https://user:pass@pagos.libelula.bo/']) assert.throws(() => checkoutUrl(url));
});
test('validates email, BOB-only currency, finite amounts, cents, and tips at the API boundary', () => {
  assert.equal(cardInputSchema.safeParse(input).success, true);
  for (const change of [{ currency: 'USD' }, { currency: 'EUR' }, { paymentEmail: '' }, { amount: Infinity }, { amount: 0 }, { amount: 1.001 }, { tipAmount: -1 }, { amount: true }, { amount: 50001 }, { idempotencyKey: 'invalid' }]) assert.equal(cardInputSchema.safeParse({ ...input, ...change }).success, false);
});
test('payment validation uses stored provider amounts and currency, never callback totals', () => {
  const donation = { id, paymentProvider: 'libelula', providerReference: id, providerTotalAmount: '12.50', providerCurrency: 'USD' };
  assert.equal(validateDebt(donation, debt), true);
  assert.equal(validateDebt(donation, { ...debt, moneda: 'BOB' }), false);
  assert.equal(validateDebt(donation, { ...debt, valor_total: 12.49 }), false);
  assert.equal(validateDebt({ ...donation, paymentProvider: 'bisa' }, debt), false);
});
test('provider dates are interpreted in Bolivia time', () => {
  assert.equal(parsePaymentDate('2026-09-08 10:30:00')?.toISOString(), '2026-09-08T14:30:00.000Z');
  assert.equal(parsePaymentDate('2026-09-08T10:30:00Z')?.toISOString(), '2026-09-08T10:30:00.000Z');
  assert.equal(parsePaymentDate('invalid'), null);
});
test('registration sends decimal units and server-side appkey; unavailable responses stay errors', async () => {
  process.env.LIBELULA_APP_KEY = 'test-only';
  const client = new LibelulaClient(async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    assert.equal(body.appkey, 'test-only');
    assert.equal(body.lineas_detalle_deuda[0].costo_unitario, 12.5);
    return new Response(JSON.stringify({ error: 0, id_transaccion: id, url_pasarela_pagos: debt.url_pasarela_pagos }));
  });
  assert.equal((await client.register({ lineas_detalle_deuda: [{ costo_unitario: 12.5 }] })).paymentId, id);
  await assert.rejects(() => new LibelulaClient(async () => new Response('down', { status: 503 })).lookup(id), /PAYMENT_PROVIDER_UNAVAILABLE/);
});
