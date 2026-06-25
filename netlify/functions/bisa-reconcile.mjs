function getBaseUrl() {
  return (
    process.env.MINKA_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    "https://minka-comunidad.org"
  ).replace(/\/$/, "");
}

export default async function handler() {
  const secret =
    process.env.BISA_RECONCILE_SECRET || process.env.BISA_CALLBACK_PASSWORD;

  if (!secret) {
    return new Response(
      "Missing BISA_RECONCILE_SECRET or BISA_CALLBACK_PASSWORD",
      { status: 500 },
    );
  }

  const response = await fetch(`${getBaseUrl()}/api/bisa/reconcile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 25 }),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    },
  });
}
