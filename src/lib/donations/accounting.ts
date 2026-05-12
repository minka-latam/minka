import { PaymentStatus, Prisma } from "@prisma/client";

import { createDonationNotification } from "@/lib/notifications";

type CompletedDonationNotification = {
  donationId: string;
  campaignId: string;
  organizerId: string;
  donorName: string;
  amount: number;
  campaignTitle: string;
  isAnonymous: boolean;
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
        select: { name: true },
      },
    },
  });

  if (!donation) {
    return { completedNow: false };
  }

  const completion = await tx.donation.updateMany({
    where: {
      id: donation.id,
      paymentStatus: { not: PaymentStatus.completed },
    },
    data: {
      ...donationUpdate,
      paymentStatus: PaymentStatus.completed,
    },
  });

  if (completion.count === 0) {
    return { completedNow: false };
  }

  const donationTipAmount = new Prisma.Decimal(
    donation.tip_amount ?? tipAmount ?? 0,
  );

  const updatedCampaign = await tx.campaign.update({
    where: { id: donation.campaignId },
    data: {
      collectedAmount: {
        increment: donation.amount,
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
      amount: Number(donation.amount),
      campaignTitle: donation.campaign.title,
      isAnonymous: donation.isAnonymous,
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
}
