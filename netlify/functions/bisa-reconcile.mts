import { reconcilePendingBisaQrDonations } from "../../src/lib/bisa/reconciliation";

export default async function handler() {
  const startedAt = Date.now();

  try {
    const result = await reconcilePendingBisaQrDonations();

    console.info(
      JSON.stringify({
        event: "bisa_reconcile_completed",
        durationMs: Date.now() - startedAt,
        checked: result.checked,
        completed: result.completed,
        pending: result.pending,
        failed: result.failed,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "bisa_reconcile_failed",
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    );
    throw error;
  }
}
