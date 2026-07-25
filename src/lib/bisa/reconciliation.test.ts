import assert from "node:assert/strict";
import test from "node:test";

import {
  BISA_EXPIRATION_GRACE_MINUTES,
  BISA_RECONCILIATION_BATCH_SIZE,
  BISA_RECONCILIATION_CONCURRENCY,
  getBisaReconciliationCutoffs,
} from "@/lib/bisa/reconciliation";

test("uses the optimized reconciliation limits", () => {
  assert.equal(BISA_RECONCILIATION_BATCH_SIZE, 5);
  assert.equal(BISA_RECONCILIATION_CONCURRENCY, 2);
  assert.equal(BISA_EXPIRATION_GRACE_MINUTES, 30);
});

test("keeps expired QR donations eligible for 30 minutes", () => {
  const now = new Date("2026-07-24T12:00:00.000Z");
  const { expirationGraceCutoff, recentNoExpirationCutoff } =
    getBisaReconciliationCutoffs(now);

  assert.equal(expirationGraceCutoff.toISOString(), "2026-07-24T11:30:00.000Z");
  assert.equal(
    recentNoExpirationCutoff.toISOString(),
    "2026-07-23T12:00:00.000Z",
  );
});
