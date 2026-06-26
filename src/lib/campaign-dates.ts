const BOLIVIA_TIME_ZONE = "America/La_Paz";

function dateKeyParts(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function boliviaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOLIVIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function utcDayNumber({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function toCampaignDateKey(value: Date | string | null | undefined) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const parts = dateKeyParts(value);
  return parts
    ? `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
    : "";
}

export function campaignDateKeyToLocalDate(value: Date | string | null | undefined) {
  const key = toCampaignDateKey(value);
  const parts = dateKeyParts(key);

  if (!parts) return undefined;

  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
}

export function calculateCampaignDaysRemaining(value: Date | string | null | undefined) {
  const key = toCampaignDateKey(value);
  const endParts = dateKeyParts(key);

  if (!endParts) return 0;

  const todayParts = boliviaDateParts(new Date());
  return Math.max(0, utcDayNumber(endParts) - utcDayNumber(todayParts));
}

export function campaignDateKeyToDbDate(value: Date | string) {
  const key = toCampaignDateKey(value);
  const parts = dateKeyParts(key);

  if (!parts) return new Date(value);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
}
