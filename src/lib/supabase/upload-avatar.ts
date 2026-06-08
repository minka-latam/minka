import { createBrowserClient } from "@supabase/ssr";
import { STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];

export async function uploadAvatar(file: File, userId: string) {
  // Validate file before upload
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG or GIF image."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "File size too large. Please upload an image smaller than 2MB."
    );
  }

  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Upload the file to Supabase storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `${STORAGE_PREFIXES.profilePictures}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}
