import { PRIVATE_STORAGE_BUCKET, STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";
import { normalizeStoragePath, storageObjectPathFromUrl } from "@/lib/storage/object-path";

export type VerificationDocumentLocation = {
  bucket: string;
  path: string;
  isPrivate: boolean;
};

const LEGACY_PUBLIC_PREFIXES = new Set<string>([
  STORAGE_PREFIXES.verificationDocuments,
  STORAGE_PREFIXES.campaignDocuments,
]);

function isUnderPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function firstFolder(path: string) {
  return normalizeStoragePath(path).split("/")[0] || "";
}

export function createPrivateStorageReference(path: string) {
  return `${PRIVATE_STORAGE_BUCKET}/${normalizeStoragePath(path)}`;
}

export function privatePathFromStorageReference(value: string | null | undefined) {
  if (!value) return null;

  const normalized = normalizeStoragePath(value.trim());
  const prefix = `${PRIVATE_STORAGE_BUCKET}/`;

  if (!normalized.startsWith(prefix)) return null;

  const path = normalizeStoragePath(normalized.slice(prefix.length));
  return isUnderPrefix(path, STORAGE_PREFIXES.verificationDocuments) ? path : null;
}

export function getVerificationDocumentLocation(
  value: string | null | undefined,
): VerificationDocumentLocation | null {
  if (!value) return null;

  const privatePath = privatePathFromStorageReference(value);
  if (privatePath) {
    return {
      bucket: PRIVATE_STORAGE_BUCKET,
      path: privatePath,
      isPrivate: true,
    };
  }

  const legacyPublicPath = storageObjectPathFromUrl(value, STORAGE_BUCKET);
  if (legacyPublicPath && LEGACY_PUBLIC_PREFIXES.has(firstFolder(legacyPublicPath))) {
    return {
      bucket: STORAGE_BUCKET,
      path: legacyPublicPath,
      isPrivate: false,
    };
  }

  return null;
}

export function isValidVerificationDocumentReference(value: string) {
  return Boolean(getVerificationDocumentLocation(value));
}

export function isImageDocumentReference(value: string) {
  return /\.(jpe?g|png|webp|gif)(?:$|\?)/i.test(value);
}
