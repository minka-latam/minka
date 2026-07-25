import { NextRequest, NextResponse } from "next/server";

import { reconcilePendingBisaQrDonations } from "@/lib/bisa/reconciliation";

function getExpectedSecret() {
  return (
    process.env.BISA_RECONCILE_SECRET || process.env.BISA_CALLBACK_PASSWORD
  );
}

function getRequestSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-minka-cron-secret")?.trim();
}

export async function POST(request: NextRequest) {
  const expectedSecret = getExpectedSecret();

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "BISA reconcile secret is not configured" },
      { status: 500 },
    );
  }

  if (getRequestSecret(request) !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await reconcilePendingBisaQrDonations({
    limit: Number(body?.limit) || undefined,
  });

  return NextResponse.json({ success: true, result });
}
