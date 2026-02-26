import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { MediaType } from "@prisma/client";
import { z } from "zod";

// Schema for media creation
const mediaCreateSchema = z.object({
  mediaUrl: z.string().url(),
  type: z.enum(["image", "video"]),
  isPrimary: z.boolean().optional().default(false),
  orderIndex: z.number().int().min(0).optional(),
});

// Schema for bulk operations
const mediaBulkSchema = z.array(
  z.object({
    id: z.string().optional(), // Optional for new items
    mediaUrl: z.string().url(),
    type: z.enum(["image", "video"]),
    isPrimary: z.boolean(),
    orderIndex: z.number().int().min(0),
  })
);

// Schema for primary image setting
const setPrimarySchema = z.object({
  mediaId: z.string(),
});

// Schema for media deletion
const deleteMediaSchema = z.object({
  mediaId: z.string(),
});

// GET: Fetch all media for a campaign
export async function GET(
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

    // Get the campaign media
    const media = await db.campaignMedia.findMany({
      where: {
        campaignId: (await params).id,
        status: "active",
      },
      orderBy: {
        orderIndex: "asc",
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching campaign media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add new media to a campaign
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

    // Find the user profile
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the campaign exists and user has permission
    const campaign = await db.campaign.findUnique({
      where: {
        id: (await params).id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is the campaign organizer or an admin
    if (campaign.organizerId !== profile.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to update this campaign" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = mediaCreateSchema.parse(body);

    // Check if this is the first media - if so, make it primary
    const existingMedia = await db.campaignMedia.findMany({
      where: {
        campaignId: (await params).id,
      },
    });

    // Determine if this should be primary
    const isPrimary = validatedData.isPrimary || existingMedia.length === 0;

    // If this will be primary, reset all others
    if (isPrimary) {
      await db.campaignMedia.updateMany({
        where: {
          campaignId: (await params).id,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Determine order index if not provided
    const orderIndex = validatedData.orderIndex ?? existingMedia.length;

    // Create the new media
    const media = await db.campaignMedia.create({
      data: {
        campaignId: (await params).id,
        mediaUrl: validatedData.mediaUrl,
        type: validatedData.type as MediaType,
        isPrimary: isPrimary,
        orderIndex: orderIndex,
        status: "active",
      },
    });

    return NextResponse.json(
      { message: "Media added successfully", media },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error adding campaign media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update all media for a campaign (bulk operation)
export async function PUT(
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

    // Find the user profile
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the campaign exists and user has permission
    const campaign = await db.campaign.findUnique({
      where: {
        id: (await params).id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is the campaign organizer or an admin
    if (campaign.organizerId !== profile.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to update this campaign" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = mediaBulkSchema.parse(body);

    // Delete all existing media for this campaign
    await db.campaignMedia.deleteMany({
      where: {
        campaignId: (await params).id,
      },
    });

    // Create all media from the provided array
    const mediaPromises = validatedData.map(async (item, index) =>
      db.campaignMedia.create({
        data: {
          campaignId: (await params).id,
          mediaUrl: item.mediaUrl,
          type: item.type as MediaType,
          isPrimary: item.isPrimary,
          orderIndex: item.orderIndex,
          status: "active",
        },
      })
    );

    const createdMedia = await Promise.all(mediaPromises);

    return NextResponse.json(
      { message: "Media updated successfully", media: createdMedia },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating campaign media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update media properties (like setting primary image)
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

    // Find the user profile
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the campaign exists and user has permission
    const campaign = await db.campaign.findUnique({
      where: {
        id: (await params).id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is the campaign organizer or an admin
    if (campaign.organizerId !== profile.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to update this campaign" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Handle "set primary" operation
    if (body.action === "set_primary") {
      const validatedData = setPrimarySchema.parse(body);

      // First, unset all primary flags
      await db.campaignMedia.updateMany({
        where: {
          campaignId: (await params).id,
        },
        data: {
          isPrimary: false,
        },
      });

      // Then, set the specified one as primary
      const media = await db.campaignMedia.update({
        where: {
          id: validatedData.mediaId,
        },
        data: {
          isPrimary: true,
        },
      });

      return NextResponse.json(
        { message: "Primary media set successfully", media },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating campaign media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific media from a campaign
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

    // Find the user profile
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the campaign exists and user has permission
    const campaign = await db.campaign.findUnique({
      where: {
        id: (await params).id,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is the campaign organizer or an admin
    if (campaign.organizerId !== profile.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to update this campaign" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const mediaId = url.searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "Missing mediaId parameter" },
        { status: 400 }
      );
    }

    // Find the media record to check if it exists
    const mediaRecord = await db.campaignMedia.findUnique({
      where: {
        id: mediaId,
      },
    });

    if (!mediaRecord) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if this is a primary image
    const isPrimary = mediaRecord.isPrimary;

    // Delete the media
    await db.campaignMedia.delete({
      where: {
        id: mediaId,
      },
    });

    // If this was the primary image and there are other images, make another one primary
    if (isPrimary) {
      const nextMedia = await db.campaignMedia.findFirst({
        where: {
          campaignId: (await params).id,
        },
        orderBy: {
          orderIndex: "asc",
        },
      });

      if (nextMedia) {
        await db.campaignMedia.update({
          where: {
            id: nextMedia.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
