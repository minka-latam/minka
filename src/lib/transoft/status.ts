export type TransoftStatusKind =
  | "completed"
  | "pending"
  | "failed"
  | "cancelled"
  | "unknown";

export function normalizeTransoftStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("es") : "";
}

export function classifyTransoftStatus(value: unknown): TransoftStatusKind {
  const status = normalizeTransoftStatus(value);

  if (
    ["pagado", "paid", "completado", "completed", "aprobado"].includes(status)
  ) {
    return "completed";
  }
  if (["pendiente", "pending", "procesando", "processing"].includes(status)) {
    return "pending";
  }
  if (["cancelado", "cancelled", "expirado", "expired"].includes(status)) {
    return "cancelled";
  }
  if (
    [
      "fallido",
      "failed",
      "rechazado",
      "declinado",
      "declined",
      "error",
    ].includes(status)
  ) {
    return "failed";
  }

  return "unknown";
}

export function parseTransoftPaymentDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim();
  const boliviaLocalMatch = normalized.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})$/,
  );
  const parsed = boliviaLocalMatch
    ? new Date(`${boliviaLocalMatch[1]}T${boliviaLocalMatch[2]}-04:00`)
    : new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
