import type { Prisma, PrismaClient } from "@prisma/client";

type CampaignCountClient = PrismaClient | Prisma.TransactionClient;

export async function refreshOrganizerActiveCampaignsCount(
  db: CampaignCountClient,
  organizerId: string,
) {
  const activeCampaignsCount = await db.campaign.count({
    where: {
      organizerId,
      campaignStatus: "active",
    },
  });

  await db.profile.update({
    where: { id: organizerId },
    data: { activeCampaignsCount },
  });

  return activeCampaignsCount;
}
