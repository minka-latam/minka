import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    // Users can only access their own campaigns unless they're an admin
    if (session.user.id !== (await params).userId) {
      const requestingUser = await prisma.profile.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!requestingUser || requestingUser.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - You can only access your own campaigns" },
          { status: 403 }
        );
      }
    }

    // Fetch the user's campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        organizerId: (await params).userId,
      },
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
    console.error(
      `Error fetching campaigns for user ${await params}.userId:`,
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
