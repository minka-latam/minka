import crypto from "crypto";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

type BisaQrAccessPayload = {
  donationId: string;
  campaignId: string;
  exp: number;
  v: 1;
};

function getSecret() {
  const secret =
    process.env.BISA_QR_ACCESS_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "BISA_QR_ACCESS_SECRET or SUPABASE_SERVICE_ROLE_KEY is required",
    );
  }

  return secret;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "=",
  );
  return Buffer.from(
    padded.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf-8");
}

function signPayload(encodedPayload: string) {
  return base64UrlEncode(
    crypto
      .createHmac("sha256", getSecret())
      .update(encodedPayload)
      .digest(),
  );
}

function timingSafeEqualString(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function createBisaQrAccessToken({
  donationId,
  campaignId,
}: {
  donationId: string;
  campaignId: string;
}) {
  const payload: BisaQrAccessPayload = {
    donationId,
    campaignId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    v: 1,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyBisaQrAccessToken(token: unknown) {
  if (typeof token !== "string" || !token.includes(".")) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!timingSafeEqualString(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as BisaQrAccessPayload;

    if (
      payload.v !== 1 ||
      !payload.donationId ||
      !payload.campaignId ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
