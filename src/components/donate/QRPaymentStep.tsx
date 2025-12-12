"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, AlertCircle, RefreshCw, Clock, Download } from "lucide-react";

interface QRPaymentStepProps {
  donationId: string;
  amount: number;
  campaignId: string;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

interface StoredQRData {
  qrImage: string;
  alias: string;
  expiresAt: string;
  donationId: string;
  amount: number;
  createdAt: string;
}

const QR_STORAGE_KEY = "minka_pending_qr";

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
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Ref to prevent double initialization in React Strict Mode
  const initializationRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const isPaidRef = useRef(false);

  // Load existing QR or generate new one on mount
  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (initializationRef.current) {
      console.log("=== useEffect skipped (already initialized) ===");
      return;
    }
    initializationRef.current = true;
    console.log("=== useEffect running (first time) ===");

    loadOrGenerateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStoredQR = (): StoredQRData | null => {
    try {
      const stored = localStorage.getItem(QR_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const storeQR = (data: { qrImage: string; alias: string; expiresAt: string }) => {
    console.log("=== storeQR called ===");
    console.log("donationId from props:", donationId);
    console.log("amount from props:", amount);
    const toStore: StoredQRData = {
      ...data,
      donationId,
      amount,
      createdAt: new Date().toISOString(),
    };
    console.log("Storing QR:", toStore);
    localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(toStore));
  };

  const clearStoredQR = () => {
    console.log("=== clearStoredQR called ===");
    console.trace("clearStoredQR stack trace:");
    localStorage.removeItem(QR_STORAGE_KEY);
  };

  const loadOrGenerateQR = async () => {
    setLoading(true);
    setError(null);

    // Check if we have a stored QR for this donation
    const storedQR = getStoredQR();
    console.log("=== loadOrGenerateQR called ===");
    console.log("Stored QR:", storedQR);
    console.log("Current donationId:", donationId);
    console.log("Stored QR donationId:", storedQR?.donationId);
    console.log("Match:", storedQR?.donationId === donationId);

    if (storedQR && storedQR.donationId === donationId) {
      // Check if the stored QR hasn't exceeded its expiration (24 hours from creation)
      const createdAt = new Date(storedQR.createdAt).getTime();
      const now = Date.now();
      const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours (QR expiration time)
      const isNotExpiredLocally = (now - createdAt) < MAX_AGE;

      if (isNotExpiredLocally) {
        // QR hasn't expired locally, use it
        // We trust the local expiration more than BISA's unreliable status API
        console.log("Found stored QR that hasn't expired locally, using it");
        setQrData({
          qrImage: storedQR.qrImage,
          alias: storedQR.alias,
          expiresAt: storedQR.expiresAt,
        });
        setLoading(false);
        return;
      }

      // QR has exceeded 24 hours, it's definitely expired
      console.log("Stored QR has exceeded 24 hours, clearing...");
      clearStoredQR();
    } else if (storedQR) {
      console.log("Stored QR is for different donation, clearing...");
      clearStoredQR();
    }

    // No valid stored QR, generate a new one
    console.log("No valid stored QR found, generating new one...");
    await generateQR();
  };

  const verifyStoredQR = async (storedQR: StoredQRData): Promise<boolean> => {
    // Don't verify if already marked as paid
    if (isPaidRef.current) {
      return false;
    }

    try {
      const response = await fetch(`/api/bisa/status/${storedQR.alias}`);
      const data = await response.json();

      // If BISA returns error (needsRegeneration), generate new QR
      if (!data.success) {
        console.log("BISA verification failed:", data.error);
        return false;
      }

      const qrStatus = data.data?.status;

      // If already paid, trigger confirmation
      if (qrStatus === "PAGADO") {
        isPaidRef.current = true;
        setStatus("PAID");
        clearStoredQR();
        setTimeout(() => onPaymentConfirmed(), 1500);
        return true;
      }

      // If expired or disabled, need new QR
      if (qrStatus === "EXPIRADO" || qrStatus === "INHABILITADO") {
        return false;
      }

      // Still pending - valid to use
      return qrStatus === "PENDIENTE";
    } catch {
      // On error, assume we need a new QR
      return false;
    }
  };

  const generateQR = async () => {
    // Prevent multiple simultaneous QR generation calls
    if (isGeneratingRef.current) {
      console.log("QR generation already in progress, skipping...");
      return;
    }
    isGeneratingRef.current = true;

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

      const qrInfo = data.data;
      setQrData(qrInfo);

      // Store QR in localStorage for persistence
      storeQR(qrInfo);
    } catch (err) {
      console.error("Error generating QR:", err);
      setError(err instanceof Error ? err.message : "Error generating QR");
      setStatus("ERROR");
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const checkStatus = async (alias: string): Promise<boolean | "needs_regeneration"> => {
    // Don't check if already marked as paid
    if (isPaidRef.current) {
      return true;
    }

    try {
      const response = await fetch(`/api/bisa/status/${alias}`);
      const data = await response.json();

      console.log("Status check response:", data);

      // Handle BISA API errors - show error but DON'T clear the QR
      // The error might be temporary, let user retry or regenerate manually
      if (!data.success && data.needsRegeneration) {
        setError(data.error || "Error al consultar estado del QR. Intenta de nuevo.");
        // Don't clear QR or change status - let user retry
        return false;
      }

      if (data.success && data.data?.status === "PAGADO") {
        isPaidRef.current = true;
        setStatus("PAID");
        clearStoredQR(); // Clear from localStorage on successful payment
        setTimeout(() => {
          onPaymentConfirmed();
        }, 1500);
        return true;
      } else if (data.data?.status === "EXPIRADO") {
        setStatus("EXPIRED");
        clearStoredQR();
        return false;
      } else if (data.data?.status === "INHABILITADO") {
        setError("Este código QR ha sido inhabilitado");
        setStatus("ERROR");
        clearStoredQR();
        return false;
      }
      return false;
    } catch (err) {
      console.error("Error checking status:", err);
      return false;
    }
  };

  const handleManualCheck = async () => {
    console.log("=== handleManualCheck called ===");
    console.log("qrData:", qrData);
    console.log("initializationRef.current:", initializationRef.current);
    if (!qrData?.alias) return;

    setCheckingPayment(true);
    setError(null);

    try {
      const response = await fetch(`/api/bisa/status/${qrData.alias}`);
      const data = await response.json();
      console.log("Status check response:", data);
      console.log("checkStatusResults result:", data.data?.status);

      if (data.success && data.data?.status === "PAGADO") {
        // Payment confirmed!
        console.log("Payment PAGADO - clearing QR and calling onPaymentConfirmed");
        isPaidRef.current = true;
        setStatus("PAID");
        clearStoredQR();
        setTimeout(() => onPaymentConfirmed(), 1500);
      } else if (data.data?.status === "PENDIENTE") {
        // Still pending - show message but keep QR, DO NOT regenerate
        console.log("Payment still PENDIENTE - showing message, NOT regenerating QR");
        setError("El pago aún no ha sido confirmado. Por favor, completa el pago con tu banco y vuelve a intentar.");
        setTimeout(() => setError(null), 5000);
      } else if (data.data?.status === "EXPIRADO") {
        // Expired - show expired UI
        console.log("Payment EXPIRADO - showing expired UI");
        setStatus("EXPIRED");
        clearStoredQR();
      } else if (data.data?.status === "INHABILITADO") {
        // Disabled - show error
        console.log("Payment INHABILITADO - showing error");
        setError("Este código QR ha sido inhabilitado");
        setStatus("ERROR");
        clearStoredQR();
      } else if (!data.success) {
        // API error - show message but DON'T clear QR
        console.log("API error - showing message but NOT clearing QR");
        setError(data.error || "Error al verificar el pago. Intenta de nuevo.");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error("Error checking status:", err);
      setError("Error de conexión. Intenta de nuevo.");
      setTimeout(() => setError(null), 5000);
    } finally {
      console.log("handleManualCheck finished");
      setCheckingPayment(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData?.qrImage) return;

    const imageData = qrData.qrImage.startsWith('data:')
      ? qrData.qrImage
      : `data:image/png;base64,${qrData.qrImage}`;

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `QR-Pago-Minka-${amount.toFixed(0)}Bs.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancel = () => {
    clearStoredQR(); // Clear stored QR when user cancels
    onCancel();
  };

  const handleRegenerateQR = () => {
    // Reset refs to allow new generation
    isGeneratingRef.current = false;
    // Clear any stored QR
    clearStoredQR();
    // Reset status
    setStatus("PENDING");
    setError(null);
    // Generate new QR
    generateQR();
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

  if (status === "EXPIRED") {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <Clock className="h-10 w-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">QR Expirado</h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">El código QR ha expirado. Genera uno nuevo para continuar con tu donación.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button onClick={handleRegenerateQR} className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Generar nuevo QR
          </Button>
        </div>
      </div>
    );
  }

  // Only show error UI for actual ERROR status (not temporary errors during PENDING)
  if (status === "ERROR") {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-6 text-center max-w-md">{error || "Ocurrió un error al procesar el pago."}</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button onClick={handleRegenerateQR} className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-lg border border-gray-200 shadow-sm max-w-lg mx-auto">
      <h3 className="text-xl md:text-2xl font-bold text-[#2c6e49] mb-6">Escanea el código QR</h3>

      {qrData && qrData.qrImage && (
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-4 border-2 border-[#2c6e49]/20 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrData.qrImage.startsWith('data:') ? qrData.qrImage : `data:image/png;base64,${qrData.qrImage}`}
            alt="QR de pago"
            className="w-full h-full object-contain p-2"
          />
        </div>
      )}
      {qrData && !qrData.qrImage && (
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-4 border-2 border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
          <p className="text-gray-500 text-center px-4">No se pudo cargar el código QR</p>
        </div>
      )}

      {qrData?.qrImage && (
        <button
          onClick={handleDownloadQR}
          className="flex items-center gap-2 text-sm text-[#2c6e49] hover:text-[#1e4d33] mb-4 transition-colors"
        >
          <Download className="h-4 w-4" />
          Guardar QR en mi dispositivo
        </button>
      )}

      <div className="text-center mb-6">
        <p className="text-xl font-semibold mb-1">Monto a pagar: Bs. {amount.toFixed(2)}</p>
        {qrData?.expiresAt && (
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Clock className="h-4 w-4" /> Vence: {qrData.expiresAt}
          </p>
        )}
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

        {/* Temporary error/info message */}
        {error && status === "PENDING" && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
            {error}
          </div>
        )}

        <Button
          onClick={handleManualCheck}
          className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white py-6 text-lg"
          disabled={checkingPayment}
        >
          {checkingPayment ? (
            <>
              <LoadingSpinner size="xs" className="mr-2" />
              Verificando pago...
            </>
          ) : (
            "Ya realicé el pago"
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleCancel}
          className="w-full text-gray-500 hover:text-gray-700"
          disabled={checkingPayment}
        >
          Cancelar y volver
        </Button>
      </div>
    </div>
  );
}
