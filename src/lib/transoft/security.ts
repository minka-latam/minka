import crypto from "crypto";

export const TRANSOFT_NOTIFICATION_TOKEN_TTL_SECONDS = 5 * 60;

export function getTransoftWebhookApiKey() {
  return (
    process.env.TRANSOFT_WEBHOOK_API_KEY ||
    process.env.TRANSOFT_API_KEY ||
    ""
  ).trim();
}

export function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

export function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isAuthorizedTransoftWebhookRequest(request: Request) {
  const expected = getTransoftWebhookApiKey();
  const received = readBearerToken(request);
  return Boolean(
    expected && received && timingSafeEqualString(received, expected),
  );
}

export function generateTransoftNotificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashTransoftNotificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
