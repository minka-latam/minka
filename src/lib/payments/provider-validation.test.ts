import assert from "node:assert/strict";
import test from "node:test";

import {
  CARD_PAYMENT_CURRENCIES,
  MINKA_CARD_PAYMENT_CURRENCY,
  resolveCardPaymentCurrency,
  validateProviderPayment,
} from "@/lib/payments/provider-validation";

test("Transoft supports both documented/confirmed currencies", () => {
  assert.deepEqual(CARD_PAYMENT_CURRENCIES, ["USD", "BOB"]);
});

test("never treats a zero provider amount as an open-amount payment", () => {
  assert.deepEqual(
    validateProviderPayment({
      expectedAmount: 10,
      providerAmount: 0,
      expectedCurrency: "BOB",
      providerCurrency: "BOB",
      amountTolerance: 0.01,
    }),
    {
      ok: false,
      reason: "invalid_amount",
      message: "Provider amount is missing or invalid",
    },
  );
});

test("BOB remains the default card currency", () => {
  assert.equal(MINKA_CARD_PAYMENT_CURRENCY, "BOB");
});

test("accepts only supported card currencies", () => {
  assert.equal(resolveCardPaymentCurrency("usd"), "USD");
  assert.equal(resolveCardPaymentCurrency(" BOB "), "BOB");
  assert.equal(resolveCardPaymentCurrency("EUR"), null);
});
