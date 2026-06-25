import { bisaClient } from "@/lib/bisa/client";
import { completeBisaDonationPayment } from "@/lib/bisa/payment-completion";
import { prisma } from "@/lib/prisma";

export async function reconcilePendingBisaQrDonations({
  limit = 25,
}: {
  limit?: number;
} = {}) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const donations = await prisma.donation.findMany({
    where: {
      paymentStatus: "pending",
      paymentMethod: "qr",
      paymentProvider: "bisa",
      bisaAlias: { not: null },
    },
    orderBy: { createdAt: "asc" },
    take: safeLimit,
  });

  const result = {
    checked: donations.length,
    completed: 0,
    pending: 0,
    failed: 0,
    errors: [] as Array<{ donationId: string; alias: string; error: string }>,
  };

  for (const donation of donations) {
    const alias = donation.bisaAlias;

    if (!alias) {
      result.pending += 1;
      continue;
    }

    try {
      const statusResponse = await bisaClient.checkStatus(alias);

      if (!statusResponse.success || !statusResponse.data) {
        result.failed += 1;
        result.errors.push({
          donationId: donation.id,
          alias,
          error: statusResponse.error || "BISA status response is empty",
        });
        continue;
      }

      if (statusResponse.data.status !== "PAGADO") {
        result.pending += 1;
        continue;
      }

      const completion = await completeBisaDonationPayment({
        donation,
        confirmation: {
          alias,
          amount: statusResponse.data.amount,
          currency: statusResponse.data.currency,
          transactionId: statusResponse.data.transactionId,
          qrId: statusResponse.data.qrId,
          payerName: statusResponse.data.payerName,
          payerAccount: statusResponse.data.payerAccount,
          payerDocument: statusResponse.data.payerDocument,
          processedAt: statusResponse.data.processedAt,
          source: "reconcile",
        },
      });

      if (completion.completedNow || completion.alreadyCompleted) {
        result.completed += 1;
      } else {
        result.failed += 1;
        result.errors.push({
          donationId: donation.id,
          alias,
          error: completion.error || "Could not complete paid BISA donation",
        });
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        donationId: donation.id,
        alias,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
