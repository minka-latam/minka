import { bisaClient } from "@/lib/bisa/client";
import { completeBisaDonationPayment } from "@/lib/bisa/payment-completion";
import { prisma } from "@/lib/prisma";

export const BISA_RECONCILIATION_BATCH_SIZE = 5;
export const BISA_RECONCILIATION_CONCURRENCY = 2;
export const BISA_EXPIRATION_GRACE_MINUTES = 30;

export function getBisaReconciliationCutoffs(now = new Date()) {
  return {
    expirationGraceCutoff: new Date(
      now.getTime() - BISA_EXPIRATION_GRACE_MINUTES * 60 * 1000,
    ),
    recentNoExpirationCutoff: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  };
}

export async function reconcilePendingBisaQrDonations({
  limit = BISA_RECONCILIATION_BATCH_SIZE,
}: {
  limit?: number;
} = {}) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const { expirationGraceCutoff, recentNoExpirationCutoff } =
    getBisaReconciliationCutoffs();
  const donations = await prisma.donation.findMany({
    where: {
      paymentStatus: "pending",
      paymentMethod: "qr",
      paymentProvider: "bisa",
      bisaAlias: { not: null },
      OR: [
        { bisaQrExpiresAt: { gte: expirationGraceCutoff } },
        {
          bisaQrExpiresAt: null,
          createdAt: { gte: recentNoExpirationCutoff },
        },
      ],
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

  const processDonation = async (donation: (typeof donations)[number]) => {
    const alias = donation.bisaAlias;

    if (!alias) {
      result.pending += 1;
      return;
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
        return;
      }

      if (statusResponse.data.status !== "PAGADO") {
        result.pending += 1;
        return;
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
  };

  const queue = [...donations];
  const workerCount = Math.min(BISA_RECONCILIATION_CONCURRENCY, queue.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const donation = queue.shift();
        if (donation) {
          await processDonation(donation);
        }
      }
    }),
  );

  return result;
}
