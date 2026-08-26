import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyTransoftStatus,
  parseTransoftPaymentDate,
} from "@/lib/transoft/status";

test("classifies the documented/sample Spanish payment states", () => {
  assert.equal(classifyTransoftStatus("Pagado"), "completed");
  assert.equal(classifyTransoftStatus("Pendiente"), "pending");
  assert.equal(classifyTransoftStatus("Rechazado"), "failed");
  assert.equal(classifyTransoftStatus("something-new"), "unknown");
});

test("assumes Bolivia time for a provider date without a timezone", () => {
  assert.equal(
    parseTransoftPaymentDate("2026-08-23 10:15:30")?.toISOString(),
    "2026-08-23T14:15:30.000Z",
  );
});
