import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { z } from "zod";
import { Region } from "@prisma/client";

const campaignDraftSchema = z.object({
  campaignId: z.string().uuid().optional(),
  title: z.string().min(3).max(80).optional(),
  description: z.string().min(10).max(1000).optional(),
  // Story field corresponds to "Presentación de la campaña" in the form
  story: z.string().min(10).max(600).optional(),
  beneficiariesDescription: z.string().min(10).max(600).optional(),
  category: z
    .enum([
      "cultura_arte",
      "educacion",
      "emergencia",
      "igualdad",
      "medioambiente",
      "salud",
      "otros",
    ])
    .optional(),
  goalAmount: z.coerce.number().min(1).optional(),
  location: z.nativeEnum(Region).optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrls: z.array(z.string().url()).optional(),
  media: z
    .array(
      z.object({
        mediaUrl: z.string().url(),
        type: z.enum(["image", "video"]),
        isPrimary: z.boolean().default(false),
        orderIndex: z.number().int().min(0),
      })
    )
    .min(1)
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Use createRouteHandlerClient with awaited cookies
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: (() => cookieStore) as any });

    // Get session using supabase client
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - You must be logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = campaignDraftSchema.parse(body);

    // Find the organizer profile
    const organizer = await db.profile.findUnique({
      where: { email: session.user.email },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    let campaign: any;

    // If campaignId is provided, update the existing campaign
    if (validatedData.campaignId) {
      // First check if the campaign belongs to this organizer
      const existingCampaign = await db.campaign.findUnique({
        where: {
          id: validatedData.campaignId,
          organizerId: organizer.id,
        },
      });

      if (!existingCampaign) {
        return NextResponse.json(
          {
            error: "Campaign not found or you don't have permission to edit it",
          },
          { status: 404 }
        );
      }

      // Calculate days remaining if endDate is provided
      const daysRemaining = validatedData.endDate
        ? Math.ceil(
            (validatedData.endDate.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : undefined;

      // Update the campaign
      campaign = await db.campaign.update({
        where: { id: validatedData.campaignId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          story: validatedData.story,
          beneficiariesDescription: validatedData.beneficiariesDescription,
          category: validatedData.category,
          goalAmount: validatedData.goalAmount,
          location: validatedData.location,
          endDate: validatedData.endDate,
          daysRemaining,
          youtubeUrl: validatedData.youtubeUrl || null,
          youtubeUrls: validatedData.youtubeUrls || [],
        },
      });

      // Update media if provided
      if (validatedData.media && validatedData.media.length > 0) {
        // Delete existing media
        await db.campaignMedia.deleteMany({
          where: { campaignId: campaign.id },
        });

        // Create new media
        await Promise.all(
          validatedData.media.map((item) =>
            db.campaignMedia.create({
              data: {
                campaignId: campaign.id,
                mediaUrl: item.mediaUrl,
                type: item.type,
                isPrimary: item.isPrimary,
                orderIndex: item.orderIndex,
                status: "active",
              },
            })
          )
        );
      }
    } else {
      // Create a new draft campaign
      campaign = await db.campaign.create({
        data: {
          title: validatedData.title || "Untitled Campaign",
          description: validatedData.description || "Draft description",
          story: validatedData.story || "",
          beneficiariesDescription:
            validatedData.beneficiariesDescription || "",
          category: validatedData.category || "otros",
          goalAmount: validatedData.goalAmount || 0,
          collectedAmount: 0,
          percentageFunded: 0,
          daysRemaining: validatedData.endDate
            ? Math.ceil(
                (validatedData.endDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 30,
          location: validatedData.location || "la_paz",
          endDate:
            validatedData.endDate ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          youtubeUrl: validatedData.youtubeUrl || null,
          youtubeUrls: validatedData.youtubeUrls || [],
          verificationStatus: false,
          verificationDate: null,
          campaignStatus: "draft",
          organizerId: organizer.id,
        },
      });

      // Create media if provided
      if (validatedData.media && validatedData.media.length > 0) {
        await Promise.all(
          validatedData.media.map((item) =>
            db.campaignMedia.create({
              data: {
                campaignId: campaign.id,
                mediaUrl: item.mediaUrl,
                type: item.type,
                isPrimary: item.isPrimary,
                orderIndex: item.orderIndex,
                status: "active",
              },
            })
          )
        );
      }
    }

    return NextResponse.json(
      {
        message: "Campaign draft saved successfully",
        campaignId: campaign.id,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error saving campaign draft:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
