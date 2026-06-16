import { Prisma } from "@prisma/client";

import { multiplyMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const DEFAULT_USD_TO_BOB_EXCHANGE_RATE = 6.96;
export const AUTOMATIC_EXCHANGE_RATE_MARGIN = 0.1;
const AUTOMATIC_EXCHANGE_RATE_URL =
  "https://api.dolarbluebolivia.click/v1/officialRate";
const PLATFORM_SETTINGS_ID = "default";

type Queryable =
  | Pick<typeof prisma, "$queryRaw" | "$executeRaw">
  | Prisma.TransactionClient;

type ExchangeRateRow = {
  usd_to_bob_exchange_rate: Prisma.Decimal | string | number;
  updated_by_id: string | null;
};

export function normalizeExchangeRate(value: unknown) {
  const rate = Number(value);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Tipo de cambio inválido");
  }

  return Number(rate.toFixed(4));
}

export function convertUsdToBob(amountUsd: number, exchangeRate: number) {
  return multiplyMoney(amountUsd, exchangeRate);
}

export async function getAutomaticUsdToBobExchangeRate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(AUTOMATIC_EXCHANGE_RATE_URL, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el tipo de cambio automático");
    }

    const payload = (await response.json()) as {
      data?: {
        blue?: {
          buy?: unknown;
        };
      };
    };
    const blueBuy = Number(payload.data?.blue?.buy);

    if (!Number.isFinite(blueBuy) || blueBuy <= AUTOMATIC_EXCHANGE_RATE_MARGIN) {
      throw new Error("Tipo de cambio automático inválido");
    }

    return normalizeExchangeRate(blueBuy - AUTOMATIC_EXCHANGE_RATE_MARGIN);
  } finally {
    clearTimeout(timeout);
  }
}

async function getStoredExchangeRateRow(db: Queryable = prisma) {
  const rows = await db.$queryRaw<ExchangeRateRow[]>`
    select
      "usd_to_bob_exchange_rate",
      "updated_by_id"::text as "updated_by_id"
    from "platform_settings"
    where "id" = ${PLATFORM_SETTINGS_ID}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getUsdToBobExchangeRate(db: Queryable = prisma) {
  const row = await getStoredExchangeRateRow(db);

  if (row?.updated_by_id) {
    return normalizeExchangeRate(row.usd_to_bob_exchange_rate);
  }

  try {
    return await getAutomaticUsdToBobExchangeRate();
  } catch (error) {
    console.error("Automatic exchange rate fallback:", error);
  }

  const rate =
    row?.usd_to_bob_exchange_rate ?? DEFAULT_USD_TO_BOB_EXCHANGE_RATE;
  return normalizeExchangeRate(rate);
}

export async function getUsdToBobExchangeRateSettings() {
  const row = await getStoredExchangeRateRow();
  const storedUsdToBobExchangeRate = row
    ? normalizeExchangeRate(row.usd_to_bob_exchange_rate)
    : null;
  const mode = row?.updated_by_id ? "manual" : "automatic";

  let automaticUsdToBobExchangeRate: number | null = null;
  try {
    automaticUsdToBobExchangeRate = await getAutomaticUsdToBobExchangeRate();
  } catch (error) {
    console.error("Error fetching automatic exchange rate:", error);
  }

  const usdToBobExchangeRate =
    mode === "manual"
      ? storedUsdToBobExchangeRate!
      : (automaticUsdToBobExchangeRate ??
        storedUsdToBobExchangeRate ??
        DEFAULT_USD_TO_BOB_EXCHANGE_RATE);

  return {
    usdToBobExchangeRate: normalizeExchangeRate(usdToBobExchangeRate),
    automaticUsdToBobExchangeRate,
    storedUsdToBobExchangeRate,
    mode,
  };
}

export async function upsertUsdToBobExchangeRate({
  exchangeRate,
  updatedById,
}: {
  exchangeRate: number;
  updatedById: string;
}) {
  const normalizedRate = normalizeExchangeRate(exchangeRate);

  await prisma.$executeRaw`
    insert into "platform_settings" (
      "id",
      "usd_to_bob_exchange_rate",
      "updated_by_id",
      "updated_at"
    )
    values (
      ${PLATFORM_SETTINGS_ID},
      ${normalizedRate},
      ${updatedById}::uuid,
      now()
    )
    on conflict ("id")
    do update set
      "usd_to_bob_exchange_rate" = excluded."usd_to_bob_exchange_rate",
      "updated_by_id" = excluded."updated_by_id",
      "updated_at" = now()
  `;

  return normalizedRate;
}

export async function useAutomaticUsdToBobExchangeRate() {
  const automaticRate = await getAutomaticUsdToBobExchangeRate();

  await prisma.$executeRaw`
    insert into "platform_settings" (
      "id",
      "usd_to_bob_exchange_rate",
      "updated_by_id",
      "updated_at"
    )
    values (
      ${PLATFORM_SETTINGS_ID},
      ${automaticRate},
      null,
      now()
    )
    on conflict ("id")
    do update set
      "usd_to_bob_exchange_rate" = excluded."usd_to_bob_exchange_rate",
      "updated_by_id" = null,
      "updated_at" = now()
  `;

  return automaticRate;
}
