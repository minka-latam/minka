# Test the Transoft flow locally

The repository includes a local provider simulator. It creates a hosted
checkout, calls both Minka webhook endpoints, and redirects back to the campaign.
It never asks for or processes a real card.

## 1. Configure Minka

Add these values to `.env.local` (keep the existing database/Supabase values):

```dotenv
TRANSOFT_BASE_URL=http://localhost:4010/api/payments
TRANSOFT_API_KEY=local-transoft-key
TRANSOFT_WEBHOOK_API_KEY=local-webhook-key
TRANSOFT_RECONCILE_SECRET=local-reconcile-key
TRANSOFT_MERCHANT_BASE_URL=http://localhost:3000
TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE=11.50
```

Do not commit `.env.local`. For real Transoft testing, replace these values
with the development URL and secrets Jorge provides.

The simulator automatically reads the same `TRANSOFT_API_KEY`,
`TRANSOFT_WEBHOOK_API_KEY`, and `TRANSOFT_MERCHANT_BASE_URL` values as Minka,
so you do not need separate `MOCK_*` variables.

## 2. Apply the database migrations

With the local database running:

```bash
npx prisma migrate deploy
npx prisma generate
```

This preserves old Tripto rows while renaming their columns to provider-neutral
names, and adds the Transoft notification-token table.

## 3. Start both services

Terminal 1:

```bash
npm run transoft:mock
```

Terminal 2:

```bash
npm run dev
```

Optional connection check (while the simulator is running):

```bash
npm run transoft:check
```

With a localhost base URL this only proves connectivity and authentication
against the simulator. With Jorge's Railway base URL it checks the real
development API using a read-only `/search` request.

Open `http://localhost:3000`, enter a campaign's donation page, choose
**Tarjeta de crédito/débito**, and test both **Tarjeta boliviana** (BOB) and
**Tarjeta extranjera** (USD). The `11.50` rate above is only a local-test
accounting example. On the mock checkout, choose approved or rejected. The
simulator calls Minka and redirects back; Minka then displays the result.

## 4. Test reconciliation

If a donation is still pending, copy its donation ID/bookCode and run:

```bash
curl -X POST http://localhost:3000/api/transoft/reconcile \
  -H 'Authorization: Bearer local-reconcile-key' \
  -H 'Content-Type: application/json' \
  --data '{"bookCode":"PASTE-DONATION-UUID"}'
```

Omit `bookCode` by sending `{}` to reconcile up to 20 oldest pending Transoft
donations. In production this endpoint should be called by a protected scheduled
job, never by the browser.

## 5. Test against Transoft's remote development service

Set `TRANSOFT_BASE_URL` and `TRANSOFT_API_KEY` to their development values. The
redirect can point to localhost in a browser, but Transoft cannot call localhost
from its server. Use an HTTPS tunnel (for example Cloudflare Tunnel or ngrok),
set `TRANSOFT_MERCHANT_BASE_URL` to that public origin, and give Transoft these
public endpoints if they need to configure them:

```text
POST  https://YOUR-TUNNEL/api/webhooks/transoft/token
PATCH https://YOUR-TUNNEL/api/webhooks/transoft/{notification_token}
```

Keep the tunnel URL and API keys private. The eventual production origin must be
HTTPS and stable.
