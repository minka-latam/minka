import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PRIVATE_STORAGE_BUCKET,
  STORAGE_PREFIXES,
} from "@/lib/storage/config";
import { createSupabaseStorageAdminClient } from "@/lib/storage/admin-client";
import { createPrivateStorageReference } from "@/lib/storage/verification-documents";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1000;
const IMAGE_QUALITY = 62;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_DOCUMENT_TYPES = new Set(["application/pdf"]);

function sanitizeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function buildUploadPayload(file: File) {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
    const buffer = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: IMAGE_QUALITY,
        mozjpeg: true,
      })
      .toBuffer();

    return {
      buffer,
      contentType: "image/jpeg",
      extension: "jpg",
    };
  }

  if (ACCEPTED_DOCUMENT_TYPES.has(file.type)) {
    return {
      buffer: inputBuffer,
      contentType: "application/pdf",
      extension: "pdf",
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const campaignId = formData.get("campaignId");
    const file = formData.get("file");

    if (typeof campaignId !== "string" || !campaignId) {
      return NextResponse.json(
        { error: "No se recibió la campaña." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió el archivo." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 5MB." },
        { status: 400 },
      );
    }

    const payload = await buildUploadPayload(file);
    if (!payload) {
      return NextResponse.json(
        { error: "Formato inválido. Sube una imagen JPG, PNG, WebP o PDF." },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { organizerId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaña no encontrada." },
        { status: 404 },
      );
    }

    if (campaign.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para subir documentos de esta campaña." },
        { status: 403 },
      );
    }

    const supabase = createSupabaseStorageAdminClient();
    const namePart = sanitizeFilePart(file.name.replace(/\.[^.]+$/, "")) || "documento";
    const filePath = `${STORAGE_PREFIXES.verificationDocuments}/${campaignId}/${crypto.randomUUID()}-${namePart}.${payload.extension}`;

    const { error } = await supabase.storage
      .from(PRIVATE_STORAGE_BUCKET)
      .upload(filePath, payload.buffer, {
        cacheControl: "3600",
        contentType: payload.contentType,
        upsert: false,
      });

    if (error) {
      console.error("Verification document upload error:", error);
      return NextResponse.json(
        { error: `No se pudo subir el documento: ${error.message}` },
        { status: 500 },
      );
    }

    const reference = createPrivateStorageReference(filePath);

    return NextResponse.json({
      success: true,
      url: reference,
      reference,
      contentType: payload.contentType,
    });
  } catch (error) {
    console.error("Verification document route error:", error);
    return NextResponse.json(
      { error: "No se pudo subir el documento de verificación." },
      { status: 500 },
    );
  }
}
