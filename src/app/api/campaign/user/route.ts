import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    // Create Supabase client with properly handled cookies
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

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("User campaigns request rejected: session error");
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json({ campaigns: [] });
    }

    // Get user's campaigns with media join for primary image
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        title,
        subtitle,
        description,
        category,
        location,
        collected_amount,
        goal_amount,
        campaign_status,
        created_at,
        submitted_for_review_at,
        verification_status,
        organizer_id,
        media:campaign_media(
          media_url,
          is_primary
        )
      `
      )
      .eq("organizer_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error fetching campaigns:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaigns from database" },
        { status: 500 }
      );
    }

    const campaignIds = campaigns?.map((campaign) => campaign.id) || [];
    const { data: verificationRequests, error: verificationError } =
      campaignIds.length > 0
        ? await supabase
            .from("campaign_verifications")
            .select("campaign_id, verification_status")
            .in("campaign_id", campaignIds)
        : { data: [], error: null };

    if (verificationError) {
      console.error(
        "Database error fetching campaign verification requests:",
        verificationError
      );
    }

    const verificationStatusByCampaignId = new Map(
      (verificationRequests || []).map((request) => [
        request.campaign_id,
        request.verification_status,
      ])
    );

    // Transform the campaigns data to match the expected format
    const transformedCampaigns = campaigns?.map((campaign) => {
      const media =
        campaign.media as
          | { is_primary?: boolean; media_url?: string | null }[]
          | null
          | undefined;
      // Find the primary image or the first image in the media array
      const primaryImage =
        media?.find((item) => item.is_primary)?.media_url ||
        media?.[0]?.media_url ||
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
        description: campaign.subtitle || campaign.description,
        created_at: campaign.created_at,
        submitted_for_review_at: campaign.submitted_for_review_at,
        verification_status: campaign.verification_status,
        verification_request_status:
          verificationStatusByCampaignId.get(campaign.id) || null,
        organizer_id: campaign.organizer_id,
      };
    });

    return NextResponse.json({
      campaigns: transformedCampaigns || [],
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Server error fetching user campaigns:", error);
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
