import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";
import { z } from "zod";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import {
  campaignDateKeyToDbDate,
  getCurrentCampaignDateKey,
} from "@/lib/campaign-dates";
import { prisma } from "@/lib/prisma";

const completionSchema = z.object({
  campaignId: z.string().uuid(),
  action: z.literal("complete"),
});

function todayAsCampaignDate() {
  return campaignDateKeyToDbDate(getCurrentCampaignDateKey());
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminProfile();
    const requestedLimit = Number(
      new URL(request.url).searchParams.get("limit") || 25,
    );
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 100)
        : 25;

    const campaigns = await prisma.campaign.findMany({
      where: {
        campaignStatus: CampaignStatus.active,
        endDate: { lte: todayAsCampaignDate() },
      },
      orderBy: { endDate: "asc" },
      take: limit,
      select: {
        id: true,
        title: true,
        endDate: true,
        goalAmount: true,
        collectedAmount: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        endDate: campaign.endDate.toISOString(),
        goalAmount: campaign.goalAmount.toString(),
        collectedAmount: campaign.collectedAmount.toString(),
        organizerId: campaign.organizer.id,
        organizerName: campaign.organizer.name,
        organizerEmail: campaign.organizer.email,
      })),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error fetching ended campaigns:", error);
    return NextResponse.json(
      { error: "Error al obtener campañas finalizadas" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminProfile();
    const { campaignId } = completionSchema.parse(await request.json());
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        campaignStatus: true,
        endDate: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      );
    }

    if (
      campaign.campaignStatus !== CampaignStatus.active ||
      campaign.endDate > todayAsCampaignDate()
    ) {
      return NextResponse.json(
        { error: "La campaña todavía no está lista para completarse" },
        { status: 400 },
      );
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { campaignStatus: CampaignStatus.completed },
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action: "campaign.complete",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        title: campaign.title,
        previousStatus: campaign.campaignStatus,
        newStatus: CampaignStatus.completed,
        endDate: campaign.endDate.toISOString(),
      },
    });

    return NextResponse.json({
      message: "Campaña marcada como completada",
      campaignId,
      status: CampaignStatus.completed,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos para completar la campaña" },
        { status: 400 },
      );
    }

    console.error("Error completing campaign:", error);
    return NextResponse.json(
      { error: "Error al completar la campaña" },
      { status: 500 },
    );
  }
}
