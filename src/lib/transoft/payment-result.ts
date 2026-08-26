import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  type Prisma,
} from "@prisma/client";

import { completeDonationAccounting } from "@/lib/donations/accounting";
import { createCompletedPaymentLogIfMissing } from "@/lib/payments/payment-log";
import {
  CARD_PAYMENT_AMOUNT_TOLERANCE,
  normalizeCurrency,
  parseProviderAmount,
  validateProviderPayment,
} from "@/lib/payments/provider-validation";
import {
  classifyTransoftStatus,
  parseTransoftPaymentDate,
} from "@/lib/transoft/status";
import type { TransoftPaymentNotification } from "@/lib/transoft/types";

export type TransoftPaymentResultSource = "callback" | "search" | "reconcile";

export async function applyTransoftPaymentResult(
  tx: Prisma.TransactionClient,
  {
    donationId,
    result,
    source,
  }: {
    donationId: string;
    result: TransoftPaymentNotification;
    source: TransoftPaymentResultSource;
  },
) {
  const donation = await tx.donation.findUnique({
    where: { id: donationId },
  });
  if (!donation) return { ok: false as const, error: "Donation not found" };
  if (
    donation.paymentProvider !== "transoft" ||
    donation.paymentMethod !== PaymentMethod.credit_card
  ) {
    return {
      ok: false as const,
      error: "Donation is not a Transoft card payment",
    };
  }
  if (
    donation.providerReference !== result.bookCode ||
    donation.id !== result.bookCode
  ) {
    return { ok: false as const, error: "bookCode does not match donation" };
  }

  const expectedAmount = Number(donation.providerTotalAmount);
  const expectedCurrency = normalizeCurrency(donation.providerCurrency);
  const providerAmount = parseProviderAmount(result.amount);
  const providerCurrency = normalizeCurrency(result.currency);
  const validation = validateProviderPayment({
    expectedAmount,
    providerAmount,
    expectedCurrency: expectedCurrency || "UNKNOWN",
    providerCurrency,
    amountTolerance: CARD_PAYMENT_AMOUNT_TOLERANCE,
  });
  if (!validation.ok) {
    return { ok: false as const, error: validation.message };
  }

  const statusKind = classifyTransoftStatus(result.status);
  if (statusKind === "unknown") {
    return {
      ok: false as const,
      error: `Unsupported Transoft status: ${result.status}`,
    };
  }
  const paymentDate = parseTransoftPaymentDate(result.paymentDate);
  if (!paymentDate) {
    return { ok: false as const, error: "Invalid Transoft paymentDate" };
  }

  const paymentId =
    donation.providerPaymentId || donation.providerReference || donation.id;
  const metadata = JSON.stringify({
    bookCode: result.bookCode,
    providerStatus: result.status,
    paymentDate: paymentDate.toISOString(),
    source,
  });

  if (statusKind === "completed") {
    const alreadyCompleted = donation.paymentStatus === PaymentStatus.completed;
    if (!alreadyCompleted && donation.paymentStatus !== PaymentStatus.pending) {
      return {
        ok: false as const,
        error: `Cannot complete a donation in ${donation.paymentStatus} state`,
      };
    }
    const completion = await completeDonationAccounting(tx, {
      donationId: donation.id,
      tipAmount: donation.tip_amount,
      notificationValues: {
        amount: Number(donation.providerAmount),
        tipAmount: Number(donation.providerTipAmount || 0),
        totalAmount: providerAmount as number,
        currency: providerCurrency as string,
      },
      donationUpdate: {
        paymentProvider: "transoft",
        paymentMethod: PaymentMethod.credit_card,
        providerPaymentId: paymentId,
        providerPaymentDate: paymentDate,
      },
    });

    await createCompletedPaymentLogIfMissing(tx, {
      paymentprovider: PaymentProvider.transoft,
      paymentmethod: PaymentMethod.credit_card,
      paymentid: paymentId,
      amount: providerAmount as number,
      tipamount: Number(donation.providerTipAmount || 0),
      currency: providerCurrency as string,
      campaignid: donation.campaignId,
      donorid: donation.donorId,
      metadata,
    });

    return {
      ok: true as const,
      completedNow: completion.completedNow,
      alreadyCompleted,
      notification: completion.notification,
      status: PaymentStatus.completed,
    };
  }

  if (statusKind === "pending") {
    return {
      ok: true as const,
      completedNow: false,
      alreadyCompleted: donation.paymentStatus === PaymentStatus.completed,
      status: donation.paymentStatus,
    };
  }

  const nextStatus =
    statusKind === "cancelled" ? PaymentStatus.cancelled : PaymentStatus.failed;
  if (donation.paymentStatus !== PaymentStatus.completed) {
    await tx.donation.update({
      where: { id: donation.id },
      data: {
        paymentStatus: nextStatus,
        providerPaymentId: paymentId,
        providerPaymentDate: paymentDate,
      },
    });
  }

  const existingLog = await tx.paymentLog.findFirst({
    where: {
      paymentprovider: PaymentProvider.transoft,
      paymentid: paymentId,
      status: nextStatus,
    },
    select: { id: true },
  });
  if (!existingLog) {
    await tx.paymentLog.create({
      data: {
        paymentprovider: PaymentProvider.transoft,
        paymentmethod: PaymentMethod.credit_card,
        paymentid: paymentId,
        status: nextStatus,
        amount: providerAmount as number,
        tipamount: Number(donation.providerTipAmount || 0),
        currency: providerCurrency as string,
        campaignid: donation.campaignId,
        donorid: donation.donorId,
        metadata,
      },
    });
  }

  return {
    ok: true as const,
    completedNow: false,
    alreadyCompleted: donation.paymentStatus === PaymentStatus.completed,
    status:
      donation.paymentStatus === PaymentStatus.completed
        ? PaymentStatus.completed
        : nextStatus,
  };
}
