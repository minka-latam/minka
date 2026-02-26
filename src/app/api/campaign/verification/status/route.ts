import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { z } from "zod";

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
    // Authentication
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can update verification status" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await req.json();
    const { campaignId, status, notes } = updateStatusSchema.parse(body);

    // Update verification status
    const updatedVerification = await db.campaignVerification.update({
      where: {
        campaignId,
      },
      data: {
        verificationStatus: status,
        approvalDate: status === "approved" ? new Date() : null,
        notes: notes,
      },
    });

    // Update the campaign verification status based on the verification status
    if (status === "approved") {
      await db.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          verificationStatus: true,
          verificationDate: new Date(),
        },
      });
    } else {
      // For rejected or pending status, set campaign verification to false
      await db.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          verificationStatus: false,
          verificationDate: null,
        },
      });
    }

    return NextResponse.json({
      message: `Verification status updated to ${status}`,
      verification: updatedVerification,
    });
  } catch (error) {
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
