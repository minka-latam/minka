import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!code) {
    console.error("No code parameter provided in callback URL");
    return NextResponse.redirect(
      new URL("/sign-in?error=Missing authentication code", request.url)
    );
  }

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    // ✅ Password recovery — redirect to reset password page
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }

    if (!data.user) {
      return NextResponse.redirect(
        new URL("/sign-in?error=Authentication failed", request.url)
      );
    }

    // Handle profile creation for new OAuth users
    try {
      const existingProfile = await prisma.profile.findUnique({
        where: { id: data.user.id },
      });

      if (!existingProfile) {
        const { data: userData } = await supabase.auth.getUser();
        const userMetadata = userData.user?.user_metadata;

        await prisma.profile.create({
          data: {
            id: data.user.id,
            name:
              userMetadata?.full_name ||
              `${userMetadata?.first_name || ""} ${userMetadata?.last_name || ""}`.trim() ||
              data.user.email?.split("@")[0] ||
              "User",
            email: data.user.email || "",
            passwordHash: "",
            profilePicture: userMetadata?.avatar_url || "",
            identityNumber: "",
            phone: userMetadata?.phone || "",
            birthDate: new Date(),
            address: "",
            bio: "",
            location: "",
            joinDate: new Date(),
            status: "active",
            verificationStatus: true,
          },
        });
      } else {
        await prisma.profile.update({
          where: { id: data.user.id },
          data: { verificationStatus: true },
        });
      }
    } catch (profileError) {
      console.error("Error handling user profile:", profileError);
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("Unexpected error during authentication callback:", error);
    return NextResponse.redirect(
      new URL("/sign-in?error=Authentication failed", request.url)
    );
  }
}