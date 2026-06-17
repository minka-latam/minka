import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  formatProfileForApi,
  getProfileById,
} from "@/lib/profile-utils";

export async function GET() {
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

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Fetch with raw SQL because OAuth users can have nullable completion
    // fields while the generated Prisma client may lag.
    const profile = await getProfileById(user.id);

    if (!profile) {
      return NextResponse.json(
        { authenticated: true, profileComplete: false, user },
        { status: 200 }
      );
    }

    // Return the session and profile data
    return NextResponse.json(
      {
        authenticated: true,
        profileComplete: true,
        user,
        profile: formatProfileForApi(profile),
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
