"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  CampaignBankAccount,
  TransferHistoryItem,
  useTransfer,
} from "@/hooks/use-transfer";
import { useCancelCampaign } from "@/hooks/use-cancel-campaign";
import { ButtonSpinner } from "@/components/ui/inline-spinner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConcludeCampaignModal } from "@/components/campaign-admin/conclude-campaign-modal";
import { toast } from "@/components/ui/use-toast";
import { MIN_TRANSFER_AMOUNT } from "@/lib/campaign-finance";
import { calculateCampaignDaysRemaining } from "@/lib/campaign-dates";

interface TransferFundsTabProps {
  campaign: Record<string, any>;
}

type BankAccountFormData = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
};

const EMPTY_BANK_ACCOUNT: BankAccountFormData = {
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  accountType: "",
};

export function TransferFundsTab({ campaign }: TransferFundsTabProps) {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferConfirmation, setShowTransferConfirmation] =
    useState(false);
  const [showConcludeCampaignModal, setShowConcludeCampaignModal] =
    useState(false);
  const [bankAccount, setBankAccount] = useState<CampaignBankAccount | null>(
    null,
  );
  const [bankAccountForm, setBankAccountForm] =
    useState<BankAccountFormData>(EMPTY_BANK_ACCOUNT);
  const [transferAmount, setTransferAmount] = useState(0);
  const [availableAmount, setAvailableAmount] = useState(
    Number(campaign.collectedAmount || 0),
  );
  const [confirmedBaseAmount, setConfirmedBaseAmount] = useState(
    Number(campaign.collectedAmount || 0),
  );
  const [reservedTransferAmount, setReservedTransferAmount] = useState(0);
  const [hasProcessingTransfer, setHasProcessingTransfer] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistoryItem[]>(
    [],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const {
    isCreatingTransfer,
    isLoadingTransfers,
    getBankAccount,
    saveBankAccount,
    createFundTransfer,
    cancelFundTransfer,
    getTransferHistory,
  } = useTransfer();
  const {
    cancelCampaign,
    isCancellingCampaign: isConcludingCampaign,
  } = useCancelCampaign();

  useEffect(() => {
    if (!campaign?.id) return;
    loadBankAccount();
    loadTransferHistory(1);
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign?.id || currentPage === 1) return;
    loadTransferHistory(currentPage);
  }, [currentPage]);

  const loadBankAccount = async () => {
    const account = await getBankAccount(campaign.id);
    setBankAccount(account);

    if (account) {
      setBankAccountForm({
        accountHolderName: account.accountHolderName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType || "",
      });
    }
  };

  const loadTransferHistory = async (page = currentPage) => {
    const limit = 10;
    const offset = (page - 1) * limit;
    const result = await getTransferHistory(campaign.id, limit, offset);

    if (!result) return;

    setTransferHistory(result.transfers);
    setTotalCount(result.totalCount);
    setTotalPages(Math.max(1, Math.ceil(result.totalCount / limit)));
    setAvailableAmount(result.availableAmount);
    setConfirmedBaseAmount(result.confirmedBaseAmount);
    setReservedTransferAmount(result.reservedTransferAmount);
    setHasProcessingTransfer(result.hasProcessingTransfer);
  };

  const handleBankAccountInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTransferAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTransferAmount(Number(e.target.value) || 0);
  };

  const handleOpenBankAccountModal = () => {
    if (hasProcessingTransfer) {
      toast({
        title: "Transferencia en proceso",
        description:
          "No puedes cambiar la cuenta bancaria mientras hay una transferencia en proceso.",
        variant: "destructive",
      });
      return;
    }

    setBankAccountForm(
      bankAccount
        ? {
            accountHolderName: bankAccount.accountHolderName,
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountType: bankAccount.accountType || "",
          }
        : EMPTY_BANK_ACCOUNT,
    );
    setShowAccountModal(true);
  };

  const handleSaveBankAccount = async () => {
    if (
      !bankAccountForm.accountHolderName.trim() ||
      !bankAccountForm.bankName.trim() ||
      !bankAccountForm.accountNumber.trim()
    ) {
      toast({
        title: "Campos incompletos",
        description: "Completa titular, banco y número de cuenta.",
        variant: "destructive",
      });
      return;
    }

    const result = await saveBankAccount(campaign.id, bankAccountForm);

    if (result.success && result.bankAccount) {
      setBankAccount(result.bankAccount);
      setShowAccountModal(false);
      await loadTransferHistory();
    }
  };

  const validateTransferRequest = () => {
    if (!bankAccount) {
      toast({
        title: "Cuenta bancaria requerida",
        description: "Primero registra la cuenta bancaria de la campaña.",
        variant: "destructive",
      });
      return false;
    }

    const minimumAmount = getMinimumTransferAmount();

    if (transferAmount < minimumAmount || transferAmount > availableAmount) {
      toast({
        title: "Monto inválido",
        description: `Solicita entre Bs. ${minimumAmount.toLocaleString()} y ${formatCurrency(
          availableAmount,
        )}.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleRequestTransfer = () => {
    if (!validateTransferRequest()) return;
    setShowTransferConfirmation(true);
  };

  const handleCancelTransferConfirmation = () => {
    setShowTransferConfirmation(false);
    setTransferAmount(0);
  };

  const submitTransferRequest = async () => {
    if (!validateTransferRequest()) {
      setShowTransferConfirmation(false);
      return;
    }

    const result = await createFundTransfer(campaign.id, {
      amount: transferAmount,
    });

    if (result.success) {
      setShowTransferConfirmation(false);
      setShowConcludeCampaignModal(true);
      setTransferAmount(0);
      if (result.availableAmount !== undefined) {
        setAvailableAmount(result.availableAmount);
      }
      await loadTransferHistory(1);
      setCurrentPage(1);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    const result = await cancelFundTransfer(campaign.id, transferId);

    if (result.success) {
      await loadTransferHistory(1);
      setCurrentPage(1);
    }
  };

  const handleConcludeCampaign = async () => {
    const result = await cancelCampaign(campaign.id, {
      successTitle: "Campaña concluida",
      successDescription:
        "La campaña fue marcada como cancelada y ya no recibirá donaciones.",
      errorTitle: "No se pudo concluir la campaña",
      errorDescription: "No se pudo concluir la campaña.",
    });

    if (result.success) {
      setShowConcludeCampaignModal(false);
      router.refresh();
    }
  };

  const hasReachedCampaignEndDate = () => {
    const endDateValue = campaign.end_date || campaign.endDate;
    if (!endDateValue) return false;

    return calculateCampaignDaysRemaining(endDateValue) === 0;
  };

  const getMinimumTransferAmount = () => {
    if (availableAmount < MIN_TRANSFER_AMOUNT && hasReachedCampaignEndDate()) {
      return availableAmount;
    }

    return MIN_TRANSFER_AMOUNT;
  };

  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length < 5) return accountNumber;
    return `*****${accountNumber.slice(-4)}`;
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Bs. ${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const minimumTransferAmount = getMinimumTransferAmount();
  const canRequestTransfer =
    Boolean(bankAccount) &&
    !hasProcessingTransfer &&
    availableAmount > 0 &&
    transferAmount >= minimumTransferAmount &&
    transferAmount <= availableAmount &&
    !isCreatingTransfer;

  const renderBankAccountModal = () => {
    if (!showAccountModal) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
        onClick={() => setShowAccountModal(false)}
      >
        <div
          className="bg-white w-full max-w-md relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#FDF9ED] w-full px-6 py-4 flex items-center justify-between">
            <span className="text-[#2c6e49] text-xl font-medium">
              Cuenta bancaria
            </span>
            <button
              type="button"
              className="text-[#2c6e49]"
              onClick={() => setShowAccountModal(false)}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label className="block mb-2">Titular de la cuenta</label>
              <input
                type="text"
                name="accountHolderName"
                maxLength={120}
                placeholder="Ingresa nombre completo"
                value={bankAccountForm.accountHolderName}
                onChange={handleBankAccountInputChange}
                className="w-full border border-gray-400 p-3 rounded-md"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2">Número de cuenta</label>
              <input
                type="text"
                name="accountNumber"
                maxLength={64}
                placeholder="Ingresa número de cuenta"
                value={bankAccountForm.accountNumber}
                onChange={handleBankAccountInputChange}
                className="w-full border border-gray-400 p-3 rounded-md"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2">Banco de destino</label>
              <input
                type="text"
                name="bankName"
                maxLength={120}
                placeholder="Ingresa banco de destino"
                value={bankAccountForm.bankName}
                onChange={handleBankAccountInputChange}
                className="w-full border border-gray-400 p-3 rounded-md"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2">Tipo de cuenta</label>
              <input
                type="text"
                name="accountType"
                maxLength={50}
                placeholder="Caja de ahorro, cuenta corriente, etc."
                value={bankAccountForm.accountType}
                onChange={handleBankAccountInputChange}
                className="w-full border border-gray-400 p-3 rounded-md"
              />
            </div>

            <div className="flex justify-center mt-8">
              <button
                type="button"
                disabled={isCreatingTransfer}
                onClick={handleSaveBankAccount}
                className="bg-[#2c6e49] hover:bg-[#1e4d33] disabled:opacity-60 text-white py-3 px-12 rounded-3xl"
              >
                {isCreatingTransfer ? (
                  <span className="flex items-center justify-center">
                    <ButtonSpinner />
                    <span>Guardando...</span>
                  </span>
                ) : (
                  "Guardar cuenta bancaria"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransferConfirmationModal = () => {
    if (!showTransferConfirmation) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-confirmation-title"
          className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        >
          <div className="bg-[#FDF9ED] px-5 py-5 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2c6e49] text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2c6e49]">
                  Retiro de fondos
                </p>
                <h3
                  id="transfer-confirmation-title"
                  className="mt-1 text-xl font-bold leading-tight text-[#1f2933] sm:text-2xl"
                >
                  ¡Importante antes de retirar tus fondos!
                </h3>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 text-sm leading-6 text-gray-700 sm:px-8">
            <div className="rounded-xl border border-[#dfeadd] bg-[#f7fbf7] p-4">
              <p className="text-xs font-medium text-gray-500">
                Solicitud a enviar
              </p>
              <p className="mt-1 text-2xl font-bold text-[#2c6e49]">
                {formatCurrency(transferAmount)}
              </p>
              {bankAccount && (
                <p className="mt-1 text-xs text-gray-600">
                  {bankAccount.bankName} · Nº{" "}
                  {maskAccountNumber(bankAccount.accountNumber)}
                </p>
              )}
            </div>

            <p>
              Al continuar con el retiro de fondos, declaras haber leído,
              comprendido y aceptado los Términos y Condiciones y las Políticas
              de Uso de Minka disponibles en esta plataforma.
            </p>
            <p>
              Asimismo, confirmas que los datos personales y bancarios
              proporcionados, incluyendo el nombre del titular y número de
              cuenta bancaria, son correctos, completos y se encuentran
              vigentes.
            </p>
            <p>
              Minka realizará las transferencias utilizando exclusivamente la
              información registrada por el usuario. En consecuencia, Minka no
              se hace responsable por errores, pérdidas, retrasos,
              transferencias no procesadas o fondos enviados a cuentas
              incorrectas debido a información errónea, incompleta o
              desactualizada proporcionada por el usuario.
            </p>
            <p>
              Al seleccionar “Aceptar y continuar”, autorizas expresamente el
              procesamiento de la transferencia bajo los datos ingresados.
            </p>
          </div>

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              disabled={isCreatingTransfer}
              onClick={handleCancelTransferConfirmation}
              className="order-2 rounded-full border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isCreatingTransfer}
              onClick={submitTransferRequest}
              className="order-1 rounded-full bg-[#2c6e49] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e4d33] disabled:opacity-60 sm:order-2"
            >
              {isCreatingTransfer ? (
                <span className="flex items-center justify-center">
                  <ButtonSpinner />
                  <span>Enviando...</span>
                </span>
              ) : (
                "Aceptar y continuar"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-6 md:px-8 lg:px-16 xl:px-24 py-6 flex flex-col min-h-[calc(100vh-200px)]">
      <div className="w-full flex-1 flex flex-col">
        <div className="mb-6">
          <h3 className="text-3xl md:text-4xl font-bold mb-2 text-[#2c6e49]">
            {formatCurrency(availableAmount)}
          </h3>
          <p className="text-sm text-gray-600">
            Saldo transferible disponible
          </p>
          <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Donaciones confirmadas</p>
              <p className="font-semibold">
                {formatCurrency(confirmedBaseAmount)}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Ya solicitado/enviado</p>
              <p className="font-semibold">
                {formatCurrency(reservedTransferAmount)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            El saldo transferible usa solo donaciones confirmadas y descuenta
            solicitudes en proceso o completadas.
          </p>
        </div>

        <div className="mb-8">
          <p className="text-sm mb-2">Cuenta bancaria de la campaña</p>
          {bankAccount ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">
                {bankAccount.bankName} - Nº{" "}
                {maskAccountNumber(bankAccount.accountNumber)}
              </span>
              <button
                type="button"
                className="text-[#2B6D48] disabled:text-gray-400"
                onClick={handleOpenBankAccountModal}
                disabled={hasProcessingTransfer}
                aria-label="Editar cuenta bancaria"
              >
                <Edit size={18} />
              </button>
              {hasProcessingTransfer && (
                <span className="text-xs text-gray-500">
                  Edición bloqueada por transferencia en proceso
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="px-3 py-1.5 text-sm text-gray-600 border border-dashed border-[#2B6D48] rounded-md hover:bg-[#f0f8f4] transition-colors duration-200"
              onClick={handleOpenBankAccountModal}
            >
              <span>Sin cuenta registrada - </span>
              <span className="text-[#2B6D48] font-medium">
                Registrar cuenta
              </span>
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 my-8"></div>

        <div className="mb-8 max-w-md">
          <h3 className="text-xl font-bold mb-3">Solicitar transferencia</h3>
          <p className="text-sm text-gray-600 mb-5">
            Minka procesa las transferencias manualmente. Una solicitud puede
            tardar hasta 5 días hábiles. Solo puede haber una solicitud de
            transferencia en proceso a la vez.
          </p>

          <label className="block mb-2">Monto a transferir</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              Bs.
            </span>
            <input
              type="number"
              min={minimumTransferAmount}
              max={availableAmount}
              step="0.01"
              placeholder="0.00"
              value={transferAmount || ""}
              onChange={handleTransferAmountChange}
              disabled={
                !bankAccount ||
                hasProcessingTransfer ||
                availableAmount < minimumTransferAmount
              }
              className="w-full pl-10 border border-gray-400 p-3 rounded-md"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Mínimo: {formatCurrency(minimumTransferAmount)}. Disponible:{" "}
            {formatCurrency(availableAmount)}.
          </p>
          {availableAmount > 0 && availableAmount < minimumTransferAmount && (
            <p className="mt-2 text-sm text-amber-700">
              Debes tener al menos {formatCurrency(minimumTransferAmount)}{" "}
              disponibles para solicitar una transferencia.
            </p>
          )}
          {availableAmount > 0 &&
            availableAmount < MIN_TRANSFER_AMOUNT &&
            hasReachedCampaignEndDate() && (
              <p className="mt-2 text-sm text-[#2c6e49]">
                La campaña ya llegó a su fecha de finalización, por eso puedes
                solicitar el saldo restante.
              </p>
            )}

          <button
            type="button"
            disabled={!canRequestTransfer}
            onClick={handleRequestTransfer}
            className="mt-5 bg-[#2c6e49] hover:bg-[#1e4d33] disabled:cursor-not-allowed disabled:opacity-60 text-white py-3 px-8 rounded-3xl"
          >
            {isCreatingTransfer ? (
              <span className="flex items-center justify-center">
                <ButtonSpinner />
                <span>Procesando...</span>
              </span>
            ) : (
              "Solicitar transferencia"
            )}
          </button>
        </div>

        <div className="border-t border-gray-200 my-8"></div>

        <div className="mt-4">
          <h3 className="text-xl font-bold mb-6">
            Historial de transferencias ({totalCount})
          </h3>

          {isLoadingTransfers ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : transferHistory.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-x-auto">
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
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Acción
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
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transfer.status === "completed"
                            ? "Completado"
                            : transfer.status === "processing"
                              ? "En proceso"
                              : "Cancelado"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {transfer.status === "processing" ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                            disabled={isCreatingTransfer}
                            onClick={() => handleCancelTransfer(transfer.id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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

                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>

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
                <p className="text-gray-600">
                  No hay ninguna transferencia registrada por el momento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderBankAccountModal()}
      {renderTransferConfirmationModal()}
      <ConcludeCampaignModal
        open={showConcludeCampaignModal}
        isLoading={isConcludingCampaign}
        onOpenChange={setShowConcludeCampaignModal}
        onConfirm={handleConcludeCampaign}
      />
    </div>
  );
}
