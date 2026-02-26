import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/components/ui/use-toast";
import {
  SAVED_CAMPAIGN_IDS_CACHE_KEY,
  SAVED_CAMPAIGNS_UPDATED_EVENT,
} from "@/constants/saved-campaign";

type SavedCampaign = {
  id: string;
  savedId: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  location: string;
  createdAt: string;
};

export function useSavedCampaigns() {
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session, isLoading: authLoading } = useAuth();

  const notifySavedCampaignsUpdated = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(SAVED_CAMPAIGNS_UPDATED_EVENT));
  };

  const updateSavedIdsCache = (campaigns: SavedCampaign[]) => {
    if (typeof window === "undefined") return;
    const ids = campaigns.map((campaign) => campaign.id);
    localStorage.setItem(
      SAVED_CAMPAIGN_IDS_CACHE_KEY,
      JSON.stringify(ids)
    );
  };

  // Function to fetch saved campaigns
  const fetchSavedCampaigns = useCallback(async () => {
    if (authLoading) {
      // Still loading auth state, don't fetch yet
      return;
    }

    if (!session) {
      setSavedCampaigns([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem(SAVED_CAMPAIGN_IDS_CACHE_KEY);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching saved campaigns for session:", !!session);

      const response = await fetch("/api/saved-campaign", {
        credentials: "include", // Important to include cookies
        headers: {
          "Cache-Control": "no-cache", // Prevent caching issues
        },
      });

      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch saved campaigns");
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} saved campaigns`);
      setSavedCampaigns(data);
      updateSavedIdsCache(data);
    } catch (err) {
      console.error("Error fetching saved campaigns:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [session, authLoading]);

  // Fetch saved campaigns on mount and when session changes
  useEffect(() => {
    if (!authLoading) {
      // Only fetch if auth loading is complete
      fetchSavedCampaigns();
    }
  }, [fetchSavedCampaigns, authLoading]);

  // Keep multiple hook instances in sync (e.g. auto-save from another component)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSavedCampaignsUpdated = () => {
      fetchSavedCampaigns();
    };

    window.addEventListener(
      SAVED_CAMPAIGNS_UPDATED_EVENT,
      handleSavedCampaignsUpdated
    );

    return () => {
      window.removeEventListener(
        SAVED_CAMPAIGNS_UPDATED_EVENT,
        handleSavedCampaignsUpdated
      );
    };
  }, [fetchSavedCampaigns]);

  // Function to save a campaign
  const saveCampaign = async (
    campaignId: string,
    options?: { silent?: boolean }
  ) => {
    const silent = options?.silent ?? false;
    console.log("=== SAVE CAMPAIGN DEBUG START ===");
    console.log("Auth loading:", authLoading);
    console.log("Session:", session);
    console.log("Session user:", session?.user);
    console.log("Session user email:", session?.user?.email);
    console.log("Campaign ID:", campaignId);

    if (authLoading) {
      console.log("AUTH LOADING - aborting");
      if (!silent) {
        toast({
          title: "Cargando",
          description: "Por favor espera mientras verificamos tu sesión",
        });
      }
      return false;
    }

    if (!session) {
      console.log("NO SESSION - aborting");
      if (!silent) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para guardar campañas",
          variant: "destructive",
        });
      }
      return false;
    }

    if (!campaignId || campaignId.trim() === "") {
      console.log("INVALID CAMPAIGN ID - aborting");
      if (!silent) {
        toast({
          title: "Error",
          description: "ID de campaña no válido",
          variant: "destructive",
        });
      }
      return false;
    }

    try {
      setError(null);
      console.log("Making API call to save campaign:", campaignId);

      const response = await fetch("/api/saved-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Include cookies for auth
        body: JSON.stringify({ campaignId: campaignId.trim() }),
      });

      console.log("API Response status:", response.status);
      console.log(
        "API Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error response:", errorData);

        // Handle specific error cases
        if (response.status === 401) {
          if (!silent) {
            toast({
              title: "Error de autenticación",
              description:
                "Tu sesión ha expirado. Por favor inicia sesión nuevamente",
              variant: "destructive",
            });
          }
          return false;
        }

        if (
          response.status === 400 &&
          errorData.error === "Campaign already saved"
        ) {
          if (!silent) {
            toast({
              title: "Campaña ya guardada",
              description: "Esta campaña ya está en tu lista de guardadas",
            });
          }
          // Refresh to ensure UI is in sync
          await fetchSavedCampaigns();
          return true;
        }

        throw new Error(errorData.error || "Failed to save campaign");
      }

      const data = await response.json();
      console.log("API Success response:", data);

      // Refresh the list of saved campaigns
      await fetchSavedCampaigns();

      if (!silent) {
        toast({
          title: "Campaña guardada",
          description: "La campaña ha sido guardada exitosamente",
        });
      }
      notifySavedCampaignsUpdated();

      console.log("=== SAVE CAMPAIGN DEBUG END - SUCCESS ===");
      return true;
    } catch (err) {
      console.error("Error saving campaign:", err);
      console.log("=== SAVE CAMPAIGN DEBUG END - ERROR ===");
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );

      if (!silent) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "No se pudo guardar la campaña",
          variant: "destructive",
        });
      }

      return false;
    }
  };

  // Function to unsave a campaign
  const unsaveCampaign = async (campaignId: string) => {
    if (authLoading) {
      toast({
        title: "Cargando",
        description: "Por favor espera mientras verificamos tu sesión",
      });
      return false;
    }

    if (!session) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para eliminar campañas guardadas",
        variant: "destructive",
      });
      return false;
    }

    if (!campaignId || campaignId.trim() === "") {
      toast({
        title: "Error",
        description: "ID de campaña no válido",
        variant: "destructive",
      });
      return false;
    }

    try {
      setError(null);
      console.log("Unsaving campaign:", campaignId);

      const response = await fetch("/api/saved-campaign", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Include cookies for auth
        body: JSON.stringify({ campaignId: campaignId.trim() }),
      });

      console.log("Unsave response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "Error de autenticación",
            description:
              "Tu sesión ha expirado. Por favor inicia sesión nuevamente",
            variant: "destructive",
          });
          return false;
        }

        if (response.status === 404) {
          toast({
            title: "Campaña no encontrada",
            description: "Esta campaña ya no está en tu lista de guardadas",
          });
          // Refresh to ensure UI is in sync
          await fetchSavedCampaigns();
          return true;
        }

        throw new Error(errorData.error || "Failed to unsave campaign");
      }

      // Refresh the list of saved campaigns
      await fetchSavedCampaigns();

      toast({
        title: "Campaña eliminada",
        description: "La campaña ha sido eliminada de tu lista",
      });
      notifySavedCampaignsUpdated();

      return true;
    } catch (err) {
      console.error("Error unsaving campaign:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );

      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo eliminar la campaña",
        variant: "destructive",
      });

      return false;
    }
  };

  // Function to check if a campaign is saved
  const isCampaignSaved = useCallback(
    (campaignId: string) => {
      if (!campaignId || campaignId.trim() === "") {
        return false;
      }
      return savedCampaigns.some(
        (campaign) => campaign.id === campaignId.trim()
      );
    },
    [savedCampaigns]
  );

  return {
    savedCampaigns,
    isLoading,
    error,
    saveCampaign,
    unsaveCampaign,
    isCampaignSaved,
    refresh: fetchSavedCampaigns,
  };
}
