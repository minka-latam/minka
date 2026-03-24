import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "minka";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
];

export interface UploadResponse {
  url: string;
  success: boolean;
}

export async function uploadMedia(file: File): Promise<UploadResponse> {
  // Validate file before upload
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      "Tipo de archivo no válido. Se permiten imágenes JPG, PNG, PDF y documentos de Office."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Archivo demasiado grande. Por favor, sube un archivo menor a 10MB."
    );
  }

  try {
    const supabase = createClientComponentClient();

    // Get the session first to verify authentication
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("Authentication error during media upload");
      throw new Error("Error de autenticación: " + sessionError.message);
    }

    if (!sessionData.session) {
      throw new Error(
        "No hay sesión activa. Por favor, inicia sesión nuevamente."
      );
    }

    // Determine folder based on file type
    let folder = "campaign-images";
    if (file.type === "application/pdf") {
      folder = "campaign-documents";
    } else if (file.type.startsWith("application/")) {
      folder = "campaign-documents";
    }

    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      // Check if it's an authentication error
      if (
        uploadError.message.includes("auth") ||
        uploadError.message.includes("JWT") ||
        uploadError.message.includes("token") ||
        uploadError.message.includes("session") ||
        uploadError.message.includes("401") ||
        uploadError.message.includes("unauthorized")
      ) {
        throw new Error(
          "Error de autenticación. Tu sesión ha expirado, por favor inicia sesión nuevamente."
        );
      }

      throw uploadError;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return {
      url: publicUrl,
      success: true,
    };
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
}
