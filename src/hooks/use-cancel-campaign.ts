"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/use-toast";

type CancelCampaignOptions = {
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
};

export function useCancelCampaign() {
  const [isCancellingCampaign, setIsCancellingCampaign] = useState(false);
  const { toast } = useToast();

  const cancelCampaign = async (
    campaignId: string,
    options: CancelCampaignOptions = {},
  ) => {
    try {
      setIsCancellingCampaign(true);

      const response = await fetch(`/api/campaign/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ campaignStatus: "cancelled" }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            options.errorDescription ||
            "No se pudo cancelar la campaña.",
        );
      }

      toast({
        title: options.successTitle || "Campaña cancelada",
        description:
          options.successDescription ||
          "La campaña ya no es pública y no recibirá donaciones.",
      });

      return { success: true };
    } catch (error) {
      toast({
        title: options.errorTitle || "No se pudo cancelar la campaña",
        description:
          error instanceof Error
            ? error.message
            : options.errorDescription ||
              "Intenta nuevamente en unos minutos.",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsCancellingCampaign(false);
    }
  };

  return {
    cancelCampaign,
    isCancellingCampaign,
  };
}
