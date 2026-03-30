"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";

interface ImproveTextButtonProps {
  text: string;
  fieldType: "title" | "description" | "story" | "beneficiaries";
  onAccept: (improvedText: string) => void;
}

export function ImproveTextButton({
  text,
  fieldType,
  onAccept,
}: ImproveTextButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async () => {
    if (!text || text.trim().length < 10) {
      setError("Escribe al menos 10 caracteres antes de mejorar el texto");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fieldType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al mejorar el texto");
      }

      setImprovedText(data.improvedText);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptImproved = () => {
    if (improvedText) {
      onAccept(improvedText);
      setIsModalOpen(false);
      setImprovedText(null);
    }
  };

  const handleKeepOriginal = () => {
    setIsModalOpen(false);
    setImprovedText(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleImprove}
          disabled={isLoading || !text || text.trim().length < 10}
          className="text-[#2c6e49] border-[#2c6e49] hover:bg-[#2c6e49] hover:text-white text-xs h-7"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Mejorando...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              ✨ Mejorar texto con IA
            </>
          )}
        </Button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-[#2c6e49] text-xl font-semibold">
            ✨ Comparar versiones
          </DialogTitle>
          <p className="text-sm text-gray-500 mb-4">
            Elige cuál versión prefieres usar para tu campaña.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Tu versión</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleKeepOriginal}
                  className="text-xs h-7"
                >
                  Usar esta
                </Button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
            </div>

            {/* Improved */}
            <div className="border-2 border-[#2c6e49] rounded-lg p-4 bg-[#f5f7e9]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[#2c6e49] flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Versión mejorada
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAcceptImproved}
                  className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white text-xs h-7"
                >
                  Usar esta
                </Button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {improvedText}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}