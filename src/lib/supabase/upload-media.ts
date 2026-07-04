import { createBrowserClient } from "@supabase/ssr";
import { STORAGE_BUCKET, STORAGE_PREFIXES } from "@/lib/storage/config";

const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CAMPAIGN_IMAGE_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const LONG_CACHE_CONTROL = "31536000";
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
  displayUrl: string;
  previewUrl?: string;
  success: boolean;
}

export type UploadMediaOptions = {
  folder?: string;
  imageMode?: "campaign" | "single";
  singleImageMaxDimension?: number;
  singleImageTargetBytes?: number;
};

type ImageVariant = {
  blob: Blob;
  suffix: "display" | "preview";
};

function isOptimizableImage(file: File) {
  return (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png" ||
    file.type === "image/webp"
  );
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo procesar la imagen."));
    };

    image.src = url;
  });
}

function getScaledDimensions(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo comprimir la imagen."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function renderImageVariant(
  image: HTMLImageElement,
  maxDimension: number,
  targetBytes: number,
) {
  const { width, height } = getScaledDimensions(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxDimension,
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo preparar la compresión de imagen.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.82, 0.74, 0.66, 0.58, 0.5];
  let bestBlob = await canvasToBlob(canvas, qualities[0]);

  for (const quality of qualities.slice(1)) {
    if (bestBlob.size <= targetBytes) break;
    bestBlob = await canvasToBlob(canvas, quality);
  }

  return bestBlob;
}

async function createCampaignImageVariants(file: File): Promise<ImageVariant[]> {
  const image = await loadImageFromFile(file);
  const [displayBlob, previewBlob] = await Promise.all([
    renderImageVariant(image, 1600, 400 * 1024),
    renderImageVariant(image, 700, 160 * 1024),
  ]);

  return [
    { blob: displayBlob, suffix: "display" },
    { blob: previewBlob, suffix: "preview" },
  ];
}

async function createSingleImageVariant(
  file: File,
  maxDimension = 1200,
  targetBytes = 250 * 1024,
) {
  const image = await loadImageFromFile(file);
  return renderImageVariant(image, maxDimension, targetBytes);
}

export async function uploadMedia(
  file: File,
  options: UploadMediaOptions = {},
): Promise<UploadResponse> {
  // Validate file before upload
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error(
      "Tipo de archivo no válido. Se permiten imágenes JPG, PNG, PDF y documentos de Office."
    );
  }

  const isImage = isOptimizableImage(file);
  const maxFileSize = isImage ? MAX_CAMPAIGN_IMAGE_FILE_SIZE : MAX_DOCUMENT_FILE_SIZE;

  if (file.size > maxFileSize) {
    throw new Error(
      isImage
        ? "La imagen no debe superar 2 MB."
        : "Archivo demasiado grande. Por favor, sube un archivo menor a 10MB."
    );
  }

  try {
    const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    let folder: string = options.folder || STORAGE_PREFIXES.campaignImages;
    if (file.type === "application/pdf") {
      folder = options.folder || STORAGE_PREFIXES.campaignDocuments;
    } else if (file.type.startsWith("application/")) {
      folder = options.folder || STORAGE_PREFIXES.campaignDocuments;
    }

    if (isImage) {
      const imageMode = options.imageMode || "campaign";
      const baseName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

      if (imageMode === "single") {
        const blob = await createSingleImageVariant(
          file,
          options.singleImageMaxDimension,
          options.singleImageTargetBytes,
        );
        const filePath = `${folder}/${baseName}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, blob, {
            cacheControl: LONG_CACHE_CONTROL,
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

        return {
          url: publicUrl,
          displayUrl: publicUrl,
          success: true,
        };
      }

      const variants = await createCampaignImageVariants(file);
      const uploadedUrls: Partial<Record<ImageVariant["suffix"], string>> = {};

      for (const variant of variants) {
        const filePath = `${folder}/${variant.suffix}/${baseName}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, variant.blob, {
            cacheControl: LONG_CACHE_CONTROL,
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

        uploadedUrls[variant.suffix] = publicUrl;
      }

      const displayUrl = uploadedUrls.display;

      if (!displayUrl) {
        throw new Error("No se pudo subir la imagen.");
      }

      return {
        url: displayUrl,
        displayUrl,
        previewUrl: uploadedUrls.preview,
        success: true,
      };
    }

    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: LONG_CACHE_CONTROL,
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
      displayUrl: publicUrl,
      success: true,
    };
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
}
