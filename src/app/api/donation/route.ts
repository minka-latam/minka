import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCampaignAnonymousProfileId } from "@/lib/donations/anonymous-donor";
import { canReceiveCampaignPayments } from "@/lib/campaigns/visibility";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseDonationCreateBody } from "@/lib/api/donation-dto";
import { createBisaQrAccessToken } from "@/lib/bisa/qr-access-token";
import {
  generateDonationClaimToken,
  hashDonationClaimToken,
} from "@/lib/donations/claim-token";
import { addMoney, roundMoney } from "@/lib/money";
import { resolveTriptoCardCurrency } from "@/lib/payments/provider-validation";
import {
  convertUsdToBob,
  getUsdToBobExchangeRate,
} from "@/lib/platform-settings";

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
      currency,
      clientAuthState,
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

    const clientClaimsAuthenticated = clientAuthState === "authenticated";
    const effectiveUserId = clientClaimsAuthenticated ? userId : null;
    const effectiveIsAnonymous = !effectiveUserId || isAnonymous;

    // Only require authentication when the client is explicitly making an
    // authenticated donation. If the user logged out but a stale cookie remains,
    // we treat the donation as anonymous instead of attributing it to that user.
    if (clientClaimsAuthenticated && !effectiveUserId) {
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

    const donorProfileId =
      effectiveUserId ??
      (effectiveIsAnonymous
        ? await getOrCreateCampaignAnonymousProfileId(campaignId)
        : null);

    const donationAmount = roundMoney(amount);
    const rawDonationTipAmount = Number(tipAmount);

    if (!Number.isFinite(rawDonationTipAmount) || rawDonationTipAmount < 0) {
      return NextResponse.json(
        { error: "Valid tip amount is required" },
        { status: 400 }
      );
    }

    const donationTipAmount = roundMoney(rawDonationTipAmount);
    const totalAmount = addMoney(donationAmount, donationTipAmount);
    const isCardPayment = paymentMethod === "card";
    const cardCurrency = resolveTriptoCardCurrency(currency);
    const usdToBobExchangeRate = isCardPayment
      ? await getUsdToBobExchangeRate()
      : null;
    const storedDonationAmount = usdToBobExchangeRate
      ? convertUsdToBob(donationAmount, usdToBobExchangeRate)
      : donationAmount;
    const storedTipAmount = usdToBobExchangeRate
      ? convertUsdToBob(donationTipAmount, usdToBobExchangeRate)
      : donationTipAmount;
    const storedTotalAmount = addMoney(storedDonationAmount, storedTipAmount);
    const claimToken =
      !effectiveUserId ? generateDonationClaimToken() : null;
    const claimTokenHash = claimToken
      ? hashDonationClaimToken(claimToken)
      : null;

    // 1. Create donor for both cases (card y qr)
    const donation = await prisma.$transaction(async (tx) => {
      const createdDonation = await tx.donation.create({
        data: {
          campaignId,
          donorId: donorProfileId!,
          amount: storedDonationAmount,
          tip_amount: storedTipAmount,
          total_amount: storedTotalAmount,
          currency: "BOB",
          paymentMethod: paymentMethodEnum,
          paymentStatus: 'pending',
          paymentProvider:
            paymentMethod === 'card' ? 'tripto' : 'bisa',
          message: message || null,
          isAnonymous: effectiveIsAnonymous,
          notificationEnabled,
          predefinedAmount: !customAmount,
        },
      })

      if (claimTokenHash) {
        await tx.$executeRaw`
          update "donations"
          set "claim_token_hash" = ${claimTokenHash}
          where "id" = ${createdDonation.id}::uuid
        `;
      }

      if (usdToBobExchangeRate) {
        await tx.$executeRaw`
          update "donations"
          set
            "exchange_rate" = ${usdToBobExchangeRate},
            "provider_amount" = ${donationAmount},
            "provider_tip_amount" = ${donationTipAmount},
            "provider_total_amount" = ${totalAmount},
            "provider_currency" = ${cardCurrency}
          where "id" = ${createdDonation.id}::uuid
        `;
      }

      return createdDonation;
    })

    return NextResponse.json(
      {
        success: true,
        donationId: donation.id,
        claimToken,
        qrAccessToken:
          paymentMethod === "qr"
            ? createBisaQrAccessToken({
                donationId: donation.id,
                campaignId,
              })
            : undefined,
      },
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
