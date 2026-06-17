// @ts-nocheck

type VerificationResultEmailPayload = {
  campaignId?: string;
  campaignTitle?: string;
  organizerName?: string;
  organizerEmail?: string;
  status?: "approved" | "rejected";
  notes?: string | null;
  campaignUrl?: string;
  verificationUrl?: string;
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
    Deno.env.get("MINKA_VERIFICATION_FROM_EMAIL") ||
    Deno.env.get("MINKA_EMAIL_FROM") ||
    Deno.env.get("MINKA_REVIEW_FROM_EMAIL");

  if (!resendApiKey || !fromEmail) {
    return new Response(
      JSON.stringify({ error: "Email provider is not configured" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | VerificationResultEmailPayload
    | null;

  if (
    !payload?.campaignId ||
    !payload.campaignTitle ||
    !payload.organizerName ||
    !payload.organizerEmail ||
    !payload.status ||
    !["approved", "rejected"].includes(payload.status) ||
    !payload.campaignUrl ||
    !payload.verificationUrl
  ) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const isApproved = payload.status === "approved";
  const campaignTitle = escapeHtml(payload.campaignTitle);
  const organizerName = escapeHtml(payload.organizerName);
  const organizerEmail = escapeHtml(payload.organizerEmail);
  const campaignUrl = escapeHtml(payload.campaignUrl);
  const verificationUrl = escapeHtml(payload.verificationUrl);
  const notes = payload.notes ? escapeHtml(payload.notes) : "";
  const logoUrl = escapeHtml(
    Deno.env.get("MINKA_EMAIL_LOGO_URL") || defaultLogoUrl,
  );
  const subject = isApproved
    ? `Verification Approval: ${payload.campaignTitle}`
    : `Verification Rejection: ${payload.campaignTitle}`;
  const statusTitle = isApproved
    ? "VERIFICATION APROBADA"
    : "VERIFICATION RECHAZADA";
  const statusCopy = isApproved
    ? "Tu campaña ya cuenta con el sello de verificación de Minka."
    : "Tu solicitud de verificación fue revisada y por ahora no pudo ser aprobada.";
  const accentColor = isApproved ? "#2c6e49" : "#9b3a32";
  const accentBg = isApproved ? "#edf7ee" : "#fff1ef";
  const text = [
    statusTitle,
    "",
    `Hola ${payload.organizerName},`,
    statusCopy,
    "",
    `Campaña: ${payload.campaignTitle}`,
    notes ? `Notas del equipo: ${payload.notes}` : null,
    "",
    isApproved
      ? `Ver campaña: ${payload.campaignUrl}`
      : `Actualizar solicitud: ${payload.verificationUrl}`,
    "",
    "Este es un aviso automático de Minka Comunidad.",
  ]
    .filter(Boolean)
    .join("\n");

  const notesBlock = notes
    ? `<div style="background:#ffffff;border:1px solid #dfe7d8;border-radius:12px;padding:16px 18px;margin:0 0 20px;">
        <p style="margin:0 0 6px;color:#1f2937;font-size:14px;font-weight:700;">Notas del equipo</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${notes}</p>
      </div>`
    : "";

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background:#f5f7e9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7e9;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe7d8;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px;">
                <img src="${logoUrl}" width="120" height="40" alt="Minka Comunidad" style="display:block;width:120px;height:auto;margin:0 0 24px;">
                <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#2c6e49;">${statusTitle}</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;">
                  Hola ${organizerName}, ${escapeHtml(statusCopy)}
                </p>

                <div style="background:${accentBg};border:1px solid ${accentColor};border-radius:12px;padding:16px 18px;margin:0 0 20px;">
                  <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.6;">
                    <strong>Campaña:</strong> ${campaignTitle}
                  </p>
                </div>

                ${notesBlock}

                <a href="${isApproved ? campaignUrl : verificationUrl}" style="display:inline-block;background:#2c6e49;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:13px 22px;border-radius:999px;">
                  ${isApproved ? "Ver campaña" : "Actualizar solicitud"}
                </a>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                  Este correo fue enviado a ${organizerEmail} porque solicitaste verificación para una campaña en Minka Comunidad.
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
      to: [payload.organizerEmail],
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
