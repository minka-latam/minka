import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { refreshOrganizerActiveCampaignsCount } from "@/lib/campaigns/active-count";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminProfile();
    const { id: campaignId } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        campaignStatus: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.campaign.delete({
        where: { id: campaignId },
      });

      if (campaign.campaignStatus === CampaignStatus.active) {
        await refreshOrganizerActiveCampaignsCount(tx, campaign.organizerId);
      }
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action: "campaign.delete",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        title: campaign.title,
        previousStatus: campaign.campaignStatus,
        deletionMode: "campaign_only_database_cascade",
      },
    });

    return NextResponse.json({
      message: "Campaña eliminada permanentemente",
      campaignId,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error deleting campaign permanently:", error);
    return NextResponse.json(
      { error: "Error al eliminar la campaña permanentemente" },
      { status: 500 },
    );
  }
}
