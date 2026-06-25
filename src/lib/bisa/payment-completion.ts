import { Donation, Prisma } from "@prisma/client";

import {
  completeDonationAccounting,
  sendCompletedDonationNotification,
} from "@/lib/donations/accounting";
import { prisma } from "@/lib/prisma";
import { createCompletedPaymentLogIfMissing } from "@/lib/payments/payment-log";
import {
  BISA_PAYMENT_CURRENCY,
  expectedDonationTotal,
  normalizeCurrency,
  parseProviderAmount,
  validateProviderPayment,
} from "@/lib/payments/provider-validation";

type BisaPaymentConfirmation = {
  alias: string;
  amount: unknown;
  currency: unknown;
  source: "callback" | "status" | "reconcile";
  transactionId?: string | null;
  qrId?: string | null;
  payerName?: string | null;
  payerAccount?: string | null;
  payerDocument?: string | null;
  processedAt?: string | Date | null;
};

function validString(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function parseProcessedAt(value: string | Date | null | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function completeBisaDonationPayment({
  donation,
  confirmation,
  awaitNotifications = true,
}: {
  donation: Donation;
  confirmation: BisaPaymentConfirmation;
  awaitNotifications?: boolean;
}) {
  if (donation.paymentStatus === "completed") {
    return { completedNow: false, alreadyCompleted: true };
  }

  const expectedAmount = expectedDonationTotal(donation);
  const providerAmount = parseProviderAmount(confirmation.amount);
  const providerCurrency = normalizeCurrency(confirmation.currency);
  const validation = validateProviderPayment({
    expectedAmount,
    providerAmount,
    expectedCurrency: BISA_PAYMENT_CURRENCY,
    providerCurrency,
    amountTolerance: 0,
  });

  if (!validation.ok) {
    console.error("[BISA][PAYMENT_VALIDATION]", {
      alias: confirmation.alias,
      source: confirmation.source,
      reason: validation.reason,
      expectedAmount,
      providerAmount,
      expectedCurrency: BISA_PAYMENT_CURRENCY,
      providerCurrency,
    });

    return {
      completedNow: false,
      alreadyCompleted: false,
      error: validation.message,
    };
  }

  const transactionId = validString(confirmation.transactionId);
  const qrId = validString(confirmation.qrId) || donation.bisaQrId;
  const paymentId =
    transactionId ||
    donation.bisaTransactionId ||
    qrId ||
    donation.bisaQrId ||
    confirmation.alias;

  let completedNow = false;
  let alreadyCompleted = false;
  let completionNotification;

  await prisma.$transaction(async (tx) => {
    const donationUpdate: Prisma.DonationUpdateManyMutationInput = {
      bisaTransactionId: paymentId,
      bisaQrId: qrId,
      bisaPayerName: validString(confirmation.payerName),
      bisaPayerAccount: validString(confirmation.payerAccount),
      bisaPayerDocument: validString(confirmation.payerDocument),
      bisaProcessedAt: parseProcessedAt(confirmation.processedAt),
    };

    const completion = await completeDonationAccounting(tx, {
      donationId: donation.id,
      donationUpdate,
    });

    completionNotification = completion.notification;

    if (!completion.completedNow) {
      alreadyCompleted = true;
      return;
    }

    completedNow = true;

    await createCompletedPaymentLogIfMissing(tx, {
      paymentprovider: "bisa",
      paymentmethod: "qr",
      paymentid: paymentId,
      amount: providerAmount as number,
      tipamount: Number(donation.tip_amount || 0),
      currency: providerCurrency || BISA_PAYMENT_CURRENCY,
      metadata: JSON.stringify({
        alias: confirmation.alias,
        donationId: donation.id,
        bisaQrId: qrId,
        source: confirmation.source,
        processedAt: confirmation.processedAt,
      }),
      campaignid: donation.campaignId,
      donorid: donation.donorId,
    });
  });

  const notificationPromise =
    sendCompletedDonationNotification(completionNotification);

  if (awaitNotifications) {
    await notificationPromise;
  } else {
    void notificationPromise.catch((error) => {
      console.error(
        "[BISA][PAYMENT_NOTIFICATION_ERROR]",
        error,
      );
    });
  }

  return {
    completedNow,
    alreadyCompleted,
  };
}
