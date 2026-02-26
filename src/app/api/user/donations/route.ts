import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({
      cookies: (() => cookieStore) as any,
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "6");

    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch donations from Supabase
    const {
      data: donations,
      count,
      error,
    } = await supabase
      .from("donations")
      .select(
        `
        *,
        campaign:campaigns(id, title, category, media:campaign_media(media_url))
      `,
        { count: "exact" }
      )
      .eq("donor_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match expected format
    const transformedDonations = donations?.map((donation) => {
      return {
        ...donation,
        campaign: {
          ...donation.campaign,
          media:
            donation.campaign?.media?.map((item: { media_url: string }) => ({
              mediaUrl: item.media_url,
            })) || [],
        },
      };
    });

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return NextResponse.json({
      donations: transformedDonations,
      meta: {
        currentPage: page,
        pageSize,
        totalItems: count,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching user donations:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
