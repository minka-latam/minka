import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("id");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: "Authentication error", message: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get campaign details
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        title,
        description,
        category,
        location,
        collected_amount,
        goal_amount,
        campaign_status,
        description,
        created_at,
        verification_status,
        organizer_id,
        media:campaign_media(
          media_url,
          is_primary
        )
      `
      )
      .eq("id", campaignId)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch campaign from database",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if the user is the organizer
    if (campaign.organizer_id !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this campaign's details" },
        { status: 403 }
      );
    }

    // Find the primary image or the first image in the media array
    const primaryImage =
      campaign.media?.find((m: any) => m.is_primary)?.media_url ||
      campaign.media?.[0]?.media_url ||
      "/amboro-main.jpg"; // Default fallback image

    // Transform the campaign data
    const transformedCampaign = {
      id: campaign.id,
      title: campaign.title,
      image_url: primaryImage,
      category: campaign.category,
      location: campaign.location,
      current_amount: parseFloat(campaign.collected_amount) || 0,
      goal_amount: parseFloat(campaign.goal_amount) || 0,
      status: campaign.campaign_status,
      description: campaign.description,
      created_at: campaign.created_at,
      verification_status: campaign.verification_status,
      organizer_id: campaign.organizer_id,
    };

    return NextResponse.json({ campaign: transformedCampaign });
  } catch (error) {
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
