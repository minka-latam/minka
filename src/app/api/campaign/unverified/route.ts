import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 },
      );
    }

    if (!session?.user) {
      return NextResponse.json({ campaigns: [] });
    }

    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 },
      );
    }

    const campaigns = await db.campaign.findMany({
      where: {
        organizerId: organizer.id,
        campaignStatus: "active",
        verificationStatus: false,
        OR: [
          { verificationRequests: null },
          {
            verificationRequests: {
              verificationStatus: "rejected",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        collectedAmount: true,
        goalAmount: true,
        campaignStatus: true,
        createdAt: true,
        verificationStatus: true,
        organizerId: true,
        media: {
          select: {
            mediaUrl: true,
            isPrimary: true,
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedCampaigns = campaigns.map((campaign) => {
      const primaryImage =
        campaign.media.find((media) => media.isPrimary)?.mediaUrl ||
        campaign.media[0]?.mediaUrl ||
        "/amboro-main.jpg";

      return {
        id: campaign.id,
        title: campaign.title,
        image_url: primaryImage,
        category: campaign.category,
        location: campaign.location,
        current_amount: Number(campaign.collectedAmount),
        goal_amount: Number(campaign.goalAmount),
        status: campaign.campaignStatus,
        description: campaign.description,
        created_at: campaign.createdAt.toISOString(),
        verification_status: campaign.verificationStatus,
        organizer_id: campaign.organizerId,
      };
    });

    return NextResponse.json({
      campaigns: transformedCampaigns,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
