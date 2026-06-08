export const DEFAULT_STORAGE_BUCKET = "minka";

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;

export const STORAGE_PREFIXES = {
  campaignImages: "campaign-images",
  campaignVideos: "campaign-videos",
  campaignDocuments: "campaign-documents",
  profilePictures: "profile-pictures",
} as const;
