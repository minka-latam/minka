import { sendCompletedDonationNotification } from "@/lib/donations/accounting";
import { prisma } from "@/lib/prisma";
import { transoftClient } from "@/lib/transoft/client";
import { applyTransoftPaymentResult } from "@/lib/transoft/payment-result";
import type { TransoftPaymentNotification } from "@/lib/transoft/types";

export async function reconcileTransoftDonation(bookCode: string) {
  const donation = await prisma.donation.findUnique({
    where: { id: bookCode },
    select: {
      id: true,
      paymentProvider: true,
      paymentMethod: true,
      paymentStatus: true,
      providerReference: true,
    },
  });
  if (
    !donation ||
    donation.paymentProvider !== "transoft" ||
    donation.paymentMethod !== "credit_card" ||
    donation.providerReference !== bookCode
  ) {
    return { ok: false as const, error: "Transoft donation not found" };
  }

  const search = await transoftClient.searchPayments({ bookCode });
  const payment = search.payments.find((item) => item.bookCode === bookCode);
  if (!payment) {
    return {
      ok: true as const,
      found: false as const,
      status: donation.paymentStatus,
    };
  }
  if (!payment.paymentDate) {
    return {
      ok: false as const,
      error: "Transoft returned a payment without paymentDate",
    };
  }

  const result: TransoftPaymentNotification = {
    bookCode: payment.bookCode,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentDate: payment.paymentDate,
  };
  const application = await prisma.$transaction((tx) =>
    applyTransoftPaymentResult(tx, {
      donationId: donation.id,
      result,
      source: "reconcile",
    }),
  );
  if (!application.ok) return application;

  await sendCompletedDonationNotification(
    "notification" in application ? application.notification : undefined,
  );
  return {
    ok: true as const,
    found: true as const,
    status: application.status,
    completedNow: application.completedNow,
  };
}
