import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get total users by category
    const totalUsers = await prisma.profile.count({
      where: { status: "active" },
    });

    const totalDonors = await prisma.donation.findMany({
      where: { status: "active" },
      select: { donorId: true },
      distinct: ["donorId"],
    });

    const totalOrganizers = await prisma.profile.count({
      where: {
        status: "active",
        role: "organizer",
      },
    });

    const totalAdmins = await prisma.profile.count({
      where: {
        status: "active",
        role: "admin",
      },
    });

    // Get notification preferences stats
    const usersWithNewsUpdates = await prisma.notificationPreference.count({
      where: {
        newsUpdates: true,
        status: "active",
      },
    });

    const usersWithCampaignUpdates = await prisma.notificationPreference.count({
      where: {
        campaignUpdates: true,
        status: "active",
      },
    });

    // Users without preferences default to receiving news
    const usersWithPreferences = await prisma.notificationPreference.count({
      where: { status: "active" },
    });

    const usersWithoutPreferences = totalUsers - usersWithPreferences;

    // Add users without preferences to news updates count (they get news by default)
    const effectiveNewsSubscribers =
      usersWithNewsUpdates + usersWithoutPreferences;

    return NextResponse.json({
      totalUsers,
      totalDonors: totalDonors.length,
      totalOrganizers,
      totalAdmins,
      usersWithNewsUpdates: effectiveNewsSubscribers,
      usersWithCampaignUpdates,
      usersWithoutPreferences,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
