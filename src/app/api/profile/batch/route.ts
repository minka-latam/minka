import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Get the user session to validate authentication
    const cookieStore = await cookies();

    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body to get the profile IDs
    const requestData = await request.json();

    if (
      !requestData.ids ||
      !Array.isArray(requestData.ids) ||
      requestData.ids.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid profile IDs" },
        { status: 400 }
      );
    }

    // Fetch the profiles from the database
    const profiles = await prisma.profile.findMany({
      where: {
        id: {
          in: requestData.ids,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Return the profiles
    return NextResponse.json({ profiles }, { status: 200 });
  } catch (error) {
    console.error("Error in batch profile fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
