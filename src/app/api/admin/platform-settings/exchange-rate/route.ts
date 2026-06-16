import { NextResponse } from "next/server";

import {
  adminAuthErrorResponse,
  createAdminAuditLog,
  requireAdminProfile,
} from "@/lib/admin-auth";
import {
  getUsdToBobExchangeRateSettings,
  normalizeExchangeRate,
  upsertUsdToBobExchangeRate,
  useAutomaticUsdToBobExchangeRate,
} from "@/lib/platform-settings";

function readExchangeRate(body: unknown) {
  const data = (body ?? {}) as Record<string, unknown>;
  return data.usdToBobExchangeRate ?? data.exchangeRate;
}

function readMode(body: unknown) {
  const data = (body ?? {}) as Record<string, unknown>;
  return data.mode;
}

export async function GET() {
  try {
    await requireAdminProfile();
    const settings = await getUsdToBobExchangeRateSettings();

    return NextResponse.json(settings);
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error fetching exchange rate:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el tipo de cambio" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdminProfile();
    const body = await request.json();
    const mode = readMode(body);

    if (mode === "automatic") {
      const automaticRate = await useAutomaticUsdToBobExchangeRate();

      await createAdminAuditLog({
        adminId: admin.id,
        action: "update_exchange_rate",
        entityType: "platform_settings",
        metadata: {
          mode: "automatic",
          usdToBobExchangeRate: automaticRate,
        },
      });

      return NextResponse.json({
        usdToBobExchangeRate: automaticRate,
        automaticUsdToBobExchangeRate: automaticRate,
        mode: "automatic",
      });
    }

    const usdToBobExchangeRate = normalizeExchangeRate(
      readExchangeRate(body),
    );

    const savedRate = await upsertUsdToBobExchangeRate({
      exchangeRate: usdToBobExchangeRate,
      updatedById: admin.id,
    });

    await createAdminAuditLog({
      adminId: admin.id,
      action: "update_exchange_rate",
      entityType: "platform_settings",
      metadata: { mode: "manual", usdToBobExchangeRate: savedRate },
    });

    return NextResponse.json({
      usdToBobExchangeRate: savedRate,
      mode: "manual",
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof Error && error.message === "Tipo de cambio inválido") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating exchange rate:", error);
    return NextResponse.json(
      { error: "No se pudo guardar el tipo de cambio" },
      { status: 500 },
    );
  }
}
