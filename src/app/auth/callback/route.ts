import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookies(),
      });

      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
        return NextResponse.redirect(
          new URL(
            `/sign-in?error=${encodeURIComponent(error.message)}`,
            request.url
          )
        );
      }

      // For password reset flows, redirect to the processing page which will set the client-side trigger
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-processing", request.url));
      }

      if (!data.user) {
        console.error("No user data returned after authentication");
        return NextResponse.redirect(
          new URL(`/sign-in?error=Authentication failed`, request.url)
        );
      }

      console.log("Successfully authenticated user:", data.user.id);

      // Check for returnUrl in the callback URL
      const returnUrl = requestUrl.searchParams.get("returnUrl");

      // Check if the user already has a profile
      try {
        const existingProfile = await prisma.profile.findUnique({
          where: { id: data.user.id },
        });

        // If the user doesn't have a profile, create one
        if (!existingProfile) {
          console.log("Creating new profile for user:", data.user.id);

          // Get user metadata from Supabase
          const { data: userData } = await supabase.auth.getUser();
          const userMetadata = userData.user?.user_metadata;

          // Create a profile in the database
          await prisma.profile.create({
            data: {
              id: data.user.id,
              name:
                userMetadata?.full_name ||
                `${userMetadata?.first_name || ""} ${userMetadata?.last_name || ""}`.trim() ||
                data.user.email?.split("@")[0] ||
                "User",
              email: data.user.email || "",
              passwordHash: "", // We don't store the actual password
              profilePicture: userMetadata?.avatar_url || "",
              identityNumber: "", // This would need to be collected later
              phone: userMetadata?.phone || "",
              birthDate: new Date(), // This would need to be collected later
              address: "",
              bio: "",
              location: "",
              joinDate: new Date(),
              status: "active",
              verificationStatus: true,
            },
          });

          console.log("Successfully created profile for user:", data.user.id);
        } else {
          console.log("Using existing profile for user:", data.user.id);
          // Update verification status for existing users
          await prisma.profile.update({
            where: { id: data.user.id },
            data: { verificationStatus: true },
          });
        }
      } catch (profileError) {
        console.error("Error handling user profile:", profileError);
        // Continue to redirect even if profile creation fails
      }

      // Redirect to returnUrl if provided, otherwise to dashboard
      if (returnUrl) {
        console.log(`Redirecting to returnUrl: ${returnUrl}`);
        return NextResponse.redirect(new URL(returnUrl, request.url));
      } else {
        console.log("Redirecting to dashboard (no returnUrl)");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      console.error("Unexpected error during authentication callback:", error);
      return NextResponse.redirect(
        new URL(
          `/sign-in?error=${encodeURIComponent("Authentication failed")}`,
          request.url
        )
      );
    }
  } else {
    console.error("No code parameter provided in callback URL");
    return NextResponse.redirect(
      new URL(`/sign-in?error=Missing authentication code`, request.url)
    );
  }
}
