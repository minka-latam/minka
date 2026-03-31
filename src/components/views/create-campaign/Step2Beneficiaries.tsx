"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useCampaignForm } from "@/components/providers/campaign-form-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InlineSpinner } from "@/components/ui/inline-spinner";
import { Textarea } from "@/components/ui/textarea";
import { ImproveTextButton } from "@/components/ui/improve-text-button";

export function Step2Beneficiaries() {
  const { state, dispatch, nextStep, prevStep, saveDraft } = useCampaignForm();
  const [error, setError] = useState<string | null>(null);

  // Validate description length
  const validateDescription = (text: string) => {
    if (text.length < 10) {
      setError("La descripción debe tener al menos 10 caracteres");
      return false;
    }
    if (text.length > 600) {
      setError("La descripción no puede tener más de 600 caracteres");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = e.target.value;
    dispatch({
      type: "SET_BENEFICIARIES_DESCRIPTION",
      payload: text,
    });
    validateDescription(text);
  };

  const handleSubmit = async () => {
    if (!validateDescription(state.beneficiariesDescription)) {
      return;
    }

    try {
      dispatch({ type: "SET_SUBMITTING", payload: true });

      // Save draft before proceeding
      await saveDraft();

      // Move to next step
      nextStep();
    } catch (error) {
      console.error("Error saving beneficiaries description:", error);
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  if (state.isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-lg">Guardando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Beneficiaries Description */}
      <div className="py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="pt-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Describe los beneficiarios
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Explica quiénes serán los beneficiarios de tu campaña y cómo
              utilizarás los fondos recaudados para ayudarlos. Sé transparente y
              específico sobre el impacto que esperas lograr.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-2">
                  Descripción de los beneficiarios
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Describe quiénes son los beneficiarios y cómo utilizarás los fondos para ayudarlos"
                    rows={8}
                    className={`w-full rounded-lg border ${error ? "border-red-500" : "border-black"} bg-white shadow-sm focus:border-[#478C5C] focus:ring-[#478C5C] focus:ring-0 p-4`}
                    value={state.beneficiariesDescription}
                    onChange={handleDescriptionChange}
                    maxLength={600}
                  />
                  <div className="flex justify-between items-center mt-1">
  <ImproveTextButton
    text={state.beneficiariesDescription}
    fieldType="beneficiaries"
    onAccept={(improved) => {
      dispatch({
        type: "SET_BENEFICIARIES_DESCRIPTION",
        payload: improved,
      });
    }}
  />
  <span className="text-sm text-gray-500">
    {state.beneficiariesDescription.length}/600
  </span>
</div>
                  {error && (
                    <div className="text-red-500 text-sm mt-1">{error}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          onClick={handleSubmit}
          className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-12 py-6 rounded-full text-xl"
          disabled={state.isSubmitting}
        >
          {state.isSubmitting ? (
            <div className="flex items-center gap-2">
              <InlineSpinner className="text-white" />
              <span>Guardando...</span>
            </div>
          ) : (
            "Continuar"
          )}
        </Button>
      </div>
    </div>
  );
}
