import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Validate userId format
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return new Response(JSON.stringify({ error: "Invalid user ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the profile with essential data only for faster loading
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        profilePicture: true,
        identityNumber: true,
        birthDate: true,
        bio: true,
        location: true,
        verificationStatus: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        activeCampaignsCount: true,
        // Exclude password and other sensitive fields
      },
    });

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get query parameter to determine if we need related data
    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get("include_related") === "true";

    let result: any = {
      ...profile,
      // Convert dates to ISO strings for consistency
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      birthDate: profile.birthDate?.toISOString() || null,
      // Map field names for compatibility
      created_at: profile.createdAt.toISOString(),
      profile_picture: profile.profilePicture,
      identity_number: profile.identityNumber,
      birth_date: profile.birthDate?.toISOString() || null,
    };

    // Only fetch related data if specifically requested (for dashboard, we don't need it initially)
    if (includeRelated) {
      const [campaigns, donations, savedCampaigns] = await Promise.all([
        prisma.campaign.findMany({
          where: { organizerId: userId },
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            goalAmount: true,
            collectedAmount: true,
            donorCount: true,
            percentageFunded: true,
            daysRemaining: true,
            location: true,
            endDate: true,
            verificationStatus: true,
            campaignStatus: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limit for performance
        }),
        prisma.donation.findMany({
          where: { donorId: userId },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            campaignId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limit for performance
        }),
        prisma.savedCampaign.findMany({
          where: { profileId: userId },
          select: {
            campaignId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limit for performance
        }),
      ]);

      result = {
        ...result,
        campaigns,
        donations,
        savedCampaigns,
      };
    }

    return new Response(JSON.stringify({ profile: result }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Validate userId format
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return new Response(JSON.stringify({ error: "Invalid user ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const json = await request.json();

    // Validate that we have at least one field to update
    const allowedFields = [
      "name",
      "phone",
      "address",
      "bio",
      "location",
      "profilePicture",
      "profile_picture",
      "birthDate",
      "verificationStatus",
      "status",
    ];
    const updateData = Object.keys(json).filter((key) =>
      allowedFields.includes(key)
    );

    if (updateData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        name: json.name,
        phone: json.phone,
        profilePicture: json.profilePicture || json.profile_picture,
        address: json.address,
        bio: json.bio,
        location: json.location,
        birthDate: json.birthDate ? new Date(json.birthDate) : undefined,
        verificationStatus: json.verificationStatus,
        status: json.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        profilePicture: true,
        identityNumber: true,
        birthDate: true,
        bio: true,
        location: true,
        verificationStatus: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response consistently
    const result: any = {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      birthDate: profile.birthDate?.toISOString() || null,
      created_at: profile.createdAt.toISOString(),
      profile_picture: profile.profilePicture,
      identity_number: profile.identityNumber,
      birth_date: profile.birthDate?.toISOString() || null,
    };

    return new Response(JSON.stringify({ profile: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
