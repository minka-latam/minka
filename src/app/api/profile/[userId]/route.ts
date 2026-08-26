import { NextRequest, NextResponse } from "next/server";
import { Status } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { createAdminAuditLog } from "@/lib/admin-auth";
import { calculateCampaignDaysRemaining } from "@/lib/campaign-dates";
import { prisma } from "@/lib/prisma";
import {
  formatAdminProfileForApi,
  formatProfileForApi,
  getProfileById,
  type ProfileRow,
} from "@/lib/profile-utils";

const personalFields = new Set([
  "name",
  "phone",
  "bio",
  "location",
  "profilePicture",
  "profile_picture",
  "birthDate",
  "birth_date",
  "identityNumber",
  "identity_number",
]);

const adminFields = new Set(["status"]);

const statusValues = new Set<string>(Object.values(Status));

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isValidUserId(userId: string) {
  return Boolean(userId && typeof userId === "string" && userId.trim());
}

function isAdminProfile(profile: ProfileRow | null) {
  return profile?.role === "admin" && profile.status === "active";
}

async function getRequesterProfile() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return { session: null, profile: null };
  }

  const profile = await getProfileById(session.user.id);
  return { session, profile };
}

async function getRelatedProfileData(userId: string) {
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
        location: true,
        endDate: true,
        verificationStatus: true,
        campaignStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
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
      take: 10,
    }),
    prisma.savedCampaign.findMany({
      where: { profileId: userId },
      select: {
        campaignId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      daysRemaining: calculateCampaignDaysRemaining(campaign.endDate),
    })),
    donations,
    savedCampaigns,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if (!isValidUserId(userId)) {
      return jsonError("Invalid user ID", 400);
    }

    const { session, profile: requesterProfile } = await getRequesterProfile();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const isOwner = session.user.id === userId;
    const isAdmin = isAdminProfile(requesterProfile);

    if (!isOwner && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get("include_related") === "true";

    if (includeRelated && !isOwner) {
      return jsonError(
        "Related profile data is only available to the owner",
        403,
      );
    }

    const profile = await getProfileById(userId);

    if (!profile) {
      return jsonError("Profile not found", 404);
    }

    let result = isOwner
      ? formatProfileForApi(profile)
      : formatAdminProfileForApi(profile);

    if (includeRelated) {
      result = {
        ...result,
        ...(await getRelatedProfileData(userId)),
      };
    }

    return NextResponse.json(
      { profile: result },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache",
        },
      },
    );
  } catch (error) {
    console.error("Profile API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if (!isValidUserId(userId)) {
      return jsonError("Invalid user ID", 400);
    }

    const { session, profile: requesterProfile } = await getRequesterProfile();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const isOwner = session.user.id === userId;
    const isAdmin = isAdminProfile(requesterProfile);

    const json = await request.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return jsonError("Invalid request body", 400);
    }

    const keys = Object.keys(json);
    if (keys.length === 0) {
      return jsonError("No fields to update", 400);
    }

    const hasUnknownFields = keys.some(
      (key) => !personalFields.has(key) && !adminFields.has(key),
    );
    if (hasUnknownFields) {
      return jsonError("No valid fields to update", 400);
    }

    const hasPersonalFields = keys.some((key) => personalFields.has(key));
    const hasAdminFields = keys.some((key) => adminFields.has(key));

    if (hasPersonalFields && hasAdminFields) {
      return jsonError(
        "Personal profile fields and admin fields must be updated separately",
        400,
      );
    }

    if (hasPersonalFields && !isOwner) {
      return jsonError("You can only update your own profile", 403);
    }

    if (hasAdminFields && !isAdmin) {
      return jsonError(
        "Only administrators can update profile status fields",
        403,
      );
    }

    const existingProfile = await getProfileById(userId);
    if (!existingProfile) {
      return jsonError("Profile not found", 404);
    }

    if (hasAdminFields) {
      const nextStatus = json.status;

      if (nextStatus !== undefined && !statusValues.has(nextStatus)) {
        return jsonError("Invalid status", 400);
      }

      if (
        existingProfile.role === "admin" &&
        existingProfile.status === "active" &&
        nextStatus &&
        nextStatus !== "active"
      ) {
        const activeAdminCount = await prisma.profile.count({
          where: { role: "admin", status: "active" },
        });

        if (activeAdminCount <= 1) {
          return jsonError(
            "Cannot deactivate the last active administrator",
            400,
          );
        }
      }

      const [profile] = await prisma.$queryRaw<ProfileRow[]>`
        update public.profiles
        set
          status = case
            when ${Object.hasOwn(json, "status")} then ${nextStatus ?? "active"}::"Status"
            else status
          end,
          updated_at = current_timestamp
        where id = ${userId}::uuid
        returning
          id::text,
          name,
          email,
          phone,
          role::text,
          profile_picture as "profilePicture",
          identity_number as "identityNumber",
          birth_date as "birthDate",
          bio,
          location,
          status::text,
          created_at as "createdAt",
          updated_at as "updatedAt",
          active_campaigns_count as "activeCampaignsCount"
      `;

      await createAdminAuditLog({
        adminId: requesterProfile!.id,
        action: "profile.update_admin_fields",
        entityType: "profile",
        entityId: profile.id,
        metadata: {
          previousStatus: existingProfile.status,
          newStatus: profile.status,
        },
      });

      return NextResponse.json({
        profile: formatAdminProfileForApi(profile),
      });
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
        updated_at = current_timestamp
      where id = ${userId}::uuid
      returning
        id::text,
        name,
        email,
        phone,
        role::text,
        profile_picture as "profilePicture",
        identity_number as "identityNumber",
        birth_date as "birthDate",
        bio,
        location,
        status::text,
        created_at as "createdAt",
        updated_at as "updatedAt",
        active_campaigns_count as "activeCampaignsCount"
    `;

    return NextResponse.json({
      profile: formatProfileForApi(profile),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
