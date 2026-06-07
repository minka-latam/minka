export const CAMPAIGN_IMAGE_MAX_SIZE_MB = 2
export const CAMPAIGN_IMAGE_MAX_COUNT = 6

const CAMPAIGN_IMAGE_MAX_SIZE_BYTES =
  CAMPAIGN_IMAGE_MAX_SIZE_MB * 1024 * 1024

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
])
const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
])

export type ImageValidationResult =
  | { valid: true }
  | {
      valid: false
      title: string
      description: string
    }

export type SingleImageDropResult =
  | { valid: true; file: File }
  | {
      valid: false
      title: string
      description: string
    }

export type MultipleImageSelectionResult =
  | { valid: true; files: File[] }
  | {
      valid: false
      title: string
      description: string
    }

export function validateCampaignImageFile(
  file: File,
): ImageValidationResult {
  const extension =
    file.name.split('.').pop()?.toLowerCase() || ''
  const isSupportedType =
    SUPPORTED_IMAGE_TYPES.has(file.type) ||
    (!file.type &&
      SUPPORTED_IMAGE_EXTENSIONS.has(extension))

  if (!isSupportedType) {
    return {
      valid: false,
      title: 'Formato inválido',
      description: 'Solo se permiten imágenes JPG o PNG.',
    }
  }

  if (file.size > CAMPAIGN_IMAGE_MAX_SIZE_BYTES) {
    return {
      valid: false,
      title: 'Archivo muy grande',
      description: `La imagen no debe superar ${CAMPAIGN_IMAGE_MAX_SIZE_MB} MB.`,
    }
  }

  return { valid: true }
}

export function getSingleImageDropFile(
  files: FileList,
): SingleImageDropResult {
  if (files.length === 0) {
    return {
      valid: false,
      title: 'No se encontró archivo',
      description:
        'Arrastra una imagen JPG o PNG para cargarla.',
    }
  }

  if (files.length > 1) {
    return {
      valid: false,
      title: 'Carga una imagen a la vez',
      description:
        'Solo puedes subir una imagen por carga.',
    }
  }

  const file = files[0]
  const validation = validateCampaignImageFile(file)

  if (!validation.valid) return validation

  return { valid: true, file }
}

export function getCampaignImageFiles(
  files: FileList,
  currentImageCount = 0,
): MultipleImageSelectionResult {
  const selectedFiles = Array.from(files)

  if (selectedFiles.length === 0) {
    return {
      valid: false,
      title: 'No se encontraron archivos',
      description:
        'Selecciona o arrastra imágenes JPG o PNG.',
    }
  }

  if (
    currentImageCount + selectedFiles.length >
    CAMPAIGN_IMAGE_MAX_COUNT
  ) {
    return {
      valid: false,
      title: 'Demasiadas imágenes',
      description: `Puedes cargar máximo ${CAMPAIGN_IMAGE_MAX_COUNT} imágenes por campaña.`,
    }
  }

  for (const file of selectedFiles) {
    const validation = validateCampaignImageFile(file)

    if (!validation.valid) {
      return {
        valid: false,
        title: validation.title,
        description: `${file.name}: ${validation.description}`,
      }
    }
  }

  return { valid: true, files: selectedFiles }
}
