import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { z } from "zod";
import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";

// Schema for verification status update
const updateStatusSchema = z.object({
  campaignId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  notes: z.string().optional(),
});

// Route handler for GET request to check verification status
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get verification for the campaign
    const verification = await db.campaignVerification.findUnique({
      where: {
        campaignId,
      },
    });

    if (!verification) {
      return NextResponse.json({
        status: null,
        message: "No verification request found for this campaign",
      });
    }

    return NextResponse.json({
      status: verification.verificationStatus,
      requestDate: verification.requestDate,
      approvalDate: verification.approvalDate,
      notes: verification.notes,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}

// Route handler for PUT request to update verification status (admin only)
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdminProfile();

    // Validate request body
    const body = await req.json();
    const { campaignId, status, notes } = updateStatusSchema.parse(body);

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        verificationStatus: true,
        verificationRequests: {
          select: {
            verificationStatus: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const approvalDate = status === "approved" ? new Date() : null;

    const updatedVerification = await db.$transaction(async (tx) => {
      const verification = await tx.campaignVerification.upsert({
        where: { campaignId },
        create: {
          campaignId,
          verificationStatus: status,
          approvalDate,
          notes,
        },
        update: {
          verificationStatus: status,
          approvalDate,
          notes,
        },
      });

      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          verificationStatus: status === "approved",
          verificationDate: approvalDate,
        },
      });

      return verification;
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action: "campaign_verification.update",
      entityType: "campaign",
      entityId: campaignId,
      metadata: {
        campaignTitle: campaign.title,
        previousCampaignVerified: campaign.verificationStatus,
        previousVerificationStatus:
          campaign.verificationRequests?.verificationStatus ?? null,
        newVerificationStatus: status,
        notes: notes ?? null,
      },
    });

    return NextResponse.json({
      message: `Verification status updated to ${status}`,
      verification: updatedVerification,
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error updating verification status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update verification status" },
      { status: 500 }
    );
  }
}
