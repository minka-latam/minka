const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function uploadAvatar(file: File, _userId: string) {
  // Validate file before upload
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG or WebP image."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "File size too large. Please upload an image smaller than 2MB."
    );
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error || "No se pudo subir la imagen de perfil."
      );
    }

    if (typeof result?.url !== "string") {
      throw new Error("La respuesta de carga no incluyó una URL válida.");
    }

    return result.url;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}
