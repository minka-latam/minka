"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCampaign, CampaignUpdate } from "@/hooks/use-campaign";
import { ImageEditor } from "@/components/views/create-campaign/ImageEditor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { createBrowserClient } from "@supabase/ssr";

interface AdsTabProps {
  campaign: Record<string, any>;
}

export function AdsTab({ campaign }: AdsTabProps) {
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    title: "",
    message: "",
    youtubeUrl: "",
    imageUrl: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const {
    isLoadingUpdates,
    isPublishingUpdate,
    getCampaignUpdates,
    publishCampaignUpdate,
    deleteCampaignUpdate,
  } = useCampaign();

  useEffect(() => {
    fetchUpdates();
  }, [campaign.id]);

  useEffect(() => {
    // Check if form has any changes
    const formChanged =
      formData.title.trim() !== "" ||
      formData.message.trim() !== "" ||
      formData.youtubeUrl.trim() !== "" ||
      uploadedImage !== null;

    setHasChanges(formChanged);
    setShowSaveBar(formChanged);
  }, [formData, uploadedImage]);

  const fetchUpdates = async () => {
    const updatesData = await getCampaignUpdates(campaign.id);
    if (updatesData) {
      console.log("Fetched updates:", updatesData);
      // Log individual update data for better debugging
      updatesData.forEach((update) => {
        console.log(`Update ${update.id}:`, {
          title: update.title,
          message: update.message,
          imageUrl: update.imageUrl || "none",
          youtubeUrl: update.youtubeUrl || "none",
        });
      });
      setUpdates(updatesData);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const isValidYoutubeUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    // Regular expressions for different YouTube URL formats
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El título y el mensaje son campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    // Validate that at least one of: uploaded image, image URL, or YouTube URL is provided
    const hasImage = !!uploadedImage;
    const hasImageUrl = !!formData.imageUrl && formData.imageUrl.trim() !== "";
    const hasYoutubeUrl =
      !!formData.youtubeUrl && formData.youtubeUrl.trim() !== "";

    if (!hasImage && !hasImageUrl && !hasYoutubeUrl) {
      toast({
        title: "Contenido multimedia requerido",
        description:
          "Debes proporcionar una imagen o un enlace de YouTube para el anuncio.",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL format if provided
    if (hasYoutubeUrl && !isValidYoutubeUrl(formData.youtubeUrl)) {
      toast({
        title: "Enlace de YouTube inválido",
        description: "Por favor proporciona un enlace de YouTube válido.",
        variant: "destructive",
      });
      return;
    }

    // If there's an uploaded image but no image URL, upload it first
    let imageUrl = formData.imageUrl || "";
    if (uploadedImage) {
      console.log("Uploading image before publishing update...");
      imageUrl = await uploadImage();
      console.log("Image uploaded, URL:", imageUrl);
      if (!imageUrl) {
        console.error("Failed to get image URL after upload");
        return;
      }
    }

    const updatePayload = {
      title: formData.title,
      message: formData.message,
      youtubeUrl: formData.youtubeUrl,
      imageUrl: imageUrl,
    };

    console.log("Sending update payload:", updatePayload);

    const success = await publishCampaignUpdate(campaign.id, updatePayload);

    if (success) {
      // Clear the form
      setFormData(initialFormState);
      setShowSaveBar(false);
      setHasChanges(false);
      setUploadedImage(null);
      setImageFile(null);

      // Refresh updates list
      fetchUpdates();
    }
  };

  const handleCancel = () => {
    // Reset all form state
    setFormData(initialFormState);
    setShowSaveBar(false);
    setHasChanges(false);
    setUploadedImage(null);
    setImageFile(null);

    // Clear file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmDeleteUpdate = async () => {
    if (!updateToDelete) return;

    const success = await deleteCampaignUpdate(campaign.id, updateToDelete);

    if (success) {
      // Refresh updates list
      fetchUpdates();
    }

    setIsDeleteDialogOpen(false);
    setUpdateToDelete(null);
  };

  const openDeleteDialog = (updateId: string) => {
    setUpdateToDelete(updateId);
    setIsDeleteDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileSize = file.size / 1024 / 1024; // Convert to MB

    if (fileSize > 2) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es de 2 MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no soportado",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary URL for the selected image
    const objectUrl = URL.createObjectURL(file);
    setUploadedImage(objectUrl);
    setImageFile(file);

    // Show the image editor
    setShowImageEditor(true);
  };

  const handleSaveEditedImage = (editedUrl: string) => {
    // Set the edited image
    setUploadedImage(editedUrl);
    // Also update the form data to track the edited image
    setFormData({
      ...formData,
      imageUrl: "", // Clear the imageUrl since we'll need to upload the edited image
    });
    setShowImageEditor(false);
  };

  const handleCancelImageEdit = () => {
    setUploadedImage(null);
    setImageFile(null);
    setShowImageEditor(false);
  };

  const uploadImage = async (): Promise<string> => {
    if (!uploadedImage) return "";

    setIsUploadingImage(true);
    try {
      // Convert data URL to Blob
      const dataURLtoBlob = (dataURL: string): Blob => {
        const arr = dataURL.split(",");
        if (arr.length < 2) return new Blob();

        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
      };

      // Convert to blob and create a File object
      const blob = dataURLtoBlob(uploadedImage);
      const file = new File([blob], `update_image_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // Upload to Supabase Storage
      const supabase = createBrowserClient();
      const STORAGE_BUCKET =
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "minka";
      const fileExt = "jpg";
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `campaign-images/${fileName}`;

      console.log(
        "Uploading to bucket:",
        STORAGE_BUCKET,
        "with path:",
        filePath
      );

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log("Upload successful, public URL:", urlData.publicUrl);

      // Store the URL in formData state to ensure it's tracked
      setFormData({
        ...formData,
        imageUrl: urlData.publicUrl,
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error al subir imagen",
        description:
          "No se pudo cargar la imagen. Intenta nuevamente o usa otra imagen.",
        variant: "destructive",
      });
      return "";
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    // Also clear the imageUrl in the form data
    setFormData({
      ...formData,
      imageUrl: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Publicar anuncios
        </h2>
        <p className="text-xl text-gray-600 leading-relaxed mb-10">
          Comparte actualizaciones sobre el progreso de tu campaña, agradece a
          los donadores o motiva publicando anuncios en tiempo real.
        </p>
        <div className="border-b border-[#478C5C]/20 my-8"></div>
      </div>

      {/* Título del anuncio */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Título
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Dale un título claro a tu anuncio para captar la atención de tus
              seguidores.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <div className="space-y-3">
              <label
                htmlFor="title"
                className="block text-lg font-medium text-gray-900 mb-1"
              >
                Título del anuncio
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ingresa el título de tu anuncio"
                className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4"
                maxLength={60}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.title.length}/60
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-b border-[#478C5C]/20" />
      </div>

      {/* Mensaje del anuncio */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Mensaje del anuncio
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Explícalo a tu comunidad sobre el progreso de tu campaña, nuevas
              noticias o próximos pasos. Mantén el entusiasmo y el compromiso
              activo.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <div className="space-y-3">
              <label
                htmlFor="message"
                className="block text-lg font-medium text-gray-900 mb-1"
              >
                Texto del anuncio
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Ejemplo: Su conservación depende de nosotros"
                className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 p-4 min-h-[150px]"
                maxLength={130}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.message.length}/130
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-b border-[#478C5C]/20" />
      </div>

      {/* Añadir foto o video */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Agrega fotos o videos que ilustren tu anuncio
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Imágenes poderosas que cuenten tu historia harán que tu anuncio
              sea más personal y emotivo. Esto ayudará a inspirar y conectar con
              más personas que apoyen tu causa.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-gray-900 mb-1">
                Añade una foto a tu anuncio
              </label>
              {!uploadedImage ? (
                <div
                  className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-4">
                      <svg
                        width="42"
                        height="42"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Arrastra o carga tus fotos aquí
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Sólo archivos en formato JPEG, PNG y máximo 2 MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] border-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Seleccionar foto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white rounded-full h-8 w-8 p-0 shadow-lg"
                      onClick={() => setShowImageEditor(true)}
                    >
                      <ImageIcon size={16} className="text-gray-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white rounded-full h-8 w-8 p-0 shadow-lg"
                      onClick={removeUploadedImage}
                    >
                      <X size={16} className="text-gray-600" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center my-6">
                <div className="flex-1 h-px bg-gray-300"></div>
                <div className="px-4 text-gray-500">O</div>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* YouTube URL input */}
              <div className="space-y-1">
                <label
                  htmlFor="youtubeUrl"
                  className="block text-lg font-medium text-gray-900 mb-1"
                >
                  Agregar enlace de YouTube
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9L15 12L10 15V9Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder="Enlace de YouTube"
                    className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 pl-10 h-12 px-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-b border-[#478C5C]/20" />
      </div>

      {/* Previous Updates */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Anuncios recientes
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revisa los anuncios que has publicado anteriormente para tu
              campaña.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <label className="block text-lg font-medium text-gray-900 mb-2">
              Tus anuncios publicados
            </label>
            {isLoadingUpdates ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : updates.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {updates.map((update) => {
                  console.log(`Rendering update ${update.id}:`, {
                    title: update.title,
                    hasImage: !!update.imageUrl,
                    hasYoutube: !!update.youtubeUrl,
                  });

                  return (
                    <div key={update.id} className="py-4">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {update.imageUrl ? (
                            <div className="h-16 w-16 rounded-md relative overflow-hidden bg-gray-100">
                              <img
                                src={update.imageUrl}
                                alt={update.title}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  console.error(
                                    `Failed to load image: ${update.imageUrl}`
                                  );
                                  // Replace with fallback instead of hiding
                                  e.currentTarget.parentElement!.innerHTML = `
                                    <div class="h-16 w-16 rounded-md flex items-center justify-center bg-gray-200 text-gray-400">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                      </svg>
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center text-[#2c6e49] font-bold">
                              {campaign.title?.charAt(0) || "C"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900">
                              {update.title}
                            </p>
                            <button
                              onClick={() => openDeleteDialog(update.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </p>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>{update.message}</p>
                          </div>
                          {update.youtubeUrl && (
                            <div className="mt-2">
                              <a
                                href={update.youtubeUrl}
                                rel="noopener noreferrer"
                                className="text-[#2c6e49] text-sm hover:underline flex items-center"
                              >
                                <svg
                                  className="mr-1 h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M10 9L15 12L10 15V9Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Ver video en YouTube
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay anuncios aún
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Comparte novedades sobre tu campaña para mantener informados a
                  los donadores.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Changes Bar */}
      {showSaveBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 py-4 px-6 border-t border-gray-200 z-50 flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 bg-white"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full"
            disabled={isPublishingUpdate || isUploadingImage || !hasChanges}
            onClick={handleSubmit}
          >
            {isPublishingUpdate || isUploadingImage ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Publicando...</span>
              </div>
            ) : (
              "Publicar anuncio"
            )}
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el anuncio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUpdate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Editor Modal */}
      {showImageEditor && uploadedImage && (
        <ImageEditor
          imageUrl={uploadedImage}
          onSave={handleSaveEditedImage}
          onCancel={handleCancelImageEdit}
          isLoading={isUploadingImage}
        />
      )}
    </div>
  );
}

