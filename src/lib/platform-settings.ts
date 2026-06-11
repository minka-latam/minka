import { Prisma } from "@prisma/client";

import { multiplyMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const DEFAULT_USD_TO_BOB_EXCHANGE_RATE = 6.96;
const PLATFORM_SETTINGS_ID = "default";

type Queryable =
  | Pick<typeof prisma, "$queryRaw" | "$executeRaw">
  | Prisma.TransactionClient;

type ExchangeRateRow = {
  usd_to_bob_exchange_rate: Prisma.Decimal | string | number;
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

export async function getUsdToBobExchangeRate(db: Queryable = prisma) {
  const rows = await db.$queryRaw<ExchangeRateRow[]>`
    select "usd_to_bob_exchange_rate"
    from "platform_settings"
    where "id" = ${PLATFORM_SETTINGS_ID}
    limit 1
  `;

  const rate =
    rows[0]?.usd_to_bob_exchange_rate ?? DEFAULT_USD_TO_BOB_EXCHANGE_RATE;
  return normalizeExchangeRate(rate);
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
