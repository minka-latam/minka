import { PaymentStatus, Prisma } from "@prisma/client";

import { sendDonorThankYouEmail } from "@/lib/donor-thank-you-email";
import { createDonationNotification } from "@/lib/notifications";

type CompletedDonationNotification = {
  donationId: string;
  campaignId: string;
  organizerId: string;
  donorName: string;
  donorEmail?: string;
  amount: number;
  tipAmount: number;
  totalAmount: number;
  currency: string;
  campaignTitle: string;
  isAnonymous: boolean;
  completedAt: Date;
};

export async function completeDonationAccounting(
  tx: Prisma.TransactionClient,
  {
    donationId,
    donationUpdate,
    tipAmount,
  }: {
    donationId: string;
    donationUpdate?: Prisma.DonationUpdateManyMutationInput;
    tipAmount?: number | string | Prisma.Decimal | null;
  },
): Promise<{
  completedNow: boolean;
  notification?: CompletedDonationNotification;
}> {
  const donation = await tx.donation.findUnique({
    where: { id: donationId },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          goalAmount: true,
        },
      },
      donor: {
        select: { name: true, email: true },
      },
    },
  });

  if (!donation) {
    return { completedNow: false };
  }

  const completion = await tx.donation.updateMany({
    where: {
      id: donation.id,
      paymentStatus: PaymentStatus.pending,
    },
    data: {
      ...donationUpdate,
      paymentStatus: PaymentStatus.completed,
    },
  });

  if (completion.count === 0) {
    return { completedNow: false };
  }

  const donationAmount = new Prisma.Decimal(
    Number(donation.amount).toFixed(2),
  );
  const donationTipAmount = new Prisma.Decimal(
    Number(donation.tip_amount ?? tipAmount ?? 0).toFixed(2),
  );
  const donationTotalAmount = new Prisma.Decimal(
    Number(
      donation.total_amount ?? donationAmount.plus(donationTipAmount),
    ).toFixed(2),
  );

  const updatedCampaign = await tx.campaign.update({
    where: { id: donation.campaignId },
    data: {
      collectedAmount: {
        increment: donationAmount,
      },
      tipCollected: {
        increment: donationTipAmount,
      },
      donorCount: {
        increment: 1,
      },
    },
    select: {
      collectedAmount: true,
      goalAmount: true,
    },
  });

  const goal = Number(updatedCampaign.goalAmount);
  const collected = Number(updatedCampaign.collectedAmount);
  const percentageFunded = goal > 0 ? (collected / goal) * 100 : 0;

  await tx.campaign.update({
    where: { id: donation.campaignId },
    data: { percentageFunded },
  });

  return {
    completedNow: true,
    notification: {
      donationId: donation.id,
      campaignId: donation.campaign.id,
      organizerId: donation.campaign.organizerId,
      donorName: donation.donor?.name || "Donante",
      donorEmail: donation.donor?.email || undefined,
      amount: Number(donation.amount),
      tipAmount: Number(donationTipAmount),
      totalAmount: Number(donationTotalAmount),
      currency: donation.currency,
      campaignTitle: donation.campaign.title,
      isAnonymous: donation.isAnonymous,
      completedAt: new Date(),
    },
  };
}

export async function sendCompletedDonationNotification(
  notification?: CompletedDonationNotification,
) {
  if (!notification) return;

  try {
    await createDonationNotification(
      notification.donationId,
      notification.campaignId,
      notification.organizerId,
      notification.donorName,
      notification.amount,
      notification.campaignTitle,
      notification.isAnonymous,
    );
  } catch (notificationError) {
    console.error(
      "Failed to create completed donation notification:",
      notificationError,
    );
  }

  if (notification.isAnonymous || !notification.donorEmail) {
    return;
  }

  await sendDonorThankYouEmail({
    donationId: notification.donationId,
    campaignId: notification.campaignId,
    campaignTitle: notification.campaignTitle,
    donorName: notification.donorName,
    donorEmail: notification.donorEmail,
    amount: notification.amount,
    tipAmount: notification.tipAmount,
    totalAmount: notification.totalAmount,
    currency: notification.currency,
    completedAt: notification.completedAt,
  });
}
