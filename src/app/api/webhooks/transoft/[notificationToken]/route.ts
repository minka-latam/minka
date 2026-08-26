import { NextResponse } from "next/server";

import { sendCompletedDonationNotification } from "@/lib/donations/accounting";
import { prisma } from "@/lib/prisma";
import { applyTransoftPaymentResult } from "@/lib/transoft/payment-result";
import {
  hashTransoftNotificationToken,
  readBearerToken,
} from "@/lib/transoft/security";
import { normalizeTransoftStatus } from "@/lib/transoft/status";
import type { TransoftPaymentNotification } from "@/lib/transoft/types";

type RouteContext = { params: Promise<{ notificationToken: string }> };

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function parseNotification(body: Record<string, unknown>) {
  const bookCode =
    typeof body.bookCode === "string" ? body.bookCode.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const paymentDate =
    typeof body.paymentDate === "string" ? body.paymentDate.trim() : "";
  const currency =
    typeof body.currency === "string" ? body.currency.trim() : "";
  const amount =
    typeof body.amount === "string" || typeof body.amount === "number"
      ? body.amount
      : "";

  if (!bookCode || !status || !paymentDate || !currency || amount === "") {
    return null;
  }
  return {
    bookCode,
    status,
    paymentDate,
    amount,
    currency,
  } satisfies TransoftPaymentNotification;
}

async function handleNotification(request: Request, context: RouteContext) {
  try {
    const pathToken = (await context.params).notificationToken?.trim();
    const notificationToken = pathToken || readBearerToken(request);
    if (!notificationToken || notificationToken.length > 256) {
      return noStoreJson(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const result = parseNotification(
      (await request.json()) as Record<string, unknown>,
    );
    if (!result) {
      return noStoreJson(
        { success: false, error: "Invalid payment notification" },
        { status: 400 },
      );
    }

    const tokenHash = hashTransoftNotificationToken(notificationToken);
    const outcome = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.transoftNotificationToken.findUnique({
        where: { tokenHash },
      });
      if (!tokenRecord) return { error: "Invalid token", status: 401 } as const;
      if (
        tokenRecord.bookCode !== result.bookCode ||
        normalizeTransoftStatus(tokenRecord.expectedStatus) !==
          normalizeTransoftStatus(result.status)
      ) {
        return {
          error: "Notification does not match token",
          status: 409,
        } as const;
      }
      if (
        !tokenRecord.usedAt &&
        tokenRecord.expiresAt.getTime() <= Date.now()
      ) {
        return { error: "Token expired", status: 410 } as const;
      }

      const application = await applyTransoftPaymentResult(tx, {
        donationId: tokenRecord.donationId,
        result,
        source: "callback",
      });
      if (!application.ok) {
        return { error: application.error, status: 422 } as const;
      }

      if (!tokenRecord.usedAt) {
        const used = await tx.transoftNotificationToken.updateMany({
          where: { id: tokenRecord.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        if (used.count !== 1) {
          return {
            error: "Token is already being processed",
            status: 409,
          } as const;
        }
      }

      return {
        success: true as const,
        duplicate: Boolean(tokenRecord.usedAt),
        paymentStatus: application.status,
        notification:
          "notification" in application ? application.notification : undefined,
      };
    });

    if ("error" in outcome) {
      return noStoreJson(
        { success: false, error: outcome.error },
        { status: outcome.status },
      );
    }
    await sendCompletedDonationNotification(outcome.notification);
    return noStoreJson({
      success: true,
      duplicate: outcome.duplicate,
      status: outcome.paymentStatus,
    });
  } catch (error) {
    console.error("[TRANSOFT][NOTIFICATION]", error);
    return noStoreJson(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export function POST(request: Request, context: RouteContext) {
  return handleNotification(request, context);
}

export function PATCH(request: Request, context: RouteContext) {
  return handleNotification(request, context);
}
