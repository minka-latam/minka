type VerificationResultEmailParams = {
  campaignId: string;
  campaignTitle: string;
  organizerName: string;
  organizerEmail: string;
  status: "approved" | "rejected";
  notes?: string | null;
};

function getAppUrl() {
  const appUrl = (
    process.env.MINKA_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://minka-comunidad.org"
  ).replace(/\/$/, "");

  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    return "https://minka-comunidad.org";
  }

  return appUrl;
}

export async function notifyVerificationResult({
  campaignId,
  campaignTitle,
  organizerName,
  organizerEmail,
  status,
  notes,
}: VerificationResultEmailParams) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const trimmedEmail = organizerEmail.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "Verification result email skipped: missing Supabase URL or service role key",
    );
    return;
  }

  if (!trimmedEmail) return;

  const appUrl = getAppUrl();

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/verification-result-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          campaignId,
          campaignTitle,
          organizerName,
          organizerEmail: trimmedEmail,
          status,
          notes: notes || null,
          campaignUrl: `${appUrl}/campaign/${campaignId}`,
          verificationUrl: `${appUrl}/campaign-verification?campaignId=${campaignId}`,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Verification result email failed:", {
        status: response.status,
        body: errorBody,
      });
    }
  } catch (error) {
    console.error("Verification result email failed:", error);
  }
}
