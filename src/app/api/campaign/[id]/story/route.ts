import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating just the story field
const storyUpdateSchema = z.object({
  // Story field corresponds to "Presentación de la campaña" in the form
  story: z.string().min(10).max(600),
});

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
    const validatedData = storyUpdateSchema.parse(body);

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

    // Update just the story field
    const campaign = await db.campaign.update({
      where: {
        id: (await params).id,
      },
      data: {
        story: validatedData.story,
      },
    });

    return NextResponse.json(
      { message: "Campaign story updated successfully", campaign },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating campaign story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
