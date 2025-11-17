import { NextRequest, NextResponse } from "next/server";
import { triptoClient } from "@/lib/tripto/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createDonationNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user using Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Parse the request body
    const body = await request.json();
    const {
      campaignId,
      amount,
      paymentMethod,
      message,
      isAnonymous = false,
      notificationEnabled = false,
      customAmount,
    } = body;

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

    // For anonymous donations, we need to handle the profile differently
    let donorProfileId = userId;

    if (isAnonymous) {
      // If donation is anonymous, find or create an anonymous profile
      // We'll check if an anonymous profile exists in our system
      let anonymousProfile = await prisma.profile.findFirst({
        where: {
          email: "anonymous@minka.org",
          identityNumber: "ANONYMOUS",
          name: "Donante Anónimo",
        },
      });

      if (!anonymousProfile) {
        // Create an anonymous profile if it doesn't exist
        anonymousProfile = await prisma.profile.create({
          data: {
            email: "anonymous@minka.org",
            identityNumber: "ANONYMOUS",
            name: "Donante Anónimo",
            passwordHash: "not-applicable",
            phone: "0000000000",
            birthDate: new Date("1900-01-01"),
          },
        });
      }

      donorProfileId = anonymousProfile.id;
    }

    // Get campaign info for notification
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        organizer: {
          select: {
            name: true,
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

    // Get donor info for notification (if not anonymous)
    let donorName = "Donante Anónimo";
    if (!isAnonymous && donorProfileId) {
      const donor = await prisma.profile.findUnique({
        where: { id: donorProfileId },
        select: { name: true },
      });
      donorName = donor?.name || "Donante";
    }

    // 1. Create donor for both cases (card y qr)
    const donation = await prisma.donation.create({
      data: {
        campaignId,
        donorId: donorProfileId!,
        amount: Number(amount),
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

    // 2. If it's card → Tripto + early return
    if (paymentMethod === 'card') {
      const paymentLink = await triptoClient.createPaymentLink({
        amount: Number(amount),
        currency: 'BOB',
        metadata: {
          donationId: donation.id,
          campaignId,
        },
      })

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          triptoPaymentId: paymentLink.paymentId,
          triptoPaymentLinkId: paymentLink.id,
          triptoCheckoutUrl: paymentLink.checkoutUrl,
        },
      })

      return NextResponse.json(
        {
          success: true,
          mode: 'tripto',
          checkoutUrl: paymentLink.checkoutUrl,
          donationId: donation.id,
        },
        { status: 201 },
      )
    }

    // Update campaign statistics (atomically with a transaction)
    await prisma.$transaction(async (tx) => {
      // Get the current campaign
      const currentCampaign = await tx.campaign.findUnique({
        where: { id: campaignId },
        select: { collectedAmount: true, donorCount: true, goalAmount: true },
      });

      if (!currentCampaign) {
        throw new Error("Campaign not found");
      }

      // Calculate new values
      const newCollectedAmount =
        Number(currentCampaign.collectedAmount) + Number(amount);
      const newDonorCount = currentCampaign.donorCount + 1;
      const percentageFunded =
        (newCollectedAmount / Number(currentCampaign.goalAmount)) * 100;

      // Update the campaign
      await tx.campaign.update({
        where: { id: campaignId },
        data: {
          collectedAmount: newCollectedAmount,
          donorCount: newDonorCount,
          percentageFunded,
        },
      });
    });

    // Create notification for campaign owner
    try {
      await createDonationNotification(
        donation.id,
        campaign.id,
        campaign.organizerId,
        donorName,
        Number(amount),
        campaign.title,
        isAnonymous
      );
    } catch (notificationError) {
      // Log error but don't fail the donation
      console.error(
        "Failed to create donation notification:",
        notificationError
      );
    }

    return NextResponse.json(
      { success: true, donationId: donation.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Donation creation error:", error);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
}
