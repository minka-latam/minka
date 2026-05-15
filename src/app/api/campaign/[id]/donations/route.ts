import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findPublicOrOwnedCampaignById } from "@/lib/campaigns/visibility";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;

    const campaign = await findPublicOrOwnedCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get URL parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = searchParams.get("offset");
    const skip = offset ? parseInt(offset) : (page - 1) * limit;
    const currentPage = Math.floor(skip / limit) + 1;

    // Get total count for pagination
    const totalCount = await prisma.donation.count({
      where: {
        campaignId,
        paymentStatus: "completed",
      },
    });

    // Fetch donations with pagination
    const donations = await prisma.donation.findMany({
      where: {
        campaignId,
        paymentStatus: "completed",
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
        currentPage,
        totalPages,
        totalCount,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
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

export async function PATCH(
  _req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: "Donation status is managed by payment providers" },
    { status: 410 }
  );
}
