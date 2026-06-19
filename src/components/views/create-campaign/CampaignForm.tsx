"use client";

import { ImproveTextButton } from "@/components/ui/improve-text-button";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  Clock,
  MapPin,
  Share2,
  Bookmark,
  Calendar,
  Play,
  Search,
  Building2,
  Info,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCampaign, CampaignFormData } from "@/hooks/use-campaign";
import { useUpload } from "@/hooks/use-upload";
import { useLegalEntities, LegalEntity } from "@/hooks/use-legal-entities";
import { UploadProgress } from "./UploadProgress";
import { ImageEditor } from "./ImageEditor";
import { YouTubeLinks } from "./YouTubeLinks";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import { getProvincesForDepartment } from "@/constants/bolivia-provinces";
import { CampaignDescriptionInput } from "./CampaignDescriptionInput";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentStep } from "@/contexts/current-step-context";
import { useAuth } from "@/providers/auth-provider";
import { CAMPAIGN_CATEGORIES } from "@/lib/campaign-categories";
import {
  CAMPAIGN_IMAGE_MAX_COUNT,
  getCampaignImageFiles,
  validateCampaignImageFile,
} from "@/lib/uploads/image-upload-validation";

const LOCAL_DONATION_FEE_RATE = 0.05;
const INTERNATIONAL_DONATION_FEE_RATE = 0.11;

function formatBobAmount(amount: number) {
  return `Bs. ${amount.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function roundCurrency(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Campaign Preview component
const CampaignPreview = ({
  campaign,
  onClose,
  uploadedUrls = [],
}: {
  campaign: CampaignFormData & { media?: { mediaUrl: string }[] };
  onClose: () => void;
  uploadedUrls?: string[];
}) => {
  // Format currency helper
  const formatCurrency = (amount: string | number) => {
    if (!amount) return "Bs. 0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Bs. ${num.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Convert any available media URLs to a consistent format for display
  const mediaUrls: string[] =
    campaign.media?.map((m: { mediaUrl: string }) => m.mediaUrl) ||
    uploadedUrls ||
    [];

  // Prepare images in the format expected by CampaignGallery
  const galleryImages = mediaUrls.map((url: string, index: number) => ({
    url,
    type: url.includes("video") ? ("video" as const) : ("image" as const),
    id: `preview-img-${index}`,
  }));

  // Add a default image if none provided
  if (galleryImages.length === 0) {
    galleryImages.push({
      url: "/landing-page/dummies/Card/Imagen.png",
      type: "image" as const,
      id: "default-img",
    });
  }

  const { profile } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto flex items-start justify-center pt-8">
      <div className="bg-[#fbfbf6] max-w-6xl w-full relative rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl font-medium text-[#2c6e49] mb-4">
            Vista previa
          </h2>

          {/* Campaign Header & Gallery - Grid layout from the campaign/[id] page */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#333333]">
                {campaign.title ||
                  "Protejamos juntos el parque Nacional Amboró"}
              </h1>

              {/* Gallery Section */}
              <div className="space-y-4">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-gray-200">
                  <Image
                    src={galleryImages[0].url}
                    alt={`${campaign.title} - Imagen principal`}
                    fill
                    className="object-cover"
                  />
                  {/* Verification badge */}
                  <div className="absolute bottom-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                    <Check className="h-5 w-5 text-[#2c6e49]" />
                  </div>
                </div>

                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {galleryImages.slice(0, 4).map((image, index) => (
                      <div
                        key={image.id}
                        className={`relative aspect-[16/9] overflow-hidden rounded-lg border-2 ${
                          index === 0
                            ? "border-[#2c6e49]"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={`${campaign.title} - Imagen ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {image.type === "video" && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white/80 rounded-full p-1">
                              <Play className="h-5 w-5 text-[#2c6e49]" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campaign Details Section - Similar to the campaign/[id] page */}
              <div className="mt-8 space-y-6">
                {/* Organizer Header */}
                <div className="flex items-center gap-3 py-4 border-b border-gray-200">
                  <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center">
                    <span className="text-sm font-medium text-[#2c6e49]">
                      {profile?.name
                        ? profile.name.charAt(0).toUpperCase()
                        : "A"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2c6e49]">
                      {profile?.name || "Usuario de Minka"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Organizador | {profile?.location || "Bolivia"}
                    </p>
                  </div>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/landing-page/step-2.png"
                      alt="Verified"
                      width={28}
                      height={28}
                      className="text-[#2c6e49]"
                    />
                    <span className="text-[#2c6e49] text-lg font-medium">
                      Campaña verificada por Minka
                    </span>
                  </div>
                  <a href="#" className="text-[#2c6e49] underline text-sm">
                    Más información
                  </a>
                </div>

                {/* Campaign Description */}
                <div className="space-y-3 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-[#2c6e49]">
                    Descripción de la campaña
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {campaign.description ||
                      "El Parque Nacional Amboró es uno de los lugares más biodiversos del mundo, hogar de especies únicas y ecosistemas vitales. Su conservación depende de todos nosotros."}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Progress */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#2c6e49] mb-1">
                  Avances de la campaña
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Cada aporte cuenta. ¡Sé parte del cambio!
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-[#2c6e49]" />
                    <span className="text-sm">Campaña verificada</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Creada hace 6 días</span>
                  </div>
                </div>

                {/* Separator */}
                <hr className="h-px w-full bg-gray-200 my-4" />

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Recaudado Bs. 1.200,00</span>
                    <span>250 donadores</span>
                  </div>
                  <div className="h-2 w-full bg-[#e8f0e9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2c6e49] rounded-full"
                      style={{ width: "80%" }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#2c6e49]">80%</span>
                    <span>
                      Objetivo: {formatCurrency(campaign.goalAmount || 4000)}
                    </span>
                  </div>
                </div>

                {/* Separator */}
                <hr className="h-px w-full bg-gray-200 my-4" />

                <div className="space-y-3">
                  <Button className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full py-4">
                    Donar ahora
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 hover:bg-gray-50 rounded-full py-4"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full hover:bg-gray-50 rounded-full py-4"
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    Guardar campaña
                  </Button>
                </div>
              </div>

              {/* Campaign Updates */}
              <div className="mt-6 bg-white p-5 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-[#2c6e49] mb-4">
                  Anuncios de la campaña
                </h2>
                <p className="text-gray-600 text-sm">
                  Aún no hay anuncios en esta campaña. Los anuncios se mostrarán
                  aquí cuando el organizador los publique.
                </p>
              </div>

              {/* Comments */}
              <div className="mt-6 bg-white p-5 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-[#2c6e49] mb-4">
                  Comentarios de donadores
                </h2>
                <p className="text-gray-600 text-sm">
                  Aún no hay comentarios en esta campaña. Los donadores podrán
                  dejar sus comentarios aquí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Update the form sections (showing only the modified parts)
export function CampaignForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { campaignId, saveCampaignDraft, updateCampaign } = useCampaign();
  const {
    isUploading,
    progress,
    uploadedUrls,
    setUploadedUrls,
    uploadFiles,
  } = useUpload();
  const { fetchActiveLegalEntities } = useLegalEntities();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the context to sync step changes with the parent page
  const { setCurrentStep: setContextStep } = useCurrentStep();

  const [currentStep, setCurrentStep] = useState(1);
  // Add new state for sub-steps within step 1
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [isSubStepAnimating, setIsSubStepAnimating] = useState(false);
  const [subStepAnimationDirection, setSubStepAnimationDirection] = useState<
    "next" | "prev"
  >("next");

  // Add new state for animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"next" | "prev">(
    "next",
  );

  // Sync the current step with the context
  useEffect(() => {
    setContextStep(currentStep);
  }, [currentStep, setContextStep]);

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    subtitle: "",
    description: "",
    category: "",
    goalAmount: "",
    location: "la_paz", // Set default value to La Paz
    province: undefined, // Add province field
    endDate: "",
    recipient: "",
    youtubeUrl: "",
    youtubeUrls: [],
    beneficiariesDescription: "",
    legalEntityId: undefined, // Add legal entity ID field
  });
  const [showOtraPersonaModal, setShowOtraPersonaModal] = useState(false);
  const [showPersonaJuridicaModal, setShowPersonaJuridicaModal] =
    useState(false);

  // Add state to track form validity for each step
  const [, setIsStep1Valid] = useState(false);
  const [, setIsStep2Valid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for "Otra persona" modal form
  const [otraPersonaForm, setOtraPersonaForm] = useState({
    beneficiaryType: "person" as "person" | "institution",
    beneficiaryName: "",
    relationship: "",
    beneficiariesDescription: "",
    institutionNit: "",
    institutionEmail: "",
    institutionWebsite: "",
    institutionPhone: "",
  });

  // State for "Persona Jurídica" modal form
  const [personaJuridicaForm, setPersonaJuridicaForm] = useState({
    entityName: "", // Company/organization name
    selectedEntityId: "", // Selected legal entity ID
  });

  // State for legal entities
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [loadingLegalEntities, setLoadingLegalEntities] = useState(false);
  const [legalEntitiesSearch, setLegalEntitiesSearch] = useState("");

  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Add new state for image editing
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null,
  );
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Add this new state for preview
  const [showPreview, setShowPreview] = useState(false);

  // Add state to track available provinces based on selected department
  const [availableProvinces, setAvailableProvinces] = useState(
    getProvincesForDepartment("la_paz"),
  );

  // Update available provinces when location changes
  useEffect(() => {
    setAvailableProvinces(getProvincesForDepartment(formData.location));
    // Reset province when department changes
    if (formData.province) {
      const newProvinces = getProvincesForDepartment(formData.location);
      const isProvinceStillValid = newProvinces.some(
        (p) => p.value === formData.province,
      );
      if (!isProvinceStillValid) {
        setFormData((prev) => ({ ...prev, province: undefined }));
      }
    }
  }, [formData.location]);

  // Check step 1 validity
  useEffect(() => {
    // Basic validation for required fields in step 1
    const isValid =
      formData.title.length >= 3 &&
      formData.subtitle.length >= 10 &&
      formData.category !== "" &&
      formData.description.length >= 10;

    setIsStep1Valid(isValid);
  }, [formData]);

  // Set step 2 valid to true by default as recipient selection is optional
  useEffect(() => {
    setIsStep2Valid(true);
  }, [formData.recipient]);

  const handleSelectRecipient = async (
    recipient: string,
    beneficiaryFormOverride?: typeof otraPersonaForm,
  ) => {
    try {
      setIsSubmitting(true);

      // Prepare the update data
      const updateData: any = {
        recipientType: recipient,
      };

      if (recipient === "tu_mismo") {
        updateData.legalEntityId = null;
        updateData.beneficiaryName = null;
        updateData.beneficiaryRelationship = null;
        updateData.beneficiariesDescription = "";
      }

      // If selecting persona_juridica, include the legal entity ID
      if (
        recipient === "persona_juridica" &&
        personaJuridicaForm.selectedEntityId
      ) {
        updateData.legalEntityId = personaJuridicaForm.selectedEntityId;
        updateData.beneficiaryName = null;
        updateData.beneficiaryRelationship = null;
        updateData.beneficiariesDescription = "";
      }

      // If selecting otra_persona, include the beneficiary information
      if (recipient === "otra_persona") {
        const beneficiaryForm = beneficiaryFormOverride || otraPersonaForm;
        updateData.legalEntityId = null;
        updateData.beneficiaryName = beneficiaryForm.beneficiaryName;
        updateData.beneficiaryRelationship = beneficiaryForm.relationship;
        updateData.beneficiariesDescription =
          beneficiaryForm.beneficiariesDescription;
      }

      // Update form data with the selected recipient and related fields
      setFormData((prev) => ({
        ...prev,
        recipient,
        legalEntityId:
          recipient === "persona_juridica"
            ? updateData.legalEntityId
            : undefined,
        beneficiaryName:
          recipient === "otra_persona" ? updateData.beneficiaryName : undefined,
        beneficiaryRelationship:
          recipient === "otra_persona"
            ? updateData.beneficiaryRelationship
            : undefined,
        beneficiariesDescription:
          recipient === "otra_persona"
            ? updateData.beneficiariesDescription
            : "",
      }));

      // If we already have a campaignId, update it instead of creating a new one
      if (campaignId) {
        const success = await updateCampaign(updateData, campaignId);

        if (!success) {
          throw new Error("Failed to update campaign recipient");
        }

        // Move to step 3 after successful selection and update with animation
        setAnimationDirection("next");
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentStep(3);
          window.scrollTo(0, 0);
          // Reset animation state after a short delay
          setTimeout(() => {
            setIsAnimating(false);
          }, 50);
        }, 500);
      } else {
        // This should not happen if the workflow is correct, but just in case
        toast({
          title: "Error",
          description: "No se encontró la campaña. Intenta nuevamente.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error handling recipient selection:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la selección.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsSubmitting(true);

      if (!campaignId) {
        toast({
          title: "Error",
          description: "No se encontró la campaña a publicar.",
          variant: "destructive",
        });
        return;
      }

      // Publishing does not control verification; badge approval is admin-only.
      const success = await updateCampaign(
        {
          campaignStatus: "active",
        },
        campaignId,
      );

      if (!success) {
        throw new Error("Failed to update campaign status");
      }

      router.push("/dashboard/campaigns");
    } catch (error) {
      console.error("Error publishing campaign:", error);
      toast({
        title: "Error",
        description: "Error al publicar la campaña",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to handle verification request
  const handleRequestVerification = async () => {
    try {
      if (!campaignId) {
        toast({
          title: "Error",
          description: "No se encontró la campaña para verificar.",
          variant: "destructive",
        });
        return;
      }

      // Publish the campaign before optional badge verification.
      const publishSuccess = await updateCampaign(
        {
          campaignStatus: "active",
        },
        campaignId,
      );

      if (!publishSuccess) {
        throw new Error("Failed to submit campaign for review");
      }

      // Store the campaign ID in local storage so CampaignVerificationView can use it
      localStorage.setItem("verificationCampaignId", campaignId);

      // Redirect to verification page with campaign ID in the URL query parameter
      router.push(`/campaign-verification?id=${campaignId}`);
    } catch (error) {
      console.error("Error preparing for verification:", error);
      toast({
        title: "Error",
        description: "Error al publicar la campaña",
        variant: "destructive",
      });
    }
  };

  const closeOtraPersonaModal = () => {
    setShowOtraPersonaModal(false);
    // Reset form when closing modal
    setOtraPersonaForm({
      beneficiaryType: "person",
      beneficiaryName: "",
      relationship: "",
      beneficiariesDescription: "",
      institutionNit: "",
      institutionEmail: "",
      institutionWebsite: "",
      institutionPhone: "",
    });
  };

  const closePersonaJuridicaModal = () => {
    setShowPersonaJuridicaModal(false);
    // Reset form when closing modal
    setPersonaJuridicaForm({
      entityName: "",
      selectedEntityId: "",
    });
    // Reset legal entities state
    setLegalEntities([]);
    setLegalEntitiesSearch("");
    setLoadingLegalEntities(false);
  };

  // Utility function to help with image URL issues
  const ensureMediaIsUploaded = async (): Promise<string[] | null> => {
    if (uploadedUrls.length === mediaFiles.length && uploadedUrls.length > 0) {
      return uploadedUrls;
    }

    if (mediaFiles.length > 0) {
      try {
        const urls = await uploadFiles(mediaFiles);
        if (urls.length === mediaFiles.length) {
          setUploadedUrls(urls);
          return urls;
        }

        console.error("Failed to upload all media files");
        return null;
      } catch (error) {
        console.error("Error uploading media files:", error);
        return null;
      }
    }

    return null;
  };

  // Update the nextStep function to include animations
  const nextStep = async () => {
    if (currentStep === 1) {
      if (!validateForm()) {
        // Show alert for validation errors
        alert(
          "Por favor completa todos los campos requeridos antes de continuar.",
        );

        // Show toast for validation errors
        toast({
          title: "Campos incompletos",
          description:
            "Por favor completa todos los campos requeridos marcados en rojo.",
          variant: "destructive",
        });
        // Scroll to the first error
        const firstErrorKey = Object.keys(formErrors)[0];
        if (firstErrorKey) {
          const element = document.getElementById(firstErrorKey);
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      try {
        setIsSubmitting(true);
        const mediaUrls = await ensureMediaIsUploaded();

        if (!mediaUrls) {
          console.error("Could not upload media");
          toast({
            title: "Error de imágenes",
            description:
              "Las imágenes no se han subido correctamente. Por favor, vuelve a intentarlo.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        // Create or update draft campaign before proceeding to step 2
        const draftData = {
          ...formData,
          // Convert goalAmount to number by removing separators
          goalAmount: removeNumberSeparators(String(formData.goalAmount)),
          // Include media information
          media: mediaUrls.map((url, index) => ({
            mediaUrl: url,
            type: "image" as const,
            isPrimary: index === 0,
            orderIndex: index,
          })),
        };

        // Save the draft and get campaign ID
        const newCampaignId = await saveCampaignDraft(draftData);

        if (!newCampaignId) {
          console.error(
            "Failed to create or update campaign draft - no ID returned",
          );
          toast({
            title: "Error",
            description:
              "No se pudo crear el borrador de la campaña. Intenta nuevamente.",
            variant: "destructive",
          });
          return;
        }

        // Start fade out animation before changing step
        setAnimationDirection("next");
        setIsAnimating(true);
        setTimeout(() => {
          // Proceed to next step
          setCurrentStep(currentStep + 1);
          window.scrollTo(0, 0);
          // Reset animation state after a short delay
          setTimeout(() => {
            setIsAnimating(false);
          }, 50);
        }, 500); // Wait for fade out animation to complete
      } catch (error) {
        console.error("Error saving draft:", error);
        toast({
          title: "Error al guardar borrador",
          description:
            error instanceof Error
              ? error.message
              : "Ocurrió un error al guardar el borrador.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (currentStep === 2) {
      try {
        setIsSubmitting(true);

        // Save beneficiaries description
        if (campaignId) {
          const success = await updateCampaign(
            {
              beneficiariesDescription: formData.beneficiariesDescription,
            },
            campaignId,
          );

          if (!success) {
            throw new Error("Failed to update beneficiaries description");
          }
        }

        // Start fade out animation before changing step
        setAnimationDirection("next");
        setIsAnimating(true);
        setTimeout(() => {
          // Move to step 3
          setCurrentStep(3);
          window.scrollTo(0, 0);
          // Reset animation state after a short delay
          setTimeout(() => {
            setIsAnimating(false);
          }, 50);
        }, 500); // Wait for fade out animation to complete
      } catch (error) {
        console.error("Error saving beneficiaries description:", error);
        toast({
          title: "Error",
          description:
            "Ocurrió un error al guardar la descripción de los beneficiarios.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // General case for other steps
    setAnimationDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      // Reset animation state after a short delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 500);
  };

  // Update the prevStep function to include animations
  const prevStep = () => {
    setAnimationDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
      // Reset animation state after a short delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }, 500);
  };

  const clearMediaError = () => {
    setFormErrors((prev) => {
      if (!prev.media) return prev;
      const next = { ...prev };
      delete next.media;
      return next;
    });
  };

  const openImageEditorForFile = (file: File, remainingFiles: File[] = []) => {
    const validation = validateCampaignImageFile(file);

    if (!validation.valid) {
      toast({
        title: validation.title,
        description: validation.description,
        variant: "destructive",
      });
      return;
    }

    clearMediaError();
    setPendingImageFiles(remainingFiles);

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);

    // Set the image to edit
    setImageToEdit(previewUrl);

    // Store original file for later reference (we'll upload the edited version)
    setUploadingFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectedImageFiles = (files: FileList) => {
    const validation = getCampaignImageFiles(files, mediaPreviewUrls.length);

    if (!validation.valid) {
      toast({
        title: validation.title,
        description: validation.description,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const [firstFile, ...remainingFiles] = validation.files;
    openImageEditorForFile(firstFile, remainingFiles);
  };

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    handleSelectedImageFiles(e.target.files);
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    if (isUploading) return;

    handleSelectedImageFiles(e.dataTransfer.files);
  };

  // Add handler for saving edited image
  const handleSaveEditedImage = async (editedUrl: string) => {
    try {
      // Create file from edited image dataURL first
      const blob = dataURLtoBlob(editedUrl);
      const fileName = uploadingFile
        ? uploadingFile.name
        : `edited-image-${Date.now()}.jpg`;
      const file = new File([blob], fileName, {
        type: "image/jpeg",
      });

      // Create an object URL from the blob for preview
      const objectUrl = URL.createObjectURL(blob);

      if (editingImageIndex !== null) {
        const newPreviewUrls = [...mediaPreviewUrls];

        // Clean up old URL
        if (newPreviewUrls[editingImageIndex]) {
          URL.revokeObjectURL(newPreviewUrls[editingImageIndex]);
        }

        // Set the new edited URL
        newPreviewUrls[editingImageIndex] = objectUrl;
        setMediaPreviewUrls(newPreviewUrls);

        // Replace existing file
        const newMediaFiles = [...mediaFiles];
        newMediaFiles[editingImageIndex] = file;
        setMediaFiles(newMediaFiles);
      } else {
        setMediaPreviewUrls((prev) => [...prev, objectUrl]);
        setMediaFiles((prev) => [...prev, file]);
      }
      setUploadingFile(null);

      // Reset editing state
      setImageToEdit(null);
      setEditingImageIndex(null);

      // Show success toast
      toast({
        title: "Imagen lista",
        description: "La imagen se guardará al continuar.",
      });

      const [nextFile, ...remainingFiles] = pendingImageFiles;
      if (nextFile) {
        openImageEditorForFile(nextFile, remainingFiles);
      }
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
      setPendingImageFiles([]);
    }
  };

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

  // Add handler for editing existing image
  const handleEditImage = (index: number) => {
    setImageToEdit(mediaPreviewUrls[index]);
    setEditingImageIndex(index);
  };

  // Add handler for cancelling image edit
  const handleCancelImageEdit = () => {
    setImageToEdit(null);
    setEditingImageIndex(null);
    setUploadingFile(null);
    setPendingImageFiles([]);
  };

  // Add handler for updating YouTube links
  const handleYouTubeLinksChange = (links: string[]) => {
    setFormData((prev) => ({
      ...prev,
      youtubeUrls: links,
      youtubeUrl: links.length > 0 ? links[0] : "", // Keep first link in youtubeUrl for backward compatibility
    }));
  };

  // Remove a media item
  const removeMedia = (index: number) => {
    // Remove from files array
    const newMediaFiles = [...mediaFiles];
    newMediaFiles.splice(index, 1);
    setMediaFiles(newMediaFiles);

    // Remove from preview URLs
    const newPreviewUrls = [...mediaPreviewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]); // Clean up object URL
    newPreviewUrls.splice(index, 1);
    setMediaPreviewUrls(newPreviewUrls);

    // Remove from uploaded URLs
    const newUploadedUrls = [...uploadedUrls];
    newUploadedUrls.splice(index, 1);
    setUploadedUrls(newUploadedUrls);
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Update the modals for recipient selection
  const handleSelectOtraPersona = () => {
    setShowOtraPersonaModal(true);
  };

  const handleSelectPersonaJuridica = async () => {
    setShowPersonaJuridicaModal(true);
    // Load legal entities when modal opens
    await loadLegalEntities();
  };

  const buildInstitutionBeneficiaryDescription = () => {
    const lines = [
      "Tipo de beneficiario: Institución/fundación no registrada en Minka",
      otraPersonaForm.beneficiariesDescription.trim(),
      otraPersonaForm.institutionNit.trim()
        ? `NIT: ${otraPersonaForm.institutionNit.trim()}`
        : "",
      otraPersonaForm.institutionEmail.trim()
        ? `Email: ${otraPersonaForm.institutionEmail.trim()}`
        : "",
      otraPersonaForm.institutionWebsite.trim()
        ? `Web: ${otraPersonaForm.institutionWebsite.trim()}`
        : "",
      otraPersonaForm.institutionPhone.trim()
        ? `Teléfono: ${otraPersonaForm.institutionPhone.trim()}`
        : "",
    ];

    return lines.filter(Boolean).join("\n");
  };

  const handleOtraPersonaSubmit = async () => {
    // Validate form data
    const {
      beneficiaryType,
      beneficiaryName,
      relationship,
      beneficiariesDescription,
      institutionEmail,
      institutionWebsite,
    } = otraPersonaForm;

    if (!beneficiaryName || !relationship) {
      toast({
        title: "Error",
        description:
          beneficiaryType === "institution"
            ? "Por favor completa el nombre de la institución y tu relación con ella."
            : "Por favor completa nombre y relación del beneficiario.",
        variant: "destructive",
      });
      return;
    }

    if (beneficiaryName.length < 3) {
      toast({
        title: "Error",
        description: "El nombre debe tener al menos 3 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (
      beneficiaryType === "person" &&
      beneficiariesDescription.trim().length < 10
    ) {
      toast({
        title: "Error",
        description:
          "Por favor describe con un poco más de detalle al beneficiario.",
        variant: "destructive",
      });
      return;
    }

    if (
      beneficiaryType === "institution" &&
      beneficiariesDescription.trim().length < 5
    ) {
      toast({
        title: "Frase breve requerida",
        description:
          "Agrega una frase corta que describa a la institución. Ejemplo: Veterinaria canina en El Alto.",
        variant: "destructive",
      });
      return;
    }

    if (
      institutionEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institutionEmail.trim())
    ) {
      toast({
        title: "Correo inválido",
        description: "Ingresa un correo válido para la institución.",
        variant: "destructive",
      });
      return;
    }

    if (
      institutionWebsite.trim() &&
      !/^https?:\/\/[^\s]+\.[^\s]+/i.test(institutionWebsite.trim())
    ) {
      toast({
        title: "Sitio web inválido",
        description: "Ingresa la web completa, por ejemplo https://ejemplo.org.",
        variant: "destructive",
      });
      return;
    }

    const nextDescription =
      beneficiaryType === "institution"
        ? buildInstitutionBeneficiaryDescription()
        : beneficiariesDescription.trim();

    if (nextDescription.length > 600) {
      toast({
        title: "Información demasiado larga",
        description:
          "Reduce la descripción o los datos opcionales para no superar el límite permitido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setOtraPersonaForm((prev) => ({
        ...prev,
        beneficiariesDescription: nextDescription,
      }));
      const nextBeneficiaryForm = {
        ...otraPersonaForm,
        beneficiariesDescription: nextDescription,
      };

      toast({
        title:
          beneficiaryType === "institution"
            ? "Institución agregada"
            : "Beneficiario agregado",
        description:
          beneficiaryType === "institution"
            ? "Los datos de la institución se han guardado correctamente."
            : "Los datos del beneficiario se han guardado correctamente.",
      });

      setShowOtraPersonaModal(false);
      await handleSelectRecipient("otra_persona", nextBeneficiaryForm);
      closeOtraPersonaModal();
    } catch (error) {
      console.error("Error saving beneficiary data:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información del beneficiario.",
        variant: "destructive",
      });
    }
  };

  const handlePersonaJuridicaSubmit = async () => {
    // Validate form data
    const { selectedEntityId } = personaJuridicaForm;

    if (!selectedEntityId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una organización.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the selected entity for logging and validation
      const selectedEntity = legalEntities.find(
        (e) => e.id === selectedEntityId,
      );

      if (!selectedEntity) {
        toast({
          title: "Error",
          description: "La organización seleccionada no es válida.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Persona Jurídica seleccionada",
        description: `Se ha seleccionado "${selectedEntity.name}" como destinatario de los fondos.`,
      });

      closePersonaJuridicaModal();
      await handleSelectRecipient("persona_juridica");
    } catch (error) {
      console.error("Error saving legal entity selection:", error);
      toast({
        title: "Error",
        description:
          "No se pudo guardar la información de la persona jurídica.",
        variant: "destructive",
      });
    }
  };

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

  const MAX_GOAL_AMOUNT = 1000000;

  const validateGoalAmount = (value: string | number): string => {
    const rawValue = removeNumberSeparators(String(value || ""));

    if (!rawValue) {
      return "Debes establecer una meta de recaudación";
    }

    const parsedValue = Number(rawValue);
    if (Number.isNaN(parsedValue) || parsedValue > MAX_GOAL_AMOUNT) {
      return "La meta no debe superar Bs. 1.000.000";
    }

    return "";
  };

  // Add validation function to check all required fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate title
    if (!formData.title || formData.title.length < 3) {
      errors.title = "El título debe tener al menos 3 caracteres";
    }

    // Validate description
    if (!formData.subtitle || formData.subtitle.length < 10) {
      errors.subtitle = "La descripción debe tener al menos 10 caracteres";
    }

    // Validate category
    if (!formData.category) {
      errors.category = "Debes seleccionar una categoría";
    }

    const goalAmountError = validateGoalAmount(formData.goalAmount);
    if (goalAmountError) {
      errors.goalAmount = goalAmountError;
    }

    // Validate campaign description
    if (!formData.description || formData.description.length < 10) {
      errors.description =
        "La presentación de la campaña debe tener al menos 10 caracteres";
    } else if (formData.description.length > 600) {
      errors.description =
        "La presentación de la campaña no puede tener más de 600 caracteres";
    }

    // Validate at least one image and ensure it's been uploaded properly
    if (mediaPreviewUrls.length === 0) {
      errors.media = "Debes subir al menos una imagen";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add function to handle input change with number validation
  const handleGoalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Only allow digits and dots (for existing separators)
    const numericOnly = inputValue.replace(/[^\d.]/g, "");

    // Remove existing separators to get raw value
    const rawValue = removeNumberSeparators(numericOnly);

    // Update form data with raw numeric value
    setFormData({ ...formData, goalAmount: rawValue });

    const goalAmountError = rawValue ? validateGoalAmount(rawValue) : "";
    setFormErrors({ ...formErrors, goalAmount: goalAmountError });
  };

  // Function to load legal entities
  const loadLegalEntities = async (search?: string) => {
    try {
      setLoadingLegalEntities(true);
      const entities = await fetchActiveLegalEntities(search);
      setLegalEntities(entities);
    } catch (error) {
      console.error("Error loading legal entities:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las organizaciones disponibles.",
        variant: "destructive",
      });
    } finally {
      setLoadingLegalEntities(false);
    }
  };

  // Add constants for sub-steps
  const STEP_1_SUB_STEPS = [
    {
      id: 1,
      title: "Nombre de la campaña",
      description:
        "Dale un nombre claro a tu campaña y agrega un subtítulo breve para transmitir rápidamente su esencia y objetivo.",
    },
    {
      id: 2,
      title: "Selecciona una categoría",
      description:
        "Categoriza una categoría y tu campaña va ser encontrada más fácilmente por los donadores potenciales.",
    },
    {
      id: 3,
      title: "Establece una meta de recaudación",
      description:
        "Define una meta realista en bolivianos que te ayude a alcanzar el objetivo de tu campaña.",
    },
    {
      id: 4,
      title: "Agrega fotos y videos que ilustren tu causa",
      description:
        "Imágenes poderosas que cuenten tu historia harán que tu campaña sea más personal y emotiva. Esto ayudará a inspirar y conectar con más personas que apoyen tu causa.",
    },
    {
      id: 5,
      title: "Señala la ubicación de tu campaña",
      description: "¿Dónde se desarrolla tu campaña? Agrega su ubicación.",
    },
    {
      id: 6,
      title: "Define el tiempo que durará tu campaña",
      description:
        "¿Hasta qué fecha deberá estar vigente tu campaña? Establece un tiempo de duración. Toma en cuenta que, una vez publicada tu campaña, no podrás modificar este plazo.",
    },
    {
      id: 7,
      title: "Ahora sí: ¡Cuenta tu historia!",
      description:
        "Inspira a los demás compartiendo el propósito de tu proyecto. Sé claro y directo para que tu causa conecte de manera profunda con quienes pueden hacer la diferencia.",
    },
  ];

  // Add sub-step navigation functions
  const nextSubStep = () => {
    if (currentSubStep < STEP_1_SUB_STEPS.length) {
      // Validate current sub-step before proceeding
      if (!validateCurrentSubStep()) {
        return;
      }

      setSubStepAnimationDirection("next");
      setIsSubStepAnimating(true);
      setTimeout(() => {
        setCurrentSubStep(currentSubStep + 1);
        setTimeout(() => {
          setIsSubStepAnimating(false);
        }, 50);
      }, 300);
    } else {
      // All sub-steps completed, proceed to step 2
      nextStep();
    }
  };

  const prevSubStep = () => {
    if (currentSubStep > 1) {
      setSubStepAnimationDirection("prev");
      setIsSubStepAnimating(true);
      setTimeout(() => {
        setCurrentSubStep(currentSubStep - 1);
        setTimeout(() => {
          setIsSubStepAnimating(false);
        }, 50);
      }, 300);
    }
  };

  // Add validation for current sub-step
  const validateCurrentSubStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentSubStep) {
      case 1: // Campaign Name
        if (!formData.title || formData.title.length < 3) {
          errors.title = "El título debe tener al menos 3 caracteres";
        }
        if (!formData.subtitle || formData.subtitle.length < 10) {
          errors.subtitle = "La descripción debe tener al menos 10 caracteres";
        }
        break;
      case 2: // Category
        if (!formData.category) {
          errors.category = "Debes seleccionar una categoría";
        }
        break;
      case 3: // Goal Amount
        {
          const goalAmountError = validateGoalAmount(formData.goalAmount);
          if (goalAmountError) {
            errors.goalAmount = goalAmountError;
          }
        }
        break;
      case 4: // Media
        if (mediaPreviewUrls.length === 0) {
          errors.media = "Debes subir al menos una imagen";
        }
        break;
      case 5: // Location
        if (!formData.location) {
          errors.location = "Debes seleccionar una ubicación";
        }
        break;
      case 6: // End Date
        if (!formData.endDate) {
          errors.endDate = "Debes seleccionar una fecha de finalización";
        }
        break;
      case 7: // Campaign description
        if (!formData.description || formData.description.length < 10) {
          errors.description =
            "La presentación de la campaña debe tener al menos 10 caracteres";
        } else if (formData.description.length > 600) {
          errors.description =
            "La presentación de la campaña no puede tener más de 600 caracteres";
        }
        break;
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Campos incompletos",
        description:
          "Por favor completa todos los campos requeridos antes de continuar.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const goalAmountNumber =
    Number(removeNumberSeparators(String(formData.goalAmount || ""))) || 0;
  const estimatedLocalFee = roundCurrency(
    goalAmountNumber * LOCAL_DONATION_FEE_RATE,
  );
  const estimatedInternationalFee = roundCurrency(
    goalAmountNumber * INTERNATIONAL_DONATION_FEE_RATE,
  );
  const estimatedLocalNet = roundCurrency(goalAmountNumber - estimatedLocalFee);
  const estimatedInternationalNet = roundCurrency(
    goalAmountNumber - estimatedInternationalFee,
  );

  // Add style block for transitions at the beginning of the component return statement
  return (
    <div className="campaign-form">
      {/* STEP #1 - Now with sub-steps */}
      {currentStep === 1 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-0">
          {/* Sub-step Content */}
          <div
            className={`sub-step flex items-center ${
              isSubStepAnimating
                ? subStepAnimationDirection === "next"
                  ? "fade-out-next"
                  : "fade-out-prev"
                : "fade-in-next"
            }`}
          >
            {/* Sub-step 1: Campaign Name */}
            {currentSubStep === 1 && (
              <div className="w-full py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[0].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[0].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <div className="space-y-6">
                      <div id="title">
                        <label className="block text-lg font-medium mb-2">
                          Nombre de la campaña
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ingresa el nombre de tu campaña"
                            className={`w-full rounded-lg border ${formErrors.title ? "error-input" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4`}
                            value={formData.title}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              });
                              if (e.target.value.length >= 3) {
                                setFormErrors({ ...formErrors, title: "" });
                              }
                            }}
                            maxLength={50}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <ImproveTextButton
                              text={formData.title}
                              fieldType="title"
                              onAccept={(improved) => {
                                setFormData({
                                  ...formData,
                                  title: improved.slice(0, 50),
                                });
                              }}
                            />
                            <span className="text-sm text-gray-500">
                              {formData.title.length}/50
                            </span>
                          </div>
                          {formErrors.title && (
                            <div className="error-text">{formErrors.title}</div>
                          )}
                        </div>
                      </div>

                      <div id="description">
                        <label className="block text-lg font-medium mb-2">
                          Subtítulo
                        </label>
                        <div className="relative">
                          <textarea
                            placeholder="Resume tu campaña en una frase breve"
                            rows={4}
                            className={`w-full rounded-lg border ${formErrors.subtitle ? "error-input" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 p-4`}
                            value={formData.subtitle}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                subtitle: e.target.value,
                              });
                              if (e.target.value.length >= 10) {
                                setFormErrors({
                                  ...formErrors,
                                  subtitle: "",
                                });
                              }
                            }}
                            maxLength={150}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <ImproveTextButton
                              text={formData.subtitle}
                              fieldType="subtitle"
                              onAccept={(improved) => {
                                setFormData({
                                  ...formData,
                                  subtitle: improved.slice(0, 150),
                                });
                              }}
                            />
                            <span className="text-sm text-gray-500">
                              {formData.subtitle.length}/150
                            </span>
                          </div>
                          {formErrors.subtitle && (
                            <div className="error-text">
                              {formErrors.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 2: Category */}
            {currentSubStep === 2 && (
              <div className="w-full py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[1].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[1].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <label
                      className="block text-lg font-medium mb-2"
                      id="category"
                    >
                      Categoría
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData({ ...formData, category: value });
                        if (value) {
                          setFormErrors({ ...formErrors, category: "" });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`ui-select-trigger w-full rounded-lg border ${formErrors.category ? "error-input" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4 text-base`}
                      >
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectGroup>
                          {CAMPAIGN_CATEGORIES.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <div className="error-text">{formErrors.category}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 3: Fundraising Goal */}
            {currentSubStep === 3 && (
              <div className="w-full py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[2].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[2].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <div className="space-y-4">
                      <label
                        className="block text-lg font-medium mb-2"
                        id="goalAmount"
                      >
                        Meta de recaudación en bolivianos
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                          Bs.-
                        </span>
                        <input
                          type="text"
                          placeholder="Ingresa el monto a recaudar en bolivianos"
                          className={`w-full rounded-lg border ${formErrors.goalAmount ? "error-input" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 pl-16 pr-4`}
                          inputMode="numeric"
                          value={formatNumberWithSeparators(
                            formData.goalAmount,
                          )}
                          onChange={handleGoalAmountChange}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Ingresa el monto en bolivianos. Máximo Bs. 1.000.000.
                      </p>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="space-y-2">
                            <p className="font-semibold">
                              Toma en cuenta la comisión antes de fijar tu meta.
                            </p>
                            <p>
                              Minka descuenta una <b>comisión</b> antes de transferir
                              los fondos al beneficiario: <b>5%</b> en donaciones
                              locales por QR y <b>11%</b> en donaciones internacionales
                              por tarjeta.
                            </p>
                          </div>
                        </div>
                      </div>
                      {formErrors.goalAmount && (
                        <div className="error-text">
                          {formErrors.goalAmount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 4: Media Upload */}
            {currentSubStep === 4 && (
              <div className="w-full py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[3].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[3].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <div className="space-y-6" id="media">
                      <div
                        className={`border-2 border-dashed ${
                          formErrors.media
                            ? "border-red-500"
                            : isDraggingImage
                              ? "border-[#2c6e49] bg-[#f0f8f4]"
                              : "border-gray-400 bg-white"
                        } rounded-lg p-10 text-center transition-colors`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
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
                            Sólo archivos JPEG o PNG. Máximo 2 MB por imagen y{" "}
                            {CAMPAIGN_IMAGE_MAX_COUNT} imágenes en total.
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                          <Button
                            variant="outline"
                            className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] hover:text-white border-0 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <div className="flex items-center gap-2">
                                <InlineSpinner className="text-white" />
                                <span>Subiendo...</span>
                              </div>
                            ) : (
                              "Seleccionar"
                            )}
                          </Button>
                        </div>
                      </div>
                      {formErrors.media && (
                        <div className="error-text">{formErrors.media}</div>
                      )}

                      {/* Show upload progress */}
                      {uploadingFile && (
                        <UploadProgress
                          progress={progress}
                          fileName={uploadingFile.name}
                        />
                      )}

                      {/* Preview uploaded images */}
                      {mediaPreviewUrls.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-3">
                            Imágenes cargadas
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {mediaPreviewUrls.map((url, index) => (
                              <div
                                key={index}
                                className={`relative rounded-lg overflow-hidden border ${index === 0 ? "border-[#2c6e49] ring-2 ring-[#2c6e49]" : "border-gray-200"}`}
                              >
                                <Image
                                  src={url}
                                  alt={`Media ${index + 1}`}
                                  width={200}
                                  height={150}
                                  className="w-full h-32 object-cover"
                                />
                                {index === 0 && (
                                  <div className="absolute top-2 left-2 bg-[#2c6e49] text-white text-xs px-2 py-1 rounded-full">
                                    Imagen principal
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button
                                    className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                                    className="bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeMedia(index);
                                    }}
                                  >
                                    <X size={16} className="text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center my-6">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <div className="px-4 text-gray-500">O</div>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>

                      {/* YouTubeLinks Component */}
                      <YouTubeLinks
                        links={formData.youtubeUrls || []}
                        onChange={handleYouTubeLinksChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 5: Location */}
            {currentSubStep === 5 && (
              <div className="w-full py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[4].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[4].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    {/* Department Selector */}
                    <label className="block text-lg font-medium mb-2">
                      Departamento
                    </label>
                    <div className="relative mb-4">
                      <Select
                        value={formData.location}
                        onValueChange={(value) =>
                          setFormData({ ...formData, location: value as any })
                        }
                      >
                        <SelectTrigger className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4">
                          <div className="flex items-center w-full">
                            <MapPin className="h-5 w-5 mr-2 text-gray-400 shrink-0" />
                            <SelectValue
                              placeholder="Selecciona un departamento"
                              className="text-sm md:text-base"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectGroup>
                            <SelectItem
                              value="la_paz"
                              className="text-sm md:text-base py-2"
                            >
                              La Paz
                            </SelectItem>
                            <SelectItem
                              value="santa_cruz"
                              className="text-sm md:text-base py-2"
                            >
                              Santa Cruz
                            </SelectItem>
                            <SelectItem
                              value="cochabamba"
                              className="text-sm md:text-base py-2"
                            >
                              Cochabamba
                            </SelectItem>
                            <SelectItem
                              value="sucre"
                              className="text-sm md:text-base py-2"
                            >
                              Sucre
                            </SelectItem>
                            <SelectItem
                              value="oruro"
                              className="text-sm md:text-base py-2"
                            >
                              Oruro
                            </SelectItem>
                            <SelectItem
                              value="potosi"
                              className="text-sm md:text-base py-2"
                            >
                              Potosí
                            </SelectItem>
                            <SelectItem
                              value="tarija"
                              className="text-sm md:text-base py-2"
                            >
                              Tarija
                            </SelectItem>
                            <SelectItem
                              value="beni"
                              className="text-sm md:text-base py-2"
                            >
                              Beni
                            </SelectItem>
                            <SelectItem
                              value="pando"
                              className="text-sm md:text-base py-2"
                            >
                              Pando
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Province Selector */}
                    <label className="block text-lg font-medium mb-2">
                      Provincia (opcional)
                    </label>
                    <div className="relative">
                      <Select
                        value={formData.province || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            province: value || undefined,
                          })
                        }
                      >
                        <SelectTrigger className="w-full rounded-lg border border-black bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 h-14 px-4">
                          <div className="flex items-center w-full">
                            <MapPin className="h-5 w-5 mr-2 text-gray-400 shrink-0" />
                            <SelectValue
                              placeholder={
                                availableProvinces.length > 0
                                  ? "Selecciona una provincia"
                                  : "Primero selecciona un departamento"
                              }
                              className="text-sm md:text-base"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectGroup>
                            {availableProvinces.map((province) => (
                              <SelectItem
                                key={province.value}
                                value={province.value}
                                className="text-sm md:text-base py-2"
                              >
                                {province.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Image
                        src="/views/create-campaign/Form/Base/info.svg"
                        alt="Info"
                        width={16}
                        height={16}
                      />
                      <span className="text-base text-gray-600">
                        Departamento es requerido, provincia es opcional
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 6: Duration */}
            {currentSubStep === 6 && (
              <div className="w-full py-6 md:py-12" id="endDate">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[5].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[5].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <label className="block text-lg font-medium mb-2">
                      Fecha de finalización
                    </label>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="DD/MM/AAAA"
                              className={`w-full rounded-lg border ${formErrors.endDate ? "error-input" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 pl-10 h-14 px-4 cursor-pointer`}
                              value={formData.endDate ? formData.endDate : ""}
                              readOnly
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={
                              formData.endDate
                                ? new Date(formData.endDate + "T12:00:00")
                                : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                // Fix timezone: set to noon UTC to avoid day shifting
                                const fixedDate = new Date(date);
                                fixedDate.setUTCHours(12, 0, 0, 0);
                                const formattedDate = format(
                                  fixedDate,
                                  "yyyy-MM-dd",
                                );
                                setFormData({
                                  ...formData,
                                  endDate: formattedDate,
                                });
                                setFormErrors({ ...formErrors, endDate: "" });
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {formErrors.endDate && (
                        <div className="error-text">{formErrors.endDate}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step 7: Campaign description */}
            {currentSubStep === 7 && (
              <div className="w-full py-6 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <div className="pt-0 md:pt-4">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">
                      {STEP_1_SUB_STEPS[6].title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                      {STEP_1_SUB_STEPS[6].description}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-black p-6 md:p-8">
                    <CampaignDescriptionInput
                      initialValue={formData.description}
                      onUpdate={(val) => {
                        setFormData({ ...formData, description: val });
                        if (val.length >= 10 && val.length <= 600) {
                          setFormErrors({ ...formErrors, description: "" });
                        }
                      }}
                      error={formErrors.description}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="py-6 md:py-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full bg-white text-[#2c6e49] border-[#2c6e49] hover:bg-[#f0f7f1] px-8"
                onClick={prevSubStep}
                disabled={currentSubStep === 1 || isSubStepAnimating}
              >
                Anterior
              </Button>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {currentSubStep === STEP_1_SUB_STEPS.length && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full bg-white text-[#2c6e49] border-[#2c6e49] hover:bg-[#f0f7f1] px-8"
                    onClick={async () => {
                      try {
                        setIsSubmitting(true);
                        // Validate form and save as draft
                        if (!validateForm()) {
                          // Show alert for validation errors
                          alert(
                            "Por favor completa todos los campos requeridos antes de guardar.",
                          );
                          return;
                        }

                        // Process media if not already done
                        const mediaUrls = await ensureMediaIsUploaded();
                        if (!mediaUrls) {
                          return;
                        }

                        // Prepare data for API
                        const apiData = {
                          ...formData,
                          // Convert goalAmount to number by removing separators
                          goalAmount: removeNumberSeparators(
                            String(formData.goalAmount),
                          ),
                          media: mediaUrls.map((url, index) => ({
                            mediaUrl: url,
                            type: "image" as const,
                            isPrimary: index === 0,
                            orderIndex: index,
                          })),
                          youtubeUrls: formData.youtubeUrls || [],
                        };

                        // Save as draft and go to next step
                        const success = await saveCampaignDraft(apiData);
                        if (success) {
                          setCurrentStep(2);
                          setCurrentSubStep(1);
                          window.scrollTo(0, 0);
                        }
                      } catch (error) {
                        console.error("Error saving draft:", error);
                        toast({
                          title: "Error",
                          description: "Error al guardar el borrador",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <InlineSpinner className="text-[#2c6e49]" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      "Guardar como borrador"
                    )}
                  </Button>
                )}

                <Button
                  className="w-full sm:w-auto rounded-full bg-[#2c6e49] hover:bg-[#1e4d33] px-8"
                  onClick={nextSubStep}
                  disabled={isSubStepAnimating || isSubmitting}
                >
                  {currentSubStep === STEP_1_SUB_STEPS.length ? (
                    isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <InlineSpinner className="text-white" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      "Continuar"
                    )
                  ) : (
                    "Siguiente"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP #2 */}
      {currentStep === 2 && (
        <div
          className={`form-step ${isAnimating ? (animationDirection === "next" ? "fade-out" : "fade-in") : ""} max-w-6xl mx-auto space-y-24`}
        >
          {/* Full-width header for "Destino de los fondos" */}
          <div className="w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] h-[100px] md:h-[200px] lg:h-[300px]">
            <Image
              src="/page-header.svg"
              alt="Page Header"
              fill
              className="object-cover object-bottom"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-bold text-white">
                Destino de los fondos
              </h1>
            </div>
          </div>

          {/* Recipient section */}
          <div className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="pt-4">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Cuéntanos quién recibirá lo recaudado
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Selecciona la persona o entidad encargada de recibir los
                  fondos de tu campaña. Esto garantiza que el apoyo llegue a
                  quien más lo necesita.
                </p>
                {/* Display loading state here if submitting */}
                {isSubmitting && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-2">
                    <InlineSpinner className="!h-8 !w-8 text-green-800" />
                    <span className="text-2xl font-semibold text-green-800">
                      Creando tu campaña...
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label
                  className="block p-6 border-2 border-black rounded-lg hover:border-[#2c6e49] cursor-pointer bg-white"
                  onClick={() => handleSelectRecipient("tu_mismo")}
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/views/create-campaign/yourself.svg"
                      alt="Tú mismo/a"
                      width={75}
                      height={75}
                    />
                    <div>
                      <div className="font-medium text-lg">Tú mismo</div>
                      <div className="text-base text-gray-600">
                        Recibes los fondos recaudados en tu campaña directamente
                        en tu cuenta bancaria.
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className="block p-6 border-2 border-black rounded-lg hover:border-[#2c6e49] cursor-pointer bg-white"
                  onClick={handleSelectOtraPersona}
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/views/create-campaign/other-person.svg"
                      alt="Otra persona o institución"
                      width={75}
                      height={75}
                    />
                    <div>
                      <div className="font-medium text-lg">
                        Otra persona o una institución/fundación
                      </div>
                      <div className="text-base text-gray-600">
                        Para apoyar a alguien que no puede crear su campaña, o
                        a una institución o fundación que aún no está en la base
                        de Minka.
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className="block p-6 border-2 border-black rounded-lg hover:border-[#2c6e49] cursor-pointer bg-white"
                  onClick={handleSelectPersonaJuridica}
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src="/views/create-campaign/organization.svg"
                      alt="Persona Jurídica"
                      width={75}
                      height={75}
                    />
                    <div>
                      <div className="font-medium text-lg">
                        Persona Jurídica
                      </div>
                      <div className="text-base text-gray-600">
                        Designa a la persona jurídica que recibirá los fondos
                        recaudados.
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Just show a back button */}
          <div className="flex justify-start mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Volver al paso anterior
            </Button>
          </div>
        </div>
      )}

      {/* STEP #3 */}
      {currentStep === 3 && (
        <div
          className={`form-step ${isAnimating ? (animationDirection === "prev" ? "fade-out" : "fade-in") : ""} max-w-6xl mx-auto space-y-24`}
        >
          {/* Preview Section - Full Width */}
          <div className="bg-[#478C5C] w-screen relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] pt-8">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-start justify-between gap-12 relative">
                <div className="max-w-xl py-8">
                  <h2 className="text-[42px] font-bold text-white">
                    ¡Ya está todo listo!
                  </h2>
                  <h2 className="text-[42px] font-bold text-white mb-4">
                    Revisa cómo quedó
                  </h2>
                  <p className="text-lg text-white/90 mb-6">
                    Antes de publicar tu campaña, verifica que todo esté
                    correcto. Puedes ver cómo lucirá en Minka.
                  </p>
                  <Button
                    variant="outline"
                    className="bg-white text-[#478C5C] border-white hover:bg-white/90 flex items-center gap-2 px-8 py-2 rounded-full"
                    onClick={() => setShowPreview(true)}
                  >
                    <span>Vista previa</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
                        stroke="#478C5C"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
                        stroke="#478C5C"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="flex-1 flex justify-end items-end">
                  <Image
                    src="/views/create-campaign/all-ready.svg"
                    alt="Campaign Preview"
                    width={502}
                    height={350}
                    className="w-full max-w-[502px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Section */}
          <div className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-start justify-between gap-16">
                <div className="max-w-md">
                  <h2 className="text-4xl font-bold mb-4">
                    Verifica tu campaña
                  </h2>
                  <p className="text-lg text-gray-600">
                    La verificación asegura la transparencia de tu campaña, te
                    ayuda a generar confianza en los donantes y a destacar.{" "}
                    <span className="font-bold">
                      ¡Te recomendamos no saltarte este paso!
                    </span>
                  </p>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-xl border border-black p-8">
                    <div className="flex justify-center mb-4">
                      <Image
                        src="/views/create-campaign/verified.svg"
                        alt="Verificación"
                        width={64}
                        height={64}
                      />
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-center">
                      Mejora tu campaña
                    </h3>
                    <p className="text-gray-600 mb-6 text-center">
                      Puedes verificar tu campaña para destacarla y generar
                      confianza, o publicarla directamente mientras el equipo de
                      Minka la revisa.
                    </p>
                      <p className="text-gray-600 mb-6 text-center ">
                      <span className="font-semibold"> No olvides: </span>
                      revisar nuestras Preguntas Frecuentes con consejos para mejorar tu campaña, aumentar la visibilidad, conocer sobre la comisión de Minka, etc.
                      </p>
                    <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                      Al publicar, tu campaña quedará visible de inmediato y el
                      equipo de Minka la revisará para confirmar que todo esté
                      en orden.
                    </div>
                    <div className="w-full h-px bg-gray-200 my-6"></div>
                    <div className="space-y-3">
                      <Button
                        onClick={handleRequestVerification}
                        className="w-full bg-[#478C5C] hover:bg-[#3a7049] text-white rounded-full py-4 flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                      >
                        <span>Solicitar verificación</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14 5L21 12M21 12L14 19M21 12H3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Button>
                      <Button
                        onClick={handlePublish}
                        className="w-full border border-[#478C5C] text-[#478C5C] hover:bg-[#f0f7f1] rounded-full py-4"
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        Publicar sin verificar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {/* Campaign Preview Modal - Only show when showPreview is true */}
      {showPreview && (
        <CampaignPreview
          campaign={formData}
          onClose={() => setShowPreview(false)}
          uploadedUrls={uploadedUrls}
        />
      )}

      {/* Image editor modal */}
      {imageToEdit && (
        <ImageEditor
          key={imageToEdit}
          imageUrl={imageToEdit}
          onSave={handleSaveEditedImage}
          onCancel={handleCancelImageEdit}
          isLoading={isUploading}
        />
      )}

      {/* Otra Persona Modal */}
      <Dialog
        open={showOtraPersonaModal}
        onOpenChange={setShowOtraPersonaModal}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Información del beneficiario</DialogTitle>
            <DialogDescription>
              Indica si la campaña será para una persona o para una institución
              o fundación que no está en la lista de Minka.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  otraPersonaForm.beneficiaryType === "person"
                    ? "border-[#2c6e49] bg-[#edf6ef]"
                    : "border-gray-200 bg-white hover:border-[#2c6e49]/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="beneficiaryType"
                    value="person"
                    checked={otraPersonaForm.beneficiaryType === "person"}
                    onChange={() =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        beneficiaryType: "person",
                        beneficiaryName: "",
                        relationship: "",
                        beneficiariesDescription: "",
                        institutionNit: "",
                        institutionEmail: "",
                        institutionWebsite: "",
                        institutionPhone: "",
                      })
                    }
                    className="mt-1 accent-[#2c6e49]"
                  />
                  <span>
                    <span className="block font-semibold text-gray-900">
                      Persona
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      Alguien que necesita apoyo y no puede gestionar su propia
                      campaña.
                    </span>
                  </span>
                </div>
              </label>

              <label
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  otraPersonaForm.beneficiaryType === "institution"
                    ? "border-[#2c6e49] bg-[#edf6ef]"
                    : "border-gray-200 bg-white hover:border-[#2c6e49]/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="beneficiaryType"
                    value="institution"
                    checked={otraPersonaForm.beneficiaryType === "institution"}
                    onChange={() =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        beneficiaryType: "institution",
                        beneficiaryName: "",
                        relationship: "",
                        beneficiariesDescription: "",
                        institutionNit: "",
                        institutionEmail: "",
                        institutionWebsite: "",
                        institutionPhone: "",
                      })
                    }
                    className="mt-1 accent-[#2c6e49]"
                  />
                  <span>
                    <span className="block font-semibold text-gray-900">
                      Institución o fundación
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      Una organización que recibirá el apoyo pero aún no está
                      registrada como persona jurídica aprobada por Minka.
                    </span>
                  </span>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {otraPersonaForm.beneficiaryType === "institution"
                  ? "Nombre de la institución o fundación *"
                  : "Nombre de la persona *"}
              </label>
              <Input
                type="text"
                className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                placeholder={
                  otraPersonaForm.beneficiaryType === "institution"
                    ? "Nombre de la institución o fundación"
                    : "Nombre completo del beneficiario"
                }
                value={otraPersonaForm.beneficiaryName}
                onChange={(e) =>
                  setOtraPersonaForm({
                    ...otraPersonaForm,
                    beneficiaryName: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {otraPersonaForm.beneficiaryType === "institution"
                  ? "¿Cuál es tu relación con la institución? *"
                  : "¿Cuál es tu relación con esta persona? *"}
              </label>
              {otraPersonaForm.beneficiaryType === "institution" ? (
                <Input
                  type="text"
                  className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                  placeholder="Ej. voluntario, miembro, fundador, colaborador"
                  value={otraPersonaForm.relationship}
                  onChange={(e) =>
                    setOtraPersonaForm({
                      ...otraPersonaForm,
                      relationship: e.target.value,
                    })
                  }
                />
              ) : (
                <select
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:border-[#478C5C] focus:ring-[#478C5C] focus:outline-none"
                  value={otraPersonaForm.relationship}
                  onChange={(e) =>
                    setOtraPersonaForm({
                      ...otraPersonaForm,
                      relationship: e.target.value,
                    })
                  }
                >
                  <option value="">Selecciona una opción</option>
                  <option value="familiar">Familiar</option>
                  <option value="amigo">Amigo/a</option>
                  <option value="conocido">Conocido/a</option>
                  <option value="vecino">Vecino/a</option>
                  <option value="colega">Colega de trabajo</option>
                  <option value="otro">Otro</option>
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {otraPersonaForm.beneficiaryType === "institution"
                  ? "Frase breve sobre la institución"
                  : "Cuéntanos brevemente sobre el beneficiario *"}
              </label>
              <Textarea
                className="w-full min-h-[80px] border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                placeholder={
                  otraPersonaForm.beneficiaryType === "institution"
                    ? "Ej. Una veterinaria nueva que está en El Alto"
                    : "Describe brevemente quién es la persona beneficiaria, su situación y por qué estás organizando la campaña por ella."
                }
                value={otraPersonaForm.beneficiariesDescription}
                onChange={(e) =>
                  setOtraPersonaForm({
                    ...otraPersonaForm,
                    beneficiariesDescription: e.target.value,
                  })
                }
                maxLength={
                  otraPersonaForm.beneficiaryType === "institution" ? 120 : 500
                }
              />
              <div className="text-xs text-gray-500 text-right">
                {otraPersonaForm.beneficiariesDescription.length}/
                {otraPersonaForm.beneficiaryType === "institution" ? 120 : 500}
              </div>
            </div>

            {otraPersonaForm.beneficiaryType === "institution" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    NIT
                  </label>
                  <Input
                    type="text"
                    className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                    placeholder="Opcional"
                    value={otraPersonaForm.institutionNit}
                    onChange={(e) =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        institutionNit: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Correo de contacto
                  </label>
                  <Input
                    type="email"
                    className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                    placeholder="Opcional"
                    value={otraPersonaForm.institutionEmail}
                    onChange={(e) =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        institutionEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sitio web
                  </label>
                  <Input
                    type="url"
                    className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                    placeholder="https://..."
                    value={otraPersonaForm.institutionWebsite}
                    onChange={(e) =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        institutionWebsite: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Teléfono de contacto
                  </label>
                  <Input
                    type="tel"
                    className="w-full h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                    placeholder="Opcional"
                    value={otraPersonaForm.institutionPhone}
                    onChange={(e) =>
                      setOtraPersonaForm({
                        ...otraPersonaForm,
                        institutionPhone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={closeOtraPersonaModal}
              className="flex-1 rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleOtraPersonaSubmit}
              className="flex-1 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full"
              disabled={
                !otraPersonaForm.beneficiaryName ||
                !otraPersonaForm.relationship
              }
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Persona Jurídica Modal */}
      <Dialog
        open={showPersonaJuridicaModal}
        onOpenChange={setShowPersonaJuridicaModal}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Persona Jurídica</DialogTitle>
            <DialogDescription>
              Selecciona la organización que recibirá los fondos recaudados en
              tu campaña
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="rounded-md border border-[#478C5C]/20 bg-[#478C5C]/5 px-4 py-3 text-sm text-gray-700">
              Si quieres sugerir tu empresa, asociación o agrupación, ponte en
              contacto con nosotros para solicitarlo enviando los documentos
              respectivos.
            </p>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Buscar organización
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  className="w-full pl-10 h-11 border-gray-300 focus:border-[#478C5C] focus:ring-[#478C5C]"
                  placeholder="Buscar por nombre, NIT, ciudad..."
                  value={legalEntitiesSearch}
                  onChange={(e) => {
                    setLegalEntitiesSearch(e.target.value);
                    // Debounce search
                    clearTimeout((window as any).searchTimeout);
                    (window as any).searchTimeout = setTimeout(() => {
                      loadLegalEntities(e.target.value);
                    }, 300);
                  }}
                />
              </div>
            </div>

            {/* Legal Entities Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Organizaciones disponibles *
              </label>

              {loadingLegalEntities ? (
                <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <InlineSpinner className="mx-auto mb-3 text-[#478C5C]" />
                    <p className="text-sm text-gray-600">
                      Cargando organizaciones...
                    </p>
                  </div>
                </div>
              ) : legalEntities.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    No se encontraron organizaciones
                  </p>
                  <p className="text-sm text-gray-500">
                    {legalEntitiesSearch
                      ? "Intenta con otros términos de búsqueda"
                      : "No hay organizaciones registradas en el sistema"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
                  {legalEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                        personaJuridicaForm.selectedEntityId === entity.id
                          ? "bg-[#f0f7f1] border-l-4 border-l-[#478C5C]"
                          : ""
                      }`}
                      onClick={() =>
                        setPersonaJuridicaForm({
                          ...personaJuridicaForm,
                          selectedEntityId: entity.id,
                          entityName: entity.name,
                        })
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {entity.name}
                            </h4>
                            {personaJuridicaForm.selectedEntityId ===
                              entity.id && (
                              <div className="bg-[#478C5C] text-white text-xs px-2 py-1 rounded-full">
                                Seleccionado
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                            {entity.taxId && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">NIT:</span>
                                <span>{entity.taxId}</span>
                              </div>
                            )}
                            {entity.legalForm && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  Forma legal:
                                </span>
                                <span>{entity.legalForm}</span>
                              </div>
                            )}
                            {entity.city && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Ciudad:</span>
                                <span>{entity.city}</span>
                              </div>
                            )}
                            {entity.department && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  Departamento:
                                </span>
                                <span className="capitalize">
                                  {entity.department.replace("_", " ")}
                                </span>
                              </div>
                            )}
                            {entity.email && (
                              <div className="flex items-center gap-1 md:col-span-2">
                                <span className="font-medium">Email:</span>
                                <span>{entity.email}</span>
                              </div>
                            )}
                          </div>

                          {entity.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {entity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Entity Summary */}
            {personaJuridicaForm.selectedEntityId && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                {(() => {
                  const selectedEntity = legalEntities.find(
                    (e) => e.id === personaJuridicaForm.selectedEntityId,
                  );
                  return selectedEntity ? (
                    <div>
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organización seleccionada
                      </h5>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">
                          {selectedEntity.name}
                        </p>
                        {selectedEntity.taxId && (
                          <p className="text-gray-700">
                            NIT: {selectedEntity.taxId}
                          </p>
                        )}
                        {selectedEntity.city && selectedEntity.department && (
                          <p className="text-gray-700">
                            {selectedEntity.city},{" "}
                            {selectedEntity.department.replace("_", " ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={closePersonaJuridicaModal}
              className="flex-1 rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePersonaJuridicaSubmit}
              className="flex-1 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full"
              disabled={!personaJuridicaForm.selectedEntityId}
            >
              Continuar con esta organización
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
