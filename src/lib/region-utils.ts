export type Region =
  | "la_paz"
  | "santa_cruz"
  | "cochabamba"
  | "sucre"
  | "oruro"
  | "potosi"
  | "tarija"
  | "beni"
  | "pando";

// Map region enum values to display names
export const regionNames: Record<Region, string> = {
  la_paz: "La Paz",
  santa_cruz: "Santa Cruz",
  cochabamba: "Cochabamba",
  sucre: "Sucre",
  oruro: "Oruro",
  potosi: "Potosí",
  tarija: "Tarija",
  beni: "Beni",
  pando: "Pando",
};

// Convert region enum value to display name
export function getRegionDisplayName(region: Region): string {
  return regionNames[region] || region;
}

export function formatRegionDisplayName(region?: string | null): string {
  if (!region) return "";

  if (region in regionNames) {
    return regionNames[region as Region];
  }

  return region
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Convert display name to region enum value
export function getRegionEnumValue(displayName: string): Region | null {
  const entry = Object.entries(regionNames).find(
    (regionEntry) => regionEntry[1] === displayName
  );
  return entry ? (entry[0] as Region) : null;
}

// Get all region options for select dropdowns
export function getRegionOptions() {
  return Object.entries(regionNames).map(([value, label]) => ({
    value,
    label,
  }));
}
