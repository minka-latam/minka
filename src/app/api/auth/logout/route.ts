import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Ensure dynamic handling and no caching
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });

  // Clear the session cookie by signing out server-side
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Server sign out error:", error);
    return NextResponse.json(
      { error: "Failed to sign out", details: error.message },
      { status: 500 }
    );
  }

  // The onAuthStateChange listener on the client should handle the redirect
  return NextResponse.json({ message: "Signed out successfully" });
}
