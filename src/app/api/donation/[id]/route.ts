import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const donationId = (await params).id;

    // Get the authenticated user using Supabase client
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Parse the request body
    const body = await request.json();
    console.log(
      "Received update request for donation:",
      donationId,
      "with body:",
      body
    );

    // Find the donation to verify it exists
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { id: true, donorId: true, isAnonymous: true },
    });

    // If donation doesn't exist
    if (!donation) {
      console.error("Donation not found:", donationId);
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Convert property names if they come in with incorrect casing
    // This handles any inconsistency between frontend and backend naming
    const normalizedBody = {
      notificationEnabled:
        body.notificationEnabled !== undefined
          ? body.notificationEnabled
          : body.notification_enabled !== undefined
            ? body.notification_enabled
            : undefined,

      paymentStatus:
        body.paymentStatus !== undefined
          ? body.paymentStatus
          : body.payment_status !== undefined
            ? body.payment_status
            : undefined,

      message: body.message !== undefined ? body.message : undefined,
    };

    console.log("Normalized update body:", normalizedBody);

    // Check if user is owner of the donation
    const isOwner = userId && donation.donorId === userId;

    // For updates to notification preferences, we'll allow it without authentication
    // This is particularly important for anonymous donations
    const isNotificationUpdate =
      normalizedBody.notificationEnabled !== undefined &&
      Object.keys(normalizedBody).filter(
        (key) =>
          normalizedBody[key as keyof typeof normalizedBody] !== undefined
      ).length === 1;

    // Only allow updates if:
    // 1. The user is authenticated and owns the donation, OR
    // 2. The update is only for notification preferences (which we allow for anyone with the donation ID)
    if (!isOwner && !isNotificationUpdate) {
      console.error("Unauthorized update attempt for donation:", donationId);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the donation
    const updatedDonation = await prisma.donation.update({
      where: { id: donationId },
      data: {
        // Only allow updating specific fields
        notificationEnabled: normalizedBody.notificationEnabled,

        // Only allow updating these fields if user is owner
        ...(isOwner
          ? {
              paymentStatus: normalizedBody.paymentStatus,
              message: normalizedBody.message,
            }
          : {}),
      },
      select: {
        id: true,
        notificationEnabled: true,
        paymentStatus: true,
      },
    });

    console.log("Successfully updated donation:", updatedDonation);
    return NextResponse.json(updatedDonation);
  } catch (error) {
    console.error("Donation update error:", error);
    return NextResponse.json(
      { error: "Failed to update donation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const donationId = (await params).id;

    // Get the authenticated user using Supabase client
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Find the donation
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            media: {
              where: { isPrimary: true },
              select: { mediaUrl: true },
              take: 1,
            },
          },
        },
      },
    });

    // If donation doesn't exist
    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // Only allow access if:
    // 1. The user is authenticated and owns the donation
    // 2. The donation is not anonymous (public info)
    const isOwner = userId && donation.donorId === userId;

    if (!isOwner && donation.isAnonymous) {
      // For anonymous donations not owned by the requester, return limited info
      return NextResponse.json({
        id: donation.id,
        amount: donation.amount,
        campaign: donation.campaign,
        isAnonymous: true,
        createdAt: donation.createdAt,
      });
    }

    // Return full donation info for the owner
    return NextResponse.json(donation);
  } catch (error) {
    console.error("Donation retrieve error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve donation" },
      { status: 500 }
    );
  }
}
