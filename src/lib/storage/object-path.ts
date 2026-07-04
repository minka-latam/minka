export function normalizeStoragePath(path: string) {
  return decodeURIComponent(path).replace(/^\/+/, "");
}

export function storageObjectPathFromUrl(
  value: string | null | undefined,
  bucket: string,
) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const publicPrefix = `/storage/v1/object/public/${bucket}/`;
    const signedPrefix = `/storage/v1/object/sign/${bucket}/`;

    for (const prefix of [publicPrefix, signedPrefix]) {
      if (url.pathname.startsWith(prefix)) {
        return normalizeStoragePath(url.pathname.slice(prefix.length));
      }
    }

    return null;
  } catch {
    return trimmed.includes("/") ? normalizeStoragePath(trimmed) : null;
  }
}
