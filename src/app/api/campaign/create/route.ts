import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { z } from "zod";

const campaignCreateSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(1000),
  // Story field corresponds to "Presentación de la campaña" in the form
  story: z.string().min(10).max(600),
  beneficiariesDescription: z.string().min(10).max(600),
  category: z.enum([
    "cultura_arte",
    "educacion",
    "emergencia",
    "igualdad",
    "medioambiente",
    "salud",
    "otros",
  ]),
  goalAmount: z.coerce.number().min(1),
  location: z.enum([
    "la_paz",
    "santa_cruz",
    "cochabamba",
    "sucre",
    "oruro",
    "potosi",
    "tarija",
    "beni",
    "pando",
  ]),
  endDate: z.string().transform((str) => new Date(str)),
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
    .min(1),
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
    const validatedData = campaignCreateSchema.parse(body);

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

    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (validatedData.endDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        story: validatedData.story,
        beneficiariesDescription: validatedData.beneficiariesDescription,
        category: validatedData.category,
        goalAmount: validatedData.goalAmount,
        collectedAmount: 0,
        percentageFunded: 0,
        daysRemaining,
        location: validatedData.location,
        endDate: validatedData.endDate,
        youtubeUrl: validatedData.youtubeUrl || null,
        youtubeUrls: validatedData.youtubeUrls || [],
        verificationStatus: false,
        verificationDate: null,
        campaignStatus: "draft",
        organizerId: organizer.id,
      },
    });

    // Create campaign media
    const mediaPromises = validatedData.media.map((item) =>
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
    );

    await Promise.all(mediaPromises);

    // Update organizer's active campaigns count
    await db.profile.update({
      where: { id: organizer.id },
      data: {
        activeCampaignsCount: organizer.activeCampaignsCount + 1,
      },
    });

    return NextResponse.json(
      { message: "Campaign created successfully", campaignId: campaign.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
