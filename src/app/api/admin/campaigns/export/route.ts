import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({
      cookies: (() => cookieStore) as any,
    });

    // Get the session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const profile = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can access this resource" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const filters = body.filters || {};

    // Build where clause based on filters
    const where: any = {};

    if (filters.status !== "all") {
      where.campaignStatus = filters.status;
    }

    if (filters.category !== "all") {
      where.category = filters.category;
    }

    if (filters.verification === "verified") {
      where.verificationStatus = true;
    } else if (filters.verification === "unverified") {
      where.verificationStatus = false;
    }

    // Add search filter if provided
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        {
          organizer: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          organizer: {
            email: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    // Fetch campaigns with filters
    const campaigns = await db.campaign.findMany({
      where,
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create CSV data
    const csvHeaders = [
      "ID",
      "Title",
      "Description",
      "Category",
      "Location",
      "Goal Amount",
      "Collected Amount",
      "Percentage Funded",
      "Donor Count",
      "Status",
      "Verification Status",
      "Organizer Name",
      "Organizer Email",
      "Created At",
      "End Date",
    ];

    const csvRows = campaigns.map((campaign) => [
      campaign.id,
      campaign.title,
      campaign.description.replace(/"/g, '""'), // Escape quotes
      campaign.category,
      campaign.location,
      Number(campaign.goalAmount),
      Number(campaign.collectedAmount),
      campaign.percentageFunded,
      campaign.donorCount,
      campaign.campaignStatus,
      campaign.verificationStatus ? "Verified" : "Not Verified",
      campaign.organizer.name || "",
      campaign.organizer.email || "",
      campaign.createdAt.toISOString(),
      campaign.endDate.toISOString(),
    ]);

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row
          .map((cell) => (typeof cell === "string" ? `"${cell}"` : cell))
          .join(",")
      ),
    ].join("\n");

    // Return CSV file
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="campaigns-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting campaigns:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
