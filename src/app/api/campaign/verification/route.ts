import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";
import { z } from "zod";
import { notifyVerificationRequestSubmitted } from "@/lib/verification-request-email";
import { isValidVerificationDocumentReference } from "@/lib/storage/verification-documents";

// Schema for campaign verification request
const documentReferenceSchema = z
  .string()
  .min(1)
  .refine(isValidVerificationDocumentReference, {
    message: "Invalid verification document reference",
  });

const verificationRequestSchema = z.object({
  campaignId: z.string().uuid(),
  idDocumentUrl: documentReferenceSchema.optional(),
  idDocumentsUrls: z.array(documentReferenceSchema).optional(),
  supportingDocsUrls: z.array(documentReferenceSchema).optional(),
  campaignStory: z.string().min(10).max(5000).optional(),
  referenceContactName: z.string().min(3).max(100).optional(),
  referenceContactEmail: z.string().email().optional(),
  referenceContactPhone: z.string().min(5).max(20).optional(),
});

const appendDocumentsSchema = z.object({
  campaignId: z.string().uuid(),
  supportingDocsUrls: z.array(documentReferenceSchema).min(1),
});

// Route handler for POST request to submit verification
export async function POST(req: NextRequest) {
  try {
    // Get session using supabase client with proper cookie handling
    const cookieStore = await cookies();
    // Use void to prevent synchronous API warning
    void cookieStore;

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

    // Get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Campaign verification request rejected: session error");
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();

    const validatedData = verificationRequestSchema.parse(body);

    // Find the organizer profile by email
    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    // Get the campaign to verify
    const campaign = await db.campaign.findUnique({
      where: {
        id: validatedData.campaignId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is the campaign organizer
    if (campaign.organizerId !== organizer.id) {
      return NextResponse.json(
        { error: "You don't have permission to verify this campaign" },
        { status: 403 }
      );
    }

    // Check if verification already exists
    const existingVerification = await db.campaignVerification.findUnique({
      where: {
        campaignId: validatedData.campaignId,
      },
    });

    if (existingVerification) {
      // If it exists but is rejected, update it instead of creating a new one
      if (existingVerification.verificationStatus === "rejected") {
        // Get the ID document URL (use first one from idDocumentsUrls if available)
        const idDocumentUrl = validatedData.idDocumentsUrls?.length
          ? validatedData.idDocumentsUrls[0]
          : validatedData.idDocumentUrl;

        const updatedVerification = await db.campaignVerification.update({
          where: {
            id: existingVerification.id,
          },
          data: {
            requestDate: new Date(),
            approvalDate: null,
            verificationStatus: "pending",
            idDocumentUrl: idDocumentUrl || existingVerification.idDocumentUrl,
            supportingDocsUrls:
              validatedData.supportingDocsUrls ||
              existingVerification.supportingDocsUrls,
            campaignStory:
              validatedData.campaignStory || existingVerification.campaignStory,
            referenceContactName:
              validatedData.referenceContactName ||
              existingVerification.referenceContactName,
            referenceContactEmail:
              validatedData.referenceContactEmail ||
              existingVerification.referenceContactEmail,
            referenceContactPhone:
              validatedData.referenceContactPhone ||
              existingVerification.referenceContactPhone,
          },
        });

        await notifyVerificationRequestSubmitted({
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          organizerName: organizer.name,
          organizerEmail: organizer.email,
          submittedAt: updatedVerification.requestDate,
          supportingDocsCount: updatedVerification.supportingDocsUrls.length,
        });

        return NextResponse.json({
          message: "Campaign verification request updated successfully",
          verificationId: updatedVerification.id,
        });
      }

      return NextResponse.json(
        {
          error: "Verification request already exists for this campaign",
          status: existingVerification.verificationStatus,
        },
        { status: 409 }
      );
    }

    // Get the ID document URL (use first one from idDocumentsUrls if available)
    const idDocumentUrl = validatedData.idDocumentsUrls?.length
      ? validatedData.idDocumentsUrls[0]
      : validatedData.idDocumentUrl;

    // Create new verification request
    const verification = await db.campaignVerification.create({
      data: {
        campaignId: validatedData.campaignId,
        idDocumentUrl,
        supportingDocsUrls: validatedData.supportingDocsUrls || [],
        campaignStory: validatedData.campaignStory,
        referenceContactName: validatedData.referenceContactName,
        referenceContactEmail: validatedData.referenceContactEmail,
        referenceContactPhone: validatedData.referenceContactPhone,
        verificationStatus: "pending",
      },
    });

    await notifyVerificationRequestSubmitted({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      organizerName: organizer.name,
      organizerEmail: organizer.email,
      submittedAt: verification.requestDate,
      supportingDocsCount: verification.supportingDocsUrls.length,
    });

    return NextResponse.json({
      message: "Campaign verification request submitted successfully",
      verificationId: verification.id,
    });
  } catch (error) {
    console.error("Error submitting campaign verification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit verification request" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const { campaignId, supportingDocsUrls } = appendDocumentsSchema.parse(
      await req.json()
    );

    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        organizerId: true,
        verificationRequests: {
          select: {
            id: true,
            verificationStatus: true,
            supportingDocsUrls: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.organizerId !== organizer.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this verification" },
        { status: 403 }
      );
    }

    if (!campaign.verificationRequests) {
      return NextResponse.json(
        { error: "No verification request found for this campaign" },
        { status: 404 }
      );
    }

    if (campaign.verificationRequests.verificationStatus === "approved") {
      return NextResponse.json(
        { error: "Approved verification requests cannot be changed" },
        { status: 400 }
      );
    }

    const mergedDocs = Array.from(
      new Set([
        ...campaign.verificationRequests.supportingDocsUrls,
        ...supportingDocsUrls,
      ])
    );

    const verification = await db.campaignVerification.update({
      where: { id: campaign.verificationRequests.id },
      data: {
        supportingDocsUrls: mergedDocs,
      },
    });

    return NextResponse.json({
      message: "Documents added successfully",
      verificationId: verification.id,
      supportingDocsUrls: verification.supportingDocsUrls,
    });
  } catch (error) {
    console.error("Error adding verification documents:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add verification documents" },
      { status: 500 }
    );
  }
}

// Get verification status for a campaign
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get verification for the campaign
    const verification = await db.campaignVerification.findUnique({
      where: {
        campaignId,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No verification request found for this campaign" },
        { status: 404 }
      );
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error("Error getting campaign verification:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}
