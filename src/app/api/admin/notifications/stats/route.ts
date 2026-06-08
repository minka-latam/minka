import { NextRequest, NextResponse } from "next/server";
import { Prisma, Status, UserRole } from "@prisma/client";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { technicalAnonymousProfileExclusion } from "@/lib/donations/anonymous-donor";

export async function GET(request: NextRequest) {
  try {
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

    const activeRealUserWhere: Prisma.ProfileWhereInput = {
      status: Status.active,
      ...technicalAnonymousProfileExclusion(),
    };

    const activeRealUsers = await prisma.profile.findMany({
      where: activeRealUserWhere,
      select: { id: true },
    });
    const activeRealUserIds = activeRealUsers.map((user) => user.id);
    const totalUsers = activeRealUserIds.length;

    const totalDonors = await prisma.profile.count({
      where: {
        ...activeRealUserWhere,
        donations: {
          some: {
            paymentStatus: "completed",
            isAnonymous: false,
          },
        },
      },
    });

    const totalOrganizers = await prisma.profile.count({
      where: {
        ...activeRealUserWhere,
        campaigns: {
          some: {},
        },
      },
    });

    const totalAdmins = await prisma.profile.count({
      where: {
        ...activeRealUserWhere,
        role: UserRole.admin,
      },
    });

    return NextResponse.json({
      totalUsers,
      totalDonors,
      totalOrganizers,
      totalAdmins,
      usersWithNewsUpdates: totalUsers,
      usersWithCampaignUpdates: totalUsers,
      usersWithoutPreferences: 0,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
