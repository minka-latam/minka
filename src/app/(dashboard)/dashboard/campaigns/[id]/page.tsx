"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, X, Check, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EditCampaignTab } from "@/components/campaign-admin/edit-campaign-tab";
import { AdsTab } from "@/components/campaign-admin/ads-tab";
import { CommentsTab } from "@/components/campaign-admin/comments-tab";
import { DonationsTab } from "@/components/campaign-admin/donations-tab";
import { TransferFundsTab } from "@/components/campaign-admin/transfer-funds-tab";
import { ImageEditor } from "@/components/views/create-campaign/ImageEditor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { uploadMedia } from "@/lib/supabase/upload-media";

export default function CampaignDetailPage() {
  const MAX_GOAL_AMOUNT = 150000;
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editar");
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state variables for form fields
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    undefined
  );
  const [isFormModified, setIsFormModified] = useState(false);

  // Add state variables for media handling
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null
  );
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track original campaign state for reset functionality
  const [originalCampaign, setOriginalCampaign] = useState<Record<string, any>>(
    {}
  );

  // Function to handle form changes
  const handleFormChange = () => {
    setIsFormModified(true);
  };

  // Function to handle cancellation
  const handleCancel = () => {
    // Reset form to original values
    setCampaign(originalCampaign);
    setSelectedLocation(originalCampaign.location || null);
    setSelectedEndDate(
      originalCampaign.end_date
        ? new Date(originalCampaign.end_date)
        : undefined
    );
    setYoutubeUrls(originalCampaign.youtube_urls || []);
    setMediaPreviewUrls([]);
    setMediaFiles([]);
    setIsFormModified(false);
  };

  // Function to handle file upload
  // Add utility function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    try {
      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error("Error converting dataURL to Blob:", error);
      // Return a small empty blob as fallback
      return new Blob([], { type: "image/jpeg" });
    }
  };

  // Add handler for saving edited image
  const handleSaveEditedImage = async (editedUrl: string) => {
    try {
      console.log("Saving edited image...");

      // Create file from edited image dataURL first
      const blob = dataURLtoBlob(editedUrl);
      const fileName = uploadingFile
        ? uploadingFile.name
        : `edited-image-${Date.now()}.jpg`;
      const file = new File([blob], fileName, {
        type: "image/jpeg",
      });

      // Start upload
      setIsUploading(true);
      try {
        const result = await uploadMedia(file);
        if (result.success) {
          if (editingImageIndex !== null) {
            // If we're editing an existing image from campaign.media
            if (editingImageIndex < (campaign.media?.length || 0)) {
              // Update existing media
              const updatedMedia = [...(campaign.media || [])];
              updatedMedia[editingImageIndex] = {
                ...updatedMedia[editingImageIndex],
                media_url: result.url,
              };

              setCampaign((prev) => ({
                ...prev,
                media: updatedMedia,
              }));
            }
            // If we're editing a newly added image that's not saved yet
            else {
              const localIndex =
                editingImageIndex - (campaign.media?.length || 0);

              // Clean up preview URLs if they exist
              if (localIndex >= 0 && localIndex < mediaPreviewUrls.length) {
                URL.revokeObjectURL(mediaPreviewUrls[localIndex]);

                // Remove from preview arrays as we're adding to campaign.media
                const newPreviewUrls = [...mediaPreviewUrls];
                newPreviewUrls.splice(localIndex, 1);
                setMediaPreviewUrls(newPreviewUrls);

                const newMediaFiles = [...mediaFiles];
                newMediaFiles.splice(localIndex, 1);
                setMediaFiles(newMediaFiles);
              }

              // Add to campaign media
              setCampaign((prev) => ({
                ...prev,
                media: [
                  ...(prev.media || []),
                  {
                    media_url: result.url,
                    is_primary: prev.media?.length === 0,
                  },
                ],
              }));
            }
          } else {
            // If adding a completely new image
            // Don't add to preview arrays, only to campaign.media
            setCampaign((prev) => ({
              ...prev,
              media: [
                ...(prev.media || []),
                {
                  media_url: result.url,
                  is_primary: prev.media?.length === 0,
                },
              ],
            }));
          }
          handleFormChange();
        } else {
          throw new Error("Failed to upload media");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error de carga",
          description: "Error al subir la imagen. Intenta nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }

      setUploadingFile(null);

      // Reset editing state
      setImageToEdit(null);
      setEditingImageIndex(null);

      // Show success toast
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente.",
      });
    } catch (error) {
      console.error("Error processing edited image:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la imagen.",
        variant: "destructive",
      });

      // Reset editing state even if there's an error
      setImageToEdit(null);
      setEditingImageIndex(null);
    }
  };

  // Helper to convert Supabase URL to use proxy if needed
  const getProxiedImageUrl = (url: string) => {
    // Check if this is a Supabase storage URL
    if (url.includes("supabase.co") || url.includes("supabase.in")) {
      // For Supabase storage URLs, we can use them directly
      // But we need to ensure CORS is handled properly
      console.log("Using original Supabase URL:", url);
      return url;
    }
    // Otherwise, return the original URL
    return url;
  };

  // Add handler for editing existing image
  const handleEditImage = (index: number) => {
    // For existing campaign media
    if (index < (campaign.media?.length || 0)) {
      const media = campaign.media?.[index];
      if (media && media.media_url) {
        console.log("Editing existing campaign media at index:", index);
        const imageUrl = getProxiedImageUrl(media.media_url);
        console.log("Setting imageToEdit to:", imageUrl);
        setImageToEdit(imageUrl);
        setEditingImageIndex(index);
        return;
      }
    }

    // For newly added media (not yet saved)
    const previewIndex = index - (campaign.media?.length || 0);
    if (previewIndex >= 0 && previewIndex < mediaPreviewUrls.length) {
      console.log("Editing newly added media at index:", previewIndex);
      setImageToEdit(mediaPreviewUrls[previewIndex]);
      setEditingImageIndex(index);
    } else {
      console.error("Invalid media index:", index);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      toast({
        title: "Archivo muy grande",
        description: "El archivo es demasiado grande. El tamaño máximo es 2MB.",
      });
      return null;
    }

    if (!file.type.includes("image/")) {
      toast({
        title: "Formato inválido",
        description: "Solo se permiten archivos de imagen (JPEG, PNG).",
      });
      return null;
    }

    setIsUploading(true);
    try {
      const result = await uploadMedia(file);
      if (result.success) {
        return result.url;
      } else {
        throw new Error("Failed to upload media");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error de carga",
        description: "Error al subir la imagen. Intenta nuevamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

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

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);

    console.log("Setting imageToEdit to", previewUrl);
    // Set the image to edit
    setImageToEdit(previewUrl);
    setUploadingFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to remove media
  const removeMedia = (index: number) => {
    const newMedia = [...(campaign.media || [])];
    newMedia.splice(index, 1);

    // If we're removing the primary image, set the first remaining image as primary
    if (newMedia.length > 0 && campaign.media?.[index]?.is_primary) {
      newMedia[0].is_primary = true;
    }

    setCampaign({
      ...campaign,
      media: newMedia,
    });

    // Remove from preview URLs if it exists
    if (index < mediaPreviewUrls.length) {
      const newPreviewUrls = [...mediaPreviewUrls];
      URL.revokeObjectURL(newPreviewUrls[index]); // Clean up object URL
      newPreviewUrls.splice(index, 1);
      setMediaPreviewUrls(newPreviewUrls);

      // Also remove from files array
      const newMediaFiles = [...mediaFiles];
      newMediaFiles.splice(index, 1);
      setMediaFiles(newMediaFiles);
    }

    handleFormChange();
  };

  // Function to set primary image
  const setPrimaryImage = (index: number) => {
    const newMedia = [...(campaign.media || [])].map((item, i) => ({
      ...item,
      is_primary: i === index,
    }));

    setCampaign({
      ...campaign,
      media: newMedia,
    });

    handleFormChange();
  };

  // Function to add YouTube URL
  const addYoutubeUrl = () => {
    if (!newYoutubeUrl || !newYoutubeUrl.includes("youtube.com")) {
      toast({
        title: "Enlace inválido",
        description: "Por favor ingresa un enlace válido de YouTube.",
      });
      return;
    }

    const newUrls = [...youtubeUrls, newYoutubeUrl];
    setYoutubeUrls(newUrls);
    setCampaign({
      ...campaign,
      youtube_urls: newUrls,
      youtube_url: newYoutubeUrl, // Set the first one as main
    });
    setNewYoutubeUrl("");
    handleFormChange();
  };

  // Function to remove YouTube URL
  const removeYoutubeUrl = (index: number) => {
    const newUrls = [...youtubeUrls];
    newUrls.splice(index, 1);
    setYoutubeUrls(newUrls);
    setCampaign({
      ...campaign,
      youtube_urls: newUrls,
      youtube_url: newUrls.length > 0 ? newUrls[0] : "",
    });
    handleFormChange();
  };

  // Function to handle saving changes
  const handleSaveChanges = async () => {
    try {
      setIsFormModified(false);

      // Prepare the data to send to the API
      const campaignData: {
        title: any;
        description: any;
        category: any;
        goalAmount: any;
        location: any;
        endDate: any;
        story: any;
        beneficiariesDescription: any;
        youtubeUrl: any;
        youtubeUrls: any;
        media?: Array<{
          mediaUrl: string;
          type: string;
          isPrimary: boolean;
          orderIndex: number;
        }>;
      } = {
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        goalAmount: campaign.goal_amount,
        location: campaign.location,
        endDate: campaign.end_date,
        story: campaign.story,
        beneficiariesDescription: campaign.beneficiaries_description,
        youtubeUrl: campaign.youtube_url,
        youtubeUrls: campaign.youtube_urls,
      };

      // If media was modified, include it in the update
      if (campaign.media) {
        campaignData.media = campaign.media.map((item: any) => ({
          mediaUrl: item.media_url,
          type: item.type || "image",
          isPrimary: item.is_primary,
          orderIndex: item.order_index || 0,
        }));
      }

      // Make API call to update the campaign
      const response = await fetch(`/api/campaign/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar los cambios");
      }

      // Update the original campaign state with the new values
      setOriginalCampaign({ ...campaign });

      toast({
        title: "Cambios guardados",
        description: "Los cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const isDraftCampaign =
    campaign?.campaign_status === "draft" ||
    campaign?.campaignStatus === "draft";
  const canDeleteCampaign =
    campaign?.campaign_status === "draft" ||
    campaign?.campaignStatus === "draft" ||
    campaign?.campaign_status === "active" ||
    campaign?.campaignStatus === "active";

  const handlePublishCampaign = async () => {
    try {
      setIsPublishing(true);
      const response = await fetch(`/api/campaign/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignStatus: "active",
          verificationStatus: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo publicar la campaña.");
      }

      setCampaign((prev: Record<string, any>) => ({
        ...prev,
        campaign_status: "active",
      }));

      toast({
        title: "Campaña publicada",
        description: "Tu campaña ahora está activa.",
      });
    } catch (error) {
      console.error("Error publishing campaign:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar la campaña.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteCampaign = async () => {
    const confirmed = window.confirm(
      "¿Eliminar esta campaña borrador? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/campaign/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "No se pudo eliminar la campaña.");
      }

      toast({
        title: "Campaña eliminada",
        description: "El borrador fue eliminado correctamente.",
      });
      router.push("/dashboard/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la campaña.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isDraftCampaign && activeTab !== "editar") {
      setActiveTab("editar");
    }
  }, [isDraftCampaign, activeTab]);

  useEffect(() => {
    async function getCampaignDetails() {
      try {
        const { data: session } = await supabase.auth.getSession();

        if (!session.session) {
          router.push("/sign-in");
          return;
        }

        // Fetch campaign details with media
        const { data: campaignData, error } = await supabase
          .from("campaigns")
          .select(
            `
            *,
            organizer:profiles(*),
            media:campaign_media(*)
          `
          )
          .eq("id", params.id)
          .single();

        if (error || !campaignData) {
          // In development mode, use dummy data instead of showing error or redirecting
          if (process.env.NODE_ENV === "development") {
            console.log("Using dummy campaign data for development");
            setCampaign({
              id: params.id,
              title: "Protejamos juntos el parque Nacional Amboró",
              description:
                "Una campaña para proteger la biodiversidad del parque nacional Amboró, uno de los tesoros naturales de Bolivia.",
              location: "Bolivia, Santa Cruz",
              image_url: "/amboro-main.jpg",
              collected_amount: 4000,
              goal_amount: 10000,
              donor_count: 250,
              days_remaining: 4,
              category: "medioambiente",
              organizer_id: session.session.user.id,
              media: [],
              youtube_url: "",
              end_date: "2024-12-31",
              beneficiaries_description:
                "Comunidades locales y vida silvestre del parque Amboró",
            });
            setLoading(false);
            return;
          }

          console.error("Error fetching campaign:", error);
          router.push("/dashboard/campaigns");
          return;
        }

        // Check if user is the campaign organizer
        if (campaignData.organizer_id !== session.session.user.id) {
          // Check if user is admin
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.session.user.id)
            .single();

          if (!profileData || profileData.role !== "admin") {
            router.push("/dashboard/campaigns");
            return;
          }
        }

        // Find the primary image from campaign media
        const primaryMedia = campaignData.media?.find(
          (media: any) =>
            media.is_primary && media.media_url && media.media_url.trim() !== ""
        );

        // Merge campaign data with the primary image URL
        const enhancedCampaignData = {
          ...campaignData,
          image_url:
            primaryMedia?.media_url && primaryMedia.media_url.trim() !== ""
              ? primaryMedia.media_url
              : "/amboro-main.jpg",
          category_id: campaignData.categories?.id || "",
        };

        // Initialize state variables with campaign data
        if (enhancedCampaignData?.location) {
          setSelectedLocation(enhancedCampaignData.location);
        }

        if (enhancedCampaignData?.end_date) {
          setSelectedEndDate(new Date(enhancedCampaignData.end_date));
        }

        // Initialize YouTube URLs from campaign data
        if (enhancedCampaignData?.youtube_urls?.length > 0) {
          setYoutubeUrls(enhancedCampaignData.youtube_urls);
        } else if (enhancedCampaignData?.youtube_url) {
          setYoutubeUrls([enhancedCampaignData.youtube_url]);
        }

        setCampaign(enhancedCampaignData);
        setOriginalCampaign(enhancedCampaignData);
      } catch (error) {
        // Suppress errors in development mode with dummy data
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Error encountered, using dummy campaign data for development"
          );
          const { data: session } = await supabase.auth.getSession();

          setCampaign({
            id: params.id,
            title: "Protejamos juntos el parque Nacional Amboró",
            description:
              "Una campaña para proteger la biodiversidad del parque nacional Amboró, uno de los tesoros naturales de Bolivia.",
            location: "Bolivia, Santa Cruz",
            image_url: "/amboro-main.jpg",
            collected_amount: 4000,
            goal_amount: 10000,
            donor_count: 250,
            days_remaining: 4,
            category: "medioambiente",
            organizer_id: session?.session?.user?.id || "dummy-id",
            media: [],
            youtube_url: "",
            end_date: "2024-12-31",
            beneficiaries_description:
              "Comunidades locales y vida silvestre del parque Amboró",
          });
        } else {
          console.error("Error:", error);
          router.push("/dashboard/campaigns");
        }
      } finally {
        setLoading(false);
      }
    }

    getCampaignDetails();
  }, [params.id, router, supabase]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaPreviewUrls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Campaña no encontrada</h1>
        <p className="mt-4">
          La campaña que buscas no existe o no tienes permisos para verla.
        </p>
        <Button
          className="mt-8 bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
          onClick={() => router.push("/dashboard/campaigns")}
        >
          Volver a mis campañas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Campaign Header */}
      <div className="px-6 md:px-8 lg:px-16 xl:px-24">
        <div className="rounded-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Campaign Image */}
            <div className="relative w-full md:w-[350px] h-56">
              <Image
                src={campaign.image_url || "/amboro-main.jpg"}
                alt={campaign.title || "Campaign image"}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            {/* Campaign Details */}
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              {/* Action Buttons */}
              <div className="flex space-x-5 mb-5">
                <Link
                  href={`/campaign/${params.id}`}
                  className="flex items-center text-[#1a5535] gap-2 text-sm font-medium hover:underline"
                >
                  <span>Ver campaña</span>
                  <Image
                    src="/icons/visibility.svg"
                    alt="View"
                    width={18}
                    height={18}
                  />
                </Link>
                <button
                  className="flex items-center text-[#1a5535] gap-2 text-sm font-medium hover:underline"
                  onClick={() => {
                    // Create the URL to share
                    const shareUrl = `${window.location.origin}/campaign/${params.id}`;

                    // Try to use the Web Share API if available
                    if (navigator.share) {
                      navigator
                        .share({
                          title: campaign.title,
                          text: campaign.description?.substring(0, 100) + "...",
                          url: shareUrl,
                        })
                        .catch(() => {
                          // Fallback to clipboard if sharing fails
                          navigator.clipboard.writeText(shareUrl).then(() => {
                            toast({
                              title: "Enlace copiado",
                              description:
                                "El enlace ha sido copiado al portapapeles.",
                            });
                          });
                        });
                    } else {
                      // Fallback for browsers that don't support sharing
                      navigator.clipboard
                        .writeText(shareUrl)
                        .then(() => {
                          toast({
                            title: "Enlace copiado",
                            description:
                              "El enlace ha sido copiado al portapapeles.",
                          });
                        })
                        .catch(() => {
                          // Silent fail - don't show errors to user
                          toast({
                            title: "Enlace copiado",
                            description:
                              "El enlace ha sido copiado al portapapeles.",
                          });
                        });
                    }
                  }}
                >
                  <span>Compartir</span>
                  <Image
                    src="/icons/share.svg"
                    alt="Share"
                    width={18}
                    height={18}
                  />
                </button>
                {isDraftCampaign && (
                  <Button
                    type="button"
                    onClick={handlePublishCampaign}
                    disabled={isPublishing || isDeleting}
                    className="h-8 px-4 rounded-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                  >
                    {isPublishing ? "Publicando..." : "Publicar"}
                  </Button>
                )}
                {canDeleteCampaign && (
                  <Button
                    type="button"
                    onClick={handleDeleteCampaign}
                    disabled={isDeleting || isPublishing}
                    variant="outline"
                    className="h-8 px-4 rounded-full border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </Button>
                )}
              </div>

              {/* Campaign Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                {campaign.title}
              </h1>

              {/* Campaign Stats */}
              <div className="flex flex-wrap items-center">
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    Bs. {campaign.collected_amount?.toLocaleString() || "0"}{" "}
                    recaudados
                  </p>
                </div>
                <div className="mx-6 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    {campaign.donor_count || "0"} donadores
                  </p>
                </div>
                <div className="mx-6 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">
                    Quedan {campaign.days_remaining || "0"} días
                  </p>
                </div>
              </div>
              {isDraftCampaign && (
                <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Esta campaña está en borrador. Publícala o elimínala desde aquí.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full">
        {/* Custom Tab Navigation */}
        <div className="flex justify-between px-4 md:px-8 lg:px-16 xl:px-24 gap-2 pb-0">
          <button
            onClick={() => setActiveTab("editar")}
            className={`relative flex items-center gap-2 py-3 px-3 sm:px-6 rounded-t-lg transition-colors flex-1 justify-center border border-[#2c6e49] border-b-0 ${
              activeTab === "editar"
                ? "bg-white text-[#1a5535] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white after:z-10"
                : "bg-[#f2f8f5] text-[#1a5535] hover:bg-[#e8f5ed]"
            }`}
          >
            <span className="text-xs sm:text-sm">Editar campaña</span>
            <Image src="/icons/edit.svg" alt="Edit" width={16} height={16} />
          </button>

          {!isDraftCampaign && (
            <>
              <button
                onClick={() => setActiveTab("anuncios")}
                className={`relative flex items-center gap-2 py-3 px-3 sm:px-6 rounded-t-lg transition-colors flex-1 justify-center border border-[#2c6e49] border-b-0 ${
                  activeTab === "anuncios"
                    ? "bg-white text-[#1a5535] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white after:z-10"
                    : "bg-[#f2f8f5] text-[#1a5535] hover:bg-[#e8f5ed]"
                }`}
              >
                <span className="text-xs sm:text-sm">Publicar anuncios</span>
                <Image src="/icons/add_2.svg" alt="Add" width={16} height={16} />
              </button>

              <button
                onClick={() => setActiveTab("comentarios")}
                className={`relative flex items-center gap-2 py-3 px-3 sm:px-6 rounded-t-lg transition-colors flex-1 justify-center border border-[#2c6e49] border-b-0 ${
                  activeTab === "comentarios"
                    ? "bg-white text-[#1a5535] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white after:z-10"
                    : "bg-[#f2f8f5] text-[#1a5535] hover:bg-[#e8f5ed]"
                }`}
              >
                <span className="text-xs sm:text-sm">Comentarios</span>
                <Image
                  src="/icons/chat.svg"
                  alt="Comments"
                  width={16}
                  height={16}
                />
              </button>

              <button
                onClick={() => setActiveTab("donaciones")}
                className={`relative flex items-center gap-2 py-3 px-3 sm:px-6 rounded-t-lg transition-colors flex-1 justify-center border border-[#2c6e49] border-b-0 ${
                  activeTab === "donaciones"
                    ? "bg-white text-[#1a5535] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white after:z-10"
                    : "bg-[#f2f8f5] text-[#1a5535] hover:bg-[#e8f5ed]"
                }`}
              >
                <span className="text-xs sm:text-sm">Donaciones</span>
                <Image
                  src="/icons/check_circle.svg"
                  alt="Donations"
                  width={16}
                  height={16}
                />
              </button>

              <button
                onClick={() => setActiveTab("transferir")}
                className={`relative flex items-center gap-2 py-3 px-3 sm:px-6 rounded-t-lg transition-colors flex-1 justify-center border border-[#2c6e49] border-b-0 ${
                  activeTab === "transferir"
                    ? "bg-white text-[#1a5535] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white after:z-10"
                    : "bg-[#f2f8f5] text-[#1a5535] hover:bg-[#e8f5ed]"
                }`}
              >
                <span className="text-xs sm:text-sm">Transferir fondos</span>
                <Image
                  src="/icons/east.svg"
                  alt="Transfer"
                  width={16}
                  height={16}
                />
              </button>
            </>
          )}
        </div>

        <div className="h-[1px] bg-[#2c6e49] w-full relative z-0"></div>

        {/* Tab Content */}
        <div className="bg-white w-full min-h-[500px] mt-0 pt-0">
          {activeTab === "editar" && (
            <div className="w-full">
              <div className="px-6 md:px-8 lg:px-16 xl:px-24 py-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                  Editar campaña
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-10">
                  Modifica los detalles de tu campaña para mejorar su alcance e
                  impacto. Actualiza la información, imágenes o metas según sea
                  necesario.
                </p>
                <div className="border-b border-[#478C5C]/20 my-8"></div>
              </div>
              <div className="px-6 md:px-8 lg:px-16 xl:px-24">
                <div className="max-w-4xl mx-auto bg-white rounded-lg border border-black p-8 mb-28">
                  <form className="space-y-8">
                    {/* Nombre de la campaña */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Nombre de la campaña
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full p-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ingresa el nombre de tu campaña"
                          defaultValue={campaign.title || ""}
                          onChange={(e) => {
                            setCampaign({ ...campaign, title: e.target.value });
                            handleFormChange();
                          }}
                        />
                      </div>
                      <div className="text-right text-sm text-black">0/60</div>
                    </div>

                    {/* Detalle */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Detalle
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full p-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px] resize-none"
                          placeholder="Ejemplo: Su conservación depende de nosotros"
                          defaultValue={campaign.description || ""}
                          onChange={(e) => {
                            setCampaign({
                              ...campaign,
                              description: e.target.value,
                            });
                            handleFormChange();
                          }}
                        ></textarea>
                      </div>
                      <div className="text-right text-sm text-black">0/130</div>
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Categoría
                      </label>
                      <div className="relative">
                        <select
                          className="w-full p-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                          defaultValue={campaign.category || ""}
                          onChange={(e) => {
                            setCampaign({
                              ...campaign,
                              category: e.target.value,
                            });
                            handleFormChange();
                          }}
                        >
                          <option value="salud">Salud</option>
                          <option value="educacion">Educación</option>
                          <option value="medioambiente">Medio ambiente</option>
                          <option value="cultura_arte">Cultura y Arte</option>
                          <option value="emergencia">Emergencia</option>
                          <option value="igualdad">Igualdad</option>
                        </select>
                        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M6 9L12 15L18 9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Meta de recaudación */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Meta de recaudación
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full p-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Bs. 2.000,00"
                          value={
                            campaign.goal_amount
                              ? `Bs. ${campaign.goal_amount.toLocaleString()}`
                              : ""
                          }
                          onChange={(e) => {
                            // Remove non-numeric characters for storage
                            const numericValue = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            const parsedValue = numericValue
                              ? parseInt(numericValue, 10)
                              : 0;
                            const boundedValue = Math.min(
                              parsedValue,
                              MAX_GOAL_AMOUNT
                            );
                            setCampaign({
                              ...campaign,
                              goal_amount: boundedValue,
                            });
                            handleFormChange();
                          }}
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3 mt-2">
                        <div className="bg-blue-500 rounded-full p-1 flex items-center justify-center text-white">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <p className="text-blue-800 text-sm">
                          Este es el monto objetivo de tu campaña.
                        </p>
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <label className="text-lg font-bold text-gray-800">
                        Imágenes de la campaña
                      </label>

                      {/* Display existing images */}
                      {(campaign.media?.length > 0 ||
                        mediaPreviewUrls.length > 0) && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-3">
                            Imágenes cargadas
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Display campaign media (uploaded and saved images) */}
                            {campaign.media?.map(
                              (media: any, index: number) => (
                                <div
                                  key={`media-${index}`}
                                  className={`relative rounded-lg overflow-hidden border ${media.is_primary ? "border-[#2c6e49] ring-2 ring-[#2c6e49]" : "border-gray-200"}`}
                                >
                                  <Image
                                    src={media.media_url}
                                    alt={`Campaign image ${index + 1}`}
                                    width={200}
                                    height={150}
                                    className="w-full h-32 object-cover"
                                  />
                                  {media.is_primary && (
                                    <div className="absolute top-2 left-2 bg-[#2c6e49] text-white text-xs px-2 py-1 rounded-full">
                                      Imagen principal
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2 flex gap-1">
                                    <button
                                      type="button"
                                      className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                      onClick={() => {
                                        handleEditImage(index);
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-blue-500"
                                      >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                      onClick={() => removeMedia(index)}
                                    >
                                      <X size={16} className="text-red-500" />
                                    </button>
                                  </div>
                                  {!media.is_primary && (
                                    <button
                                      type="button"
                                      className="absolute bottom-2 left-2 bg-white/80 text-[#2c6e49] text-xs px-2 py-1 rounded-full font-medium shadow-sm hover:bg-white"
                                      onClick={() => setPrimaryImage(index)}
                                    >
                                      Hacer principal
                                    </button>
                                  )}
                                </div>
                              )
                            )}

                            {/* Preview URLs for newly uploaded images (not yet saved to campaign.media) */}
                            {mediaPreviewUrls.length > 0 &&
                              mediaPreviewUrls.map((url, index) => {
                                // Calculate the actual index for editing (after campaign.media)
                                const editIndex =
                                  (campaign.media?.length || 0) + index;

                                return (
                                  <div
                                    key={`preview-${index}`}
                                    className="relative rounded-lg overflow-hidden border border-gray-200"
                                  >
                                    <Image
                                      src={url}
                                      alt={`New image ${index + 1}`}
                                      width={200}
                                      height={150}
                                      className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                      <button
                                        type="button"
                                        className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                        onClick={() =>
                                          handleEditImage(editIndex)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-blue-500"
                                        >
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                        onClick={() => {
                                          const newPreviewUrls = [
                                            ...mediaPreviewUrls,
                                          ];
                                          URL.revokeObjectURL(
                                            newPreviewUrls[index]
                                          );
                                          newPreviewUrls.splice(index, 1);
                                          setMediaPreviewUrls(newPreviewUrls);

                                          const newMediaFiles = [...mediaFiles];
                                          newMediaFiles.splice(index, 1);
                                          setMediaFiles(newMediaFiles);

                                          handleFormChange();
                                        }}
                                      >
                                        <X size={16} className="text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Upload new image */}
                      <div
                        className="border-2 border-dashed border-gray-400 rounded-lg p-10 text-center bg-white cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Image
                            src="/icons/add_ad.svg"
                            alt="Add media"
                            width={42}
                            height={42}
                            className="mb-4"
                          />
                          <p className="text-sm text-gray-500 mb-4">
                            Arrastra o carga tus fotos aquí
                          </p>
                          <p className="text-xs text-gray-400 mb-4">
                            Sólo archivos en formato JPEG, PNG y máximo 2 MB
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] border-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Subiendo...</span>
                              </div>
                            ) : (
                              "Seleccionar"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center my-6">
                      <div className="flex-grow h-px bg-gray-300"></div>
                      <div className="mx-4 text-gray-500">o</div>
                      <div className="flex-grow h-px bg-gray-300"></div>
                    </div>

                    {/* YouTube */}
                    <div className="space-y-4">
                      <label className="text-lg font-medium text-gray-800 mb-2">
                        Agregar enlace de YouTube
                      </label>

                      {/* Add new YouTube link */}
                      <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.0471 17.54 13.54L20.54 10.54C21.4479 9.59699 21.9505 8.33397 21.9384 7.02299C21.9262 5.71201 21.4 4.45898 20.4741 3.53307C19.5482 2.60716 18.2951 2.08101 16.9842 2.06884C15.6732 2.05666 14.4102 2.55923 13.47 3.47L11.75 5.18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3935 9.60707C11.7643 9.26331 11.0685 9.05889 10.3534 9.00768C9.63821 8.95646 8.92041 9.05964 8.24866 9.31023C7.5769 9.56082 6.96689 9.95294 6.46 10.46L3.46 13.46C2.55209 14.403 2.04954 15.666 2.06165 16.977C2.07375 18.288 2.59998 19.541 3.5259 20.4669C4.45181 21.3928 5.70487 21.919 7.01581 21.9312C8.32675 21.9434 9.58979 21.4408 10.53 20.53L12.24 18.82"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <input
                            type="text"
                            className="w-full pl-11 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={newYoutubeUrl}
                            onChange={(e) => setNewYoutubeUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addYoutubeUrl();
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={addYoutubeUrl}
                          className="w-10 h-10 p-0 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full flex items-center justify-center min-w-10"
                          aria-label="Agregar enlace de YouTube"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </Button>
                      </div>

                      {/* Display existing YouTube links */}
                      {youtubeUrls.length > 0 && (
                        <div className="mt-5">
                          <p className="text-base font-medium mb-2">
                            Enlaces agregados:
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            {youtubeUrls.map((url, index) => {
                              // Extract video ID from URL
                              const videoId =
                                url.match(
                                  /(?:\/|v=)([a-zA-Z0-9_-]{11})(?:\?|&|$)/
                                )?.[1] || "";
                              const thumbnailUrl = videoId
                                ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                                : "/images/default-video-thumbnail.jpg";

                              return (
                                <div
                                  key={`yt-${index}`}
                                  className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                                >
                                  <div className="relative aspect-video bg-gray-100">
                                    <Image
                                      src={thumbnailUrl}
                                      alt={`YouTube video ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M5 3L19 12L5 21V3Z"
                                            fill="white"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-2 flex justify-between items-center">
                                    <div className="truncate text-sm text-gray-600">
                                      {url}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeYoutubeUrl(index)}
                                      className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Ubicación de la campaña
                      </label>
                      <div className="relative">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-12 justify-start text-left border-black rounded-md bg-white hover:bg-gray-50",
                                !(selectedLocation || campaign.location) &&
                                  "text-gray-400"
                              )}
                            >
                              <div className="flex items-center w-full">
                                <Image
                                  src="/icons/search.svg"
                                  alt="Search"
                                  width={20}
                                  height={20}
                                  className="mr-2 shrink-0"
                                />
                                <span className="text-base">
                                  {selectedLocation
                                    ? selectedLocation
                                        .split("_")
                                        .map(
                                          (word: string) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1)
                                        )
                                        .join(" ")
                                    : campaign.location
                                      ? campaign.location
                                          .split("_")
                                          .map(
                                            (word: string) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
                                          .join(" ")
                                      : "¿Adónde irán los fondos?"}
                                </span>
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-full p-0 bg-white border border-gray-200 rounded-lg shadow-lg"
                            align="start"
                          >
                            <div className="p-2">
                              <div className="max-h-56 overflow-y-auto">
                                {[
                                  "la_paz",
                                  "santa_cruz",
                                  "cochabamba",
                                  "sucre",
                                  "oruro",
                                  "potosi",
                                  "tarija",
                                  "beni",
                                  "pando",
                                ].map((region) => (
                                  <Button
                                    key={region}
                                    variant="ghost"
                                    className="w-full justify-start text-left rounded-md p-2 hover:bg-gray-100"
                                    onClick={() => {
                                      setSelectedLocation(region);
                                      // Update campaign object
                                      setCampaign({
                                        ...campaign,
                                        location: region,
                                      });
                                      handleFormChange();
                                      document.body.click();
                                    }}
                                  >
                                    {region
                                      .split("_")
                                      .map(
                                        (word: string) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(" ")}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-gray-500 text-sm flex items-center space-x-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span>Campo opcional</span>
                      </p>
                    </div>

                    {/* Fecha de finalización */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Fecha de finalización
                      </label>
                      <div className="relative">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={cn(
                                "w-full h-12 justify-start text-left relative pl-10 border-black rounded-md bg-white hover:bg-gray-50",
                                !(selectedEndDate || campaign.end_date) &&
                                  "text-gray-400"
                              )}
                            >
                              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                              {selectedEndDate
                                ? format(selectedEndDate, "dd/MM/yyyy", {
                                    locale: es,
                                  })
                                : campaign.end_date
                                  ? format(
                                      new Date(campaign.end_date),
                                      "dd/MM/yyyy",
                                      { locale: es }
                                    )
                                  : "DD/MM/AAAA"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-lg"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                selectedEndDate ||
                                (campaign.end_date
                                  ? new Date(campaign.end_date)
                                  : undefined)
                              }
                              onSelect={(date) => {
                                if (date) {
                                  setSelectedEndDate(date);
                                  // Update campaign object
                                  setCampaign({
                                    ...campaign,
                                    end_date: date.toISOString().split("T")[0],
                                  });
                                  handleFormChange();
                                }
                                setTimeout(() => document.body.click(), 100);
                              }}
                              disabled={(date) => {
                                // Disable dates in the past
                                return (
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                );
                              }}
                              initialFocus
                              className="rounded-md border-none p-3"
                              captionLayout="dropdown"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 5}
                              classNames={{
                                caption_dropdowns: "flex gap-1",
                                dropdown:
                                  "p-1 bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#2c6e49]",
                                caption_label: "text-sm font-medium hidden",
                                nav_button:
                                  "h-8 w-8 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full",
                                day_selected:
                                  "bg-[#2c6e49] text-white hover:bg-[#2c6e49] hover:text-white focus:bg-[#2c6e49] focus:text-white",
                                day_today: "bg-gray-100 text-gray-900",
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Presentación de la campaña */}
                    <div className="space-y-2">
                      <label className="text-lg font-bold text-gray-800">
                        Presentación de la campaña
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full p-4 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px] resize-none"
                          placeholder="Ejemplo: Su conservación depende de nosotros"
                          defaultValue={
                            campaign.beneficiaries_description || ""
                          }
                          onChange={(e) => {
                            setCampaign({
                              ...campaign,
                              beneficiaries_description: e.target.value,
                            });
                            handleFormChange();
                          }}
                        ></textarea>
                      </div>
                      <div className="text-right text-sm text-black">0/600</div>
                    </div>

                    {/* Información del beneficiario */}
                    {campaign.recipient_type && (
                      <div className="space-y-4 border-t border-gray-200 pt-6">
                        <label className="text-lg font-bold text-gray-800">
                          Información del beneficiario
                        </label>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Tipo de destinatario:</span>
                            <span className="text-sm text-gray-800 capitalize">
                              {campaign.recipient_type === "tu_mismo" && "Tú mismo"}
                              {campaign.recipient_type === "otra_persona" && "Otra persona"}
                              {campaign.recipient_type === "persona_juridica" && "Persona Jurídica"}
                            </span>
                          </div>

                          {campaign.recipient_type === "otra_persona" && (
                            <>
                              {campaign.beneficiary_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600">Nombre del beneficiario:</span>
                                  <span className="text-sm text-gray-800">{campaign.beneficiary_name}</span>
                                </div>
                              )}
                              {campaign.beneficiary_relationship && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600">Relación:</span>
                                  <span className="text-sm text-gray-800 capitalize">{campaign.beneficiary_relationship}</span>
                                </div>
                              )}
                              {campaign.beneficiary_reason && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium text-gray-600">Motivo:</span>
                                  <span className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200">{campaign.beneficiary_reason}</span>
                                </div>
                              )}
                            </>
                          )}

                          {campaign.recipient_type === "persona_juridica" && campaign.legal_entity_id && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">Organización asociada:</span>
                              <span className="text-sm text-gray-800">ID: {campaign.legal_entity_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "anuncios" && (
            <div className="w-full">
              <div className="px-6 md:px-8 lg:px-16 xl:px-24 py-6">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Publicar anuncios
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-10">
                  Mantén a tus donadores informados sobre los avances y logros
                  de tu campaña.
                </p>
                <div className="border-b border-[#478C5C]/20 my-8"></div>
              </div>
              <AdsTab campaign={campaign} />
            </div>
          )}

          {activeTab === "comentarios" && (
            <div className="w-full">
              <CommentsTab campaign={campaign} />
            </div>
          )}

          {activeTab === "donaciones" && (
            <div className="w-full">
              <DonationsTab campaign={campaign} />
            </div>
          )}

          {activeTab === "transferir" && (
            <div className="w-full">
              <div className="px-6 md:px-8 lg:px-16 xl:px-24 py-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                  Transferir fondos
                </h2>
                <div className="border-b border-[#478C5C]/20 my-4"></div>
              </div>
              <TransferFundsTab campaign={campaign} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar that appears when form is modified */}
      {isFormModified && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 shadow-md z-50 py-4 px-6">
          <div className="container mx-auto">
            <div className="flex space-x-4 justify-start">
              <Button
                onClick={() => {
                  // Implement the actual save logic with Supabase
                  handleSaveChanges();
                }}
                className="px-6 py-2 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full font-medium flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Guardar cambios
              </Button>
              <Button
                onClick={handleCancel}
                className="px-6 py-2 bg-transparent hover:bg-transparent text-[#2c6e49] rounded-md font-medium flex items-center shadow-none"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal - Moved to root level for proper rendering */}
      {imageToEdit && (
        <ImageEditor
          imageUrl={imageToEdit}
          onSave={handleSaveEditedImage}
          onCancel={() => {
            setImageToEdit(null);
            setEditingImageIndex(null);
          }}
          isLoading={isUploading}
        />
      )}
    </div>
  );
}
