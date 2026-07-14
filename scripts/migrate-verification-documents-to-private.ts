import "dotenv/config";

import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import {
  PRIVATE_STORAGE_BUCKET,
  STORAGE_BUCKET,
  STORAGE_PREFIXES,
} from "../src/lib/storage/config";
import { normalizeStoragePath, storageObjectPathFromUrl } from "../src/lib/storage/object-path";

type Args = {
  write: boolean;
  limit?: number;
};

type StorageObject = {
  name: string;
  id?: string | null;
  metadata?: Record<string, unknown> | null;
};

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const SOURCE_PREFIXES = [
  STORAGE_PREFIXES.verificationDocuments,
  STORAGE_PREFIXES.campaignDocuments,
];

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let write = false;
  let limit: number | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--write") {
      write = true;
      continue;
    }

    if (arg === "--limit") {
      limit = Number(args[i + 1]);
      i += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    write,
    limit: Number.isFinite(limit) ? limit : undefined,
  };
}

function printHelp() {
  console.log(`
Usage:
  yarn storage:migrate-verification-documents
  yarn storage:migrate-verification-documents -- --write
  yarn storage:migrate-verification-documents -- --write --limit 5

Dry-run is the default. --write copies referenced verification documents to
${PRIVATE_STORAGE_BUCKET}/${STORAGE_PREFIXES.verificationDocuments}, optimizes images, and updates DB references.
`);
}

function isUnderPrefix(value: string, prefix: string) {
  return value === prefix || value.startsWith(`${prefix}/`);
}

function getPrivatePath(value: string | null | undefined) {
  if (!value) return null;
  const prefix = `${PRIVATE_STORAGE_BUCKET}/`;
  const normalized = normalizeStoragePath(value);
  return normalized.startsWith(prefix)
    ? normalizeStoragePath(normalized.slice(prefix.length))
    : null;
}

function getSourcePath(value: string | null | undefined) {
  if (!value || getPrivatePath(value)) return null;

  const pathFromPublicUrl = storageObjectPathFromUrl(value, STORAGE_BUCKET);
  if (!pathFromPublicUrl) return null;

  return SOURCE_PREFIXES.some((prefix) => isUnderPrefix(pathFromPublicUrl, prefix))
    ? pathFromPublicUrl
    : null;
}

function extensionFromPath(value: string) {
  const extension = path.extname(value).replace(".", "").toLowerCase();
  return extension || "bin";
}

function isImageDocument(sourcePath: string, contentType?: string | null) {
  return (
    contentType?.startsWith("image/") ||
    /\.(jpe?g|png|webp)$/i.test(sourcePath)
  );
}

async function listStorageObjects(
  supabase: any,
  prefix: string,
) {
  const objects: string[] = [];

  async function walk(currentPath: string) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(currentPath, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Could not list ${currentPath}: ${error.message}`);
    }

    for (const item of (data || []) as StorageObject[]) {
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata;

      if (isFolder) {
        await walk(itemPath);
      } else {
        objects.push(normalizeStoragePath(itemPath));
      }
    }
  }

  await walk(prefix);
  return objects;
}

async function migrateDocument({
  supabase,
  verificationId,
  sourceValue,
  fieldName,
  write,
}: {
  supabase: any;
  verificationId: string;
  sourceValue: string;
  fieldName: string;
  write: boolean;
}) {
  if (getPrivatePath(sourceValue)) {
    return { status: "already-private" as const, value: sourceValue };
  }

  const sourcePath = getSourcePath(sourceValue);
  if (!sourcePath) {
    return { status: "skipped-unsupported" as const, value: sourceValue };
  }

  const sourceExtension = extensionFromPath(sourcePath);
  const dryRunTargetExtension = /\.(jpe?g|png|webp)$/i.test(sourcePath)
    ? "jpg"
    : sourceExtension;
  const dryRunTargetPath = `${STORAGE_PREFIXES.verificationDocuments}/${verificationId}/${fieldName}.${dryRunTargetExtension}`;

  if (!write) {
    return {
      status: "planned" as const,
      sourcePath,
      targetPath: dryRunTargetPath,
      value: `${PRIVATE_STORAGE_BUCKET}/${dryRunTargetPath}`,
    };
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(sourcePath);
  if (error || !data) {
    return {
      status: "failed" as const,
      sourcePath,
      value: sourceValue,
      error: error?.message || "Download failed",
    };
  }

  const inputBuffer = Buffer.from(await data.arrayBuffer());
  const shouldOptimizeImage = isImageDocument(sourcePath, data.type);
  const outputBuffer = shouldOptimizeImage
    ? await sharp(inputBuffer, { failOn: "none" })
        .rotate()
        .resize({
          width: 1000,
          height: 1000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 62,
          mozjpeg: true,
        })
        .toBuffer()
    : inputBuffer;
  const targetExtension = shouldOptimizeImage ? "jpg" : sourceExtension;
  const contentType = shouldOptimizeImage ? "image/jpeg" : data.type || "application/octet-stream";
  const targetPath = `${STORAGE_PREFIXES.verificationDocuments}/${verificationId}/${fieldName}.${targetExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(PRIVATE_STORAGE_BUCKET)
    .upload(targetPath, outputBuffer, {
      cacheControl: "3600",
      contentType,
      upsert: true,
    });

  if (uploadError) {
    return {
      status: "failed" as const,
      sourcePath,
      value: sourceValue,
      error: uploadError.message,
    };
  }

  return {
    status: "migrated" as const,
    sourcePath,
    targetPath,
    value: `${PRIVATE_STORAGE_BUCKET}/${targetPath}`,
    beforeBytes: inputBuffer.length,
    afterBytes: outputBuffer.length,
  };
}

async function main() {
  const args = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const verifications = await prisma.campaignVerification.findMany({
    select: {
      id: true,
      idDocumentUrl: true,
      supportingDocsUrls: true,
    },
    orderBy: { createdAt: "asc" },
    take: args.limit,
  });
  const referenced = new Set<string>();
  const results: Array<Awaited<ReturnType<typeof migrateDocument>>> = [];

  for (const verification of verifications) {
    let nextIdDocumentUrl = verification.idDocumentUrl;
    const nextSupportingDocsUrls = [...verification.supportingDocsUrls];
    const documents = [
      {
        value: verification.idDocumentUrl,
        fieldName: "id-document",
        setValue: (nextValue: string) => {
          nextIdDocumentUrl = nextValue;
        },
      },
      ...verification.supportingDocsUrls.map((value, index) => ({
        value,
        fieldName: `supporting-${index + 1}`,
        setValue: (nextValue: string) => {
          nextSupportingDocsUrls[index] = nextValue;
        },
      })),
    ];

    for (const document of documents) {
      const sourcePath = getSourcePath(document.value);
      if (sourcePath) referenced.add(sourcePath);

      if (!document.value) continue;

      const result = await migrateDocument({
        supabase,
        verificationId: verification.id,
        sourceValue: document.value,
        fieldName: document.fieldName,
        write: args.write,
      });
      results.push(result);

      if (args.write && result.status === "migrated") {
        document.setValue(result.value);
      }
    }

    if (
      args.write &&
      (nextIdDocumentUrl !== verification.idDocumentUrl ||
        nextSupportingDocsUrls.join("\n") !== verification.supportingDocsUrls.join("\n"))
    ) {
      await prisma.campaignVerification.update({
        where: { id: verification.id },
        data: {
          idDocumentUrl: nextIdDocumentUrl,
          supportingDocsUrls: nextSupportingDocsUrls,
        },
      });
    }
  }

  const storageObjects = (
    await Promise.all(SOURCE_PREFIXES.map((prefix) => listStorageObjects(supabase, prefix)))
  ).flat();
  const orphanObjects = storageObjects.filter((object) => !referenced.has(object));
  const counts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});
  const optimizedBytes = results.reduce(
    (acc, result) => {
      if (result.status !== "migrated") return acc;
      return {
        before: acc.before + result.beforeBytes,
        after: acc.after + result.afterBytes,
      };
    },
    { before: 0, after: 0 },
  );

  console.log(`Mode: ${args.write ? "write" : "dry-run"}`);
  console.log(`Verifications scanned: ${verifications.length}`);
  console.log(`Results: ${JSON.stringify(counts)}`);

  if (args.write && optimizedBytes.before > 0) {
    console.log(
      `Migrated bytes: ${(optimizedBytes.before / 1024).toFixed(1)} KB -> ${(optimizedBytes.after / 1024).toFixed(1)} KB`,
    );
  }

  const planned = results.filter((result) => result.status === "planned");
  if (planned.length > 0) {
    console.log("\nPlanned migrations:");
    planned.forEach((result) => {
      console.log(`- ${result.sourcePath} -> ${result.value}`);
    });
  }

  const failures = results.filter((result) => result.status === "failed");
  if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((result) => {
      console.log(`- ${result.sourcePath}: ${result.error}`);
    });
  }

  console.log(`\nPublic orphan objects found: ${orphanObjects.length}`);
  orphanObjects.forEach((object) => console.log(`- ${object}`));

  if (!args.write) {
    console.log("\nDry run only. Re-run with -- --write to migrate referenced documents.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
