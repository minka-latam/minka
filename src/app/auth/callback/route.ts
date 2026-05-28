import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ensureProfileForUser,
  getProfileById,
  profileNeedsCompletion,
} from "@/lib/profile-utils";
import { getSafeAuthRedirectPath } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(errorDescription || error)}`,
        request.url,
      ),
    );
  }

  const type = requestUrl.searchParams.get("type");

  const next = getSafeAuthRedirectPath(requestUrl.searchParams.get("next"));

  if (!code) {
    console.error("No code parameter provided in callback URL");
    return NextResponse.redirect(
      new URL("/sign-in?error=Missing authentication code", request.url),
    );
  }

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
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(
        new URL(
          `/sign-in?error=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
    }

    // Password recovery creates a temporary session that can update the password.
    // Send the user directly to the reset form instead of the dashboard.
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }

    const amr = data.session?.user?.app_metadata?.amr;
    const isRecovery = Array.isArray(amr)
      ? amr.some((a: any) => a.method === "recovery")
      : false;
    if (isRecovery) {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }

    if (!data.user) {
      return NextResponse.redirect(
        new URL("/sign-in?error=Authentication failed", request.url),
      );
    }

    const userMetadata = data.user.user_metadata ?? {};
    const isGoogleAuth =
      data.user.app_metadata?.provider === "google" ||
      userMetadata.iss === "https://accounts.google.com";

    let shouldCompleteProfile = false;

    // Handle profile creation for new OAuth users
    try {
      const existingProfile = await getProfileById(data.user.id);
      const profile = await ensureProfileForUser(data.user);

      shouldCompleteProfile =
        isGoogleAuth && !existingProfile && profileNeedsCompletion(profile);
      // Note: we no longer update verificationStatus on existing profiles
      // as user verification is not currently implemented
    } catch (profileError) {
      console.error("Error handling user profile:", profileError);
      // Redirect to sign-in if profile creation fails
      // to avoid a logged-in user with no profile
      return NextResponse.redirect(
        new URL(
          "/sign-in?error=Profile setup failed, please try again",
          request.url,
        ),
      );
    }

    const redirectUrl = new URL(next, request.url);
    if (shouldCompleteProfile) {
      redirectUrl.searchParams.set("complete_profile", "1");
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error during authentication callback:", error);
    return NextResponse.redirect(
      new URL("/sign-in?error=Authentication failed", request.url),
    );
  }
}
