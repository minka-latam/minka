import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCampaignAnonymousProfileId } from "@/lib/donations/anonymous-donor";
import { canReceiveCampaignPayments } from "@/lib/campaigns/visibility";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseDonationCreateBody } from "@/lib/api/donation-dto";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user using Supabase client
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Parse the request body
    const body = await request.json();
    const {
      campaignId,
      amount,
      tipAmount = 0,
      paymentMethod,
      message,
      isAnonymous = false,
      notificationEnabled = false,
      customAmount,
    } = parseDonationCreateBody(body);

    // Basic validation
    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid donation amount is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Set paymentMethod to enum value
    const paymentMethodEnum =
      paymentMethod === "card"
        ? "credit_card"
        : paymentMethod === "qr"
          ? "qr"
          : "bank_transfer";

    // Handle anonymous vs. authenticated donations properly
    // Only require authentication for non-anonymous donations
    if (!isAnonymous && !userId) {
      return NextResponse.json(
        { error: "User must be logged in for non-anonymous donations" },
        { status: 401 }
      );
    }

    // Verify campaign exists before creating a pending donation.
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        campaignStatus: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!canReceiveCampaignPayments(campaign)) {
      return NextResponse.json(
        { error: "Campaign is not accepting donations" },
        { status: 400 }
      );
    }

    const donorProfileId = isAnonymous
      ? await getOrCreateCampaignAnonymousProfileId(campaignId)
      : userId;

    // Calculate total amount
    const totalAmount = Number(amount) + Number(tipAmount);

    // 1. Create donor for both cases (card y qr)
    const donation = await prisma.donation.create({
      data: {
        campaignId,
        donorId: donorProfileId!,
        amount: Number(amount),
        tip_amount: Number(tipAmount),
        total_amount: totalAmount,
        paymentMethod: paymentMethodEnum,
        paymentStatus: 'pending',
        paymentProvider:
          paymentMethod === 'card' ? 'tripto' : 'bisa',
        message: message || null,
        isAnonymous,
        notificationEnabled,
        predefinedAmount: !customAmount,
      },
    })

    return NextResponse.json(
      { success: true, donationId: donation.id },
      { status: 201 }
    );
    } catch (err: any) {
      console.error("Donation creation error:", err);

      return NextResponse.json(
        {
          success: false,
          error: err?.message || "Failed to process donation",
        },
        { status: 500 }
      );
    }
}
