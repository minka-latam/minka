import type { PrismaClient } from "@prisma/client";
import { CampaignStatus } from "@prisma/client";

import { refreshOrganizerActiveCampaignsCount } from "@/lib/campaigns/active-count";

export class CampaignCancellationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CampaignCancellationError";
    this.status = status;
  }
}

export async function cancelCampaignById(
  db: PrismaClient,
  campaignId: string,
) {
  const existingCampaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      organizerId: true,
      campaignStatus: true,
    },
  });

  if (!existingCampaign) {
    throw new CampaignCancellationError("Campaign not found", 404);
  }

  if (existingCampaign.campaignStatus === CampaignStatus.cancelled) {
    return { alreadyCancelled: true };
  }

  if (existingCampaign.campaignStatus === CampaignStatus.completed) {
    throw new CampaignCancellationError(
      "Completed campaigns cannot be cancelled from this endpoint",
      400,
    );
  }

  if (
    existingCampaign.campaignStatus !== CampaignStatus.draft &&
    existingCampaign.campaignStatus !== CampaignStatus.active
  ) {
    throw new CampaignCancellationError(
      "Only draft or active campaigns can be cancelled from this endpoint",
      400,
    );
  }

  await db.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        campaignStatus: CampaignStatus.cancelled,
      },
    });

    await refreshOrganizerActiveCampaignsCount(
      tx,
      existingCampaign.organizerId,
    );
  });

  return { alreadyCancelled: false };
}
