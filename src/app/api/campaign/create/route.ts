import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/prisma";
import { z } from "zod";
import {
  calculateCampaignDaysRemaining,
  campaignDateKeyToDbDate,
} from "@/lib/campaign-dates";

const campaignCreateSchema = z.object({
  title: z.string().min(3).max(80),
  subtitle: z.string().min(10).max(150),
  description: z.string().min(10).max(600),
  beneficiariesDescription: z.string().max(600).optional().default(""),
  category: z.enum([
    "cultura_arte",
    "educacion",
    "emergencia",
    "igualdad",
    "medioambiente",
    "salud",
    "otros",
  ]),
  goalAmount: z.coerce
    .number()
    .min(1)
    .max(1000000, "La meta no debe superar Bs. 1.000.000"),
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
  endDate: z.string().transform(campaignDateKeyToDbDate),
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
    // Use createServerClient with awaited cookies
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
    const daysRemaining = calculateCampaignDaysRemaining(validatedData.endDate);

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        description: validatedData.description,
        beneficiariesDescription: validatedData.beneficiariesDescription || "",
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
