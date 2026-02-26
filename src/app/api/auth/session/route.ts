import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });

    // Get the session from Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Fetch the user's profile from the database
    const profile = await prisma.profile.findUnique({
      where: { id: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { authenticated: true, profileComplete: false, user: session.user },
        { status: 200 }
      );
    }

    // Return the session and profile data
    return NextResponse.json(
      {
        authenticated: true,
        profileComplete: true,
        user: session.user,
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to retrieve session", details: errorMessage },
      { status: 500 }
    );
  }
}
