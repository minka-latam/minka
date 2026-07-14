import { NextRequest, NextResponse } from "next/server";

import {
  adminAuthErrorResponse,
  requireAdminProfile,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseStorageAdminClient } from "@/lib/storage/admin-client";
import { getVerificationDocumentLocation } from "@/lib/storage/verification-documents";

type ZipEntry = {
  name: string;
  data: Buffer;
  crc: number;
};

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

function extensionFromValue(value: string, contentType: string | null) {
  let pathname = value.toLowerCase();
  try {
    pathname = new URL(value).pathname.toLowerCase();
  } catch {
    pathname = value.toLowerCase();
  }

  const match = pathname.match(/\.(pdf|jpg|jpeg|png|webp|heic|doc|docx)$/);
  if (match) return match[0];

  if (contentType?.includes("pdf")) return ".pdf";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return ".jpg";
  }
  if (contentType?.includes("webp")) return ".webp";

  return ".bin";
}

function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(entry.crc, 14);
    localHeader.writeUInt32LE(entry.data.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(entry.crc, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

async function fetchZipEntry(value: string, nameBase: string) {
  const location = getVerificationDocumentLocation(value);

  if (location?.isPrivate) {
    const supabase = createSupabaseStorageAdminClient();
    const { data, error } = await supabase.storage
      .from(location.bucket)
      .download(location.path);

    if (error || !data) {
      throw new Error(`Failed to download private document: ${value}`);
    }

    const dataBuffer = Buffer.from(await data.arrayBuffer());
    const extension = extensionFromValue(value, data.type || null);

    return {
      name: `${nameBase}${extension}`,
      data: dataBuffer,
      crc: crc32(dataBuffer),
    };
  }

  const response = await fetch(value);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${value}`);
  }

  const data = Buffer.from(await response.arrayBuffer());
  const extension = extensionFromValue(value, response.headers.get("content-type"));

  return {
    name: `${nameBase}${extension}`,
    data,
    crc: crc32(data),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminProfile();

    const { id: campaignId } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        title: true,
        verificationRequests: {
          select: {
            idDocumentUrl: true,
            supportingDocsUrls: true,
          },
        },
      },
    });

    if (!campaign?.verificationRequests) {
      return NextResponse.json(
        { error: "Solicitud de verificación no encontrada" },
        { status: 404 },
      );
    }

    const urls: { url: string; name: string }[] = [];
    if (campaign.verificationRequests.idDocumentUrl) {
      urls.push({
        url: campaign.verificationRequests.idDocumentUrl,
        name: "documento-identidad-anverso",
      });
    }

    campaign.verificationRequests.supportingDocsUrls.forEach((url, index) => {
      urls.push({
        url,
        name:
          index === 0
            ? "documento-identidad-reverso"
            : `documento-respaldo-${index}`,
      });
    });

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "No hay documentos para descargar" },
        { status: 404 },
      );
    }

    const entries = await Promise.all(
      urls.map((document) => fetchZipEntry(document.url, document.name)),
    );
    const zip = createZip(entries);
    const safeTitle = campaign.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    return new NextResponse(zip, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="verificacion-${safeTitle || campaignId}.zip"`,
        "Content-Length": String(zip.length),
      },
    });
  } catch (error) {
    const authResponse = adminAuthErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Error downloading verification documents:", error);
    return NextResponse.json(
      { error: "Error al descargar documentos de verificación" },
      { status: 500 },
    );
  }
}
