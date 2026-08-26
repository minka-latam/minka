import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type MockSession = {
  token: string;
  code: string;
  amount: number;
  currency: "USD" | "BOB";
  description: string;
  redirectUrl: string;
  createdAt: string;
  paymentDate?: string;
  status?: string;
};

const port = Number(process.env.MOCK_TRANSOFT_PORT) || 4010;
const providerApiKey =
  process.env.MOCK_TRANSOFT_API_KEY ||
  process.env.TRANSOFT_API_KEY ||
  "local-transoft-key";
const webhookApiKey =
  process.env.MOCK_MINKA_WEBHOOK_KEY ||
  process.env.TRANSOFT_WEBHOOK_API_KEY ||
  "local-webhook-key";
const minkaBaseUrl = (
  process.env.MOCK_MINKA_BASE_URL ||
  process.env.TRANSOFT_MERCHANT_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const sessions = new Map<string, MockSession>();

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function html(response: ServerResponse, status: number, body: string) {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJson(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new Error("Request too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function isProviderAuthorized(request: IncomingMessage) {
  return request.headers.authorization === `Bearer ${providerApiKey}`;
}

function checkoutPage(session: MockSession) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock Transoft</title><style>
body{font-family:system-ui,sans-serif;background:#eef3f6;color:#102033;margin:0;padding:32px}.card{max-width:680px;margin:30px auto;background:white;border-radius:20px;padding:32px;box-shadow:0 18px 50px #16324f20}.badge{display:inline-block;background:#dff7ed;color:#076b4b;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:700}h1{margin:18px 0 8px}.summary{background:#102033;color:white;border-radius:15px;padding:22px;margin:22px 0}.row{display:flex;justify-content:space-between;gap:20px;margin:8px 0}.actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}button{border:0;border-radius:12px;padding:14px;font-weight:700;cursor:pointer}.pay{background:#178a67;color:white}.fail{background:#fbe7e7;color:#9d2525}@media(max-width:540px){body{padding:12px}.card{padding:22px}.actions{grid-template-columns:1fr}}</style></head>
<body><main class="card"><span class="badge">SIMULADOR LOCAL · NO COBRA TARJETAS</span><h1>Checkout Transoft</h1><p>Esta página imita el checkout hospedado para probar Minka de punta a punta.</p>
<div class="summary"><div class="row"><span>bookCode</span><strong>${escapeHtml(session.code)}</strong></div><div class="row"><span>Descripción</span><strong>${escapeHtml(session.description)}</strong></div><div class="row"><span>Total</span><strong>${escapeHtml(session.currency)} ${session.amount.toFixed(2)}</strong></div></div>
<div class="actions"><form method="post" action="/payments/${encodeURIComponent(session.token)}/complete?status=Pagado"><button class="pay" type="submit">Simular pago aprobado</button></form><form method="post" action="/payments/${encodeURIComponent(session.token)}/complete?status=Rechazado"><button class="fail" type="submit">Simular pago rechazado</button></form></div></main></body></html>`;
}

async function notifyMinka(session: MockSession, status: string) {
  const tokenResponse = await fetch(
    `${minkaBaseUrl}/api/webhooks/transoft/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${webhookApiKey}`,
      },
      body: JSON.stringify({ bookCode: session.code, status }),
    },
  );
  const tokenBody = (await tokenResponse.json()) as Record<string, unknown>;
  const notificationToken = tokenBody.notification_token || tokenBody.token;
  if (!tokenResponse.ok || typeof notificationToken !== "string") {
    throw new Error(
      `Minka token endpoint returned ${tokenResponse.status}: ${JSON.stringify(tokenBody)}`,
    );
  }

  const paymentDate = new Date().toISOString();
  const notificationResponse = await fetch(
    `${minkaBaseUrl}/api/webhooks/transoft/${encodeURIComponent(notificationToken)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookCode: session.code,
        status,
        paymentDate,
        amount: session.amount.toFixed(2),
        currency: session.currency,
      }),
    },
  );
  const notificationBody = await notificationResponse.json();
  if (!notificationResponse.ok) {
    throw new Error(
      `Minka notification endpoint returned ${notificationResponse.status}: ${JSON.stringify(notificationBody)}`,
    );
  }
  session.status = status;
  session.paymentDate = paymentDate;
}

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url || "/",
    `http://${request.headers.host || `localhost:${port}`}`,
  );

  try {
    if (request.method === "POST" && url.pathname === "/api/payments/session") {
      if (!isProviderAuthorized(request))
        return json(response, 401, { error: "Unauthorized" });
      const body = (await readJson(request)) as Record<string, unknown>;
      const code = typeof body.code === "string" ? body.code.trim() : "";
      const amount = Number(body.amount);
      const currency = body.currency;
      const redirectUrl =
        typeof body.urlToRedirect === "string" ? body.urlToRedirect : "";
      if (
        !code ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        (currency !== "USD" && currency !== "BOB") ||
        body.redirect !== true ||
        !redirectUrl
      ) {
        return json(response, 422, { error: "Invalid session payload" });
      }
      new URL(redirectUrl);
      const token = randomUUID().replaceAll("-", "");
      sessions.set(token, {
        token,
        code,
        amount,
        currency,
        description:
          typeof body.descripcion === "string"
            ? body.descripcion
            : "Donación Minka",
        redirectUrl,
        createdAt: new Date().toISOString(),
      });
      return json(response, 200, {
        token,
        url: `http://localhost:${port}/payments/${token}`,
        expires_in: 900,
      });
    }

    if (request.method === "POST" && url.pathname === "/api/payments/search") {
      if (!isProviderAuthorized(request))
        return json(response, 401, { error: "Unauthorized" });
      const body = (await readJson(request)) as Record<string, unknown>;
      const bookCode = typeof body.bookCode === "string" ? body.bookCode : "";
      const payments = [...sessions.values()]
        .filter((session) => !bookCode || session.code === bookCode)
        .map((session) => ({
          bookCode: session.code,
          amount: session.amount.toFixed(2),
          currency: session.currency,
          description: session.description,
          status: session.status || "Pendiente",
          creationDate: session.createdAt,
          paymentDate: session.paymentDate || null,
        }));
      return json(response, 200, {
        success: true,
        count: payments.length,
        payments,
        data: payments,
      });
    }

    const checkoutMatch = url.pathname.match(/^\/payments\/([^/]+)$/);
    if (request.method === "GET" && checkoutMatch) {
      const session = sessions.get(decodeURIComponent(checkoutMatch[1]));
      if (!session) return html(response, 404, "<h1>Sesión no encontrada</h1>");
      return html(response, 200, checkoutPage(session));
    }

    const completionMatch = url.pathname.match(
      /^\/payments\/([^/]+)\/complete$/,
    );
    if (request.method === "POST" && completionMatch) {
      const session = sessions.get(decodeURIComponent(completionMatch[1]));
      if (!session) return html(response, 404, "<h1>Sesión no encontrada</h1>");
      const status =
        url.searchParams.get("status") === "Rechazado" ? "Rechazado" : "Pagado";
      await notifyMinka(session, status);
      const destination = JSON.stringify(session.redirectUrl).replaceAll(
        "<",
        "\\u003c",
      );
      return html(
        response,
        200,
        `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;text-align:center;padding:60px"><h1>${status === "Pagado" ? "Pago aprobado" : "Pago rechazado"}</h1><p>Minka ya recibió la notificación. Redirigiendo…</p><p><a href=${JSON.stringify(session.redirectUrl)}>Volver ahora</a></p><script>setTimeout(()=>location.assign(${destination}),1500)</script></body></html>`,
      );
    }

    return json(response, 404, { error: "Not found" });
  } catch (error) {
    console.error("[MOCK TRANSOFT]", error);
    return json(response, 500, {
      error: error instanceof Error ? error.message : "Mock server error",
    });
  }
});

server.listen(port, () => {
  console.log(`Mock Transoft listening on http://localhost:${port}`);
  console.log(`Sending callbacks to ${minkaBaseUrl}`);
});
