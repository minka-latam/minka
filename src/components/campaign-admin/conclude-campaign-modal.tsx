"use client";

import { AlertTriangle } from "lucide-react";

import { ButtonSpinner } from "@/components/ui/inline-spinner";

interface ConcludeCampaignModalProps {
  open: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConcludeCampaignModal({
  open,
  isLoading,
  onOpenChange,
  onConfirm,
}: ConcludeCampaignModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="conclude-campaign-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl"
      >
        <div className="bg-[#FDF9ED] px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Concluir campaña
              </p>
              <h3
                id="conclude-campaign-title"
                className="mt-1 text-xl font-bold leading-tight text-[#1f2933] sm:text-2xl"
              >
                ¿Quieres cerrar esta campaña ahora?
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 text-sm leading-6 text-gray-700 sm:px-8">
          <p>
            <span className="underline decoration-gray-500 underline-offset-2">
              Tu campaña puede permanecer abierta el tiempo que consideres
              prudente.
            </span>{" "}
            Si necesitas más tiempo, puedes editar la fecha de finalización y
            ampliarla sin problema.
          </p>
          <p>
            También puedes solicitar transferencias todas las veces que
            necesites, siempre que cumplas los requisitos de saldo y no tengas
            una solicitud en proceso.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Si eliges concluirla ahora, la campaña quedará marcada como{" "}
            <span className="font-semibold">cancelada</span> y ya no podrá
            recibir nuevas donaciones.
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="order-2 rounded-full bg-[#2c6e49] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1e4d33] disabled:cursor-not-allowed disabled:opacity-60 sm:order-1"
          >
            Mantener abierta
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="order-1 rounded-full bg-[#dc6464] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#ca5656] disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <ButtonSpinner />
                <span>Concluyendo...</span>
              </span>
            ) : (
              "Concluir campaña"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
