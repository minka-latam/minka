import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return { supabaseUrl, supabaseServiceRoleKey };
}

export async function POST(req: NextRequest) {
  try {
    // Read env vars at request-time (prevents build-time crash)
    const { supabaseUrl, supabaseServiceRoleKey } = getEnv();
    const supabase: ReturnType<typeof createClient> = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Check authentication
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "File type not supported. Please upload JPEG, PNG or MP4 files only.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Determine the file type and folder
    const isVideo = file.type.startsWith("video");
    const folder = isVideo
      ? STORAGE_PREFIXES.campaignVideos
      : STORAGE_PREFIXES.campaignImages;

    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type: isVideo ? "video" : "image",
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean error when env vars are missing
    if (error instanceof Error && error.message.startsWith("Missing ")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
