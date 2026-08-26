import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  readBearerToken,
  timingSafeEqualString,
} from "@/lib/transoft/security";
import { reconcileTransoftDonation } from "@/lib/transoft/reconciliation";

function reconciliationSecret() {
  return (
    process.env.TRANSOFT_RECONCILE_SECRET ||
    process.env.TRANSOFT_WEBHOOK_API_KEY ||
    ""
  ).trim();
}

function authorized(request: Request) {
  const expected = reconciliationSecret();
  const received = readBearerToken(request);
  return Boolean(
    expected && received && timingSafeEqualString(expected, received),
  );
}

export async function POST(request: Request) {
  if (!reconciliationSecret()) {
    return NextResponse.json(
      { success: false, error: "Server not configured" },
      { status: 500 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const requestedBookCode =
      typeof body.bookCode === "string" ? body.bookCode.trim() : "";
    const donations = requestedBookCode
      ? [{ id: requestedBookCode }]
      : await prisma.donation.findMany({
          where: {
            paymentProvider: "transoft",
            paymentMethod: "credit_card",
            paymentStatus: "pending",
          },
          orderBy: { createdAt: "asc" },
          take: 20,
          select: { id: true },
        });

    const results = [];
    for (const donation of donations) {
      try {
        results.push({
          bookCode: donation.id,
          ...(await reconcileTransoftDonation(donation.id)),
        });
      } catch (error) {
        console.error("[TRANSOFT][RECONCILE]", donation.id, error);
        results.push({
          bookCode: donation.id,
          ok: false,
          error: "Provider lookup failed",
        });
      }
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error) {
    console.error("[TRANSOFT][RECONCILE]", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
