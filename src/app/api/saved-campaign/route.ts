import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// GET: Fetch all saved campaigns for the current user
export async function GET() {
  try {
    console.log("GET /api/saved-campaign: Fetching saved campaigns");

    // Get the current session using Supabase
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", {
      hasSession: !!session,
      error: sessionError ? sessionError.message : null,
      userEmail: session?.user?.email,
    });

    if (sessionError || !session?.user?.email) {
      console.error("Session error or no user found:", sessionError);
      return NextResponse.json(
        { error: "You must be logged in to view saved campaigns" },
        { status: 401 }
      );
    }

    // Get the user profile id from the email
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      console.error("Profile not found for email:", session.user.email);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("Found profile:", profile.id);

    // Fetch the saved campaigns with campaign details
    const savedCampaigns = await prisma.savedCampaign.findMany({
      where: {
        profileId: profile.id,
        status: "active",
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            createdAt: true,
            media: {
              where: {
                isPrimary: true,
              },
              select: {
                mediaUrl: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${savedCampaigns.length} saved campaigns`);

    // Format the response to match the expected structure
    const formattedCampaigns = savedCampaigns.map((saved) => ({
      id: saved.campaign.id,
      savedId: saved.id,
      title: saved.campaign.title,
      description: saved.campaign.description,
      imageUrl: saved.campaign.media[0]?.mediaUrl || "",
      category: saved.campaign.category,
      location: saved.campaign.location,
      createdAt: saved.campaign.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedCampaigns);
  } catch (error) {
    console.error("Error fetching saved campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved campaigns" },
      { status: 500 }
    );
  }
}

// POST: Save a campaign for the current user
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/saved-campaign: Saving campaign");

    const { campaignId } = await request.json();
    console.log("Request to save campaignId:", campaignId);

    if (
      !campaignId ||
      typeof campaignId !== "string" ||
      campaignId.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Valid campaign ID is required" },
        { status: 400 }
      );
    }

    // Get the current session using Supabase
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", {
      hasSession: !!session,
      error: sessionError ? sessionError.message : null,
      userEmail: session?.user?.email,
    });

    if (sessionError || !session?.user?.email) {
      console.error("Session error or no user found:", sessionError);
      return NextResponse.json(
        { error: "You must be logged in to save campaigns" },
        { status: 401 }
      );
    }

    // Get the user profile id from the email
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      console.error("Profile not found for email:", session.user.email);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("Found profile:", profile.id);

    // Check if the campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId.trim() },
    });

    if (!campaign) {
      console.error("Campaign not found:", campaignId);
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if the campaign is already saved
    const existingSave = await prisma.savedCampaign.findFirst({
      where: {
        profileId: profile.id,
        campaignId: campaignId.trim(),
        status: "active",
      },
    });

    if (existingSave) {
      console.log("Campaign already saved");
      return NextResponse.json(
        { error: "Campaign already saved" },
        { status: 400 }
      );
    }

    // Save the campaign
    const savedCampaign = await prisma.savedCampaign.create({
      data: {
        profileId: profile.id,
        campaignId: campaignId.trim(),
      },
    });

    console.log("Campaign saved successfully:", savedCampaign.id);
    return NextResponse.json(savedCampaign);
  } catch (error) {
    console.error("Error saving campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to save campaign",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a saved campaign for the current user
export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE /api/saved-campaign: Unsaving campaign");

    const { campaignId } = await request.json();
    console.log("Request to unsave campaignId:", campaignId);

    if (
      !campaignId ||
      typeof campaignId !== "string" ||
      campaignId.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Valid campaign ID is required" },
        { status: 400 }
      );
    }

    // Get the current session using Supabase
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Session check:", {
      hasSession: !!session,
      error: sessionError ? sessionError.message : null,
      userEmail: session?.user?.email,
    });

    if (sessionError || !session?.user?.email) {
      console.error("Session error or no user found:", sessionError);
      return NextResponse.json(
        { error: "You must be logged in to unsave campaigns" },
        { status: 401 }
      );
    }

    // Get the user profile id from the email
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      console.error("Profile not found for email:", session.user.email);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("Found profile:", profile.id);

    // Find the saved campaign
    const savedCampaign = await prisma.savedCampaign.findFirst({
      where: {
        profileId: profile.id,
        campaignId: campaignId.trim(),
        status: "active",
      },
    });

    if (!savedCampaign) {
      console.error("Saved campaign not found");
      return NextResponse.json(
        { error: "Saved campaign not found" },
        { status: 404 }
      );
    }

    // Delete the saved campaign (soft delete by changing status)
    await prisma.savedCampaign.update({
      where: { id: savedCampaign.id },
      data: { status: "inactive" },
    });

    console.log("Campaign unsaved successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to unsave campaign",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
