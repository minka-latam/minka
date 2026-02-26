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

    // Fetch analytics data
    const [usersCount, campaignsCount, donations, pendingVerificationsCount] =
      await Promise.all([
        prisma.profile.count(),
        prisma.campaign.count(),
        prisma.donation.findMany({
          select: {
            amount: true,
          },
        }),
        prisma.campaign.count({
          where: {
            verificationStatus: false,
          },
        }),
      ]);

    // Calculate total donations sum
    const totalDonationAmount = donations.reduce(
      (sum, d) => sum + (d.amount ? parseFloat(d.amount.toString()) : 0),
      0
    );

    // Return analytics data
    return NextResponse.json(
      {
        totalUsers: usersCount,
        totalCampaigns: campaignsCount,
        totalDonations: totalDonationAmount,
        pendingVerifications: pendingVerificationsCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in admin analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
