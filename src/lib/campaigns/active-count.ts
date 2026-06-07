import type { Prisma, PrismaClient } from "@prisma/client";
import { CampaignStatus } from "@prisma/client";

type CampaignCountClient = PrismaClient | Prisma.TransactionClient;
export const COUNTED_CAMPAIGN_STATUSES = [
  CampaignStatus.active,
  CampaignStatus.completed,
] as const;

export function isCountedCampaignStatus(
  status: CampaignStatus | null | undefined,
) {
  return (
    status === CampaignStatus.active ||
    status === CampaignStatus.completed
  );
}

export async function refreshOrganizerActiveCampaignsCount(
  db: CampaignCountClient,
  organizerId: string,
) {
  const activeCampaignsCount = await db.campaign.count({
    where: {
      organizerId,
      campaignStatus: {
        in: [...COUNTED_CAMPAIGN_STATUSES],
      },
    },
  });

  await db.profile.update({
    where: { id: organizerId },
    data: { activeCampaignsCount },
  });

  return activeCampaignsCount;
}
