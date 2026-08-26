import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const required = [
    "TRANSOFT_BASE_URL",
    "TRANSOFT_API_KEY",
    "TRANSOFT_WEBHOOK_API_KEY",
    "TRANSOFT_RECONCILE_SECRET",
    "TRANSOFT_MERCHANT_BASE_URL",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const apiKey = process.env.TRANSOFT_API_KEY!.trim();
  if (apiKey.includes("***") || apiKey.includes("…")) {
    throw new Error(
      "TRANSOFT_API_KEY is masked. Ask Jorge for the complete merchant_notification_api_key.",
    );
  }

  new URL(process.env.TRANSOFT_BASE_URL!);
  new URL(process.env.TRANSOFT_MERCHANT_BASE_URL!);
  const target = new URL(process.env.TRANSOFT_BASE_URL!);
  console.log(
    `Checking ${target.origin}${target.pathname.replace(/\/$/, "")}/search`,
  );
  if (["localhost", "127.0.0.1"].includes(target.hostname)) {
    console.log(
      "Local target detected: this verifies the simulator, not Jorge's development credential.",
    );
  }

  const webhookKey = process.env.TRANSOFT_WEBHOOK_API_KEY!.trim();
  const reconcileSecret = process.env.TRANSOFT_RECONCILE_SECRET!.trim();
  if (webhookKey === reconcileSecret || webhookKey === apiKey) {
    console.warn(
      "Warning: use independent values for the outbound API key, inbound webhook key, and reconciliation secret.",
    );
  }
  if (apiKey.startsWith("$2")) {
    console.warn(
      "Warning: TRANSOFT_API_KEY looks like the old bcrypt-style password. The live request below will determine whether Transoft accepts it as the v10 Bearer key.",
    );
  }

  const { TransoftClient, TransoftResponseError } = await import(
    "../src/lib/transoft/client"
  );
  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await TransoftClient.fromEnvironment().searchPayments({
      fromDate: today,
      toDate: today,
    });
    console.log(
      `Transoft connection OK. Authentication succeeded; /search returned ${result.count} payment(s) for ${today}.`,
    );
  } catch (error) {
    if (error instanceof TransoftResponseError && error.status === 401) {
      throw new Error(
        "Transoft returned HTTP 401. TRANSOFT_API_KEY is not the valid v10 merchant_notification_api_key.",
      );
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? `Transoft check failed: ${error.message}` : error,
  );
  process.exitCode = 1;
});
