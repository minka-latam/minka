import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface FundTransferFormData {
  amount: number | string;
}

export interface CampaignBankAccount {
  id: string;
  campaignId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: string | null;
  status: "active" | "replaced" | "disabled";
  createdAt: string;
  updatedAt: string;
}

export interface TransferHistoryItem {
  id: string;
  campaignBankAccountId: string | null;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  status: "processing" | "completed" | "cancelled";
  transferDate: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function useTransfer() {
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const { toast } = useToast();

  const getBankAccount = async (
    campaignId: string,
  ): Promise<CampaignBankAccount | null> => {
    try {
      const response = await fetch(`/api/campaign/${campaignId}/bank-account`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        return null;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener la cuenta bancaria");
      }

      return result.bankAccount;
    } catch (error) {
      console.error("Error getting bank account:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo obtener la cuenta bancaria",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveBankAccount = async (
    campaignId: string,
    data: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      accountType?: string | null;
    },
  ): Promise<{ success: boolean; bankAccount?: CampaignBankAccount }> => {
    setIsCreatingTransfer(true);

    try {
      const response = await fetch(`/api/campaign/${campaignId}/bank-account`, {
        method: "PUT",
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
          return { success: false };
        }
        throw new Error(result.error || "Error al guardar la cuenta bancaria");
      }

      toast({
        title: "Cuenta bancaria guardada",
        description: "La cuenta bancaria de la campaña fue actualizada.",
      });

      return { success: true, bankAccount: result.bankAccount };
    } catch (error) {
      console.error("Error saving bank account:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la cuenta bancaria",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsCreatingTransfer(false);
    }
  };

  // Create a fund transfer request
  const createFundTransfer = async (
    campaignId: string,
    data: FundTransferFormData,
  ): Promise<{
    success: boolean;
    transferId?: string;
    availableAmount?: number;
  }> => {
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
          "Tu solicitud de transferencia fue registrada y será procesada manualmente.",
      });

      return {
        success: true,
        transferId: result.transferId,
        availableAmount:
          result.availableAmount !== undefined
            ? Number(result.availableAmount)
            : undefined,
      };
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

  const cancelFundTransfer = async (
    campaignId: string,
    transferId: string,
  ): Promise<{ success: boolean }> => {
    setIsCreatingTransfer(true);

    try {
      const response = await fetch(`/api/campaign/${campaignId}/transfer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          transferId,
          status: "cancelled",
          notes: "Cancelada por el usuario",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return { success: false };
        }
        throw new Error(result.error || "Error al cancelar la transferencia");
      }

      toast({
        title: "Solicitud cancelada",
        description: "La solicitud de transferencia fue cancelada.",
      });

      return { success: true };
    } catch (error) {
      console.error("Error cancelling fund transfer:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar la transferencia",
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
    offset: number = 0,
  ): Promise<{
    transfers: TransferHistoryItem[];
    totalCount: number;
    hasMore: boolean;
    availableAmount: number;
    confirmedBaseAmount: number;
    confirmedTipAmount: number;
    reservedTransferAmount: number;
    hasProcessingTransfer: boolean;
  } | null> => {
    setIsLoadingTransfers(true);

    try {
      const response = await fetch(
        `/api/campaign/${campaignId}/transfer?limit=${limit}&offset=${offset}`,
        {
          credentials: "include",
        },
      );

      if (response.status === 401) {
        setIsAuthenticated(false);
        return {
          transfers: [],
          totalCount: 0,
          hasMore: false,
          availableAmount: 0,
          confirmedBaseAmount: 0,
          confirmedTipAmount: 0,
          reservedTransferAmount: 0,
          hasProcessingTransfer: false,
        };
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Error al obtener el historial de transferencias",
        );
      }

      return {
        transfers: result.transfers,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        availableAmount: Number(result.availableAmount || 0),
        confirmedBaseAmount: Number(result.confirmedBaseAmount || 0),
        confirmedTipAmount: Number(result.confirmedTipAmount || 0),
        reservedTransferAmount: Number(result.reservedTransferAmount || 0),
        hasProcessingTransfer: Boolean(result.hasProcessingTransfer),
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
        availableAmount: 0,
        confirmedBaseAmount: 0,
        confirmedTipAmount: 0,
        reservedTransferAmount: 0,
        hasProcessingTransfer: false,
      };
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  return {
    isCreatingTransfer,
    isLoadingTransfers,
    isAuthenticated,
    getBankAccount,
    saveBankAccount,
    createFundTransfer,
    cancelFundTransfer,
    getTransferHistory,
  };
}
