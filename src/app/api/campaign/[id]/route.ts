import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  isCountedCampaignStatus,
  refreshOrganizerActiveCampaignsCount,
} from "@/lib/campaigns/active-count";
import { isPublicCampaign } from "@/lib/campaigns/visibility";
import { notifyCampaignPublishedForReview } from "@/lib/campaign-review-email";
import { CampaignStatus } from "@prisma/client";

// Define interfaces to help with typing
interface OrganizerProfile {
  id: string;
  name: string;
  location: string;
  profile_picture: string | null;
  join_date?: string;
  active_campaigns_count?: number;
  bio?: string;
}

interface CampaignMedia {
  id: string;
  media_url: string;
  is_primary: boolean;
  type: string;
  order_index: number | null;
}

interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  youtube_url?: string;
  created_at: string;
}

interface CampaignComment {
  id: string;
  message: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
  };
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  beneficiaries_description?: string;
  recipient_type?: string | null;
  legal_entity_id?: string | null;
  beneficiary_name?: string | null;
  beneficiary_relationship?: string | null;
  legal_entity?: {
    id: string;
    name: string;
    description: string | null;
    website: string | null;
  } | null;
  category?: string;
  location: string;
  goal_amount: number;
  collected_amount: number;
  donor_count: number;
  percentage_funded: number;
  days_remaining: number;
  youtube_url?: string | null;
  youtube_urls?: string[];
  verification_status?: boolean;
  created_at?: string;
  campaign_status?: string;
  submitted_for_review_at?: string | null;
  reviewed_at?: string | null;
  organizer: OrganizerProfile | null;
  media: CampaignMedia[];
  updates?: CampaignUpdate[];
  comments?: CampaignComment[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;

  if (!id) {
    console.error("API: Campaign ID is required but not provided");
    return NextResponse.json(
      { error: "Campaign ID is required" },
      { status: 400 },
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    console.log(`API: Created supabase client for campaign: ${id}`);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Fetch campaign data with organizer profile and campaign media
    console.log(`API: Executing supabase query for campaign: ${id}`);
    const { data, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        title,
        subtitle,
        description,
        category,
        beneficiaries_description,
        recipient_type,
        beneficiary_name,
        beneficiary_relationship,
        legal_entity_id,
        location,
        goal_amount,
        collected_amount,
        donor_count,
        percentage_funded,
        days_remaining,
        youtube_url,
        youtube_urls,
        verification_status,
        created_at,
        campaign_status,
        submitted_for_review_at,
        reviewed_at,
        organizer_id,
        organizer:profiles!organizer_id(id, name, location, profile_picture, join_date, active_campaigns_count, bio),
        legal_entity:legal_entities(id, name, description, website),
        media:campaign_media(id, media_url, is_primary, type, order_index),
        updates:campaign_updates(id, title, content, image_url, youtube_url, created_at),
        comments:comments(
          id,
          message,
          created_at,
          profile:profiles(id, name)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (campaignError) {
      console.error(
        `API: Error fetching campaign data: ${campaignError.message}`,
        campaignError,
      );

      // If not found, return 404
      if (campaignError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: campaignError.message,
          details: campaignError,
        },
        { status: 500 },
      );
    }

    if (!data) {
      console.error(`API: No data found for campaign: ${id}`);
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }
    const campaign = data as any;
    const profileWhere: Array<{ id: string } | { email: string }> = [];
    if (session?.user?.id) profileWhere.push({ id: session.user.id });
    if (session?.user?.email) profileWhere.push({ email: session.user.email });
    const requester =
      profileWhere.length > 0
        ? await db.profile.findFirst({
            where: { OR: profileWhere },
            select: { id: true, role: true },
          })
        : null;
    const canViewCancelled =
      requester?.role === "admin" || requester?.id === campaign.organizer_id;

    if (!isPublicCampaign(campaign) && !canViewCancelled) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const fallbackLegalEntity =
      !campaign.legal_entity && campaign.legal_entity_id
        ? await db.legalEntity.findUnique({
            where: { id: campaign.legal_entity_id },
            select: {
              id: true,
              name: true,
              description: true,
              website: true,
            },
          })
        : null;

    const legalEntity = campaign.legal_entity || fallbackLegalEntity;

    // Format the response with proper type handling
    const formattedCampaign: Campaign = {
      id: campaign.id,
      title: campaign.title,
      subtitle: campaign.subtitle,
      description: campaign.description,
      beneficiaries_description: campaign.beneficiaries_description,
      recipient_type: campaign.recipient_type,
      legal_entity_id: campaign.legal_entity_id,
      beneficiary_name: campaign.beneficiary_name,
      beneficiary_relationship: campaign.beneficiary_relationship,
      legal_entity: legalEntity
        ? {
            id: legalEntity.id,
            name: legalEntity.name,
            description: legalEntity.description,
            website: legalEntity.website,
          }
        : null,
      category: campaign.category,
      location: campaign.location,
      goal_amount: campaign.goal_amount,
      collected_amount: campaign.collected_amount,
      donor_count: campaign.donor_count,
      percentage_funded: campaign.percentage_funded,
      days_remaining: campaign.days_remaining,
      youtube_url: campaign.youtube_url,
      youtube_urls: campaign.youtube_urls,
      verification_status: campaign.verification_status,
      created_at: campaign.created_at,
      campaign_status: campaign.campaign_status,
      submitted_for_review_at: campaign.submitted_for_review_at,
      reviewed_at: campaign.reviewed_at,
      organizer: campaign.organizer
        ? {
            id: campaign.organizer.id,
            name: campaign.organizer.name,
            location: campaign.organizer.location,
            profile_picture: campaign.organizer.profile_picture,
            join_date: campaign.organizer.join_date,
            active_campaigns_count: campaign.organizer.active_campaigns_count,
            bio: campaign.organizer.bio,
          }
        : null,
      // NOTE (Hotfix - Dec 2025):
      // When the user is NOT authenticated, campaign data is fetched via the Supabase REST API.
      // When the user IS authenticated, campaign data is fetched via Prisma (direct PostgreSQL).
      // Prisma returns fields in snake_case (media_url, order_index).
      // Supabase REST was returning mediaUrl/orderIndex in camelCase after mapping.
      // This mismatch caused images to fail loading ONLY for anonymous users.
      // To unify both data sources, we return the fields in snake_case, matching Prisma output.
      media: Array.isArray(campaign.media)
        ? campaign.media
            .map((m: any) => ({
              id: m.id,
              media_url: m.media_url,
              is_primary: m.is_primary,
              type: m.type,
              order_index: m.order_index,
            }))
            .sort(
              (a: any, b: any) =>
                (a.order_index || 999) - (b.order_index || 999),
            )
        : [],
      updates: Array.isArray(campaign.updates) ? campaign.updates : [],
      comments: Array.isArray(campaign.comments) ? campaign.comments : [],
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error("API: Unhandled error fetching campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaign data",
        details: error,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const campaignId = (await params).id;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (
      Object.hasOwn(body, "verificationStatus") ||
      Object.hasOwn(body, "verification_status")
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign verification status can only be changed by the admin verification workflow",
        },
        { status: 403 },
      );
    }

    const profileWhere: Array<{ id: string } | { email: string }> = [];
    if (session.user.id) profileWhere.push({ id: session.user.id });
    if (session.user.email) profileWhere.push({ email: session.user.email });

    const currentProfile =
      profileWhere.length > 0
        ? await db.profile.findFirst({
            where: { OR: profileWhere },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          })
        : null;

    if (!currentProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Get the current campaign to check ownership
    const existingCampaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    const isOwner = existingCampaign.organizerId === currentProfile.id;
    const isActiveAdmin =
      currentProfile.role === "admin" && currentProfile.status === "active";

    if (!isOwner && !isActiveAdmin) {
      return NextResponse.json(
        {
          error: "You don't have permission to update this campaign",
        },
        { status: 403 },
      );
    }

    if (existingCampaign.campaignStatus === "cancelled") {
      return NextResponse.json(
        { error: "Cancelled campaigns cannot be updated" },
        { status: 400 },
      );
    }

    // Prepare the update data, extracting all valid fields from the body
    const {
      title,
      subtitle,
      description,
      beneficiariesDescription,
      category,
      categoryId,
      goalAmount,
      location,
      endDate,
      youtubeUrl,
      youtubeUrls,
      campaignStatus,
      recipient,
      recipientType,
      beneficiaryName,
      beneficiaryRelationship,
      legalEntityId,
      media,
      presentation,
    } = body;

    if (goalAmount !== undefined && Number(goalAmount) > 1000000) {
      return NextResponse.json(
        {
          error: "La meta no debe superar Bs. 1.000.000",
        },
        { status: 400 },
      );
    }

    if (
      campaignStatus !== undefined &&
      !Object.values(CampaignStatus).includes(campaignStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid campaign status" },
        { status: 400 },
      );
    }

    // Build the data object dynamically with only the fields that were provided
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (beneficiariesDescription !== undefined)
      updateData.beneficiariesDescription = beneficiariesDescription;
    if (category !== undefined) updateData.category = category;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (goalAmount !== undefined) updateData.goalAmount = goalAmount;
    if (location !== undefined) updateData.location = location;
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
    if (youtubeUrls !== undefined) updateData.youtubeUrls = youtubeUrls;

    let publishedForReviewAt: Date | null = null;
    const isPublishingCampaign =
      campaignStatus === CampaignStatus.active &&
      existingCampaign.campaignStatus === CampaignStatus.draft;
    const shouldSendReviewEmail =
      isPublishingCampaign && !existingCampaign.submittedForReviewAt;

    if (campaignStatus !== undefined) {
      if (campaignStatus === CampaignStatus.active) {
        if (existingCampaign.campaignStatus === CampaignStatus.draft) {
          updateData.campaignStatus = CampaignStatus.active;

          if (!existingCampaign.submittedForReviewAt) {
            publishedForReviewAt = new Date();
            updateData.submittedForReviewAt = publishedForReviewAt;
            updateData.reviewedAt = null;
          }
        } else if (existingCampaign.campaignStatus === CampaignStatus.active) {
          updateData.campaignStatus = CampaignStatus.active;
        } else {
          return NextResponse.json(
            {
              error: "Only draft or active campaigns can be published",
            },
            { status: 400 },
          );
        }
      } else {
        updateData.campaignStatus = campaignStatus;
      }
    }
    if (presentation !== undefined) updateData.presentation = presentation;

    // Handle recipient/beneficiary fields
    const nextRecipientType = recipientType ?? recipient;
    if (nextRecipientType !== undefined)
      updateData.recipientType = nextRecipientType;
    if (beneficiaryName !== undefined)
      updateData.beneficiaryName = beneficiaryName;
    if (beneficiaryRelationship !== undefined)
      updateData.beneficiaryRelationship = beneficiaryRelationship;
    if (legalEntityId !== undefined) updateData.legalEntityId = legalEntityId;

    const statusAffectsActiveCount =
      updateData.campaignStatus !== undefined &&
      existingCampaign.campaignStatus !== updateData.campaignStatus &&
      (isCountedCampaignStatus(existingCampaign.campaignStatus) ||
        isCountedCampaignStatus(updateData.campaignStatus));

    const campaign = await db.$transaction(async (tx) => {
      const updatedCampaign = await tx.campaign.update({
        where: {
          id: campaignId,
        },
        data: updateData,
      });

      if (statusAffectsActiveCount) {
        await refreshOrganizerActiveCampaignsCount(
          tx,
          existingCampaign.organizerId,
        );
      }

      return updatedCampaign;
    });

    if (shouldSendReviewEmail && publishedForReviewAt) {
      await notifyCampaignPublishedForReview({
        campaignId,
        campaignTitle: existingCampaign.title,
        organizerName: existingCampaign.organizer.name,
        organizerEmail: existingCampaign.organizer.email,
        submittedAt: publishedForReviewAt,
      });
    }

    // If media was provided, update the media records
    if (media && Array.isArray(media) && media.length > 0) {
      // Delete existing media
      await db.campaignMedia.deleteMany({
        where: { campaignId },
      });

      // Create new media
      await Promise.all(
        media.map(async (item: any) =>
          db.campaignMedia.create({
            data: {
              campaignId,
              mediaUrl: item.mediaUrl,
              type: item.type,
              isPrimary: item.isPrimary,
              orderIndex: item.orderIndex,
            },
          }),
        ),
      );
    }

    return NextResponse.json(
      {
        message: isPublishingCampaign
          ? "Campaign published successfully"
          : "Campaign updated successfully",
        pendingAdminReview: isPublishingCampaign,
        campaign,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 },
      );
    }

    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 },
      );
    }

    const campaignId = (await params).id;
    const existingCampaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        organizerId: true,
        campaignStatus: true,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );
    }

    if (existingCampaign.organizerId !== organizer.id) {
      return NextResponse.json(
        {
          error: "You don't have permission to delete this campaign",
        },
        { status: 403 },
      );
    }

    if (existingCampaign.campaignStatus === "cancelled") {
      return NextResponse.json(
        { message: "Campaign is already cancelled" },
        { status: 200 },
      );
    }

    if (existingCampaign.campaignStatus === "completed") {
      return NextResponse.json(
        {
          error: "Completed campaigns cannot be cancelled from this endpoint",
        },
        { status: 400 },
      );
    }

    if (
      existingCampaign.campaignStatus !== "draft" &&
      existingCampaign.campaignStatus !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Only draft or active campaigns can be cancelled from this endpoint",
        },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          campaignStatus: "cancelled",
        },
      });

      await refreshOrganizerActiveCampaignsCount(
        tx,
        existingCampaign.organizerId,
      );
    });

    return NextResponse.json(
      { message: "Campaign cancelled successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
