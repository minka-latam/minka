import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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

    // Get URL query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "pending"; // Default to pending
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Define the where clause for campaigns based on verification status
    const where: any = {};

    if (status === "pending") {
      where.AND = [
        { verificationStatus: false },
        { verificationRequests: { verificationStatus: "pending" } },
      ];
    } else if (status === "approved") {
      where.verificationStatus = true; // Campaigns that are actually verified
    } else if (status === "rejected") {
      where.AND = [
        { verificationStatus: false },
        { verificationRequests: { verificationStatus: "rejected" } },
      ];
    } else if (status === "unverified") {
      where.AND = [
        { verificationStatus: false },
        { verificationRequests: null },
      ];
    }
    // For "all", we don't filter - we want all campaigns

    // Fetch campaigns with their verification status
    const campaigns = await db.campaign.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        media: {
          where: {
            isPrimary: true,
          },
          select: {
            mediaUrl: true,
          },
          take: 1,
        },
        verificationRequests: true, // Include verification request if it exists
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.campaign.count({
      where,
    });

    // Format the response data
    const formattedCampaigns = campaigns.map((campaign) => {
      // Get the primary image or fallback to default
      const imageUrl = campaign.media[0]?.mediaUrl || null;

      // Determine the actual verification status
      let status: string;
      if (campaign.verificationStatus) {
        status = "approved"; // Campaign is verified
      } else if (campaign.verificationRequests) {
        status = campaign.verificationRequests.verificationStatus; // pending or rejected
      } else {
        status = "unverified"; // No verification request
      }

      return {
        id: campaign.id,
        campaignTitle: campaign.title,
        organizerName: campaign.organizer.name || "Organizador desconocido",
        organizerId: campaign.organizer.id,
        requestDate:
          campaign.verificationRequests?.requestDate?.toISOString() || null,
        approvalDate:
          campaign.verificationRequests?.approvalDate?.toISOString() ||
          campaign.verificationDate?.toISOString() ||
          null,
        status: status,
        notes: campaign.verificationRequests?.notes,
        idDocumentUrl: campaign.verificationRequests?.idDocumentUrl,
        supportingDocsUrls: campaign.verificationRequests?.supportingDocsUrls,
        campaignStory: campaign.story,
        referenceContactName:
          campaign.verificationRequests?.referenceContactName,
        referenceContactEmail:
          campaign.verificationRequests?.referenceContactEmail,
        referenceContactPhone:
          campaign.verificationRequests?.referenceContactPhone,
        campaignImage: imageUrl,
      };
    });

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
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
