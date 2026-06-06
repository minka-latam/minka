export const CAMPAIGN_CATEGORIES = [
  { value: "cultura_arte", label: "Cultura y arte" },
  { value: "educacion", label: "Educación" },
  { value: "emergencia", label: "Emergencia" },
  { value: "igualdad", label: "Igualdad" },
  { value: "medioambiente", label: "Medio ambiente" },
  { value: "salud", label: "Salud" },
  { value: "otros", label: "Otros" },
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
