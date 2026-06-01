type CampaignReviewEmailParams = {
  campaignId: string;
  campaignTitle: string;
  organizerName: string;
  organizerEmail: string;
  submittedAt: Date;
};

function getAppUrl() {
  return (
    process.env.MINKA_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://minka-comunidad.org"
  ).replace(/\/$/, "");
}

export async function notifyCampaignSubmittedForReview({
  campaignId,
  campaignTitle,
  organizerName,
  organizerEmail,
  submittedAt,
}: CampaignReviewEmailParams) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "Campaign review email skipped: missing Supabase URL or service role key",
    );
    return;
  }

  const appUrl = getAppUrl();

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/campaign-review-email`,
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
          organizerEmail,
          submittedAt: submittedAt.toISOString(),
          campaignUrl: `${appUrl}/campaign/${campaignId}`,
          dashboardUrl: `${appUrl}/dashboard/campaigns`,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Campaign review email failed:", {
        status: response.status,
        body: errorBody,
      });
    }
  } catch (error) {
    console.error("Campaign review email failed:", error);
  }
}
