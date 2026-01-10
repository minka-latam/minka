"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  PlusCircle,
  X,
  CheckCircle,
  UploadCloud,
  Plus,
  Play,
  Link as LinkIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CampaignMedia {
  id: string;
  mediaUrl: string | null;
  isPrimary: boolean;
  orderIndex: number;
  type: string;
  status?: string;
}

interface EditCampaignTabProps {
  campaign: Record<string, any>;
}

export function EditCampaignTab({ campaign }: EditCampaignTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [campaignMedia, setCampaignMedia] = useState<CampaignMedia[]>(
    (campaign.media || []).map((media: any) => ({
      id: media.id,
      mediaUrl: media.media_url || null,
      isPrimary: media.is_primary || false,
      orderIndex: media.order_index || 0,
      type: media.type || "image",
      status: media.status || "active",
    }))
  );

  const initialFormState = useMemo(
    () => ({
      title: campaign.title || "",
      description: campaign.description || "",
      goalAmount: campaign.goal_amount || 0,
      location: campaign.location || "",
      category: campaign.category || "",
      youtubeUrl: campaign.youtube_url || "",
      youtubeUrls: campaign.youtube_urls || [],
      beneficiariesDescription: campaign.beneficiaries_description || "",
      endDate: campaign.end_date?.split("T")[0] || "",
    }),
    [campaign]
  );

  const [formData, setFormData] = useState(initialFormState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if form has any changes
    const formChanged =
      JSON.stringify(formData) !== JSON.stringify(initialFormState);
    setHasChanges(formChanged);
    setShowSaveBar(formChanged);
  }, [formData, initialFormState]);

  // Add function to format number with thousands separators
  const formatNumberWithSeparators = (value: string | number): string => {
    // Convert to string and remove any non-digit characters first
    const stringValue = String(value || "");
    const numericValue = stringValue.replace(/\D/g, "");

    // Return empty string if no digits
    if (!numericValue) return "";

    // Add thousands separators (dots)
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Add function to remove separators and get raw numeric value
  const removeNumberSeparators = (value: string): string => {
    return value.replace(/\./g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "goalAmount") {
      // Only allow digits and dots (for existing separators) for goalAmount
      const numericOnly = value.replace(/[^\d.]/g, "");

      // Remove existing separators to get raw value
      const rawValue = removeNumberSeparators(numericOnly);

      setFormData({ ...formData, [name]: rawValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast({
        title: "Archivo muy grande",
        description: "El archivo es demasiado grande. El tamaño máximo es 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.includes("image/")) {
      toast({
        title: "Formato inválido",
        description: "Solo se permiten archivos de imagen (JPEG, PNG).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      // Upload the file to storage
      const supabase = createClientComponentClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `campaign-media/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("campaign-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from("campaign-media")
        .getPublicUrl(filePath);

      // Now use the API to add the media to the campaign
      const response = await fetch(`/api/campaign/${campaign.id}/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaUrl: publicUrlData.publicUrl,
          type: "image",
          isPrimary: campaignMedia.length === 0, // Make it primary if it's the first image
          orderIndex: campaignMedia.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add media to campaign");
      }

      const { media } = await response.json();

      // Update local state with the new media
      const mappedMedia: CampaignMedia = {
        id: media.id,
        mediaUrl: media.media_url || null,
        isPrimary: media.is_primary || false,
        orderIndex: media.order_index || 0,
        type: media.type || "image",
        status: media.status || "active",
      };

      setCampaignMedia([...campaignMedia, mappedMedia]);

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente.",
      });

      // Refresh to update the primary image in the UI if needed
      if (campaignMedia.length === 0) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    try {
      setIsLoading(true);

      // Use the API to set a media as primary
      const response = await fetch(`/api/campaign/${campaign.id}/media`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "set_primary",
          mediaId: mediaId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set media as primary");
      }

      // Update local state
      const updatedMedia = campaignMedia.map((media) => ({
        ...media,
        isPrimary: media.id === mediaId,
      }));

      setCampaignMedia(updatedMedia);

      toast({
        title: "Imagen principal",
        description: "La imagen principal ha sido actualizada.",
      });

      // Refresh to update the primary image in the UI
      router.refresh();
    } catch (error) {
      console.error("Error setting primary image:", error);
      toast({
        title: "Error",
        description:
          "No se pudo establecer la imagen principal. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (mediaId: string) => {
    try {
      setIsLoading(true);

      // Use the API to delete the media
      const response = await fetch(
        `/api/campaign/${campaign.id}/media?mediaId=${mediaId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete media");
      }

      // Update local state
      const updatedMedia = campaignMedia.filter(
        (media) => media.id !== mediaId
      );
      setCampaignMedia(updatedMedia);

      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada correctamente.",
      });

      // Check if we might have deleted a primary image
      const wasDeletedPrimary = campaignMedia.find(
        (media) => media.id === mediaId && media.isPrimary
      );

      // Refresh if primary image was changed
      if (wasDeletedPrimary) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleYouTubeLinksChange = (links: string[]) => {
    setFormData({
      ...formData,
      youtubeUrls: links,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update campaign using the API endpoint
      const response = await fetch(`/api/campaign/${campaign.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_amount: Number(formData.goalAmount),
          location: formData.location,
          category: formData.category,
          youtube_url: formData.youtubeUrl,
          youtube_urls: formData.youtubeUrls,
          beneficiaries_description: formData.beneficiariesDescription,
          end_date: formData.endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update campaign");
      }

      toast({
        title: "Campaña actualizada",
        description: "Los cambios han sido guardados correctamente.",
      });

      setShowSaveBar(false);
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la campaña. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setShowSaveBar(false);
    setHasChanges(false);
  };

  return (
    <div className="w-full">
      <div className="px-6 md:px-8 lg:px-16 xl:px-24 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Información de la campaña</h2>
          <p className="text-sm text-gray-500">
            Modifica los detalles de tu campaña para mejorar su alcance e
            impacto
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre de la campaña
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ingresa el nombre de tu campaña"
                className="w-full border-gray-300"
                maxLength={60}
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.title.length}/60
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Categoría
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3"
                required
              >
                <option value="">Selecciona una categoría</option>
                <option value="cultura_arte">Cultura y Arte</option>
                <option value="educacion">Educación</option>
                <option value="emergencia">Emergencia</option>
                <option value="igualdad">Igualdad</option>
                <option value="medioambiente">Medio ambiente</option>
                <option value="salud">Salud</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Detalle
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Ejemplo: Su conservación depende de nosotros"
                className="w-full rounded-md border border-gray-300 p-3 min-h-[100px]"
                maxLength={130}
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.description.length}/130
              </div>
            </div>

            <div>
              <label
                htmlFor="goalAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta de recaudación
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  Bs.
                </span>
                <Input
                  id="goalAmount"
                  name="goalAmount"
                  type="text"
                  value={formatNumberWithSeparators(formData.goalAmount)}
                  onChange={handleInputChange}
                  className="pl-10 w-full border-gray-300"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ubicación de la campaña
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 p-3"
                required
              >
                <option value="">Selecciona una región</option>
                <option value="la_paz">La Paz</option>
                <option value="santa_cruz">Santa Cruz</option>
                <option value="cochabamba">Cochabamba</option>
                <option value="sucre">Sucre</option>
                <option value="oruro">Oruro</option>
                <option value="potosi">Potosí</option>
                <option value="tarija">Tarija</option>
                <option value="beni">Beni</option>
                <option value="pando">Pando</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fecha de finalización
              </label>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      formNoValidate
                      id="date-picker-button"
                      className={`flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-[#478C5C] focus:outline-none focus:ring-1 focus:ring-[#478C5C] ${
                        !formData.endDate ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      <span className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {formData.endDate
                          ? format(new Date(formData.endDate), "PPP")
                          : "Selecciona una fecha"}
                      </span>
                      <span className="ml-auto">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-gray-500"
                        >
                          <path
                            d="M2.5 4.5L6 8L9.5 4.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="rounded-md border shadow-md">
                      <Calendar
                        mode="single"
                        selected={
                          formData.endDate
                            ? new Date(formData.endDate)
                            : undefined
                        }
                        onSelect={(date) => {
                          setFormData({
                            ...formData,
                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                          });
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">
                Imágenes de la campaña
              </h3>

              {/* Display existing images */}
              {campaignMedia.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {campaignMedia.map((media) => (
                    <div
                      key={media.id}
                      className="relative border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={media.mediaUrl || "/amboro-main.jpg"}
                          alt="Campaign image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(media.id)}
                          className={`p-1.5 rounded-full ${
                            media.isPrimary
                              ? "bg-green-100 text-green-600"
                              : "bg-white text-gray-600"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(media.id)}
                          className="bg-white p-1.5 rounded-full text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {media.isPrimary && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new image */}
              <div
                onClick={handleFileSelect}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center">
                  {isUploadingImage ? (
                    <LoadingSpinner size="md" />
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Arrastra o carga tus fotos aquí
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Deben ser archivos JPG o PNG, no mayor a 2 MB.
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white border-gray-300"
                    onClick={handleFileSelect}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enlaces de YouTube
              </label>
              <YouTubeLinks
                links={formData.youtubeUrls}
                onChange={handleYouTubeLinksChange}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="beneficiariesDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Beneficiarios
              </label>
              <textarea
                id="beneficiariesDescription"
                name="beneficiariesDescription"
                value={formData.beneficiariesDescription}
                onChange={handleInputChange}
                placeholder="Describe quiénes se beneficiarán de esta campaña..."
                className="w-full rounded-md border border-gray-300 p-3 min-h-[100px]"
                maxLength={600}
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.beneficiariesDescription.length}/600
              </div>
            </div>
          </div>
        </form>
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
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
            disabled={isLoading || !hasChanges}
            onClick={handleSubmit}
          >
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface YouTubeLinksProps {
  links: string[];
  onChange: (links: string[]) => void;
}

function YouTubeLinks({ links, onChange }: YouTubeLinksProps) {
  const [newLink, setNewLink] = useState("");

  const validateYouTubeUrl = (url: string) => {
    // Simple regex to validate YouTube URLs
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleAddLink = () => {
    if (!newLink.trim()) {
      toast({
        title: "Enlace vacío",
        description: "Por favor ingresa un enlace de YouTube",
        variant: "destructive",
      });
      return;
    }

    if (!validateYouTubeUrl(newLink)) {
      toast({
        title: "Enlace inválido",
        description: "Por favor ingresa un enlace válido de YouTube",
        variant: "destructive",
      });
      return;
    }

    const updatedLinks = [...links, newLink];
    onChange(updatedLinks);
    setNewLink("");
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onChange(updatedLinks);
  };

  const extractVideoId = (url: string) => {
    // Try to extract the video ID from various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-[#478C5C] focus:ring-1 focus:ring-[#478C5C] outline-none"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddLink}
          className="bg-[#478C5C] text-white hover:bg-[#3a7049] rounded-full h-10"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {links.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4 className="font-medium">Enlaces agregados:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link, index) => {
              const videoId = extractVideoId(link);
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="aspect-video bg-gray-100">
                    {videoId ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                          alt={`YouTube thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-[#478C5C]/80 rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" fill="white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No se pudo cargar la vista previa
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div className="truncate flex-1 text-sm">{link}</div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
