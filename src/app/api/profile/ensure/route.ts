import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ensureProfileForUser,
  formatProfileForApi,
  profileNeedsCompletion,
} from "@/lib/profile-utils";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
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

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await ensureProfileForUser(user);

    return NextResponse.json(
      {
        profile: formatProfileForApi(profile),
        profileComplete: !profileNeedsCompletion(profile),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile ensure error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to ensure profile",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
