import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { technicalAnonymousProfileExclusion } from "@/lib/donations/anonymous-donor";

export async function POST(request: NextRequest) {
  try {
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, target } = body;

    // Validate input
    if (!title || !content || !target) {
      return NextResponse.json(
        { error: "Title, content, and target are required" },
        { status: 400 }
      );
    }

    if (!["all", "donors", "organizers", "admins"].includes(target)) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Build query to get target users
    let whereClause: any = {
      status: "active",
      ...technicalAnonymousProfileExclusion(),
    };

    // Filter by audience if needed. Organizers are users with at least one campaign,
    // not a separate profile role.
    if (target === "organizers") {
      whereClause.campaigns = {
        some: {},
      };
    } else if (target === "admins") {
      whereClause.role = "admin";
    } else if (target === "donors") {
      whereClause.donations = {
        some: {
          paymentStatus: "completed",
          isAnonymous: false,
        },
      };
    }
    // For "all", we don't add additional filters

    // Get all target users
    const targetUsers = await prisma.profile.findMany({
      where: whereClause,
      select: { id: true },
    });

    const allEligibleUserIds = targetUsers.map((user) => user.id);

    if (allEligibleUserIds.length === 0) {
      return NextResponse.json(
        {
          message: "No eligible recipients found",
          recipientCount: 0,
        },
        { status: 200 }
      );
    }

    // Create notifications for all eligible users
    const notifications = allEligibleUserIds.map((userId) => ({
      userId,
      type: "general_news" as const,
      title,
      message: content,
      isRead: false,
      status: "active" as const,
    }));

    // Batch create notifications
    await prisma.notification.createMany({
      data: notifications,
    });

    // Create a system notification log for admin tracking
    try {

      const logResult = await prisma.systemNotificationLog.create({
        data: {
          adminId: session.user.id,
          title,
          content,
          target,
          recipientCount: allEligibleUserIds.length,
        },
      });
    } catch (logError) {
      console.error("Error creating system notification log:", logError);
      // Don't fail the entire operation if logging fails
    }

    return NextResponse.json({
      success: true,
      recipientCount: allEligibleUserIds.length,
      message: `Notification sent to ${allEligibleUserIds.length} users`,
    });
  } catch (error) {
    console.error("Error sending system notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
