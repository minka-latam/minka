import type { PaymentMethod, PaymentStatus } from "@prisma/client";

type DonationRequestBody = Record<string, unknown>;

export type DonationCreateInput = {
  campaignId?: string;
  donorId?: string;
  amount?: unknown;
  tipAmount: unknown;
  paymentMethod?: unknown;
  currency?: unknown;
  message?: string;
  isAnonymous: boolean;
  notificationEnabled: boolean;
  customAmount?: unknown;
};

export type DonationPatchInput = {
  notificationEnabled?: boolean;
  message?: string;
  paymentStatus?: unknown;
};

export type DonationStatusDto = {
  id: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
  tipAmount: number | null;
  totalAmount: number | null;
  currency: string;
  updatedAt: Date;
  triptoPaymentId: string | null;
};

function read(body: DonationRequestBody, camelKey: string, snakeKey: string) {
  return body[camelKey] ?? body[snakeKey];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function parseDonationCreateBody(
  body: unknown
): DonationCreateInput {
  const data = (body ?? {}) as DonationRequestBody;

  return {
    campaignId: stringValue(read(data, "campaignId", "campaign_id")),
    donorId: stringValue(read(data, "donorId", "donor_id")),
    amount: data.amount,
    tipAmount: read(data, "tipAmount", "tip_amount") ?? 0,
    paymentMethod: read(data, "paymentMethod", "payment_method"),
    currency:
      read(data, "currency", "cardCurrency") ?? data.card_currency,
    message: stringValue(data.message),
    isAnonymous: booleanValue(read(data, "isAnonymous", "is_anonymous")) ?? false,
    notificationEnabled:
      booleanValue(read(data, "notificationEnabled", "notification_enabled")) ??
      false,
    customAmount: read(data, "customAmount", "custom_amount"),
  };
}

export function parseDonationPatchBody(body: unknown): DonationPatchInput {
  const data = (body ?? {}) as DonationRequestBody;

  return {
    notificationEnabled: booleanValue(read(
      data,
      "notificationEnabled",
      "notification_enabled"
    )),
    message: stringValue(data.message),
    paymentStatus: read(data, "paymentStatus", "payment_status"),
  };
}

export function formatDonationStatusDto(donation: {
  id: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentMethod: PaymentMethod;
  amount: unknown;
  tip_amount: unknown;
  total_amount: unknown;
  currency: string;
  updatedAt: Date;
  triptoPaymentId: string | null;
}): DonationStatusDto {
  return {
    id: donation.id,
    paymentStatus: donation.paymentStatus,
    paymentProvider: donation.paymentProvider,
    paymentMethod: donation.paymentMethod,
    amount: Number(donation.amount),
    tipAmount:
      donation.tip_amount == null ? null : Number(donation.tip_amount),
    totalAmount:
      donation.total_amount == null ? null : Number(donation.total_amount),
    currency: donation.currency,
    updatedAt: donation.updatedAt,
    triptoPaymentId: donation.triptoPaymentId,
  };
}
