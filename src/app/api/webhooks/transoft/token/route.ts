import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  generateTransoftNotificationToken,
  getTransoftWebhookApiKey,
  hashTransoftNotificationToken,
  isAuthorizedTransoftWebhookRequest,
  TRANSOFT_NOTIFICATION_TOKEN_TTL_SECONDS,
} from "@/lib/transoft/security";
import { classifyTransoftStatus } from "@/lib/transoft/status";

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!getTransoftWebhookApiKey()) {
    console.error("[TRANSOFT][TOKEN] Webhook API key is not configured");
    return noStoreJson(
      { success: false, error: "Server not configured" },
      { status: 500 },
    );
  }
  if (!isAuthorizedTransoftWebhookRequest(request)) {
    return noStoreJson(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const bookCode =
      typeof body.bookCode === "string" ? body.bookCode.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!bookCode || bookCode.length > 64 || !status || status.length > 64) {
      return noStoreJson(
        { success: false, error: "bookCode and status are required" },
        { status: 400 },
      );
    }
    if (classifyTransoftStatus(status) === "unknown") {
      return noStoreJson(
        { success: false, error: "Unsupported payment status" },
        { status: 422 },
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { id: bookCode },
      select: {
        id: true,
        paymentProvider: true,
        paymentMethod: true,
        paymentStatus: true,
        providerReference: true,
      },
    });
    if (
      !donation ||
      donation.paymentProvider !== "transoft" ||
      donation.paymentMethod !== "credit_card" ||
      donation.providerReference !== bookCode
    ) {
      return noStoreJson(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }
    if (!["pending", "completed"].includes(donation.paymentStatus)) {
      return noStoreJson(
        { success: false, error: "Payment is already closed" },
        { status: 409 },
      );
    }

    const notificationToken = generateTransoftNotificationToken();
    const expiresAt = new Date(
      Date.now() + TRANSOFT_NOTIFICATION_TOKEN_TTL_SECONDS * 1000,
    );
    await prisma.transoftNotificationToken.create({
      data: {
        donationId: donation.id,
        bookCode,
        expectedStatus: status,
        tokenHash: hashTransoftNotificationToken(notificationToken),
        expiresAt,
      },
    });

    return noStoreJson({
      success: true,
      notification_token: notificationToken,
      token: notificationToken,
      expires_in: TRANSOFT_NOTIFICATION_TOKEN_TTL_SECONDS,
    });
  } catch (error) {
    console.error("[TRANSOFT][TOKEN]", error);
    return noStoreJson(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
