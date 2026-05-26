export const BISA_PAYMENT_CURRENCY = "BOB";
export const TRIPTO_CARD_CURRENCIES = ["USD", "EUR"] as const;
export const DEFAULT_TRIPTO_CARD_CURRENCY = "USD";
export const TRIPTO_OPEN_AMOUNT_TOLERANCE = 0.01;

type DonationAmountSource = {
  amount: unknown;
  tip_amount?: unknown;
  total_amount?: unknown;
};

export type PaymentValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_amount" | "amount_mismatch" | "currency_mismatch";
      message: string;
    };

export function normalizeCurrency(value: unknown) {
  if (typeof value !== "string") return null;
  const currency = value.trim().toUpperCase();
  return currency || null;
}

export function resolveTriptoCardCurrency(value: unknown) {
  const currency = normalizeCurrency(value);

  if (
    currency &&
    TRIPTO_CARD_CURRENCIES.includes(
      currency as (typeof TRIPTO_CARD_CURRENCIES)[number]
    )
  ) {
    return currency;
  }

  return DEFAULT_TRIPTO_CARD_CURRENCY;
}

export function parseProviderAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function expectedDonationTotal(donation: DonationAmountSource) {
  const total = Number(donation.total_amount);
  if (Number.isFinite(total) && total > 0) return total;

  const amount = Number(donation.amount);
  const tip = Number(donation.tip_amount || 0);
  return amount + tip;
}

function toMinorUnits(value: number) {
  return Math.round(value * 100);
}

export function validateProviderPayment({
  expectedAmount,
  providerAmount,
  expectedCurrency,
  providerCurrency,
  amountTolerance,
}: {
  expectedAmount: number;
  providerAmount: number | null;
  expectedCurrency: string;
  providerCurrency: string | null;
  amountTolerance: number;
}): PaymentValidationResult {
  if (providerAmount == null || providerAmount <= 0) {
    return {
      ok: false,
      reason: "invalid_amount",
      message: "Provider amount is missing or invalid",
    };
  }

  const normalizedExpectedCurrency = normalizeCurrency(expectedCurrency);
  const normalizedProviderCurrency = normalizeCurrency(providerCurrency);

  if (
    !normalizedExpectedCurrency ||
    normalizedProviderCurrency !== normalizedExpectedCurrency
  ) {
    return {
      ok: false,
      reason: "currency_mismatch",
      message: `Currency mismatch: expected ${normalizedExpectedCurrency || "unknown"}, got ${normalizedProviderCurrency || "unknown"}`,
    };
  }

  const expectedMinorAmount = toMinorUnits(expectedAmount);
  const providerMinorAmount = toMinorUnits(providerAmount);
  const toleranceMinorAmount = toMinorUnits(amountTolerance);

  if (
    Math.abs(expectedMinorAmount - providerMinorAmount) >
    toleranceMinorAmount
  ) {
    return {
      ok: false,
      reason: "amount_mismatch",
      message: `Amount mismatch: expected ${expectedAmount}, got ${providerAmount}`,
    };
  }

  return { ok: true };
}
