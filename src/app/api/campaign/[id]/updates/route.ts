import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;

    // Get the updates for this campaign
    const updates = await db.campaignUpdate.findMany({
      where: {
        campaignId: campaignId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response to match the front-end expectations
    const formattedUpdates = updates.map((update) => ({
      id: update.id,
      title: update.title,
      message: update.content, // Map content to message for front-end
      youtubeUrl: update.youtubeUrl, // Include youtubeUrl if it exists, otherwise null
      imageUrl: update.imageUrl, // Include imageUrl if it exists, otherwise null
      campaignId: update.campaignId,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
      status: update.status,
    }));

    return NextResponse.json(formattedUpdates);
  } catch (error) {
    console.error("Error fetching campaign updates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const campaignId = (await params).id;
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
        id: campaignId,
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
        { error: "You don't have permission to post updates to this campaign" },
        { status: 403 }
      );
    }

    // Create the new update
    const { title, message, youtubeUrl, imageUrl } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    // Validate that at least one of imageUrl or youtubeUrl is provided
    if (!imageUrl && !youtubeUrl) {
      return NextResponse.json(
        {
          error:
            "Either an image or a YouTube URL is required for announcements",
        },
        { status: 400 }
      );
    }

    try {
      // Try to create with all fields (youtubeUrl and imageUrl might not exist yet in the schema)
      console.log("Creating update with data:", {
        title,
        content: message,
        youtubeUrl: youtubeUrl || null,
        imageUrl: imageUrl || null,
        campaignId,
      });

      const newUpdate = await db.campaignUpdate.create({
        data: {
          title,
          content: message,
          youtubeUrl: youtubeUrl || null,
          imageUrl: imageUrl || null,
          campaignId,
          status: "active",
        },
      });

      console.log("Created update in database:", newUpdate);

      // Transform the response to match what the front-end expects
      const formattedUpdate = {
        id: newUpdate.id,
        title: newUpdate.title,
        message: newUpdate.content, // Map content to message for front-end
        youtubeUrl: newUpdate.youtubeUrl, // Use the stored value from DB
        imageUrl: newUpdate.imageUrl, // Use the stored value from DB
        campaignId: newUpdate.campaignId,
        createdAt: newUpdate.createdAt,
        updatedAt: newUpdate.updatedAt,
        status: newUpdate.status,
      };

      return NextResponse.json(formattedUpdate);
    } catch (schemaError) {
      console.error("Schema error details:", schemaError);
      console.error("Trying alternative approach without media fields");

      // If the previous attempt failed due to schema issues, try without the new fields
      const newUpdate = await db.campaignUpdate.create({
        data: {
          title,
          content: message,
          campaignId,
          status: "active",
        },
      });

      console.log("Created update (fallback) in database:", newUpdate);

      // Then separately try to update with the media fields
      try {
        const updatedUpdate = await db.campaignUpdate.update({
          where: { id: newUpdate.id },
          data: {
            youtubeUrl: youtubeUrl || null,
            imageUrl: imageUrl || null,
          },
        });

        console.log("Updated with media fields:", updatedUpdate);

        // Transform the response using the updated data
        const formattedUpdate = {
          id: updatedUpdate.id,
          title: updatedUpdate.title,
          message: updatedUpdate.content,
          youtubeUrl: updatedUpdate.youtubeUrl,
          imageUrl: updatedUpdate.imageUrl,
          campaignId: updatedUpdate.campaignId,
          createdAt: updatedUpdate.createdAt,
          updatedAt: updatedUpdate.updatedAt,
          status: updatedUpdate.status,
        };

        return NextResponse.json(formattedUpdate);
      } catch (updateError) {
        console.error("Failed to update with media fields:", updateError);

        // If update fails, return what we have
        const formattedUpdate = {
          id: newUpdate.id,
          title: newUpdate.title,
          message: newUpdate.content,
          youtubeUrl: youtubeUrl || null,
          imageUrl: imageUrl || null,
          campaignId: newUpdate.campaignId,
          createdAt: newUpdate.createdAt,
          updatedAt: newUpdate.updatedAt,
          status: newUpdate.status,
        };

        return NextResponse.json(formattedUpdate);
      }
    }
  } catch (error) {
    console.error("Error creating campaign update:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE an update
export async function DELETE(
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

    const campaignId = (await params).id;
    const { searchParams } = new URL(req.url);
    const updateId = searchParams.get("updateId");

    if (!updateId) {
      return NextResponse.json(
        { error: "Update ID is required" },
        { status: 400 }
      );
    }

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
        id: campaignId,
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
        {
          error:
            "You don't have permission to delete updates from this campaign",
        },
        { status: 403 }
      );
    }

    try {
      // Instead of hard delete, set status to inactive
      const updatedUpdate = await db.campaignUpdate.update({
        where: {
          id: updateId,
          campaignId: campaignId,
        },
        data: {
          status: "inactive",
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error updating campaign update status:", error);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting campaign update:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
