import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  formatProfileForApi,
  getProfileById,
  type ProfileRow,
} from "@/lib/profile-utils";

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

    const profile = await getProfileById(userId);

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get query parameter to determine if we need related data
    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get("include_related") === "true";

    let result: any = formatProfileForApi(profile);

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
      "birth_date",
      "identityNumber",
      "identity_number",
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

    const profilePicture = json.profilePicture ?? json.profile_picture;
    const identityNumber = json.identityNumber ?? json.identity_number;
    const birthDate = json.birthDate ?? json.birth_date;

    const [profile] = await prisma.$queryRaw<ProfileRow[]>`
      update public.profiles
      set
        name = case
          when ${Object.hasOwn(json, "name")} then coalesce(nullif(${json.name ?? ""}, ''), name)
          else name
        end,
        phone = case
          when ${Object.hasOwn(json, "phone")} then nullif(${json.phone ?? ""}, '')
          else phone
        end,
        profile_picture = case
          when ${Object.hasOwn(json, "profilePicture") || Object.hasOwn(json, "profile_picture")}
            then nullif(${profilePicture ?? ""}, '')
          else profile_picture
        end,
        identity_number = case
          when ${Object.hasOwn(json, "identityNumber") || Object.hasOwn(json, "identity_number")}
            then nullif(${identityNumber ?? ""}, '')
          else identity_number
        end,
        address = case
          when ${Object.hasOwn(json, "address")} then nullif(${json.address ?? ""}, '')
          else address
        end,
        bio = case
          when ${Object.hasOwn(json, "bio")} then nullif(${json.bio ?? ""}, '')
          else bio
        end,
        location = case
          when ${Object.hasOwn(json, "location")} then nullif(${json.location ?? ""}, '')
          else location
        end,
        birth_date = case
          when ${Object.hasOwn(json, "birthDate") || Object.hasOwn(json, "birth_date")}
            then nullif(${birthDate ?? ""}, '')::date
          else birth_date
        end,
        verification_status = case
          when ${Object.hasOwn(json, "verificationStatus")} then ${json.verificationStatus ?? false}
          else verification_status
        end,
        status = case
          when ${Object.hasOwn(json, "status")} then ${json.status ?? "active"}::"Status"
          else status
        end,
        updated_at = current_timestamp
      where id = ${userId}::uuid
      returning
        id::text,
        name,
        email,
        phone,
        address,
        role::text,
        profile_picture as "profilePicture",
        identity_number as "identityNumber",
        birth_date as "birthDate",
        bio,
        location,
        verification_status as "verificationStatus",
        status::text,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = formatProfileForApi(profile);

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
