# Transoft card integration: final questions

## Implemented from integration guide v10

- Minka sends `POST /api/payments/session` with Bearer API-key authentication.
- `code`/`bookCode` is the Minka donation UUID, so every payment attempt is
  unique and traceable.
- The donor chooses **Tarjeta boliviana** (a BOB session) or **Tarjeta
  extranjera** (a USD session). The amount and voluntary Minka contribution are
  sent to Transoft together in that selected currency.
- Transoft hosts the card form; Minka never receives or stores PAN, CVV, or
  expiration data.
- The session supplies a dynamic `urlToRedirect` containing the donation ID.
- Transoft first calls `POST /api/webhooks/transoft/token` with its Bearer key
  and `{ bookCode, status }`. Minka returns an opaque, hashed-at-rest token that
  expires in 300 seconds.
- Transoft then calls `PATCH` or `POST`
  `/api/webhooks/transoft/{notification_token}` with the payment details.
- A callback only credits the campaign after token, bookCode, status, amount,
  currency, and payment date validation. Duplicate delivery is idempotent.
- `POST /api/transoft/reconcile` performs a protected `/search` lookup for one
  donation or up to 20 pending donations.

## Deliberate safety decisions where v10 is incomplete

- Amount `0` is invalid. The guide requires an amount in `/session` and never
  defines an open-amount mode; the zero in the `/search` example is treated as
  sample/test data, not permission to credit an unspecified amount.
- Guide v10 does not return a BOB settlement amount or an FX rate, while Minka
  campaigns and available balances are BOB-only. Minka therefore stores the
  exact Transoft amount/currency in provider fields and uses
  `TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE` only to snapshot the BOB campaign-ledger
  value of a USD donation. No rate is hardcoded or sent to Transoft.
- The configurable accounting rate is a provisional integration assumption.
  Production USD payments must remain disabled until Jorge confirms who owns
  the rate and whether Transoft can return an exact BOB settlement amount.
- Status aliases currently map `Pagado`, `Paid`, `Completado`, and `Aprobado`
  to success; unknown statuses are rejected without consuming the token.
- A date like `2026-08-23 10:00:00` without an offset is interpreted as Bolivia
  time (UTC-04:00).
- Refunds and chargebacks are not automated because v10 defines neither their
  statuses nor their accounting lifecycle.
- Separate outbound and inbound secrets are supported. If no inbound key is
  set, Minka temporarily falls back to the provider API key for compatibility.

## Questions that still need Transoft's answer

Blocking before remote testing: the old `$2...` password was tested as the
Bearer credential against the documented development `/search` endpoint on
2026-08-25 and returned HTTP 401. Request the complete, unmasked
`merchant_notification_api_key`.

1. What is the exhaustive, case-sensitive status list, and does `Pagado` mean
   captured/final settlement rather than authorization only?
2. What timezone and exact format does `paymentDate` use?
3. Does endpoint B send the notification token only in the URL, or also in an
   authorization header? Does it additionally send the fixed API key?
4. What response code/body does Transoft require from both Minka endpoints?
   Does it expect `token`, `notification_token`, or another response field?
5. What is the retry schedule, and should an identical used-token retry return
   HTTP 200 or HTTP 409? Minka currently returns 200 for an identical retry.
6. Is `amount` always in major units with at most two decimals? Confirm that
   the `/search` example's `"0"` is only sample data and not “open amount.”
7. Will `/search` always include the real paid amount, currency, status, and a
   non-null payment date? Which of its duplicate arrays, `payments` or `data`,
   is canonical?
8. Is there a provider transaction/authorization ID distinct from bookCode?
9. Which refund, reversal, chargeback, timeout, and expiry statuses can arrive,
   and how should a merchant initiate a refund?
10. Can Transoft provision distinct secrets for Minka calling Transoft and for
    Transoft calling Minka? How are keys rotated?
11. If Minka sends `currency: "USD"`, does Minka settle in USD or BOB? If BOB,
    where can Minka obtain the exact settled BOB amount and rate? The current
    callback provides only one amount and one currency.
12. Confirm that Minka's proposed UI mapping—Bolivian card to a BOB session and
    foreign card to a USD session—is valid. Can either card type reject the
    selected transaction currency?
13. Provide test cards and required certification cases for approval, decline,
    3-D Secure, duplicate callback, delayed callback, timeout, and reconciliation.
