import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get the user session to validate authentication
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user is an admin
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all campaigns
    const campaigns = await prisma.campaign.findMany({
      include: {
        media: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the campaigns for the response
    const formattedCampaigns = campaigns.map((campaign) => ({
      ...campaign,
      media: campaign.media.map((media) => ({
        mediaUrl: media.mediaUrl,
        isPrimary: media.isPrimary,
        type: media.type,
        orderIndex: media.orderIndex,
      })),
    }));

    // Return the campaigns
    return NextResponse.json(
      { campaigns: formattedCampaigns },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching all campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
