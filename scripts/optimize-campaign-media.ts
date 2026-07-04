import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

import { STORAGE_BUCKET } from "../src/lib/storage/config";
import { storageObjectPathFromUrl } from "../src/lib/storage/object-path";

type Args = {
  write: boolean;
  limit: number;
  campaignId?: string;
};

type OptimizedVariant = {
  buffer: Buffer;
  path: string;
};

type SharpFactory = typeof import("sharp");

let sharpInstance: SharpFactory | null = null;

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    write: false,
    limit: 25,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--write") {
      parsed.write = true;
      continue;
    }

    if (arg === "--limit") {
      parsed.limit = Number(args[i + 1] || parsed.limit);
      i += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      parsed.limit = Number(arg.slice("--limit=".length));
      continue;
    }

    if (arg === "--campaign-id") {
      parsed.campaignId = args[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith("--campaign-id=")) {
      parsed.campaignId = arg.slice("--campaign-id=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(parsed.limit) || parsed.limit < 1) {
    parsed.limit = 25;
  }

  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  npm run storage:optimize-campaign-media
  npm run storage:optimize-campaign-media -- --write --limit 10
  npm run storage:optimize-campaign-media -- --campaign-id <uuid> --write

Options:
  --write                 Upload optimized variants and update campaign_media.
  --limit <number>        Max media records to process. Defaults to 25.
  --campaign-id <uuid>    Restrict optimization to one campaign.
`);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatKb(bytes: number) {
  return `${Math.round(bytes / 1024)} KB`;
}

function createOptimizedPath(
  originalPath: string,
  mediaId: string,
  variant: "display" | "preview",
) {
  const folder = originalPath.split("/")[0] || "campaign-images";
  return `${folder}/${variant}/${mediaId}_${Date.now()}.jpg`;
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch image (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(
      `URL is not an image (${contentType || "unknown content type"})`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getSharp() {
  if (!sharpInstance) {
    const imported = (await import("sharp")) as unknown as {
      default?: SharpFactory;
    } & SharpFactory;
    sharpInstance = imported.default || imported;
  }

  return sharpInstance;
}

async function renderVariant(
  input: Buffer,
  originalPath: string,
  mediaId: string,
  variant: "display" | "preview",
): Promise<OptimizedVariant> {
  const config =
    variant === "display"
      ? { maxDimension: 1600, quality: 82 }
      : { maxDimension: 700, quality: 76 };
  const sharp = await getSharp();

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: config.maxDimension,
      height: config.maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: config.quality,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    buffer,
    path: createOptimizedPath(originalPath, mediaId, variant),
  };
}

async function main() {
  const args = parseArgs();
  const supabase = args.write ? getSupabaseAdminClient() : null;

  const mediaRecords = await prisma.campaignMedia.findMany({
    where: {
      type: "image",
      status: "active",
      ...(args.campaignId ? { campaignId: args.campaignId } : {}),
      campaign: {
        campaignStatus: "active",
      },
    },
    select: {
      id: true,
      campaignId: true,
      mediaUrl: true,
      previewUrl: true,
      campaign: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: Math.floor(args.limit),
  });

  console.log(
    `${args.write ? "WRITE" : "DRY RUN"}: checking ${mediaRecords.length} campaign media records`,
  );

  const replacementReport: Array<{
    mediaId: string;
    campaignId: string;
    originalPath: string | null;
    originalSize: number;
    displayPath: string;
    displaySize: number;
    previewPath: string;
    previewSize: number;
  }> = [];

  for (const media of mediaRecords) {
    try {
      const originalPath =
        storageObjectPathFromUrl(media.mediaUrl, STORAGE_BUCKET) ||
        "campaign-images";

      if (media.previewUrl && originalPath.includes("/display/")) {
        console.log(`skip ${media.id}: already optimized`);
        continue;
      }

      const originalBuffer = await fetchImageBuffer(media.mediaUrl);
      const [display, preview] = await Promise.all([
        renderVariant(originalBuffer, originalPath, media.id, "display"),
        renderVariant(originalBuffer, originalPath, media.id, "preview"),
      ]);

      console.log(
        [
          `media ${media.id}`,
          `"${media.campaign.title}"`,
          `original ${formatKb(originalBuffer.length)}`,
          `display ${formatKb(display.buffer.length)}`,
          `preview ${formatKb(preview.buffer.length)}`,
        ].join(" | "),
      );

      if (args.write) {
        for (const variant of [display, preview]) {
          const { error } = await supabase!.storage
            .from(STORAGE_BUCKET)
            .upload(variant.path, variant.buffer, {
              cacheControl: "31536000",
              contentType: "image/jpeg",
              upsert: false,
            });

          if (error) {
            throw new Error(`Could not upload ${variant.path}: ${error.message}`);
          }
        }

        const {
          data: { publicUrl: displayUrl },
        } = supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(display.path);
        const {
          data: { publicUrl: previewUrl },
        } = supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(preview.path);

        await prisma.campaignMedia.update({
          where: { id: media.id },
          data: {
            mediaUrl: displayUrl,
            previewUrl,
          },
        });
      }

      replacementReport.push({
        mediaId: media.id,
        campaignId: media.campaignId,
        originalPath,
        originalSize: originalBuffer.length,
        displayPath: display.path,
        displaySize: display.buffer.length,
        previewPath: preview.path,
        previewSize: preview.buffer.length,
      });
    } catch (error) {
      console.error(
        `failed ${media.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  console.log("\nReplacement report:");
  console.log(JSON.stringify(replacementReport, null, 2));
  console.log("\nOriginal objects were not deleted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
