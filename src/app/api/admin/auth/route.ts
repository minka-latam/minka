import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
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

