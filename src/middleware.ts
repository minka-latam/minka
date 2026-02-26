import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if the user is authenticated
  const isAuthenticated = !!session;

  // Define protected routes
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/profile") ||
    req.nextUrl.pathname.startsWith("/campaign/create") ||
    req.nextUrl.pathname.startsWith("/create-campaign");

  // Define auth routes (sign-in, sign-up)
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up");

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    const returnUrl = req.nextUrl.searchParams.get("returnUrl");
    const safeReturnUrl =
      returnUrl && returnUrl.startsWith("/") ? returnUrl : null;

    if (safeReturnUrl) {
      console.log(
        `Authenticated user redirected from auth route to returnUrl: ${safeReturnUrl}`
      );
      return NextResponse.redirect(new URL(safeReturnUrl, req.url));
    }

    console.log("Authenticated user redirected from auth route to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && isProtectedRoute) {
    // Store the original URL to redirect back after sign-in
    const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
    console.log(
      `Unauthenticated user redirected to sign-in. Return URL: ${returnUrl}`
    );

    const signInUrl = new URL("/sign-in", req.url);

    // Add the returnUrl as a query parameter
    signInUrl.searchParams.set("returnUrl", returnUrl);

    return NextResponse.redirect(signInUrl);
  }

  return res;
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/campaign/create/:path*",
    "/create-campaign",
    // Auth routes
    "/sign-in",
    "/sign-up",
  ],
};
