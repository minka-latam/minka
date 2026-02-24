"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, X } from "lucide-react";
import { useCampaignForm } from "@/components/providers/campaign-form-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function Step3Preview() {
  const router = useRouter();
  const { state, prevStep, submitCampaign } = useCampaignForm();
  const [previewOpen, setPreviewOpen] = useState(false);

  // Find primary media
  const primaryMedia =
    state.media.find((item) => item.isPrimary) || state.media[0];

  // Format category for display
  const formatCategory = (category: string) => {
    const categories: Record<string, string> = {
      cultura_arte: "Cultura y Arte",
      educacion: "Educación",
      emergencia: "Emergencia",
      igualdad: "Igualdad",
      medioambiente: "Medio ambiente",
      salud: "Salud",
      otros: "Otros",
    };
    return categories[category] || category;
  };

  // Format goal amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePublish = async () => {
    await submitCampaign();
  };

  if (state.isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg">Publicando campaña...</span>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Preview Instructions */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Revisa y publica tu campaña
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Revisa todos los detalles de tu campaña antes de publicarla.
              Puedes regresar a los pasos anteriores para realizar cambios si es
              necesario.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <div className="space-y-4">
              <p className="text-lg">
                Tu campaña se publicará con la siguiente información:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  Título: <span className="font-medium">{state.title}</span>
                </li>
                <li>
                  Categoría:{" "}
                  <span className="font-medium">
                    {formatCategory(state.category)}
                  </span>
                </li>
                <li>
                  Ubicación:{" "}
                  <span className="font-medium">{state.location}</span>
                </li>
                <li>
                  Meta:{" "}
                  <span className="font-medium">
                    {formatAmount(state.goalAmount)}
                  </span>
                </li>
                <li>
                  Fecha de finalización:{" "}
                  <span className="font-medium">
                    {state.endDate
                      ? format(new Date(state.endDate), "PPP", { locale: es })
                      : "No especificada"}
                  </span>
                </li>
                <li>
                  Imágenes/videos:{" "}
                  <span className="font-medium">{state.media.length}</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 italic mt-4">
                Nota: Tu campaña será revisada por nuestro equipo antes de ser
                publicada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Preview Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          className="mx-auto flex items-center gap-2 bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-4 rounded-full text-lg"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="h-5 w-5" />
          Ver vista previa
        </Button>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white max-w-4xl w-full mx-4 relative shadow-lg rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#f5f7e9] py-3 px-6 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-semibold text-[#2c6e49]">
                Vista previa de la campaña
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-[#478C5C] hover:text-[#2c6e49]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Campaign Header */}
              <div>
                <h1 className="text-3xl font-bold text-[#2c6e49]">
                  {state.title}
                </h1>
                <p className="mt-2 text-gray-600">{state.description}</p>
              </div>

              {/* Campaign Image/Media */}
              <div className="rounded-xl overflow-hidden">
                {primaryMedia && primaryMedia.type === "image" ? (
                  <img
                    src={primaryMedia.mediaUrl}
                    alt={state.title}
                    className="w-full h-[300px] object-cover"
                  />
                ) : primaryMedia && primaryMedia.type === "video" ? (
                  <video
                    src={primaryMedia.mediaUrl}
                    controls
                    className="w-full h-[300px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No hay imagen principal</p>
                  </div>
                )}
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Categoría</p>
                  <p className="font-medium">
                    {formatCategory(state.category)}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Ubicación</p>
                  <p className="font-medium">{state.location}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Fecha de finalización</p>
                  <p className="font-medium">
                    {state.endDate
                      ? format(new Date(state.endDate), "PPP", { locale: es })
                      : "No especificada"}
                  </p>
                </div>
              </div>

              {/* Campaign Progress */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Recaudado</span>
                    <span className="font-bold">
                      {formatAmount(0)} de {formatAmount(state.goalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#2c6e49] h-2.5 rounded-full"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>0%</span>
                    <span>0 donantes</span>
                  </div>
                </div>
                <Button className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-lg py-3">
                  Donar
                </Button>
              </div>

              {/* Campaign Description */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#2c6e49]">
                  Descripción de la campaña
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {state.description}
                </p>
              </div>

              {/* Beneficiaries */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#2c6e49]">
                  Beneficiarios
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {state.beneficiariesDescription}
                </p>
              </div>

              {/* Gallery */}
              {state.media.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[#2c6e49]">
                    Galería
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {state.media.map((item, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        {item.type === "image" ? (
                          <img
                            src={item.mediaUrl}
                            alt={`Media ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <video
                            src={item.mediaUrl}
                            className="w-full h-32 object-cover"
                            controls
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <Button
                type="button"
                onClick={() => setPreviewOpen(false)}
                variant="outline"
                className="rounded-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="border-[#2c6e49] text-[#2c6e49] px-6 py-2 rounded-full text-lg flex items-center"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={handlePublish}
          className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-12 py-6 rounded-full text-xl"
          disabled={state.isSubmitting}
        >
          {state.isSubmitting ? (
            <div className="flex items-center gap-2">
              <InlineSpinner className="text-white" />
              <span>Publicando...</span>
            </div>
          ) : (
            "Publicar campaña"
          )}
        </Button>
      </div>
    </div>
  );
}
