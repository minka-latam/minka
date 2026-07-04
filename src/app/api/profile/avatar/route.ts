import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { getAuthSession } from "@/lib/auth";
import { STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const LONG_CACHE_CONTROL = "31536000";
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function getStorageClient() {
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

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió una imagen." },
        { status: 400 }
      );
    }

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Sube una imagen JPG, PNG o WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen supera el límite de 2MB." },
        { status: 400 }
      );
    }

    const supabase = getStorageClient();
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: 512,
        height: 512,
        fit: "cover",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 78,
        mozjpeg: true,
      })
      .toBuffer();
    const filePath = `${STORAGE_PREFIXES.profilePictures}/${session.user.id}-${Date.now()}-${crypto.randomUUID()}.jpg`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, optimizedBuffer, {
        cacheControl: LONG_CACHE_CONTROL,
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Profile avatar upload error:", error);
      return NextResponse.json(
        { error: `No se pudo subir la imagen: ${error.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Profile avatar route error:", error);

    if (error instanceof Error && error.message.startsWith("Missing ")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "No se pudo subir la imagen de perfil." },
      { status: 500 }
    );
  }
}
