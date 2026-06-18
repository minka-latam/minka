export const CAMPAIGN_CATEGORIES = [
  {
    value: "cultura_arte",
    label: "Cultura y arte",
    icon: "/icons/palette.svg",
  },
  { value: "educacion", label: "Educación", icon: "/icons/book_2.svg" },
  {
    value: "emergencia",
    label: "Emergencia",
    icon: "/icons/e911_emergency.svg",
  },
  { value: "igualdad", label: "Igualdad", icon: "/icons/diversity_4.svg" },
  { value: "medioambiente", label: "Medio ambiente", icon: "/icons/nature.svg" },
  { value: "salud", label: "Salud", icon: "/icons/health_metrics.svg" },
  { value: "otros", label: "Otros", icon: "/icons/handshake.svg" },
] as const;

export type CampaignCategoryValue =
  (typeof CAMPAIGN_CATEGORIES)[number]["value"];

export function formatCampaignCategory(
  category?: string | null,
) {
  if (!category) return "";

  return (
    CAMPAIGN_CATEGORIES.find((item) => item.value === category)
      ?.label || category
  );
}

export function getCampaignCategoryIcon(category?: string | null) {
  if (!category) return "/icons/view_cozy.svg";

  const normalized = category.toLowerCase();
  const item = CAMPAIGN_CATEGORIES.find(
    (categoryItem) =>
      categoryItem.value === normalized ||
      categoryItem.label.toLowerCase() === normalized,
  );

  return item?.icon || "/icons/view_cozy.svg";
}
