import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface FundTransferFormData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  frequency?: "monthly_once" | "monthly_twice" | "every_90_days";
}

export interface TransferHistoryItem {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  status: "processing" | "completed" | "rejected" | "cancelled";
  frequency: "monthly_once" | "monthly_twice" | "every_90_days";
  transferDate: string | null;
  createdAt: string;
}

export function useTransfer() {
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const { toast } = useToast();

  // Create a fund transfer request
  const createFundTransfer = async (
    campaignId: string,
    data: FundTransferFormData
  ): Promise<{ success: boolean; transferId?: string }> => {
    setIsCreatingTransfer(true);

    try {
      const response = await fetch(`/api/campaign/${campaignId}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          // Silent fail for auth errors, handled in the UI
          return { success: false };
        }
        throw new Error(result.error || "Error al crear la transferencia");
      }

      toast({
        title: "Solicitud enviada",
        description:
          "Tu solicitud de transferencia ha sido enviada y está siendo procesada.",
      });

      return { success: true, transferId: result.transferId };
    } catch (error) {
      console.error("Error creating fund transfer:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo procesar la solicitud de transferencia",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsCreatingTransfer(false);
    }
  };

  // Get transfer history for a campaign
  const getTransferHistory = async (
    campaignId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{
    transfers: TransferHistoryItem[];
    totalCount: number;
    hasMore: boolean;
  } | null> => {
    setIsLoadingTransfers(true);

    try {
      const response = await fetch(
        `/api/campaign/${campaignId}/transfer?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        }
      );

      if (response.status === 401) {
        setIsAuthenticated(false);
        return {
          transfers: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Error al obtener el historial de transferencias"
        );
      }

      return {
        transfers: result.transfers,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
      };
    } catch (error) {
      console.error("Error getting transfer history:", error);
      // Don't show toast for auth errors as they're expected for new users
      if (!(error instanceof Error && error.message === "No autorizado")) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo obtener el historial de transferencias",
          variant: "destructive",
        });
      }
      return {
        transfers: [],
        totalCount: 0,
        hasMore: false,
      };
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  return {
    isCreatingTransfer,
    isLoadingTransfers,
    isAuthenticated,
    createFundTransfer,
    getTransferHistory,
  };
}
