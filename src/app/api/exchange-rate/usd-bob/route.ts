import { NextResponse } from "next/server";

import { getUsdToBobExchangeRateSettings } from "@/lib/platform-settings";

export async function GET() {
  try {
    const settings = await getUsdToBobExchangeRateSettings();

    return NextResponse.json(
      {
        usdToBobExchangeRate: settings.usdToBobExchangeRate,
        source: settings.source,
        publishedOn: settings.officialPublishedOn,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to load the USD/BOB exchange rate:", error);
    return NextResponse.json(
      { error: "EXCHANGE_RATE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
