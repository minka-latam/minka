import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createCommentNotification } from "@/lib/notifications";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get the comments for this campaign
    const comments = await db.comment.findMany({
      where: {
        campaignId: campaignId,
        status: "active",
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await db.comment.count({
      where: {
        campaignId: campaignId,
        status: "active",
      },
    });

    return NextResponse.json({
      comments,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching campaign comments:", error);
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

    // Find the user profile by email
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if the campaign exists and get campaign info for notification
    const existingCampaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
      },
      select: {
        id: true,
        title: true,
        organizerId: true,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Create the new comment
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const newComment = await db.comment.create({
      data: {
        campaignId,
        profileId: profile.id,
        status: "active",
        message: content,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Create notification for campaign owner (only if commenter is not the owner)
    if (profile.id !== existingCampaign.organizerId) {
      try {
        await createCommentNotification(
          newComment.id,
          existingCampaign.id,
          existingCampaign.organizerId,
          profile.name,
          existingCampaign.title,
          content
        );
      } catch (notificationError) {
        // Log error but don't fail the comment creation
        console.error(
          "Failed to create comment notification:",
          notificationError
        );
      }
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Error creating campaign comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a comment (only for campaign owner or comment author)
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
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Find the user profile by email
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Get the comment to check ownership
    const comment = await db.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Get the campaign to check if user is the campaign owner
    const campaign = await db.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // User can delete the comment if they are the comment author or the campaign owner
    if (
      comment.profileId !== profile.id &&
      campaign.organizerId !== profile.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Instead of hard delete, set status to inactive
    const updatedComment = await db.comment.update({
      where: {
        id: commentId,
      },
      data: {
        status: "inactive",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
