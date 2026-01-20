import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

// Define the types for campaign form data
export interface CampaignFormData {
  title: string;
  description: string;
  category: string;
  goalAmount: string | number;
  location:
    | "la_paz"
    | "santa_cruz"
    | "cochabamba"
    | "sucre"
    | "oruro"
    | "potosi"
    | "tarija"
    | "beni"
    | "pando";
  province?: string; // Optional province field
  endDate: string;
  // Story field corresponds to "Presentación de la campaña" in the form
  story: string;
  mediaFiles?: File[];
  youtubeUrl?: string;
  youtubeUrls?: string[];
  recipient?: string;
  beneficiariesDescription?: string;
  legalEntityId?: string; // Optional legal entity ID field
  campaignStatus?: "draft" | "active" | "completed" | "cancelled";
  verificationStatus?: boolean;
  media?: Array<{
    mediaUrl: string;
    type: "image" | "video";
    isPrimary: boolean;
    orderIndex: number;
  }>;
}

// Define types for the create campaign response
interface CreateCampaignResponse {
  message: string;
  campaignId: string;
}

// Define types for the campaign draft response
interface DraftCampaignResponse {
  message: string;
  campaignId: string;
}

// Define types for campaign updates
export interface CampaignUpdate {
  id: string;
  title: string;
  message: string;
  youtubeUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

// Define types for campaign comments
export interface CampaignComment {
  id: string;
  content: string;
  message?: string;
  createdAt: string;
  donation_amount?: number;
  profile: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  replies?: Array<{
    id: string;
    text: string;
    created_at: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

// Define types for campaign donations
export interface CampaignDonation {
  id: string;
  amount: number;
  tip_amount?: number;
  total_amount?: number;
  currency: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
  status?: string;
  donor: {
    id: string | null;
    name: string;
    profilePicture?: string;
    email?: string;
  };
}

export function useCampaign() {
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [isPublishingUpdate, setIsPublishingUpdate] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const [isUpdatingDonation, setIsUpdatingDonation] = useState(false);
  const [isReplyingToComment, setIsReplyingToComment] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to create a new campaign (kept for backwards compatibility)
  const createCampaign = async (
    formData: CampaignFormData
  ): Promise<string | null> => {
    setIsCreating(true);

    try {
      // Format the data according to API requirements
      const payload = {
        title: formData.title,
        description: formData.description,
        story: formData.story,
        beneficiariesDescription:
          formData.beneficiariesDescription || formData.story,
        category: formData.category,
        goalAmount: Number(formData.goalAmount),
        location: formData.location,
        province: formData.province,
        endDate: formData.endDate,
        youtubeUrl: formData.youtubeUrl || "",
        youtubeUrls: formData.youtubeUrls || [], // Include all YouTube links
        // Use provided media array if available, otherwise use default
        media: formData.media || [
          {
            mediaUrl: "https://example.com/placeholder-image.jpg",
            type: "image" as const,
            isPrimary: true,
            orderIndex: 0,
          },
        ],
      };

      const response = await fetch("/api/campaign/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      const data: CreateCampaignResponse = await response.json();
      setCampaignId(data.campaignId);
      toast({
        title: "¡Éxito!",
        description: "¡Campaña creada exitosamente!",
      });
      return data.campaignId;
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al crear la campaña",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Function to save a campaign draft
  const saveCampaignDraft = async (
    formData: CampaignFormData
  ): Promise<string | null> => {
    setIsSavingDraft(true);

    try {
      // Perform validation checks
      if (!formData.title || !formData.description || !formData.category) {
        console.error("Missing required fields in campaign draft data");
        throw new Error("Faltan campos requeridos en el formulario");
      }

      if (!formData.media || formData.media.length === 0) {
        console.error("No media provided for campaign draft");
        throw new Error("Debes subir al menos una imagen");
      }

      // Format the data according to API requirements
      const payload: any = {
        title: formData.title,
        description: formData.description,
        story: formData.story,
        beneficiariesDescription:
          formData.beneficiariesDescription || formData.story,
        category: formData.category,
        goalAmount: formData.goalAmount
          ? Number(formData.goalAmount)
          : undefined,
        location: formData.location,
        province: formData.province,
        endDate: formData.endDate,
        youtubeUrl: formData.youtubeUrl || "",
        youtubeUrls: formData.youtubeUrls || [], // Include all YouTube links
        // Use provided media array if available
        media: formData.media,
      };

      // Only add campaignId to payload if it exists
      if (campaignId) {
        payload.campaignId = campaignId;
      }

      console.log("Sending draft payload:", {
        hasMedia: !!payload.media,
        mediaCount: payload.media?.length || 0,
        hasId: !!payload.campaignId,
      });

      const response = await fetch("/api/campaign/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to save campaign draft");
      }

      const data: DraftCampaignResponse = await response.json();
      setCampaignId(data.campaignId);
      toast({
        title: "Borrador guardado",
        description: "Borrador guardado correctamente",
      });
      return data.campaignId;
    } catch (error) {
      console.error("Error saving campaign draft:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al guardar el borrador",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Helper method to update a campaign
  const updateCampaign = async (
    campaignData: Partial<CampaignFormData>,
    targetCampaignId: string = campaignId || ""
  ): Promise<boolean> => {
    if (!targetCampaignId) {
      toast({
        title: "Error",
        description: "No se encontró ID de campaña para actualizar",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(`/api/campaign/${targetCampaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update campaign");
      }

      toast({
        title: "Actualizado",
        description: "Campaña actualizada correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la campaña",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add a method to update just the campaign story field
  const updateCampaignStory = async (
    story: string,
    targetCampaignId: string = campaignId || ""
  ): Promise<boolean> => {
    if (!targetCampaignId) {
      toast({
        title: "Error",
        description: "No se encontró ID de campaña para actualizar",
        variant: "destructive",
      });
      return false;
    }

    try {
      const response = await fetch(`/api/campaign/${targetCampaignId}/story`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ story }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update campaign story");
      }

      toast({
        title: "Éxito",
        description: "Presentación de la campaña actualizada correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error updating campaign story:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la presentación de la campaña",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to get campaign updates
  const getCampaignUpdates = async (
    targetCampaignId: string
  ): Promise<CampaignUpdate[] | null> => {
    setIsLoadingUpdates(true);

    try {
      const response = await fetch(`/api/campaign/${targetCampaignId}/updates`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch campaign updates");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching campaign updates:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al cargar los anuncios de la campaña",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  // Function to publish a campaign update
  const publishCampaignUpdate = async (
    targetCampaignId: string,
    updateData: {
      title: string;
      message: string;
      youtubeUrl?: string;
      imageUrl?: string;
    }
  ): Promise<boolean> => {
    setIsPublishingUpdate(true);

    try {
      if (!updateData.title || !updateData.message) {
        throw new Error("El título y mensaje son requeridos");
      }

      const response = await fetch(
        `/api/campaign/${targetCampaignId}/updates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish campaign update");
      }

      toast({
        title: "Anuncio publicado",
        description: "Tu anuncio ha sido publicado correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error publishing campaign update:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al publicar el anuncio",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  // Function to delete a campaign update
  const deleteCampaignUpdate = async (
    targetCampaignId: string,
    updateId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/updates?updateId=${updateId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete campaign update");
      }

      toast({
        title: "Anuncio eliminado",
        description: "El anuncio ha sido eliminado correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error deleting campaign update:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar el anuncio",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to get campaign comments
  const getCampaignComments = async (
    targetCampaignId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    comments: CampaignComment[];
    total: number;
    hasMore: boolean;
  } | null> => {
    setIsLoadingComments(true);

    try {
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/comments?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch campaign comments");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching campaign comments:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al cargar los comentarios de la campaña",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Function to post a campaign comment
  const postCampaignComment = async (
    targetCampaignId: string,
    content: string
  ): Promise<CampaignComment | null> => {
    setIsPostingComment(true);

    try {
      if (!content.trim()) {
        throw new Error("El comentario no puede estar vacío");
      }

      const response = await fetch(
        `/api/campaign/${targetCampaignId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post comment");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error posting campaign comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al publicar el comentario",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsPostingComment(false);
    }
  };

  // Function to delete a campaign comment
  const deleteCampaignComment = async (
    targetCampaignId: string,
    commentId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/comments?commentId=${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete comment");
      }

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error deleting campaign comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar el comentario",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to get campaign donations
  const getCampaignDonations = async (
    targetCampaignId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    donations: CampaignDonation[];
    total: number;
    totalAmount: number;
    hasMore: boolean;
    isOwner: boolean;
  } | null> => {
    setIsLoadingDonations(true);

    try {
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/donations?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch campaign donations"
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching campaign donations:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al cargar las donaciones de la campaña",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingDonations(false);
    }
  };

  // Function to update donation status (for campaign owners/admins)
  const updateDonationStatus = async (
    targetCampaignId: string,
    donationId: string,
    status: "pending" | "active" | "rejected"
  ): Promise<boolean> => {
    setIsUpdatingDonation(true);

    try {
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/donations`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ donationId, status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update donation status");
      }

      toast({
        title: "Estado actualizado",
        description:
          "El estado de la donación ha sido actualizado correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error updating donation status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar el estado de la donación",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdatingDonation(false);
    }
  };

  // Function to reply to a campaign comment
  const replyToComment = async (
    targetCampaignId: string,
    commentId: string,
    content: string
  ): Promise<boolean> => {
    setIsReplyingToComment(true);

    try {
      if (!content.trim()) {
        throw new Error("La respuesta no puede estar vacía");
      }

      // Using the regular comments endpoint with a special format for replies
      // until a specific reply endpoint is implemented
      const response = await fetch(
        `/api/campaign/${targetCampaignId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            parentCommentId: commentId, // Add parent comment ID to indicate this is a reply
            isReply: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to post reply");
      }

      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido publicada correctamente",
      });
      return true;
    } catch (error) {
      console.error("Error posting reply to comment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al publicar la respuesta",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsReplyingToComment(false);
    }
  };

  return {
    isCreating,
    isSavingDraft,
    isLoadingUpdates,
    isPublishingUpdate,
    isLoadingComments,
    isPostingComment,
    isLoadingDonations,
    isUpdatingDonation,
    isReplyingToComment,
    campaignId,
    createCampaign,
    saveCampaignDraft,
    updateCampaign,
    updateCampaignStory,
    getCampaignUpdates,
    publishCampaignUpdate,
    deleteCampaignUpdate,
    getCampaignComments,
    postCampaignComment,
    deleteCampaignComment,
    getCampaignDonations,
    updateDonationStatus,
    replyToComment,
  };
}
