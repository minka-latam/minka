import crypto from "crypto";
import { NextResponse } from "next/server";

import { parseDonationCreateBody } from "@/lib/api/donation-dto";
import { getAuthSession } from "@/lib/auth";
import { canReceiveCampaignPayments } from "@/lib/campaigns/visibility";
import { getOrCreateCampaignAnonymousProfileId } from "@/lib/donations/anonymous-donor";
import {
  generateDonationClaimToken,
  hashDonationClaimToken,
} from "@/lib/donations/claim-token";
import { addMoney, multiplyMoney, roundMoney } from "@/lib/money";
import { resolveCardPaymentCurrency } from "@/lib/payments/provider-validation";
import { prisma } from "@/lib/prisma";
import {
  TransoftConfigurationError,
  TransoftResponseError,
  transoftClient,
} from "@/lib/transoft/client";

function getPublicBaseUrl() {
  const configured =
    process.env.TRANSOFT_MERCHANT_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.MINKA_APP_URL;
  if (!configured) throw new Error("Minka public base URL is not configured");
  const normalized = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;
  return new URL(normalized).origin;
}

function sessionTokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

class UsdAccountingRateConfigurationError extends Error {}

function getUsdToBobAccountingRate() {
  const rawRate = process.env.TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE?.trim();
  const rate = Number(rawRate);
  if (!rawRate || !Number.isFinite(rate) || rate <= 0) {
    throw new UsdAccountingRateConfigurationError(
      "TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE must be a positive number for USD payments",
    );
  }
  return Number(rate.toFixed(4));
}

export async function POST(request: Request) {
  let pendingDonationId: string | null = null;

  try {
    const body = await request.json();
    const {
      campaignId,
      amount,
      tipAmount = 0,
      message = "",
      clientAuthState,
      isAnonymous = false,
      notificationEnabled = false,
    } = parseDonationCreateBody(body);

    const providerCurrency = resolveCardPaymentCurrency(body.currency);
    if (!providerCurrency) {
      return NextResponse.json(
        { success: false, error: "UNSUPPORTED_CARD_CURRENCY" },
        { status: 400 },
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: "Campaign ID is required" },
        { status: 400 },
      );
    }

    const rawDonationAmount = Number(amount);
    const rawTipAmount = Number(tipAmount);
    if (
      !Number.isFinite(rawDonationAmount) ||
      rawDonationAmount <= 0 ||
      !Number.isFinite(rawTipAmount) ||
      rawTipAmount < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid donation amount" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        campaignStatus: true,
      },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }
    if (!canReceiveCampaignPayments(campaign)) {
      return NextResponse.json(
        { success: false, error: "Campaign is not accepting donations" },
        { status: 400 },
      );
    }

    const session = await getAuthSession();
    const userId = session?.user?.id ?? null;
    const clientClaimsAuthenticated = clientAuthState === "authenticated";
    const effectiveUserId = clientClaimsAuthenticated ? userId : null;
    const effectiveIsAnonymous = !effectiveUserId || isAnonymous;
    if (clientClaimsAuthenticated && !effectiveUserId) {
      return NextResponse.json(
        { success: false, error: "Authentication is required" },
        { status: 401 },
      );
    }

    const donorProfileId =
      effectiveUserId ??
      (effectiveIsAnonymous
        ? await getOrCreateCampaignAnonymousProfileId(campaignId)
        : null);
    if (!donorProfileId) {
      return NextResponse.json(
        { success: false, error: "Donor profile is required" },
        { status: 400 },
      );
    }

    // Preserve exactly what Transoft charges. Campaign balances remain in BOB,
    // so USD sessions also snapshot the explicitly configured accounting rate.
    // This is Minka accounting metadata, not a rate sent to Transoft.
    const exchangeRate =
      providerCurrency === "USD" ? getUsdToBobAccountingRate() : null;
    const providerDonationAmount = roundMoney(rawDonationAmount);
    const providerTipAmount = roundMoney(rawTipAmount);
    const providerTotalAmount = addMoney(
      providerDonationAmount,
      providerTipAmount,
    );
    const storedDonationAmount = exchangeRate
      ? multiplyMoney(providerDonationAmount, exchangeRate)
      : providerDonationAmount;
    const storedTipAmount = exchangeRate
      ? multiplyMoney(providerTipAmount, exchangeRate)
      : providerTipAmount;
    const storedTotalAmount = addMoney(storedDonationAmount, storedTipAmount);
    const claimToken = !effectiveUserId ? generateDonationClaimToken() : null;

    const donationId = crypto.randomUUID();
    const donation = await prisma.donation.create({
      data: {
        id: donationId,
        campaignId,
        donorId: donorProfileId,
        amount: storedDonationAmount,
        tip_amount: storedTipAmount,
        total_amount: storedTotalAmount,
        currency: "BOB",
        providerAmount: providerDonationAmount,
        providerTipAmount,
        providerTotalAmount,
        providerCurrency,
        exchangeRate,
        paymentStatus: "pending",
        paymentProvider: "transoft",
        paymentMethod: "credit_card",
        providerPaymentId: donationId,
        providerReference: donationId,
        claimTokenHash: claimToken ? hashDonationClaimToken(claimToken) : null,
        isAnonymous: effectiveIsAnonymous,
        notificationEnabled: Boolean(notificationEnabled),
        message: message || null,
      },
      select: { id: true },
    });
    pendingDonationId = donation.id;

    const publicBaseUrl = getPublicBaseUrl();
    const redirectUrl = new URL(`/donate/${campaignId}`, publicBaseUrl);
    redirectUrl.searchParams.set("donationId", donation.id);
    const paymentSession = await transoftClient.createPaymentSession({
      code: donation.id,
      amount: providerTotalAmount,
      currency: providerCurrency,
      language: providerCurrency === "USD" ? "eng" : "esp",
      descripcion: `Donación en Minka: ${campaign.title}`.slice(0, 160),
      redirect: true,
      urlToRedirect: redirectUrl.toString(),
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        providerReference: donation.id,
        providerSessionId: sessionTokenHash(paymentSession.token),
        providerSessionExpiresAt: new Date(
          Date.now() + paymentSession.expiresInSeconds * 1000,
        ),
      },
    });

    return NextResponse.json({
      success: true,
      url: paymentSession.url,
      donationId: donation.id,
      claimToken,
      currency: providerCurrency,
      expiresIn: paymentSession.expiresInSeconds,
    });
  } catch (error) {
    if (pendingDonationId) {
      await prisma.donation
        .updateMany({
          where: { id: pendingDonationId, paymentStatus: "pending" },
          data: { paymentStatus: "failed" },
        })
        .catch(() => undefined);
    }

    console.error("[TRANSOFT][SESSION]", error);
    if (error instanceof UsdAccountingRateConfigurationError) {
      return NextResponse.json(
        { success: false, error: "USD_ACCOUNTING_RATE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    if (error instanceof TransoftConfigurationError) {
      return NextResponse.json(
        { success: false, error: "PAYMENT_PROVIDER_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    if (error instanceof TransoftResponseError) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.status === 422
              ? "PAYMENT_SESSION_REJECTED"
              : "PAYMENT_PROVIDER_UNAVAILABLE",
        },
        { status: error.status === 422 ? 422 : 502 },
      );
    }
    return NextResponse.json(
      { success: false, error: "PAYMENT_SESSION_FAILED" },
      { status: 500 },
    );
  }
}
