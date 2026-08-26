import { NextRequest, NextResponse } from "next/server";
import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { refreshOrganizerActiveCampaignsCount } from "@/lib/campaigns/active-count";
import { prisma } from "@/lib/prisma";
import { deleteStorageObjectsForMedia } from "@/lib/storage/delete-objects";
import {
  cancelCampaignById,
  CampaignCancellationError,
} from "@/lib/campaigns/cancel-campaign";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminProfile();
    const { id: campaignId } = await params;
    const body = await request.json();

    if (body.action !== "cancel") {
      return NextResponse.json(
        { error: "Acción administrativa inválida" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        campaignStatus: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      );
    }

    const result = await cancelCampaignById(prisma, campaignId);

    await createAdminAuditLog({
      adminId: admin.id,
      action: "campaign.cancel",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        title: campaign.title,
        previousStatus: campaign.campaignStatus,
        newStatus: "cancelled",
        alreadyCancelled: result.alreadyCancelled,
      },
    });

    return NextResponse.json({
      message: result.alreadyCancelled
        ? "La campaña ya estaba terminada"
        : "Campaña terminada sin eliminar su historial",
      campaignId,
      status: "cancelled",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof CampaignCancellationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Error cancelling campaign as admin:", error);
    return NextResponse.json(
      { error: "Error al terminar la campaña" },
      { status: 500 },
    );
  }
}

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
        media: {
          select: {
            mediaUrl: true,
            previewUrl: true,
          },
        },
        updates: {
          select: {
            imageUrl: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 },
      );
    }

    const [donationCount, transferCount] = await Promise.all([
      prisma.donation.count({ where: { campaignId } }),
      prisma.fundTransfer.count({ where: { campaignId } }),
    ]);

    if (donationCount > 0 || transferCount > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar permanentemente una campaña con donaciones o transferencias. Cancélala para conservar el historial.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { campaignId } });
      await tx.savedCampaign.deleteMany({ where: { campaignId } });
      await tx.comment.deleteMany({ where: { campaignId } });
      await tx.campaignUpdate.deleteMany({ where: { campaignId } });
      await tx.campaignVerification.deleteMany({ where: { campaignId } });
      await tx.campaignMedia.deleteMany({ where: { campaignId } });
      await tx.campaignBankAccount.deleteMany({ where: { campaignId } });
      await tx.campaign.delete({
        where: { id: campaignId },
      });

      await refreshOrganizerActiveCampaignsCount(tx, campaign.organizerId);
    });

    const storageDeletion = await deleteStorageObjectsForMedia([
      ...campaign.media,
      ...campaign.updates.map((update) => ({
        mediaUrl: update.imageUrl,
        previewUrl: null,
      })),
    ]);

    await createAdminAuditLog({
      adminId: admin.id,
      action: "campaign.delete",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        title: campaign.title,
        previousStatus: campaign.campaignStatus,
        deletionMode: "campaign_hard_delete_without_financial_activity",
        deletedStoragePaths: storageDeletion.deletedPaths,
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
