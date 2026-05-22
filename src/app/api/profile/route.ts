import { NextRequest, NextResponse } from "next/server";
import { Status, UserRole, type Prisma } from "@prisma/client";

import { adminAuthErrorResponse, requireAdminProfile } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const roleValues = new Set<string>(Object.values(UserRole));
const statusValues = new Set<string>(Object.values(Status));

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Profile creation through this endpoint is disabled. Use the authenticated profile setup flow.",
    },
    { status: 405, headers: { Allow: "GET" } },
  );
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminProfile();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    if (role && !roleValues.has(role)) {
      return NextResponse.json(
        { error: "Invalid role filter" },
        { status: 400 },
      );
    }

    if (status && !statusValues.has(status)) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 },
      );
    }

    const whereClause: Prisma.ProfileWhereInput = {};

    if (role) whereClause.role = role as UserRole;
    if (status) whereClause.status = status as Status;

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        verificationStatus: true,
        profilePicture: true,
        activeCampaignsCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        verification_status: profile.verificationStatus,
        profile_picture: profile.profilePicture,
        active_campaigns_count: profile.activeCampaignsCount,
        created_at: profile.createdAt.toISOString(),
        updated_at: profile.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
