// @ts-nocheck

type DonorThankYouEmailPayload = {
  donationId?: string;
  campaignId?: string;
  campaignTitle?: string;
  donorName?: string;
  donorEmail?: string;
  amount?: number;
  tipAmount?: number;
  totalAmount?: number;
  currency?: string;
  completedAt?: string;
  campaignUrl?: string;
  donationsUrl?: string;
  logoUrl?: string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

const defaultLogoUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-2S5vgSiFRwu8gClKBuwTXkOi5H46aN.svg";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(amount: number, currency: string) {
  const prefix = currency === "BOB" ? "Bs." : currency;
  return `${prefix} ${amount.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail =
    Deno.env.get("MINKA_DONOR_FROM_EMAIL") ||
    Deno.env.get("MINKA_EMAIL_FROM") ||
    Deno.env.get("MINKA_REVIEW_FROM_EMAIL");

  if (!resendApiKey || !fromEmail) {
    return new Response(
      JSON.stringify({ error: "Email provider is not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | DonorThankYouEmailPayload
    | null;

  if (
    !payload?.donationId ||
    !payload.campaignId ||
    !payload.campaignTitle ||
    !payload.donorName ||
    !payload.donorEmail ||
    typeof payload.amount !== "number" ||
    typeof payload.totalAmount !== "number" ||
    !payload.currency ||
    !payload.completedAt ||
    !payload.campaignUrl ||
    !payload.donationsUrl
  ) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const campaignTitle = escapeHtml(payload.campaignTitle);
  const donorName = escapeHtml(payload.donorName);
  const donorEmail = escapeHtml(payload.donorEmail);
  const campaignUrl = escapeHtml(payload.campaignUrl);
  const donationsUrl = escapeHtml(payload.donationsUrl);
  const logoUrl = escapeHtml(
    Deno.env.get("MINKA_EMAIL_LOGO_URL") ||
      payload.logoUrl ||
      defaultLogoUrl,
  );
  const tipAmount = Number(payload.tipAmount || 0);
  const completedAt = new Date(payload.completedAt).toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
  });
  const subject = `Gracias por donar a ${payload.campaignTitle}`;
  const preheader =
    "Tu aporte fue recibido correctamente. Gracias por ayudar a que esta campaña avance.";

  const text = [
    `Gracias por tu donación, ${payload.donorName}`,
    "",
    "Tu aporte fue recibido correctamente en Minka Comunidad.",
    "",
    `Campaña: ${payload.campaignTitle}`,
    `Donación: ${formatMoney(payload.amount, payload.currency)}`,
    tipAmount > 0
      ? `Aporte a Minka: ${formatMoney(tipAmount, payload.currency)}`
      : null,
    `Total: ${formatMoney(payload.totalAmount, payload.currency)}`,
    `Fecha: ${completedAt}`,
    "",
    "Gracias por ser parte de una comunidad que se mueve para ayudar.",
    "",
    `Ver campaña: ${payload.campaignUrl}`,
    `Mis donaciones: ${payload.donationsUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const tipRow =
    tipAmount > 0
      ? `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Aporte a Minka</td>
          <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;text-align:right;">${escapeHtml(
            formatMoney(tipAmount, payload.currency),
          )}</td>
        </tr>`
      : "";

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7f2;font-family:Arial,Helvetica,sans-serif;color:#243124;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f2;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e6da;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#2f7d3f;padding:24px 28px;">
                <img src="${logoUrl}" width="120" height="40" alt="Minka Comunidad" style="display:block;width:120px;height:auto;margin:0 0 18px;">
                <h1 style="margin:0;color:#ffffff;font-size:25px;line-height:1.25;font-weight:700;">Gracias por tu donación</h1>
                <p style="margin:10px 0 0;color:#dcefd9;font-size:15px;line-height:1.5;">Tu aporte ya está ayudando a que esta campaña avance.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px;color:#415041;font-size:16px;line-height:1.55;">
                  Hola ${donorName}, recibimos tu donación para <strong style="color:#172017;">${campaignTitle}</strong>. Gracias por confiar en Minka Comunidad y por sumarte a una causa que necesita apoyo real.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Campaña</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;font-weight:700;text-align:right;">${campaignTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Donación</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;text-align:right;">${escapeHtml(
                      formatMoney(payload.amount, payload.currency),
                    )}</td>
                  </tr>
                  ${tipRow}
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Total pagado</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:16px;font-weight:700;text-align:right;">${escapeHtml(
                      formatMoney(payload.totalAmount, payload.currency),
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#6a7468;font-size:13px;">Fecha</td>
                    <td style="padding:12px 0;color:#172017;font-size:14px;text-align:right;">${escapeHtml(completedAt)}</td>
                  </tr>
                </table>

                <div style="background:#f2f7ee;border:1px solid #dcebd7;border-radius:10px;padding:16px 18px;margin:0 0 24px;">
                  <p style="margin:0;color:#334333;font-size:14px;line-height:1.55;">
                    En Minka creemos que la ayuda se construye en comunidad. Tu aporte, grande o pequeño, suma directamente al objetivo de esta campaña.
                  </p>
                </div>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                  <tr>
                    <td style="border-radius:8px;background:#2f7d3f;">
                      <a href="${campaignUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Ver campaña</a>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="border-radius:8px;border:1px solid #2f7d3f;">
                      <a href="${donationsUrl}" style="display:inline-block;padding:11px 18px;color:#2f7d3f;text-decoration:none;font-size:14px;font-weight:700;">Mis donaciones</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;color:#6a7468;font-size:12px;line-height:1.5;">
                  Este correo fue enviado a ${donorEmail} porque realizaste una donación autenticada en Minka Comunidad.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.donorEmail],
      subject,
      html,
      text,
    }),
  });

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: errorBody,
      }),
      { status: 502, headers: jsonHeaders },
    );
  }

  const data = await resendResponse.json().catch(() => ({}));
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: jsonHeaders,
  });
});
