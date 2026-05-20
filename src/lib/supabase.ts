import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadMedia = async (
  file: File
): Promise<{ url: string; type: "image" | "video" }> => {
  const isVideo = file.type.startsWith("video");
  const folder = isVideo
    ? STORAGE_PREFIXES.campaignVideos
    : STORAGE_PREFIXES.campaignImages;

  // Create a unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL for the file
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    url: publicUrl,
    type: isVideo ? "video" : "image",
  };
};
