import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({ request: { headers: req.headers } });
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Safely get session - ignore cookie parse errors
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch  {
    console.log("Session parse error - treating as unauthenticated");
  }

  const isAuthenticated = !!session;

  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/profile") ||
    req.nextUrl.pathname.startsWith("/campaign/create") ||
    req.nextUrl.pathname.startsWith("/create-campaign");

  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up");

  if (isAuthenticated && isAuthRoute) {
    const returnUrl = req.nextUrl.searchParams.get("returnUrl");
    const safeReturnUrl = returnUrl && returnUrl.startsWith("/") ? returnUrl : null;
    return NextResponse.redirect(new URL(safeReturnUrl || "/dashboard", req.url));
  }

  if (!isAuthenticated && isProtectedRoute) {
    const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("returnUrl", returnUrl);
    return NextResponse.redirect(signInUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/campaign/create/:path*",
    "/create-campaign/:path*",
    "/create-campaign",
    "/sign-in",
    "/sign-up",
  ],
};