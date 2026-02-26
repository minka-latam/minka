import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const donationId = (await params).id;

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

    // Fetch the specific donation
    const { data: donation, error } = await supabase
      .from("donations")
      .select(
        `
        *,
        campaign:campaigns(
          id, 
          title, 
          description,
          story,
          category,
          goal_amount,
          collected_amount,
          percentage_funded,
          media:campaign_media(id, media_url, type, is_primary)
        ),
        donor:profiles(id, name, email, profile_picture)
      `
      )
      .eq("id", donationId)
      .eq("donor_id", session.user.id)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      // If it's not found or not associated with the user
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Donation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match expected format
    const transformedDonation = {
      ...donation,
      campaign: {
        ...donation.campaign,
        media:
          donation.campaign?.media?.map(
            (item: {
              media_url: string;
              id: string;
              type: string;
              is_primary: boolean;
            }) => ({
              mediaUrl: item.media_url,
              id: item.id,
              type: item.type,
              isPrimary: item.is_primary,
            })
          ) || [],
      },
    };

    return NextResponse.json({ donation: transformedDonation });
  } catch (error) {
    console.error("Error fetching donation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch donation details" },
      { status: 500 }
    );
  }
}
