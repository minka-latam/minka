import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;

    // Get URL parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.donation.count({
      where: {
        campaignId,
        status: "active",
      },
    });

    // Fetch donations with pagination
    const donations = await prisma.donation.findMany({
      where: {
        campaignId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        tip_amount: true,
        total_amount: true,
        message: true,
        isAnonymous: true,
        createdAt: true,
        paymentStatus: true,
        donor: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      skip,
      take: limit,
    });

    // Map the donations to respect anonymity
    const formattedDonations = donations.map((donation) => ({
      id: donation.id,
      amount: donation.amount,
      tip_amount: donation.tip_amount,
      total_amount: donation.total_amount,
      message: donation.message,
      createdAt: donation.createdAt,
      paymentStatus: donation.paymentStatus,
      donor: donation.isAnonymous
        ? {
            id: null,
            name: "Donante Anónimo",
            profilePicture: null,
          }
        : donation.donor,
    }));

    // Calculate the total pages
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: formattedDonations,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign donations" },
      { status: 500 }
    );
  }
}

// Admin endpoint to manage donation status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const campaignId = (await params).id;
    const body = await req.json();
    const { donationId, status } = body;

    if (!donationId || !status) {
      return NextResponse.json(
        { error: "Donation ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status value
    if (!["pending", "active", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Find user profile
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify user is campaign owner or admin
    const campaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.organizerId !== profile.id && profile.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "You don't have permission to manage donations for this campaign",
        },
        { status: 403 }
      );
    }

    // Update donation status
    const donation = await db.donation.update({
      where: {
        id: donationId,
        campaignId: campaignId,
      },
      data: {
        status,
      },
    });

    // If the donation was activated, update the campaign's collected amount
    if (status === "active") {
      await db.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          collectedAmount: {
            increment: donation.amount,
          },
        },
      });
    } else if (status === "rejected" && donation.status === "active") {
      // If an active donation was rejected, decrement the collected amount
      await db.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          collectedAmount: {
            decrement: donation.amount,
          },
        },
      });
    }

    return NextResponse.json({ success: true, donation });
  } catch (error) {
    console.error("Error updating donation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
