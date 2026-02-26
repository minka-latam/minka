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

    // Get campaign statistics
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      verifiedCampaigns,
      totalRaisedResult,
    ] = await Promise.all([
      db.campaign.count(),
      db.campaign.count({ where: { campaignStatus: "active" } }),
      db.campaign.count({ where: { campaignStatus: "completed" } }),
      db.campaign.count({ where: { verificationStatus: true } }),
      db.campaign.aggregate({
        _sum: {
          collectedAmount: true,
        },
      }),
    ]);

    const totalRaised = Number(totalRaisedResult._sum.collectedAmount || 0);
    const averageFunding =
      totalCampaigns > 0 ? totalRaised / totalCampaigns : 0;

    return NextResponse.json({
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      averageFunding,
      verifiedCampaigns,
      completedCampaigns,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
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
