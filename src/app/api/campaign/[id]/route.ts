import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

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
  description: string;
  story: string;
  beneficiaries_description?: string;
  location: string;
  goal_amount: number;
  collected_amount: number;
  donor_count: number;
  percentage_funded: number;
  days_remaining: number;
  verification_status?: boolean;
  created_at?: string;
  campaign_status?: string;
  organizer: OrganizerProfile | null;
  media: CampaignMedia[];
  updates?: CampaignUpdate[];
  comments?: CampaignComment[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  console.log(`API: Fetching campaign with ID: ${id}`);

  if (!id) {
    console.error("API: Campaign ID is required but not provided");
    return NextResponse.json(
      { error: "Campaign ID is required" },
      { status: 400 }
    );
  }

  try {
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    console.log(`API: Created supabase client for campaign: ${id}`);

    // Fetch campaign data with organizer profile and campaign media
    console.log(`API: Executing supabase query for campaign: ${id}`);
    const { data, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        `
        id, 
        title, 
        description,
        story,
        beneficiaries_description,
        location,
        goal_amount,
        collected_amount,
        donor_count,
        percentage_funded,
        days_remaining,
        verification_status,
        created_at,
        campaign_status,
        organizer:profiles!organizer_id(id, name, location, profile_picture, join_date, active_campaigns_count, bio),
        media:campaign_media(id, media_url, is_primary, type, order_index),
        updates:campaign_updates(id, title, content, image_url, youtube_url, created_at),
        comments:comments(
          id,
          message,
          created_at,
          profile:profiles(id, name)
        )
      `
      )
      .eq("id", id)
      .single();

    if (campaignError) {
      console.error(
        `API: Error fetching campaign data: ${campaignError.message}`,
        campaignError
      );

      // If not found, return 404
      if (campaignError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: campaignError.message, details: campaignError },
        { status: 500 }
      );
    }

    if (!data) {
      console.error(`API: No data found for campaign: ${id}`);
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    console.log(`API: Successfully fetched campaign: ${data.title}`);
    const campaign = data as any;

    // Format the response with proper type handling
    const formattedCampaign: Campaign = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      story: campaign.story,
      beneficiaries_description: campaign.beneficiaries_description,
      location: campaign.location,
      goal_amount: campaign.goal_amount,
      collected_amount: campaign.collected_amount,
      donor_count: campaign.donor_count,
      percentage_funded: campaign.percentage_funded,
      days_remaining: campaign.days_remaining,
      verification_status: campaign.verification_status,
      created_at: campaign.created_at,
      campaign_status: campaign.campaign_status,
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
          .sort((a: any, b: any) => (a.order_index || 999) - (b.order_index || 999))
      : [],
      updates: Array.isArray(campaign.updates) ? campaign.updates : [],
      comments: Array.isArray(campaign.comments) ? campaign.comments : [],
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error("API: Unhandled error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign data", details: error },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Find the organizer profile by email
    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    // Get the current campaign to check ownership
    const existingCampaign = await db.campaign.findUnique({
      where: {
        id: (await params).id,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Ensure the user owns the campaign
    if (existingCampaign.organizerId !== organizer.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this campaign" },
        { status: 403 }
      );
    }

    // Prepare the update data, extracting all valid fields from the body
    const {
      title,
      description,
      story,
      beneficiariesDescription,
      category,
      categoryId,
      goalAmount,
      location,
      endDate,
      youtubeUrl,
      youtubeUrls,
      campaignStatus,
      verificationStatus,
      recipient,
      recipientType,
      beneficiaryName,
      beneficiaryRelationship,
      beneficiaryReason,
      legalEntityId,
      media,
      presentation,
    } = body;

    if (
      goalAmount !== undefined &&
      Number(goalAmount) > 150000
    ) {
      return NextResponse.json(
        {
          error:
            "Goal amount cannot exceed 150000",
        },
        { status: 400 }
      );
    }

    // Build the data object dynamically with only the fields that were provided
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (story !== undefined) updateData.story = story; // Story field = "Presentación de la campaña"
    if (beneficiariesDescription !== undefined)
      updateData.beneficiariesDescription = beneficiariesDescription;
    if (category !== undefined) updateData.category = category;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (goalAmount !== undefined) updateData.goalAmount = goalAmount;
    if (location !== undefined) updateData.location = location;
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
    if (youtubeUrls !== undefined) updateData.youtubeUrls = youtubeUrls;
    if (campaignStatus !== undefined)
      updateData.campaignStatus = campaignStatus;
    if (verificationStatus !== undefined)
      updateData.verificationStatus = verificationStatus;
    if (presentation !== undefined) updateData.presentation = presentation;

    // Handle recipient/beneficiary fields
    if (recipientType !== undefined) updateData.recipientType = recipientType;
    if (beneficiaryName !== undefined) updateData.beneficiaryName = beneficiaryName;
    if (beneficiaryRelationship !== undefined) updateData.beneficiaryRelationship = beneficiaryRelationship;
    if (beneficiaryReason !== undefined) updateData.beneficiaryReason = beneficiaryReason;
    if (legalEntityId !== undefined) updateData.legalEntityId = legalEntityId;

    // Only set verification date if explicitly verifying the campaign
    if (verificationStatus === true) {
      updateData.verificationDate = new Date();
    }

    // Update campaign with all provided fields
    const campaign = await db.campaign.update({
      where: {
        id: (await params).id,
      },
      data: updateData,
    });

    // If media was provided, update the media records
    if (media && Array.isArray(media) && media.length > 0) {
      // Delete existing media
      await db.campaignMedia.deleteMany({
        where: { campaignId: (await params).id },
      });

      // Create new media
      await Promise.all(
        media.map(async (item: any) =>
          db.campaignMedia.create({
            data: {
              campaignId: (await params).id,
              mediaUrl: item.mediaUrl,
              type: item.type,
              isPrimary: item.isPrimary,
              orderIndex: item.orderIndex,
            },
          })
        )
      );
    }

    return NextResponse.json(
      { message: "Campaign updated successfully", campaign },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
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
        { status: 404 }
      );
    }

    if (existingCampaign.organizerId !== organizer.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this campaign" },
        { status: 403 }
      );
    }

    if (
      existingCampaign.campaignStatus !== "draft" &&
      existingCampaign.campaignStatus !== "active"
    ) {
      return NextResponse.json(
        {
          error:
            "Only draft or active campaigns can be deleted from this endpoint",
        },
        { status: 400 }
      );
    }

    await db.campaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json(
      { message: "Campaign deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
