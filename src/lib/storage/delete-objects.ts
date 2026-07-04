import { createClient } from "@supabase/supabase-js";

import { STORAGE_BUCKET } from "@/lib/storage/config";
import { storageObjectPathFromUrl } from "@/lib/storage/object-path";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin storage credentials");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getStoragePathsForMedia(media: {
  mediaUrl?: string | null;
  previewUrl?: string | null;
}) {
  return Array.from(
    new Set(
      [media.mediaUrl, media.previewUrl]
        .map((url) => storageObjectPathFromUrl(url, STORAGE_BUCKET))
        .filter((path): path is string => Boolean(path)),
    ),
  );
}

export async function deleteStorageObjectsForMedia(
  media: Array<{
    mediaUrl?: string | null;
    previewUrl?: string | null;
  }>,
) {
  const paths = Array.from(
    new Set(media.flatMap((item) => getStoragePathsForMedia(item))),
  );

  if (paths.length === 0) return { deletedPaths: [] as string[] };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    throw new Error(`Could not delete storage objects: ${error.message}`);
  }

  return { deletedPaths: paths };
}
