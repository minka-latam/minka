import assert from "node:assert/strict";
import test from "node:test";

import {
  TransoftResponseError,
  parseTransoftSearchResponse,
  parseTransoftSessionResponse,
} from "@/lib/transoft/client";

test("parses the payment session shape shown by Transoft", () => {
  assert.deepEqual(
    parseTransoftSessionResponse({
      token: "opaque-session-token",
      url: "https://payments.example.test/payments/opaque-session-token",
      expires_in: 900,
    }),
    {
      token: "opaque-session-token",
      url: "https://payments.example.test/payments/opaque-session-token",
      expiresInSeconds: 900,
    },
  );
});

test("parses the v10 search response without trusting the duplicate data field", () => {
  assert.deepEqual(
    parseTransoftSearchResponse({
      success: true,
      count: 1,
      payments: [
        {
          bookCode: "donation-id",
          amount: 25,
          currency: "USD",
          status: "Pagado",
          paymentDate: "2026-08-23 10:00:00",
        },
      ],
      data: [{ malformed: true }],
    }),
    {
      count: 1,
      payments: [
        {
          bookCode: "donation-id",
          amount: "25",
          currency: "USD",
          status: "Pagado",
          paymentDate: "2026-08-23 10:00:00",
        },
      ],
    },
  );
});

test("rejects incomplete session responses", () => {
  assert.throws(
    () =>
      parseTransoftSessionResponse({
        token: "",
        url: "not-a-url",
        expires_in: 0,
      }),
    TransoftResponseError,
  );
});
