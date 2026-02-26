import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bisaClient } from "@/lib/bisa/client";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donationId, reason } = body;

    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    // Verify user is authenticated
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile - the profile.id is the same as the supabase user.id
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Find donation
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        campaign: {
          select: { organizerId: true },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // Check if user is the donor or campaign organizer or admin
    const isOwner = donation.donorId === profile.id;
    const isOrganizer = donation.campaign.organizerId === profile.id;
    const isAdmin = profile.role === "admin";

    if (!isOwner && !isOrganizer && !isAdmin) {
      return NextResponse.json({
        error: "You don't have permission to cancel this payment"
      }, { status: 403 });
    }

    // Check if donation has a BISA QR
    if (!donation.bisaAlias || donation.paymentProvider !== "bisa") {
      return NextResponse.json({
        error: "This donation doesn't have a BISA QR payment"
      }, { status: 400 });
    }

    // Check payment status
    if (donation.paymentStatus === "completed") {
      return NextResponse.json({
        error: "Cannot cancel a completed payment"
      }, { status: 400 });
    }

    if (donation.paymentStatus === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "Payment already cancelled"
      });
    }

    // Call BISA API to disable QR
    const bisaSuccess = await bisaClient.disableQR(donation.bisaAlias);

    const cancelReason = reason || "user_cancelled";

    if (!bisaSuccess) {
      // Log the failed attempt but don't fail completely
      // The QR might already be expired or disabled
      console.warn(`Failed to disable QR for donation ${donationId}, BISA returned error`);

      await prisma.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || donation.bisaAlias || donation.id,
          status: "cancel_failed",
          amount: donation.amount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias: donation.bisaAlias,
            donationId: donation.id,
            campaignId: donation.campaignId,
            reason: cancelReason,
            cancelledBy: profile.id,
            error: "BISA API failed to disable QR",
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    }

    // Update donation status and create payment log
    await prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          paymentStatus: "cancelled",
        },
      });

      await tx.paymentLog.create({
        data: {
          paymentprovider: "bisa",
          paymentmethod: "qr",
          paymentid: donation.bisaQrId || donation.bisaAlias || donation.id,
          status: "cancelled",
          amount: donation.amount,
          currency: "BOB",
          metadata: JSON.stringify({
            alias: donation.bisaAlias,
            donationId: donation.id,
            campaignId: donation.campaignId,
            reason: cancelReason,
            cancelledBy: profile.id,
            bisaDisabled: bisaSuccess,
          }),
          campaignid: donation.campaignId,
          donorid: donation.donorId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Payment cancelled successfully"
    });

  } catch (error) {
    console.error("Error cancelling QR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
