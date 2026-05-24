export const BISA_EXPECTED_CURRENCY = "BOB";
export const TRIPTO_EXPECTED_CURRENCY =
  (process.env.TRIPTO_EXPECTED_CURRENCY || "USD").trim().toUpperCase();

export const BISA_AMOUNT_TOLERANCE = 0.01;
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

  if (Math.abs(expectedAmount - providerAmount) > amountTolerance) {
    return {
      ok: false,
      reason: "amount_mismatch",
      message: `Amount mismatch: expected ${expectedAmount}, got ${providerAmount}`,
    };
  }

  return { ok: true };
}
