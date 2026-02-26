import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
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
    };

    // Filter by role if needed
    if (target === "organizers") {
      whereClause.role = "organizer";
    } else if (target === "admins") {
      whereClause.role = "admin";
    } else if (target === "donors") {
      // For donors, we'll target users who have made donations
      const donorIds = await prisma.donation.findMany({
        where: { status: "active" },
        select: { donorId: true },
        distinct: ["donorId"],
      });
      whereClause.id = { in: donorIds.map((d) => d.donorId) };
    }
    // For "all", we don't add additional filters

    // Get all target users
    const targetUsers = await prisma.profile.findMany({
      where: whereClause,
      select: { id: true },
    });

    // Filter users who have opted in for general news notifications
    // (we'll only send system notifications to users who want news updates)
    const usersWithNewsPrefs = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: targetUsers.map((u) => u.id) },
        newsUpdates: true,
        status: "active",
      },
      select: { userId: true },
    });

    const eligibleUserIds = usersWithNewsPrefs.map((p) => p.userId);

    // Also include users without preferences (default to receiving news)
    const usersWithoutPrefs = targetUsers.filter(
      (user) => !usersWithNewsPrefs.some((pref) => pref.userId === user.id)
    );

    // Add users without preferences to eligible users (they get news by default)
    const allEligibleUserIds = [
      ...eligibleUserIds,
      ...usersWithoutPrefs.map((u) => u.id),
    ];

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
      console.log("Creating system notification log...");
      console.log(
        "Prisma systemNotificationLog available:",
        !!prisma.systemNotificationLog
      );

      const logResult = await prisma.systemNotificationLog.create({
        data: {
          adminId: session.user.id,
          title,
          content,
          target,
          recipientCount: allEligibleUserIds.length,
        },
      });

      console.log(
        "System notification log created successfully:",
        logResult.id
      );
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
