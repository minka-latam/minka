// @ts-nocheck

type CampaignReviewEmailPayload = {
  campaignId?: string;
  campaignTitle?: string;
  organizerName?: string;
  organizerEmail?: string;
  submittedAt?: string;
  campaignUrl?: string;
  dashboardUrl?: string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const fromEmail = Deno.env.get("MINKA_REVIEW_FROM_EMAIL");
  const toEmail =
    Deno.env.get("MINKA_REVIEW_TO_EMAIL") || "minkacomunidad0@gmail.com";

  if (!resendApiKey || !fromEmail) {
    return new Response(
      JSON.stringify({ error: "Email provider is not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | CampaignReviewEmailPayload
    | null;

  if (
    !payload?.campaignId ||
    !payload.campaignTitle ||
    !payload.organizerName ||
    !payload.organizerEmail ||
    !payload.submittedAt ||
    !payload.campaignUrl ||
    !payload.dashboardUrl
  ) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const title = escapeHtml(payload.campaignTitle);
  const organizerName = escapeHtml(payload.organizerName);
  const organizerEmail = escapeHtml(payload.organizerEmail);
  const campaignUrl = escapeHtml(payload.campaignUrl);
  const dashboardUrl = escapeHtml(payload.dashboardUrl);
  const submittedAt = new Date(payload.submittedAt).toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
  });

  const subject = `Nueva campaña pendiente de revisión`;
  const preheader = `La campaña "${payload.campaignTitle}" fue enviada para aprobación.`;

  const text = [
    "Nueva campaña pendiente de revisión",
    "",
    "Una campaña fue enviada para aprobación en Minka Comunidad.",
    "",
    `Campaña: ${payload.campaignTitle}`,
    `Organizador: ${payload.organizerName}`,
    `Email: ${payload.organizerEmail}`,
    `Fecha de envío: ${submittedAt}`,
    "",
    `Ver campaña: ${payload.campaignUrl}`,
    `Panel admin: ${payload.dashboardUrl}`,
    "",
    "Este es un aviso automático de Minka Comunidad.",
  ].join("\n");

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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e6da;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#2f7d3f;padding:24px 28px;">
                <p style="margin:0;color:#dcefd9;font-size:13px;letter-spacing:.02em;text-transform:uppercase;">Minka Comunidad</p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700;">Nueva campaña pendiente de revisión</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 22px;color:#415041;font-size:16px;line-height:1.5;">
                  Una campaña fue enviada para aprobación. Revisa el contenido y define si debe publicarse.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;width:135px;">Campaña</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;font-weight:700;">${title}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Organizador</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;">${organizerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#6a7468;font-size:13px;">Email</td>
                    <td style="padding:12px 0;border-bottom:1px solid #eef0ea;color:#172017;font-size:14px;">
                      <a href="mailto:${organizerEmail}" style="color:#2f7d3f;text-decoration:none;">${organizerEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0;color:#6a7468;font-size:13px;">Enviada</td>
                    <td style="padding:12px 0;color:#172017;font-size:14px;">${escapeHtml(submittedAt)}</td>
                  </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                  <tr>
                    <td style="border-radius:8px;background:#2f7d3f;">
                      <a href="${campaignUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Ver campaña</a>
                    </td>
                    <td style="width:12px;"></td>
                    <td style="border-radius:8px;border:1px solid #2f7d3f;">
                      <a href="${dashboardUrl}" style="display:inline-block;padding:11px 18px;color:#2f7d3f;text-decoration:none;font-size:14px;font-weight:700;">Panel admin</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;color:#6a7468;font-size:12px;line-height:1.5;">
                  Este aviso se envió automáticamente porque una campaña entró a la cola de revisión.
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
      to: [toEmail],
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
