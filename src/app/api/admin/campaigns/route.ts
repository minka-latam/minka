import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
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
        { error: "Only administrators can access this resource" },
        { status: 403 }
      );
    }

    // Get URL query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Fetch all campaigns with related data
    const campaigns = await db.campaign.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        media: {
          where: {
            isPrimary: true,
          },
          select: {
            mediaUrl: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.campaign.count();

    // Format the response data
    const formattedCampaigns = campaigns.map((campaign) => {
      // Calculate days remaining
      const endDate = new Date(campaign.endDate);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        location: campaign.location,
        goalAmount: Number(campaign.goalAmount),
        collectedAmount: Number(campaign.collectedAmount),
        donorCount: campaign.donorCount,
        percentageFunded: campaign.percentageFunded,
        daysRemaining: daysRemaining,
        status: campaign.campaignStatus,
        verificationStatus: campaign.verificationStatus,
        verificationDate: campaign.verificationDate?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        endDate: campaign.endDate.toISOString(),
        organizerName: campaign.organizer.name,
        organizerEmail: campaign.organizer.email,
        organizerId: campaign.organizer.id,
        imageUrl: campaign.media[0]?.mediaUrl || null,
      };
    });

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
} 