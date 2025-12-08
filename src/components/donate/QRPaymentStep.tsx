"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";

interface QRPaymentStepProps {
  donationId: string;
  amount: number;
  campaignId: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

export function QRPaymentStep({
  donationId,
  amount,
  campaignId,
  onPaymentConfirmed,
  onCancel,
}: QRPaymentStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    qrImage: string;
    alias: string;
    expiresAt: string;
  } | null>(null);
  const [status, setStatus] = useState<"PENDING" | "PAID" | "EXPIRED" | "ERROR">("PENDING");
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate QR on mount
  useEffect(() => {
    generateQR();
    return () => stopPolling();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    setStatus("PENDING");
    
    try {
      const response = await fetch("/api/bisa/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, amount, campaignId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate QR");
      }

      setQrData(data.data);
      startPolling(data.data.alias);
    } catch (err) {
      console.error("Error generating QR:", err);
      setError(err instanceof Error ? err.message : "Error generating QR");
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (alias: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    
    pollInterval.current = setInterval(async () => {
      await checkStatus(alias);
    }, 5000); // Poll every 5 seconds
  };

  const stopPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
  };

  const checkStatus = async (alias: string) => {
    try {
      const response = await fetch(`/api/bisa/status/${alias}`);
      const data = await response.json();

      if (data.success && data.data.status === "PAGADO") {
        setStatus("PAID");
        stopPolling();
        setTimeout(() => {
            onPaymentConfirmed();
        }, 1500);
      } else if (data.data?.status === "EXPIRADO") {
        setStatus("EXPIRED");
        stopPolling();
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const handleManualCheck = async () => {
    if (qrData?.alias) {
      setLoading(true);
      await checkStatus(qrData.alias);
      setLoading(false);
    }
  };

  if (loading && !qrData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Generando código QR...</p>
      </div>
    );
  }

  if (status === "PAID") {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-[#2c6e49] mb-2">¡Pago Confirmado!</h3>
        <p className="text-gray-600">Tu donación ha sido procesada correctamente.</p>
      </div>
    );
  }

  if (error || status === "ERROR") {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error || "Ocurrió un error al procesar el pago."}</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={generateQR} className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm max-w-md mx-auto">
      <h3 className="text-xl font-bold text-[#2c6e49] mb-6">Escanea el código QR</h3>
      
      {qrData && (
        <div className="relative w-64 h-64 mb-6 border-2 border-gray-100 rounded-lg overflow-hidden">
          <Image 
            src={`data:image/png;base64,${qrData.qrImage}`} 
            alt="QR de pago" 
            fill
            className="object-contain"
          />
        </div>
      )}

      <div className="text-center mb-6">
        <p className="text-lg font-semibold mb-1">Monto a pagar: Bs. {amount.toFixed(2)}</p>
        <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" /> Vence: {qrData?.expiresAt}
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <ol className="list-decimal pl-4 space-y-1">
            <li>Abre la aplicación de tu banco</li>
            <li>Selecciona la opción "Pago con QR" o "Cobro Simple"</li>
            <li>Escanea el código mostrado arriba</li>
            <li>Confirma el pago en tu celular</li>
          </ol>
        </div>

        <Button 
          onClick={handleManualCheck} 
          className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white py-6 text-lg"
          disabled={loading}
        >
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          Ya realicé el pago
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="w-full text-gray-500 hover:text-gray-700"
        >
          Cancelar y volver
        </Button>
      </div>
    </div>
  );
}
