import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
      return NextResponse.json({ campaigns: [] });
    }

    // Get user's unverified campaigns
    const { data: campaigns, error } = await supabase
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
      .eq("organizer_id", session.user.id)
      .eq("campaign_status", "active") // Only active campaigns
      .or(
        "verification_status.eq.pending,verification_status.eq.not_verified,verification_status.is.null"
      ) // No already verified campaigns
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch campaigns from database",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Transform the campaigns data to match the expected format
    const transformedCampaigns = campaigns?.map((campaign) => {
      // Find the primary image or the first image in the media array
      const primaryImage =
        campaign.media?.find((m: any) => m.is_primary)?.media_url ||
        campaign.media?.[0]?.media_url ||
        "/amboro-main.jpg"; // Default fallback image

      return {
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
    });

    return NextResponse.json({
      campaigns: transformedCampaigns || [],
    });
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
