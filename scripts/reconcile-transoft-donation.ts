import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  const donationId = process.argv[2]?.trim();
  if (!donationId) {
    throw new Error("Usage: npm run transoft:reconcile -- DONATION_ID");
  }

  const secret = process.env.TRANSOFT_RECONCILE_SECRET?.trim();
  if (!secret) throw new Error("TRANSOFT_RECONCILE_SECRET is not configured");

  const response = await fetch("http://localhost:3000/api/transoft/reconcile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookCode: donationId }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Minka reconciliation returned HTTP ${response.status}: ${JSON.stringify(data)}`,
    );
  }

  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
