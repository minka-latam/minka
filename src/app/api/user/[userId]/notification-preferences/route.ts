import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Get the user session to validate authentication
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only access their own preferences
    if (session.user.id !== (await params).userId) {
      // Check if the requesting user is an admin
      const requestingUser = await prisma.profile.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!requestingUser || requestingUser.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - You can only access your own preferences" },
          { status: 403 }
        );
      }
    }

    // Fetch the notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: (await params).userId },
    });

    // If no preferences found, return defaults
    if (!preferences) {
      return NextResponse.json(
        {
          preferences: {
            newsUpdates: false,
            campaignUpdates: true,
          },
        },
        { status: 200 }
      );
    }

    // Return the preferences
    return NextResponse.json(
      {
        preferences: {
          newsUpdates: preferences.newsUpdates,
          campaignUpdates: preferences.campaignUpdates,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Get the user session to validate authentication
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only update their own preferences
    if (session.user.id !== (await params).userId) {
      // Check if the requesting user is an admin
      const requestingUser = await prisma.profile.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!requestingUser || requestingUser.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - You can only update your own preferences" },
          { status: 403 }
        );
      }
    }

    // Parse the request body
    const requestData = await request.json();

    if (
      typeof requestData.newsUpdates !== "boolean" ||
      typeof requestData.campaignUpdates !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid preference values" },
        { status: 400 }
      );
    }

    // Update the notification preferences
    await prisma.notificationPreference.upsert({
      where: { userId: (await params).userId },
      create: {
        userId: (await params).userId,
        newsUpdates: requestData.newsUpdates,
        campaignUpdates: requestData.campaignUpdates,
      },
      update: {
        newsUpdates: requestData.newsUpdates,
        campaignUpdates: requestData.campaignUpdates,
      },
    });

    // Return success
    return NextResponse.json(
      {
        message: "Notification preferences updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
