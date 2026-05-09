import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";
import { calculatePlatformFee, toNumber } from "@/lib/campaign-finance";

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

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
      donationTips,
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
      db.donation.findMany({
        where: {
          status: "active",
          paymentStatus: "completed",
        },
        select: {
          campaignId: true,
          tip_amount: true,
        },
      }),
    ]);

    const totalRaised = Number(totalRaisedResult._sum.collectedAmount || 0);
    const averageFunding =
      totalCampaigns > 0 ? totalRaised / totalCampaigns : 0;
    const donationTipsByCampaign = new Map<string, number>();

    for (const donation of donationTips) {
      const tipAmount = toNumber(donation.tip_amount);
      donationTipsByCampaign.set(
        donation.campaignId,
        (donationTipsByCampaign.get(donation.campaignId) || 0) + tipAmount
      );
    }

    const totalTipAmount = [...donationTipsByCampaign.values()].reduce(
      (sum, tipAmount) => sum + tipAmount,
      0
    );
    const totalPlatformFeeAmount = calculatePlatformFee(totalRaised);
    const totalProcessedAmount = totalRaised + totalTipAmount;

    return NextResponse.json({
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      averageFunding,
      verifiedCampaigns,
      completedCampaigns,
      totalTipAmount,
      totalPlatformFeeAmount,
      totalProcessedAmount,
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
