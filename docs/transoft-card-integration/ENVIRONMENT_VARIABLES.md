# Transoft environment variables

## Required for the local simulator

Copy these into `.env.local`. They are test-only values shared between Minka
and the repository's simulator; Jorge does not provide them.

```dotenv
TRANSOFT_BASE_URL=http://localhost:4010/api/payments
TRANSOFT_API_KEY=local-transoft-key
TRANSOFT_WEBHOOK_API_KEY=local-webhook-key
TRANSOFT_RECONCILE_SECRET=local-reconcile-key
TRANSOFT_MERCHANT_BASE_URL=http://localhost:3000
TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE=11.50
```

The `11.50` value is an example for local testing, not a permanently approved
production policy.

## Ownership for remote development and production

| Variable                              | Who supplies it                                            | What to use                                                                                                                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TRANSOFT_BASE_URL`                   | Transoft/Jorge                                             | Jorge's current development base URL is `https://payment-service-card-production.up.railway.app/api/payments`; he said it will change after production approval.                                                                              |
| `TRANSOFT_API_KEY`                    | Transoft/Jorge                                             | The real `merchant_notification_api_key` used as `Authorization: Bearer ...` when Minka calls Transoft. On 2026-08-25 the configured old `$2...` password was tested against `/search` and returned HTTP 401; Jorge must provide the v10 key. |
| `TRANSOFT_WEBHOOK_API_KEY`            | Preferably Minka, agreed with Transoft                     | A separate high-entropy key that Transoft sends when calling Minka's token endpoint. Generate it and share it securely with Jorge, unless he provisions it instead.                                                                           |
| `TRANSOFT_MERCHANT_BASE_URL`          | Minka                                                      | Minka's public origin: an HTTPS tunnel during remote development and the stable Minka domain in production.                                                                                                                                   |
| `TRANSOFT_RECONCILE_SECRET`           | Minka only                                                 | An internal key protecting Minka's reconciliation endpoint. Do not give this to Transoft.                                                                                                                                                     |
| `TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE` | Minka/accounting policy, pending Jorge's settlement answer | Positive decimal used only to express USD donations in Minka's BOB campaign ledger. It is not sent to Transoft. Do not use 6.96 by default.                                                                                                   |
| `TRANSOFT_TIMEOUT_MS`                 | Minka, optional                                            | Provider request timeout in milliseconds; defaults to `10000`.                                                                                                                                                                                |

Generate each Minka-owned secret independently, for example:

```bash
openssl rand -hex 32
```

Do not commit `.env.local`, paste production keys into chat, reuse the same
secret for reconciliation and webhooks, or put server secrets in a
`NEXT_PUBLIC_*` variable.
