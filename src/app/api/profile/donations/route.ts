import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getAuthSession();

    // If no authenticated user, return unauthorized
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get URL parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Count total donations for this user
    const totalCount = await prisma.donation.count({
      where: {
        donorId: userId,
      },
    });

    // Fetch donations with campaign information
    const donations = await prisma.donation.findMany({
      where: {
        donorId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });

    // Format campaign media for easier frontend consumption
    const formattedDonations = donations.map((donation) => ({
      ...donation,
      campaign: {
        ...donation.campaign,
        mainImage:
          donation.campaign.media.length > 0
            ? donation.campaign.media[0].mediaUrl
            : null,
        media: undefined, // Remove the media array
      },
    }));

    // Calculate total amount donated
    const totalAmountResult = await prisma.donation.aggregate({
      where: {
        donorId: userId,
        paymentStatus: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const totalAmount = totalAmountResult._sum.amount || 0;

    // Calculate total pages for pagination
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: formattedDonations,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        totalAmount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
