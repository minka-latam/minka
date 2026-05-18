import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Args = {
  bucket: string;
  delete: boolean;
  prefixes: string[];
};

type StorageItem = {
  name: string;
  id?: string | null;
  metadata?: Record<string, unknown> | null;
};

type SupabaseAdminClient = SupabaseClient<any, "public", any>;

const DEFAULT_PREFIXES = ["campaign-images"];
const DELETE_BATCH_SIZE = 1000;

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const prefixes: string[] = [];
  let bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "minka";
  let shouldDelete = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--delete") {
      shouldDelete = true;
      continue;
    }

    if (arg === "--bucket") {
      bucket = args[i + 1] || bucket;
      i += 1;
      continue;
    }

    if (arg.startsWith("--bucket=")) {
      bucket = arg.slice("--bucket=".length);
      continue;
    }

    if (arg === "--prefix") {
      const prefix = args[i + 1];
      if (prefix) prefixes.push(normalizePrefix(prefix));
      i += 1;
      continue;
    }

    if (arg.startsWith("--prefix=")) {
      prefixes.push(normalizePrefix(arg.slice("--prefix=".length)));
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    bucket,
    delete: shouldDelete,
    prefixes: prefixes.length > 0 ? prefixes : DEFAULT_PREFIXES,
  };
}

function printHelp() {
  console.log(`
Usage:
  npm run storage:cleanup-campaign-media
  npm run storage:cleanup-campaign-media -- --delete
  npm run storage:cleanup-campaign-media -- --prefix campaign-images --prefix campaign-videos

Options:
  --bucket <name>   Supabase Storage bucket. Defaults to NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET or "minka".
  --prefix <path>   Folder/prefix to scan. Can be repeated. Defaults to "campaign-images".
  --delete          Delete orphaned objects. Without this flag the script only prints a dry run.
`);
}

function normalizePrefix(prefix: string) {
  return prefix.replace(/^\/+|\/+$/g, "");
}

function normalizePath(path: string) {
  return decodeURIComponent(path).replace(/^\/+/, "");
}

function objectPathFromStoredValue(value: string | null | undefined, bucket: string) {
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
        return normalizePath(url.pathname.slice(prefix.length));
      }
    }

    return null;
  } catch {
    if (trimmed.includes("/")) {
      return normalizePath(trimmed);
    }

    return null;
  }
}

function isUnderPrefixes(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

async function getReferencedStoragePaths(bucket: string, prefixes: string[]) {
  const referenced = new Set<string>();

  const [campaignMedia, campaignUpdates, profiles, verifications] = await Promise.all([
    prisma.campaignMedia.findMany({ select: { mediaUrl: true } }),
    prisma.campaignUpdate.findMany({ select: { imageUrl: true } }),
    prisma.profile.findMany({ select: { profilePicture: true } }),
    prisma.campaignVerification.findMany({
      select: { idDocumentUrl: true, supportingDocsUrls: true },
    }),
  ]);

  const add = (value: string | null | undefined) => {
    const path = objectPathFromStoredValue(value, bucket);
    if (path && isUnderPrefixes(path, prefixes)) {
      referenced.add(path);
    }
  };

  campaignMedia.forEach((item) => add(item.mediaUrl));
  campaignUpdates.forEach((item) => add(item.imageUrl));
  profiles.forEach((item) => add(item.profilePicture));
  verifications.forEach((item) => {
    add(item.idDocumentUrl);
    item.supportingDocsUrls.forEach(add);
  });

  return referenced;
}

async function listStorageObjects(
  supabase: SupabaseAdminClient,
  bucket: string,
  prefix: string
) {
  const objects: string[] = [];

  async function walk(path: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Could not list storage path "${path}": ${error.message}`);
    }

    for (const item of (data || []) as StorageItem[]) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata;

      if (isFolder) {
        await walk(itemPath);
      } else {
        objects.push(normalizePath(itemPath));
      }
    }
  }

  await walk(prefix);
  return objects;
}

async function deleteObjects(
  supabase: SupabaseAdminClient,
  bucket: string,
  paths: string[]
) {
  for (let i = 0; i < paths.length; i += DELETE_BATCH_SIZE) {
    const batch = paths.slice(i, i + DELETE_BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(batch);

    if (error) {
      throw new Error(`Could not delete storage batch starting at ${i}: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const referencedPaths = await getReferencedStoragePaths(args.bucket, args.prefixes);
  const storagePathsByPrefix = await Promise.all(
    args.prefixes.map((prefix) => listStorageObjects(supabase, args.bucket, prefix))
  );
  const storagePaths = storagePathsByPrefix.flat();
  const orphanPaths = storagePaths.filter((path) => !referencedPaths.has(path));

  console.log(`Bucket: ${args.bucket}`);
  console.log(`Prefixes: ${args.prefixes.join(", ")}`);
  console.log(`Storage objects found: ${storagePaths.length}`);
  console.log(`Referenced objects found: ${referencedPaths.size}`);
  console.log(`Orphan objects found: ${orphanPaths.length}`);

  if (orphanPaths.length > 0) {
    console.log("\nOrphan objects:");
    orphanPaths.forEach((path) => console.log(`- ${path}`));
  }

  if (!args.delete) {
    console.log("\nDry run only. Re-run with -- --delete to remove these objects.");
    return;
  }

  if (orphanPaths.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }

  await deleteObjects(supabase, args.bucket, orphanPaths);
  console.log(`\nDeleted ${orphanPaths.length} orphan objects.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
