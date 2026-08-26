# Real Transoft development test

Do not run `npm run transoft:mock`. A real checkout must never open on
`localhost:4010`.

## 1. Obtain the missing Transoft configuration

Ask Jorge for:

1. The complete, unmasked `merchant_notification_api_key` for the v10
   development service. The complete `$2y$10$...` password supplied by Jorge
   was tested on 2026-08-25 as both a v10 Bearer key and the legacy
   `username/password` body credential; `/search` and `/session` both returned
   HTTP 401 `Credenciales inválidas`.
2. Confirmation that the development service is safe for test cards, plus the
   ATC/RedEnlace test cards and approval/decline cases.
3. Registration of Minka's two public webhook URLs and the Bearer key Transoft
   will send to Service A.

Send Jorge these URLs after choosing the public Minka origin:

```text
POST  https://PUBLIC-MINKA-ORIGIN/api/webhooks/transoft/token
PATCH https://PUBLIC-MINKA-ORIGIN/api/webhooks/transoft/{notification_token}
```

Also send him the value of `TRANSOFT_WEBHOOK_API_KEY` securely. Do not send
`TRANSOFT_RECONCILE_SECRET`.

## 2. Configure Minka

```dotenv
TRANSOFT_BASE_URL=https://payment-service-card-production.up.railway.app/api/payments
TRANSOFT_API_KEY=THE_COMPLETE_KEY_FROM_JORGE
TRANSOFT_WEBHOOK_API_KEY=THE_KEY_REGISTERED_WITH_JORGE
TRANSOFT_MERCHANT_BASE_URL=https://PUBLIC-MINKA-ORIGIN
TRANSOFT_RECONCILE_SECRET=A_PRIVATE_MINKA_ONLY_SECRET
TRANSOFT_USD_TO_BOB_ACCOUNTING_RATE=11.50
```

For local development, `PUBLIC-MINKA-ORIGIN` must be an HTTPS tunnel forwarding
to `http://localhost:3000`. Alternatively, deploy the branch to Netlify and use
that stable HTTPS origin. The `11.50` rate is only provisional test accounting;
it is not sent to Transoft and must be replaced by the agreed settlement policy
before production.

Restart `npm run dev` after changing environment variables.

## 3. Prove authentication before opening checkout

```bash
npm run transoft:check
```

Continue only when it prints `Transoft connection OK`. HTTP 401 means the key
is wrong; `unavailable` means the URL/network is unreachable.

## 4. Run a real payment test

1. Open Minka through the public HTTPS origin, not through the simulator.
2. Create a minimal BOB donation first.
3. Confirm the returned checkout URL uses Transoft's domain, never
   `localhost:4010`.
4. Use only a test card supplied/approved by Jorge unless he explicitly
   confirms the environment will make a real charge.
5. Complete payment and wait for the redirect.
6. Verify the donation changes from `pending` to `completed` and the campaign is
   credited once.
7. Repeat with a declined card, duplicate callback, and then USD only after
   Jorge confirms transaction and settlement currency behavior.

For the first real checkout, the redirect may point back to localhost because
the redirect happens in the donor's browser. If Transoft has not registered a
public webhook URL yet, the payment can be verified manually from another
terminal after returning:

```bash
npm run transoft:reconcile -- PASTE_DONATION_ID
```

This makes Minka query the real Transoft `/search` endpoint and applies the
result. It is a local testing fallback; production should receive the webhooks.

If checkout opens but the donation remains pending, Transoft could create the
payment but could not reach or authenticate to Minka's public webhooks. Check
Jorge's registered URLs/key and the public deployment logs.
