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

  const text = [
    "Nueva campaña para revisar",
    "",
    `Campaña: ${payload.campaignTitle}`,
    `Organizador: ${payload.organizerName} (${payload.organizerEmail})`,
    `Fecha de envío: ${submittedAt}`,
    "",
    `Ver campaña: ${payload.campaignUrl}`,
    `Panel admin: ${payload.dashboardUrl}`,
  ].join("\n");

  const html = `
    <h2>Nueva campaña para revisar</h2>
    <p><strong>Campaña:</strong> ${title}</p>
    <p><strong>Organizador:</strong> ${organizerName} (${organizerEmail})</p>
    <p><strong>Fecha de envío:</strong> ${escapeHtml(submittedAt)}</p>
    <p><a href="${campaignUrl}">Ver campaña</a></p>
    <p><a href="${dashboardUrl}">Ir al panel admin</a></p>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `Nueva campaña para revisar: ${payload.campaignTitle}`,
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
