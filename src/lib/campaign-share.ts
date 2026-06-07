export type CampaignShareIntent = "support" | "donation";

export type CampaignSharePlatform =
  | "whatsapp"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "copy";

export interface CampaignShareData {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
}

export interface CampaignSharePayload {
  url: string;
  title: string;
  text: string;
  caption: string;
  links: Record<
    Exclude<CampaignSharePlatform, "copy">,
    string
  >;
}

export const MINKA_FALLBACK_SHARE_IMAGE =
  "/favicon/android-chrome-512x512.png";

const PRODUCTION_APP_URL = "https://minka-comunidad.org";

function cleanText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function trimForShare(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

export function getPublicAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    PRODUCTION_APP_URL;

  return configuredUrl.replace(/\/+$/, "");
}

export function getClientShareBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return getPublicAppUrl();
}

export function toAbsoluteShareUrl(
  url?: string | null,
  baseUrl = getPublicAppUrl(),
) {
  const value = cleanText(url);
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${baseUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function getCampaignShareUrl(
  campaignId: string,
  baseUrl = getClientShareBaseUrl(),
) {
  return `${baseUrl.replace(/\/+$/, "")}/campaign/${campaignId}`;
}

export function getCampaignShareTitle(campaign: CampaignShareData) {
  return cleanText(campaign.title) || "Apoya esta campaña";
}

export function getCampaignShareDescription(
  campaign: Pick<CampaignShareData, "subtitle" | "description">,
  maxLength = 180,
) {
  const description =
    cleanText(campaign.subtitle) || cleanText(campaign.description);

  return trimForShare(
    description ||
      "Conoce esta campaña en Minka y sé parte del cambio.",
    maxLength,
  );
}

export function buildCampaignSharePayload(
  campaign: CampaignShareData,
  options: {
    intent?: CampaignShareIntent;
    baseUrl?: string;
  } = {},
): CampaignSharePayload {
  const intent = options.intent || "support";
  const url = getCampaignShareUrl(campaign.id, options.baseUrl);
  const title = getCampaignShareTitle(campaign);
  const description = getCampaignShareDescription(campaign, 130);
  const text =
    intent === "donation"
      ? `Acabo de apoyar "${title}" en Minka. ${description} Súmate tú también.`
      : `Apoya "${title}" en Minka. ${description} Cada aporte cuenta.`;
  const caption = `${text}\n${url}`;

  return {
    url,
    title,
    text,
    caption,
    links: {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      instagram: "https://www.instagram.com/",
    },
  };
}
