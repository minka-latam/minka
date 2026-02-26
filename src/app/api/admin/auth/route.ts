import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { authenticated: false, isAdmin: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile) {
      return NextResponse.json(
        { authenticated: true, isAdmin: false, message: "Profile not found" },
        { status: 403 }
      );
    }

    const isAdmin = profile.role === "admin";

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        profilePicture: profile.profilePicture,
      },
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      {
        authenticated: false,
        isAdmin: false,
        error: "Server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
