type DonorThankYouEmailParams = {
  donationId: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  tipAmount: number;
  totalAmount: number;
  currency: string;
  completedAt: Date;
};

const DEFAULT_EMAIL_LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-2S5vgSiFRwu8gClKBuwTXkOi5H46aN.svg";

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

export async function sendDonorThankYouEmail({
  donationId,
  campaignId,
  campaignTitle,
  donorName,
  donorEmail,
  amount,
  tipAmount,
  totalAmount,
  currency,
  completedAt,
}: DonorThankYouEmailParams) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "Donor thank-you email skipped: missing Supabase URL or service role key",
    );
    return;
  }

  const trimmedEmail = donorEmail.trim();

  if (!trimmedEmail) {
    return;
  }

  const appUrl = getAppUrl();

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/donor-thank-you-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          donationId,
          campaignId,
          campaignTitle,
          donorName,
          donorEmail: trimmedEmail,
          amount,
          tipAmount,
          totalAmount,
          currency,
          completedAt: completedAt.toISOString(),
          campaignUrl: `${appUrl}/campaign/${campaignId}`,
          donationsUrl: `${appUrl}/dashboard/donations`,
          logoUrl: process.env.MINKA_EMAIL_LOGO_URL || DEFAULT_EMAIL_LOGO_URL,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("Donor thank-you email failed:", {
        status: response.status,
        body: errorBody,
      });
    }
  } catch (error) {
    console.error("Donor thank-you email failed:", error);
  }
}
