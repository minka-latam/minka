import { NextRequest, NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import {
  isCountedCampaignStatus,
  refreshOrganizerActiveCampaignsCount,
} from "@/lib/campaigns/active-count";
import { prisma } from "@/lib/prisma";

const updateCampaignApprovalSchema = z.object({
  campaignId: z.string().uuid(),
  action: z.enum(["approve", "cancel"]),
});

type AdminCampaignApprovalRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  goalAmount: Prisma.Decimal;
  organizerName: string;
  organizerEmail: string;
  submittedAt: Date;
  createdAt: Date;
};

function serializeCampaignApproval(row: AdminCampaignApprovalRow) {
  return {
    ...row,
    goalAmount: row.goalAmount.toString(),
    submittedAt: row.submittedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminProfile();

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "25"),
      100,
    );

    if (status !== "pending") {
      return NextResponse.json(
        { error: "Estado de aprobación inválido" },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRaw<AdminCampaignApprovalRow[]>`
      select
        campaigns.id,
        campaigns.title,
        campaigns.category::text as category,
        campaigns.location::text as location,
        campaigns.goal_amount as "goalAmount",
        organizer.name as "organizerName",
        organizer.email as "organizerEmail",
        campaigns.submitted_for_review_at as "submittedAt",
        campaigns.created_at as "createdAt"
      from public.campaigns
      join public.profiles organizer on organizer.id = campaigns.organizer_id
      where campaigns.campaign_status = 'draft'::"CampaignStatus"
        and campaigns.submitted_for_review_at is not null
      order by campaigns.submitted_for_review_at asc
      limit ${limit}
    `;

    return NextResponse.json({
      campaigns: rows.map(serializeCampaignApproval),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error fetching campaign approvals:", error);
    return NextResponse.json(
      { error: "Error al obtener campañas pendientes" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminProfile();
    const { campaignId, action } = updateCampaignApprovalSchema.parse(
      await request.json(),
    );

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        campaignStatus: true,
        organizerId: true,
        submittedForReviewAt: true,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      );
    }

    if (
      existingCampaign.campaignStatus !== CampaignStatus.draft ||
      !existingCampaign.submittedForReviewAt
    ) {
      return NextResponse.json(
        { error: "La campaña no está pendiente de aprobación" },
        { status: 400 },
      );
    }

    const reviewedAt = new Date();
    const nextStatus =
      action === "approve"
        ? CampaignStatus.active
        : CampaignStatus.cancelled;

    const updatedCampaign = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          campaignStatus: nextStatus,
          reviewedAt,
        },
        select: {
          id: true,
          title: true,
          campaignStatus: true,
          submittedForReviewAt: true,
          reviewedAt: true,
        },
      });

      if (
        isCountedCampaignStatus(existingCampaign.campaignStatus) ||
        isCountedCampaignStatus(nextStatus)
      ) {
        await refreshOrganizerActiveCampaignsCount(
          tx,
          existingCampaign.organizerId,
        );
      }

      return campaign;
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action:
        action === "approve"
          ? "campaign_review.approve"
          : "campaign_review.cancel",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        previousStatus: existingCampaign.campaignStatus,
        newStatus: nextStatus,
        submittedForReviewAt:
          existingCampaign.submittedForReviewAt.toISOString(),
        reviewedAt: reviewedAt.toISOString(),
      },
    });

    return NextResponse.json({
      campaign: {
        id: updatedCampaign.id,
        title: updatedCampaign.title,
        status: updatedCampaign.campaignStatus,
        submittedForReviewAt:
          updatedCampaign.submittedForReviewAt?.toISOString() ?? null,
        reviewedAt: updatedCampaign.reviewedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos para actualizar campaña" },
        { status: 400 },
      );
    }

    console.error("Error updating campaign approval:", error);
    return NextResponse.json(
      { error: "Error al actualizar campaña pendiente" },
      { status: 500 },
    );
  }
}
