export const DEFAULT_STORAGE_BUCKET = "minka";
export const DEFAULT_PRIVATE_STORAGE_BUCKET = "minka_private";

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET;
export const PRIVATE_STORAGE_BUCKET =
  process.env.SUPABASE_PRIVATE_STORAGE_BUCKET || DEFAULT_PRIVATE_STORAGE_BUCKET;

export const STORAGE_PREFIXES = {
  campaignImages: "campaign-images",
  campaignUpdates: "campaign-updates",
  campaignVideos: "campaign-videos",
  campaignDocuments: "campaign-documents",
  verificationDocuments: "verification-documents",
  profilePictures: "profile-pictures",
} as const;
