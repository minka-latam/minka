import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";
import { createSupabaseStorageAdminClient } from "@/lib/storage/admin-client";
import { getVerificationDocumentLocation } from "@/lib/storage/verification-documents";
import { CampaignStatus } from "@prisma/client";
import {
  campaignDateKeyToDbDate,
  getCurrentCampaignDateKey,
} from "@/lib/campaign-dates";

const SIGNED_URL_EXPIRES_IN_SECONDS = 10 * 60;

async function getAdminDocumentUrl(value: string | null | undefined) {
  if (!value) return value;

  const location = getVerificationDocumentLocation(value);
  if (!location?.isPrivate) return value;

  const supabase = createSupabaseStorageAdminClient();
  const { data, error } = await supabase.storage
    .from(location.bucket)
    .createSignedUrl(location.path, SIGNED_URL_EXPIRES_IN_SECONDS);

  if (error) {
    console.error("Could not create signed verification document URL:", error);
    return null;
  }

  return data.signedUrl;
}

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with properly handled cookies
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
    const today = campaignDateKeyToDbDate(getCurrentCampaignDateKey());
    const pendingCampaignEligibility = {
      campaignStatus: CampaignStatus.active,
      endDate: { gt: today },
    };

    if (status === "pending") {
      where.AND = [
        { verificationStatus: false },
        { verificationRequests: { verificationStatus: "pending" } },
        pendingCampaignEligibility,
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
    } else if (status === "all") {
      // Preserve approved/rejected history, but do not keep stale pending
      // requests for campaigns that can no longer be verified.
      where.OR = [
        { verificationRequests: null },
        {
          verificationRequests: {
            verificationStatus: { not: "pending" },
          },
        },
        {
          AND: [
            {
              verificationRequests: {
                verificationStatus: "pending",
              },
            },
            pendingCampaignEligibility,
          ],
        },
      ];
    }

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
            previewUrl: true,
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
    const formattedCampaigns = await Promise.all(campaigns.map(async (campaign) => {
      // Get the primary image or fallback to default
      const imageUrl =
        campaign.media[0]?.previewUrl ||
        campaign.media[0]?.mediaUrl ||
        null;

      // Determine the actual verification status
      let status: string;
      if (campaign.verificationStatus) {
        status = "approved"; // Campaign is verified
      } else if (campaign.verificationRequests) {
        status = campaign.verificationRequests.verificationStatus; // pending or rejected
      } else {
        status = "unverified"; // No verification request
      }

      const idDocumentUrl = await getAdminDocumentUrl(
        campaign.verificationRequests?.idDocumentUrl,
      );
      const supportingDocsUrls = await Promise.all(
        (campaign.verificationRequests?.supportingDocsUrls || []).map(
          getAdminDocumentUrl,
        ),
      );

      return {
        id: campaign.id,
        campaignTitle: campaign.title,
        campaignStatus: campaign.campaignStatus,
        endDate: campaign.endDate.toISOString(),
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
        idDocumentUrl,
        supportingDocsUrls: supportingDocsUrls.filter(
          (url): url is string => Boolean(url),
        ),
        campaignStory:
          campaign.verificationRequests?.campaignStory || campaign.description,
        referenceContactName:
          campaign.verificationRequests?.referenceContactName,
        referenceContactEmail:
          campaign.verificationRequests?.referenceContactEmail,
        referenceContactPhone:
          campaign.verificationRequests?.referenceContactPhone,
        campaignImage: imageUrl,
      };
    }));

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
