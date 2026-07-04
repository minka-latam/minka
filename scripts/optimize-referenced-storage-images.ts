import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { STORAGE_BUCKET, STORAGE_PREFIXES } from "../src/lib/storage/config";
import { storageObjectPathFromUrl } from "../src/lib/storage/object-path";

type Args = {
  write: boolean;
  limit: number;
};

type ImageKind = "profile" | "verification" | "update";

type OptimizedImage = {
  sourceUrl: string;
  publicUrl: string;
  sourcePath: string | null;
  targetPath: string;
  originalSize: number;
  optimizedSize: number;
};

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = {
    write: false,
    limit: 100,
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

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(parsed.limit) || parsed.limit < 1) {
    parsed.limit = 100;
  }

  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  npm run storage:optimize-referenced-images
  npm run storage:optimize-referenced-images -- --write --limit 100

Optimizes non-campaign-media image references:
  - profiles.profile_picture -> profile-pictures/
  - campaign_verifications.* -> verification-documents/
  - campaign_updates.image_url -> campaign-updates/

Options:
  --write           Upload optimized image and update DB. Dry-run by default.
  --limit <number>  Max unique source URLs to process. Defaults to 100.
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

function isLegacyCampaignImagesRootUrl(url: string | null | undefined) {
  const path = storageObjectPathFromUrl(url, STORAGE_BUCKET);
  return Boolean(
    path &&
      path.startsWith(`${STORAGE_PREFIXES.campaignImages}/`) &&
      !path.startsWith(`${STORAGE_PREFIXES.campaignImages}/display/`) &&
      !path.startsWith(`${STORAGE_PREFIXES.campaignImages}/preview/`),
  );
}

function getKindConfig(kind: ImageKind) {
  switch (kind) {
    case "profile":
      return {
        folder: STORAGE_PREFIXES.profilePictures,
        maxDimension: 512,
        quality: 78,
        fit: "cover" as const,
      };
    case "verification":
      return {
        folder: STORAGE_PREFIXES.verificationDocuments,
        maxDimension: 1400,
        quality: 78,
        fit: "inside" as const,
      };
    case "update":
      return {
        folder: STORAGE_PREFIXES.campaignUpdates,
        maxDimension: 1200,
        quality: 78,
        fit: "inside" as const,
      };
  }
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

async function optimizeImage(url: string, kind: ImageKind, recordId: string) {
  const config = getKindConfig(kind);
  const input = await fetchImageBuffer(url);
  const image = sharp(input, { failOn: "none" }).rotate();
  const resized =
    kind === "profile"
      ? image.resize({
          width: config.maxDimension,
          height: config.maxDimension,
          fit: config.fit,
          withoutEnlargement: true,
        })
      : image.resize({
          width: config.maxDimension,
          height: config.maxDimension,
          fit: config.fit,
          withoutEnlargement: true,
        });
  const buffer = await resized
    .jpeg({
      quality: config.quality,
      mozjpeg: true,
    })
    .toBuffer();

  return {
    buffer,
    originalSize: input.length,
    optimizedSize: buffer.length,
    sourcePath: storageObjectPathFromUrl(url, STORAGE_BUCKET),
    targetPath: `${config.folder}/${recordId}_${Date.now()}.jpg`,
  };
}

async function main() {
  const args = parseArgs();
  const supabase = args.write ? getSupabaseAdminClient() : null;
  const optimizedByUrl = new Map<string, OptimizedImage>();
  const failures: Array<{ url: string; reason: string }> = [];

  const [profiles, verifications, updates] = await Promise.all([
    prisma.profile.findMany({
      where: { profilePicture: { not: null } },
      select: { id: true, profilePicture: true },
    }),
    prisma.campaignVerification.findMany({
      select: {
        id: true,
        idDocumentUrl: true,
        supportingDocsUrls: true,
      },
    }),
    prisma.campaignUpdate.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, imageUrl: true },
    }),
  ]);

  const candidates: Array<{
    kind: ImageKind;
    recordId: string;
    url: string;
  }> = [];

  profiles.forEach((profile) => {
    if (
      profile.profilePicture &&
      isLegacyCampaignImagesRootUrl(profile.profilePicture)
    ) {
      candidates.push({
        kind: "profile",
        recordId: profile.id,
        url: profile.profilePicture,
      });
    }
  });

  verifications.forEach((verification) => {
    if (
      verification.idDocumentUrl &&
      isLegacyCampaignImagesRootUrl(verification.idDocumentUrl)
    ) {
      candidates.push({
        kind: "verification",
        recordId: verification.id,
        url: verification.idDocumentUrl,
      });
    }

    verification.supportingDocsUrls.forEach((url) => {
      if (isLegacyCampaignImagesRootUrl(url)) {
        candidates.push({
          kind: "verification",
          recordId: verification.id,
          url,
        });
      }
    });
  });

  updates.forEach((update) => {
    if (update.imageUrl && isLegacyCampaignImagesRootUrl(update.imageUrl)) {
      candidates.push({
        kind: "update",
        recordId: update.id,
        url: update.imageUrl,
      });
    }
  });

  const uniqueCandidates = Array.from(
    new Map(candidates.map((candidate) => [candidate.url, candidate])).values(),
  ).slice(0, Math.floor(args.limit));

  console.log(
    `${args.write ? "WRITE" : "DRY RUN"}: checking ${uniqueCandidates.length} referenced image URLs`,
  );

  for (const candidate of uniqueCandidates) {
    try {
      const optimized = await optimizeImage(
        candidate.url,
        candidate.kind,
        candidate.recordId,
      );
      let publicUrl = `(dry-run) ${optimized.targetPath}`;

      if (args.write) {
        const { error } = await supabase!.storage
          .from(STORAGE_BUCKET)
          .upload(optimized.targetPath, optimized.buffer, {
            cacheControl: "31536000",
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) {
          throw new Error(`Could not upload ${optimized.targetPath}: ${error.message}`);
        }

        const {
          data: { publicUrl: uploadedPublicUrl },
        } = supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(optimized.targetPath);
        publicUrl = uploadedPublicUrl;
      }

      optimizedByUrl.set(candidate.url, {
        sourceUrl: candidate.url,
        publicUrl,
        sourcePath: optimized.sourcePath,
        targetPath: optimized.targetPath,
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
      });

      console.log(
        [
          candidate.kind,
          candidate.recordId,
          `${Math.round(optimized.originalSize / 1024)} KB -> ${Math.round(
            optimized.optimizedSize / 1024,
          )} KB`,
          optimized.targetPath,
        ].join(" | "),
      );
    } catch (error) {
      failures.push({
        url: candidate.url,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
      console.error(
        `failed ${candidate.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  if (args.write) {
    for (const profile of profiles) {
      if (!profile.profilePicture) continue;
      const optimized = optimizedByUrl.get(profile.profilePicture);
      if (!optimized) continue;

      await prisma.profile.update({
        where: { id: profile.id },
        data: { profilePicture: optimized.publicUrl },
      });
    }

    for (const update of updates) {
      if (!update.imageUrl) continue;
      const optimized = optimizedByUrl.get(update.imageUrl);
      if (!optimized) continue;

      await prisma.campaignUpdate.update({
        where: { id: update.id },
        data: { imageUrl: optimized.publicUrl },
      });
    }

    for (const verification of verifications) {
      const idDocReplacement = verification.idDocumentUrl
        ? optimizedByUrl.get(verification.idDocumentUrl)?.publicUrl
        : undefined;
      const supportingDocsUrls = verification.supportingDocsUrls.map(
        (url) => optimizedByUrl.get(url)?.publicUrl || url,
      );

      if (
        idDocReplacement ||
        supportingDocsUrls.some(
          (url, index) => url !== verification.supportingDocsUrls[index],
        )
      ) {
        await prisma.campaignVerification.update({
          where: { id: verification.id },
          data: {
            ...(idDocReplacement ? { idDocumentUrl: idDocReplacement } : {}),
            supportingDocsUrls,
          },
        });
      }
    }
  }

  console.log("\nReplacement report:");
  console.log(JSON.stringify(Array.from(optimizedByUrl.values()), null, 2));

  if (failures.length > 0) {
    console.log("\nFailures:");
    console.log(JSON.stringify(failures, null, 2));
  }

  console.log("\nOriginal objects were not deleted. Run cleanup after verifying UI.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
