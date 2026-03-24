"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Edit,
} from "lucide-react";
import {
  useTransfer,
  FundTransferFormData,
  TransferHistoryItem,
} from "@/hooks/use-transfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ButtonSpinner } from "@/components/ui/inline-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TransferFundsTabProps {
  campaign: Record<string, any>;
}

export function TransferFundsTab({ campaign }: TransferFundsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [transferFrequency, setTransferFrequency] =
    useState<string>("monthly_once");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>(
    []
  );
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [availableAmount, setAvailableAmount] = useState(
    campaign.collectedAmount || 0
  );
  const [maskedAccountNumber, setMaskedAccountNumber] = useState<string | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [hasSavedAccount, setHasSavedAccount] = useState(false);

  const {
    isCreatingTransfer,
    isLoadingTransfers,
    createFundTransfer,
    getTransferHistory,
  } = useTransfer();

  const initialFormState = useMemo<FundTransferFormData>(
    () => ({
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      amount: 0,
    }),
    []
  );

  const [formData, setFormData] =
    useState<FundTransferFormData>(initialFormState);

  // Load transfer history and check for existing transfers
  useEffect(() => {
    if (campaign?.id) {
      loadTransferHistory();
      checkExistingBankAccount();
    }
  }, [campaign?.id]);

  // Load transfer history when page changes
  useEffect(() => {
    if (campaign?.id && currentPage > 1) {
      loadTransferHistory();
    }
  }, [currentPage]);

  // Check for form changes
  useEffect(() => {
    const formChanged =
      formData.accountHolderName.trim() !==
        initialFormState.accountHolderName ||
      formData.bankName !== initialFormState.bankName ||
      formData.accountNumber.trim() !== initialFormState.accountNumber ||
      (formData.amount > 0 && formData.amount !== initialFormState.amount);

    setShowSaveBar(formChanged);
  }, [formData, initialFormState]);

  // Check if there's an existing bank account associated with this campaign
  const checkExistingBankAccount = async () => {
    try {
      // First try to get the latest transfer to extract bank details
      const result = await getTransferHistory(campaign.id, 1, 0);

      if (result && result.transfers.length > 0) {
        const latestTransfer = result.transfers[0];

        // Use the bank details from the latest transfer
        setFormData({
          ...formData,
          accountHolderName: latestTransfer.accountHolderName || "",
          bankName: latestTransfer.bankName || "",
          accountNumber: latestTransfer.accountNumber || "",
          amount: 0, // Reset amount
        });

        // Mask the account number for display
        if (latestTransfer.accountNumber) {
          const masked = maskAccountNumber(latestTransfer.accountNumber);
          setMaskedAccountNumber(masked);
          setHasSavedAccount(true);
        }
      } else if (campaign.accountDetails) {
        // Fallback to campaign.accountDetails if available
        const { accountHolderName, bankName, accountNumber } =
          campaign.accountDetails;

        setFormData({
          ...formData,
          accountHolderName: accountHolderName || "",
          bankName: bankName || "",
          accountNumber: accountNumber || "",
        });

        // Mask the account number for display
        if (accountNumber) {
          const masked = maskAccountNumber(accountNumber);
          setMaskedAccountNumber(masked);
          setHasSavedAccount(true);
        }
      }
    } catch (error) {
      console.error("Error checking existing bank account:", error);
    }
  };

  const loadTransferHistory = async () => {
    if (!campaign?.id) return;

    const limit = 10;
    const offset = (currentPage - 1) * limit;

    const result = await getTransferHistory(campaign.id, limit, offset);

    if (result) {
      setTransferHistory(result.transfers);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setTotalPages(Math.ceil(result.totalCount / limit));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsLoading(true);

    try {
      // Check if all required fields are filled
      if (
        !formData.accountHolderName ||
        !formData.bankName ||
        !formData.accountNumber
      ) {
        toast({
          title: "Campos incompletos",
          description: "Por favor completa todos los campos requeridos.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // If submitting just bank account info without a transfer, set amount to 0
      let dataToSubmit = { ...formData };
      if (!dataToSubmit.amount) {
        dataToSubmit.amount = 0;
      }

      const result = await createFundTransfer(campaign.id, {
        ...dataToSubmit,
        frequency: transferFrequency as any,
      });

      // Success case - the API returned success:true
      if (result && result.success) {
        setTransferSuccess(true);
        setHasSavedAccount(true);
        setShowSaveBar(false);
        setShowAccountModal(false);

        // Update masked account number
        if (formData.accountNumber) {
          const masked = maskAccountNumber(formData.accountNumber);
          setMaskedAccountNumber(masked);
        }

        // Show success message
        toast({
          title: "Información guardada",
          description:
            "La información de cuenta ha sido guardada correctamente.",
        });

        // Reload transfer history
        loadTransferHistory();
      } else {
        // API returned but not with success:true
        toast({
          title: "No se pudo procesar la solicitud",
          description: "Por favor verifica los datos e intenta nuevamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting transfer:", error);
      toast({
        title: "Error",
        description:
          "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setShowSaveBar(false);
    setShowAccountModal(false);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length < 5) return accountNumber;

    // Only show the last 4 digits
    return `*****${accountNumber.slice(-4)}`;
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Bs. ${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const canWithdraw = availableAmount > 0;

  // Determine if form is valid based on context
  const isFormValid = useMemo(() => {
    // Bank account details are always required
    const accountDetailsValid =
      formData.accountHolderName.trim() !== "" &&
      formData.bankName !== "" &&
      formData.accountNumber.trim() !== "";

    // If we're just registering an account, we don't need a transfer amount
    if (!hasSavedAccount) {
      return accountDetailsValid;
    }

    // If making a transfer with an existing account, amount is required and must be valid
    if (hasSavedAccount && formData.amount > 0) {
      return accountDetailsValid && formData.amount <= availableAmount;
    }

    // Default case - just require account details
    return accountDetailsValid;
  }, [formData, hasSavedAccount, availableAmount]);

  // Custom modal implementation
  const renderBankAccountModal = () => {
    if (!showAccountModal) return null;

    return (
      <>
        {/* Modal backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
          onClick={() => setShowAccountModal(false)}
        >
          {/* Modal container */}
          <div
            className="bg-white w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#FDF9ED] w-full px-6 py-4 flex items-center justify-between">
              <span className="text-[#2c6e49] text-xl font-medium">
                Destino de fondos
              </span>
              <X
                className="h-4 w-4 text-[#2c6e49] cursor-pointer"
                onClick={() => setShowAccountModal(false)}
              />
            </div>

            {/* Modal content */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block mb-2">Titular de la cuenta</label>
                <input
                  type="text"
                  name="accountHolderName"
                  placeholder="Ingresa nombre completo"
                  value={formData.accountHolderName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-400 p-3 rounded-md"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2">Número de cuenta</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Ingresa número de cuenta"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-400 p-3 rounded-md"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2">Banco de destino</label>
                <input
                  type="text"
                  name="bankName"
                  placeholder="Ingresa banco de destino"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-400 p-3 rounded-md"
                />
              </div>

              {canWithdraw && hasSavedAccount && (
                <div className="mb-6">
                  <label className="block mb-2">Monto a transferir</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Bs.
                    </span>
                    <input
                      type="number"
                      name="amount"
                      min="0"
                      max={availableAmount}
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount || ""}
                      onChange={handleInputChange}
                      className="w-full pl-10 border border-gray-400 p-3 rounded-md"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Monto disponible: {formatCurrency(availableAmount)}
                  </p>
                </div>
              )}

              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  disabled={!isFormValid || isCreatingTransfer}
                  onClick={handleSubmit}
                  className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white py-3 px-12 rounded-3xl"
                >
                  {isCreatingTransfer ? (
                    <div className="flex items-center justify-center">
                      <ButtonSpinner />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    "Guardar informacion"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="w-full px-6 md:px-8 lg:px-16 xl:px-24 py-6 flex flex-col min-h-[calc(100vh-200px)]">
      {/* Content Section - Full Width */}
      <div className="w-full flex-1 flex flex-col">
        <div>
          {/* Main Amount Display */}
          <div className="mb-6">
            <h3 className="text-3xl md:text-4xl font-bold mb-2 text-[#2c6e49]">
              {formatCurrency(availableAmount)}
            </h3>
            <p className="text-sm text-gray-600">Fondos disponibles</p>
          </div>

          {/* Account Number Display */}
          <div className="mb-6 flex items-center">
            {maskedAccountNumber ? (
              <>
                <span className="text-sm">Nº {maskedAccountNumber}</span>
                <button
                  className="ml-2 text-[#2B6D48]"
                  onClick={() => {
                    setEditMode(true);
                    setShowAccountModal(true);
                  }}
                >
                  <Edit size={18} />
                </button>
              </>
            ) : (
              <button
                className="px-3 py-1.5 text-sm text-gray-600 border border-dashed border-[#2B6D48] rounded-md hover:bg-[#f0f8f4] flex items-center gap-2 transition-colors duration-200"
                onClick={() => {
                  setEditMode(false);
                  setShowAccountModal(true);
                }}
              >
                <span>Sin cuenta registrada - </span>
                <span className="text-[#2B6D48] font-medium">
                  Registrar cuenta
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#2B6D48]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4V20M4 12H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Destination Selector */}
          <div className="mb-6">
            <p className="text-sm mb-2">Destino de fondos</p>
            <button
              className={`inline-flex px-6 py-2 border ${hasSavedAccount ? "border-[#2c6e49]" : "border-gray-300"} rounded-full ${hasSavedAccount ? "bg-white text-[#2c6e49] hover:bg-[#f0f8f4]" : "bg-gray-50 text-gray-500 hover:bg-gray-100"} font-medium text-sm`}
              onClick={() => {
                setEditMode(false);
                if (!hasSavedAccount) {
                  // If there's no saved account, show the modal to add one
                  setShowAccountModal(true);
                  toast({
                    title: "Cuenta bancaria necesaria",
                    description:
                      "Primero debes registrar una cuenta bancaria para poder transferir fondos.",
                  });
                } else {
                  // If there's an existing account, just set the amount
                  setFormData({
                    ...formData,
                    amount: 0, // Reset amount for new transfer
                  });
                  setShowAccountModal(true);
                }
              }}
            >
              {hasSavedAccount
                ? "Nueva transferencia"
                : "Registrar cuenta bancaria"}
            </button>
          </div>

          {/* Separator before frequency section */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Frequency of Transfer Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-6">
              Frecuencia de transferencia
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="monthly_once"
                  name="transferFrequency"
                  value="monthly_once"
                  checked={transferFrequency === "monthly_once"}
                  onChange={() => setTransferFrequency("monthly_once")}
                  className="h-5 w-5 text-black border-gray-500"
                />
                <label htmlFor="monthly_once" className="ml-3 text-sm">
                  1 vez al mes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="monthly_twice"
                  name="transferFrequency"
                  value="monthly_twice"
                  checked={transferFrequency === "monthly_twice"}
                  onChange={() => setTransferFrequency("monthly_twice")}
                  className="h-5 w-5 text-black border-gray-500"
                />
                <label htmlFor="monthly_twice" className="ml-3 text-sm">
                  2 veces al mes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="every_90_days"
                  name="transferFrequency"
                  value="every_90_days"
                  checked={transferFrequency === "every_90_days"}
                  onChange={() => setTransferFrequency("every_90_days")}
                  className="h-5 w-5 text-black border-gray-500"
                />
                <label htmlFor="every_90_days" className="ml-3 text-sm">
                  Cada 90 días
                </label>
              </div>
            </div>
          </div>

          {/* Separator after frequency section */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Transfer History Section */}
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6">
              Historial de transferencias ({totalCount})
            </h3>

            {isLoadingTransfers ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : transferHistory.length > 0 ? (
              <div className="flex-1 flex flex-col">
                {/* Table Header */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Monto
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Cuenta
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transferHistory.map((transfer) => (
                      <tr key={transfer.id} className="bg-white">
                        <td className="py-4 px-4 text-gray-700">
                          {formatCurrency(transfer.amount)}
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {formatDate(transfer.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {maskAccountNumber(transfer.accountNumber)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transfer.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transfer.status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : transfer.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {transfer.status === "completed"
                              ? "Completado"
                              : transfer.status === "processing"
                                ? "En proceso"
                                : transfer.status === "rejected"
                                  ? "Rechazado"
                                  : "Cancelado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      className="flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>Anterior</span>
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${
                            currentPage === pageNum
                              ? "bg-green-700 text-white border border-green-700"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-1 text-gray-500">...</span>
                        <button
                          className="h-10 w-10 rounded-full flex items-center justify-center text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          onClick={() => goToPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      className="flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="bg-gray-50 p-8 rounded-lg text-center w-full">
                  <div className="flex justify-center">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 12L12 16"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="8" r="1" fill="#3b82f6" />
                    </svg>
                  </div>
                  <p className="mt-4 text-gray-600">
                    No hay ninguna transferencia registrada por el momento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render custom modal */}
      {renderBankAccountModal()}

      {/* Save Changes Bar */}
      {showSaveBar && !showAccountModal && (
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
            disabled={isCreatingTransfer || !isFormValid}
            onClick={handleSubmit}
          >
            {isCreatingTransfer ? "Procesando..." : "Solicitar transferencia"}
          </Button>
        </div>
      )}
    </div>
  );
}
