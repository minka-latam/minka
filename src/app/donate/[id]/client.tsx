"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, QrCode, Bell } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCampaign } from "@/hooks/useCampaign";
import { Switch } from "@/components/ui/switch";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define donation amount options
const DONATION_AMOUNTS = [
  { value: 50, label: "Bs. 50" },
  { value: 100, label: "Bs. 100" },
  { value: 200, label: "Bs. 200" },
  { value: 500, label: "Bs. 500" },
];

// Define payment methods
const PAYMENT_METHODS = [
  {
    id: "card",
    title: "Tarjeta de crédito/débito",
    description:
      "Ingresa los detalles de tu tarjeta de crédito o débito para procesar tu donación.",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    id: "qr",
    title: "Código QR",
    description:
      "Abre la aplicación de tu banco, escanea el código QR y sigue las instrucciones.",
    icon: <QrCode className="h-6 w-6" />,
  },
];

// Create a client component that uses params
export function DonatePageContent({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Use our custom hook to fetch campaign data
  const {
    campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaign(campaignId);

  // Add user state
  const [user, setUser] = useState<any>(null);

  // State variables
  const [step, setStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [receiveNotifications, setReceiveNotifications] = useState(false);
  const [minkaContribution, setMinkaContribution] = useState<number>(5);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showNotificationSection, setShowNotificationSection] = useState(false);
  const [selectedAmountIndex, setSelectedAmountIndex] = useState(0);
  const [selectedPaymentMethodIndex, setSelectedPaymentMethodIndex] = useState<
    number | null
  >(null);
  const [donationId, setDonationId] = useState<string | null>(null);

  // Read redirect parameters from Tripto checkout
  const searchParams = useSearchParams();

  // For Tripto redirects
  const status = searchParams.get("status");

  // State for error notification
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation state for step transitions
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "forward" | "backward"
  >("forward");

  // Custom tip state
  const [tipMode, setTipMode] = useState<"percentage" | "custom">("percentage");
  const [customTipAmount, setCustomTipAmount] = useState<string>("");

  // Donation confirmation state
  const [isDonationConfirmed, setIsDonationConfirmed] = useState(false);

  // Share functionality state
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };

    checkUser();
  }, [supabase]);

  // Tripto redirect handler
  useEffect(() => {
    if (!status) return;

    if (status === "success") {
      console.log("[TRIPTO] Redirect success");
      setShowSuccessModal(true);

      router.refresh();
    }

    if (status === "failed") {
      console.warn("[TRIPTO] Redirect failed");
      setErrorMessage("Tu pago no se completó. Por favor inténtalo nuevamente.");
    }

    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [status, router]);

  // Calculate donation details
  const donationAmount =
    selectedAmount || (customAmount ? Number.parseFloat(customAmount) : 0);
  const platformFee =
    tipMode === "percentage"
      ? donationAmount * (minkaContribution / 100)
      : Number.parseFloat(customTipAmount) || 0; // User-selected percentage or custom amount for platform fee
  const totalAmount = donationAmount + platformFee;

  // Handle amount selection
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  // Handle custom amount input
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomAmount(value);
      setSelectedAmount(null);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    // Set the selectedPaymentMethodIndex based on the method ID
    const index = PAYMENT_METHODS.findIndex((pm) => pm.id === method);
    if (index !== -1) {
      setSelectedPaymentMethodIndex(index);
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (
      step === 1 &&
      (selectedAmount || (customAmount && Number.parseFloat(customAmount) > 0))
    ) {
      setIsAnimating(true);
      setAnimationDirection("forward");
      setTimeout(() => {
        setStep(2);
        setIsAnimating(false);
      }, 300);
    } else if (step === 2 && paymentMethod) {
      setIsAnimating(true);
      setAnimationDirection("forward");
      setTimeout(() => {
        setStep(3);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (step > 1) {
      setIsAnimating(true);
      setAnimationDirection("backward");
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  // Handle donation confirmation
  const handleConfirmDonation = async () => {
    if (!campaignId) {
      setErrorMessage('No campaign selected for donation.')
      return
    }

    // Clear any previous errors
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      // Determine selected payment method (card or qr)
      const selectedMethod =
        selectedPaymentMethodIndex !== null
          ? PAYMENT_METHODS[selectedPaymentMethodIndex].id
          : paymentMethod || 'card'

      // 🔹 Branch 1: Tripto (card)
      if (selectedMethod === 'card') {
        const response = await fetch(
          '/api/tripto/payment',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campaignId,
              donorId: user?.id ?? null,
              amount: donationAmount,
              tipAmount: platformFee,
              message: '',
              isAnonymous: !user, // same logic as antes
              notificationEnabled: receiveNotifications,
              paymentMethod: selectedMethod,
            }),
          },
        )

        const data = await response.json()

        if (!response.ok || !data.success || !data.url) {
          console.error(
            'Error initiating Tripto payment:',
            data.error,
          )
          setErrorMessage(
            data.error ||
              'Hubo un problema al iniciar el pago. Inténtalo nuevamente.',
          )
          return
        }

        // Redirect user to Tripto checkout
        window.location.href = data.url
        return // important: no seguir con el flujo viejo
      }

      // 🔹 Branch 2: flujo antiguo (QR / otros)
      const donationData = {
        campaignId: campaignId,
        amount: donationAmount,
        paymentMethod: selectedMethod,
        message: '',
        isAnonymous: !user, // Explicitly set isAnonymous flag
        notificationEnabled: receiveNotifications,
        customAmount:
          !selectedAmount && customAmount ? true : false,
      }

      const response = await fetch('/api/donation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationData),
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(
          'Error submitting donation:',
          errorData.error,
        )

        // Check specifically for auth error
        if (
          errorData.error ===
          'User must be logged in for non-anonymous donations'
        ) {
          throw new Error(
            'Debes iniciar sesión para realizar donaciones. Por favor, inicia sesión o regístrate primero.',
          )
        }

        throw new Error(
          errorData.error || 'Error submitting donation',
        )
      }

      const data = await response.json()

      // Store donation ID for notification updates
      if (data && data.donationId) {
        setDonationId(data.donationId)
      }

      // Show success modal (flujo legacy)
      setShowSuccessModal(true)
      setIsDonationConfirmed(true)
    } catch (error) {
      console.error('Error submitting donation:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error desconocido al enviar la donación',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle authentication error by redirecting to login
  const handleLoginRedirect = () => {
    // Store the current URL to redirect back after login
    const currentPath = window.location.pathname;
    router.push(`/sign-in?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Handle sign-up redirect for unauthenticated users
  const handleSignUpRedirect = () => {
    // Store the current URL to redirect back after sign-up
    const currentPath = window.location.pathname;
    router.push(`/sign-up?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Handle closing success modal
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setIsAnimating(true);
    setAnimationDirection("forward");
    setTimeout(() => {
      setStep(4); // Show step 4 with notifications options
      setIsAnimating(false);
    }, 300);
  };

  // Handle notification toggle
  const handleNotificationToggle = async (checked: boolean) => {
    // If user is trying to enable notifications but is not authenticated, redirect to sign-in
    if (checked && !user) {
      handleLoginRedirect();
      return;
    }

    setReceiveNotifications(checked);
    // If we have a donation ID, update the notification preference in the database
    if (donationId) {
      try {
        console.log(
          "Updating notification preference for donation:",
          donationId,
          "to:",
          checked
        );

        // Clear any previous errors
        setErrorMessage(null);

        // Update notification preference in the database
        const response = await fetch(`/api/donation/${donationId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationEnabled: checked }),
        });

        const responseData = await response
          .json()
          .catch(() => ({ error: "Failed to parse response" }));

        if (!response.ok) {
          console.error(
            "Failed to update notification preference:",
            responseData
          );

          // Set an error message
          setErrorMessage(
            `No se pudo actualizar la preferencia de notificación: ${responseData.error || "Error desconocido"}`
          );
          return;
        }

        console.log(
          "Successfully updated notification preference:",
          responseData
        );
      } catch (error) {
        console.error("Error updating notification preference:", error);
        setErrorMessage(
          "Error al actualizar la preferencia de notificación. Inténtalo de nuevo."
        );
      }
    } else {
      // If no donation ID yet, the preference will be saved with the donation when submitted
      console.log(
        "No donation ID available, notification preference saved for next donation"
      );
    }
  };

  // Handle slider change for Minka contribution
  const handleMinkaContributionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMinkaContribution(Number(e.target.value));
  };

  // Handle tip mode change
  const handleTipModeChange = (mode: "percentage" | "custom") => {
    setTipMode(mode);
    if (mode === "custom" && !customTipAmount) {
      setCustomTipAmount("");
    }
  };

  // Handle custom tip amount change
  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomTipAmount(value);
    }
  };

  // Share functionality
  const handleShareClick = () => {
    const shareUrl = `${window.location.origin}/campaign/${campaignId}`;
    const shareTitle = campaign?.title || "Apoya esta campaña";
    const shareText = `¡Acabo de apoyar esta campaña en Minka! ${shareTitle}`;

    // Try to use native Web Share API if available (mobile devices)
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to custom share options
          setShowShareOptions(true);
        });
    } else {
      // Show custom share options for desktop
      setShowShareOptions(true);
    }
  };

  const shareOnPlatform = (platform: string) => {
    const shareUrl = `${window.location.origin}/campaign/${campaignId}`;
    const shareTitle = campaign?.title || "Apoya esta campaña";
    const shareText = `¡Acabo de apoyar esta campaña en Minka! ${shareTitle}`;

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };

    if (platform === "copy") {
      copyToClipboard(shareUrl);
    } else if (urls[platform as keyof typeof urls]) {
      window.open(
        urls[platform as keyof typeof urls],
        "_blank",
        "width=600,height=400"
      );
      setShowShareOptions(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShowShareOptions(false);
      // You could add a toast notification here if you have the toast hook available
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };

  if (campaignLoading) {
    return <DonatePageLoading />;
  }

  if (campaignError) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-medium text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{campaignError}</p>
          <Button
            className="mt-6 bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
            onClick={() => router.push("/campaigns")}
          >
            Ver otras campañas
          </Button>
        </div>
      </div>
    );
  }

  // Default values if campaign data isn't available
  const campaignTitle = campaign?.title || "Nombre de la campaña sin especificar";
  const campaignImage =
    campaign?.media && campaign.media.length > 0
      ? campaign.media[0].media_url
      : "/placeholder.svg";
  const organizer = {
    name: campaign?.organizer?.name || "Nombre sin especificar",
    role: "Organizador de campaña",
    location:
      campaign?.location ||
      campaign?.organizer?.location ||
      "Ubicación no especificada",
    profilePicture: campaign?.organizer?.profilePicture || null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]">
      <Header />

      {/* Spacer div to account for the fixed header height */}
      <div className="h-20 md:h-28"></div>

      {/* Page header with increased height */}
      <div className="w-full h-[300px] md:h-[500px] relative border-t border-[#2c6e49]/5">
        <Image
          src="/page-header.svg"
          alt="Page Header"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-bold text-white text-center">
            Impulsa sueños con tu donación
          </h1>
        </div>
      </div>

      {/* Campaign info header - updated to match design */}
      <div className="w-full py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left md:flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2c6e49] mb-4">
                Protejamos juntos el {campaignTitle}
              </h2>

              {/* Organizer details without background */}
              <div className="inline-flex items-center pl-1 pr-4 py-1">
                <div className="w-8 h-8 rounded-full bg-[#2c6e49] flex-shrink-0 mr-2 overflow-hidden">
                  {organizer.profilePicture ? (
                    <Image
                      src={organizer.profilePicture}
                      alt={organizer.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs">
                      {organizer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[#2c6e49]">
                    {organizer.name}
                  </span>
                  <div className="flex text-xs text-gray-600">
                    <span>
                      {organizer.role} | {organizer.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:flex-1">
              <div className="rounded-lg overflow-hidden h-[180px] max-w-[400px] mx-auto">
                <Image
                  src={campaignImage}
                  alt={campaignTitle}
                  width={400}
                  height={180}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator between campaign details and form */}
      <div className="w-full flex justify-center">
        <div className="w-[90%] border-t border-gray-200"></div>
      </div>

      {/* Main content */}
      <main className="overflow-x-hidden">
        <div className="container mx-auto py-12">
          {showNotificationSection ? (
            <div className="max-w-2xl mx-auto rounded-lg bg-green-50 p-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Bell className="h-6 w-6 text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    Recibe actualizaciones sobre tu donación (opcional)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Puedes recibir notificaciones sobre el progreso de la
                    campaña y cómo se está utilizando tu donación para ayudar.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notification-toggle"
                        checked={receiveNotifications}
                        onCheckedChange={handleNotificationToggle}
                      />
                      <label
                        htmlFor="notification-toggle"
                        className="cursor-pointer"
                      >
                        {receiveNotifications
                          ? "Recibirás notificaciones"
                          : "No recibirás notificaciones"}
                      </label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push("/campaign")}
                      className="px-6 py-2 bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-md"
                    >
                      Volver a la campaña
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Choose donation amount */}
              {step === 1 && (
                <div
                  className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="min-h-[600px] flex items-center justify-center">
                    <div className="w-full max-w-3xl mx-auto px-4">
                      {/* Title and description moved to top and centered */}
                      <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6 leading-tight">
                          Elige el monto de tu donación
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                          Selecciona un monto o ingresa la cantidad que
                          prefieras y contribuye a generar impacto. Minka
                          retiene un porcentaje de donación para cubrir costos
                          operativos y garantizar el funcionamiento seguro de la
                          plataforma.
                        </p>
                      </div>

                      {/* Donation form centered */}
                      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-black">
                        <h3 className="text-lg font-semibold text-black mb-4">
                          Selecciona un monto
                        </h3>

                        {/* Predefined amounts */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {DONATION_AMOUNTS.map((option, index) => (
                            <button
                              key={option.value}
                              type="button"
                              className={`py-3 px-4 rounded-lg border ${
                                selectedAmount === option.value
                                  ? "border-[#2c6e49] bg-[#2c6e49] text-white"
                                  : "border-black hover:bg-gray-100 text-black"
                              } transition-colors`}
                              onClick={() => handleAmountSelect(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        {/* Separator with "o" */}
                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-3 text-sm text-gray-500 font-medium">
                              o
                            </span>
                          </div>
                        </div>

                        {/* Custom amount */}
                        <div className="mb-6">
                          <label
                            htmlFor="custom-amount"
                            className="block text-sm font-medium text-black mb-2"
                          >
                            Si prefieres, indica otra cantidad
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                              Bs.
                            </span>
                            <input
                              type="text"
                              id="custom-amount"
                              className="block w-full pl-10 pr-3 py-3 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black"
                              placeholder="1.300,00"
                              value={customAmount}
                              onChange={handleCustomAmountChange}
                            />
                          </div>
                        </div>

                        {/* Donation info - updated with slider - border and bg removed */}
                        <div className="mb-6">
                          <p className="text-sm text-black mb-3">
                            ¿Quieres apoyar a Minka? Una contribución voluntaria
                            adicional te permite ser parte de la comunidad
                            solidaria por excelencia.
                          </p>

                          {/* Tip mode toggle */}
                          <div className="flex gap-2 mb-4">
                            <button
                              type="button"
                              className={`px-3 py-2 text-sm rounded-md border ${
                                tipMode === "percentage"
                                  ? "bg-[#2c6e49] text-white border-[#2c6e49]"
                                  : "bg-white text-black border-black hover:bg-gray-100"
                              } transition-colors`}
                              onClick={() => handleTipModeChange("percentage")}
                            >
                              Porcentaje
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-2 text-sm rounded-md border ${
                                tipMode === "custom"
                                  ? "bg-[#2c6e49] text-white border-[#2c6e49]"
                                  : "bg-white text-black border-black hover:bg-gray-100"
                              } transition-colors`}
                              onClick={() => handleTipModeChange("custom")}
                            >
                              Cantidad personalizada
                            </button>
                          </div>

                          {/* Percentage mode */}
                          {tipMode === "percentage" && (
                            <div className="space-y-2">
                              {/* Percentage indicator above the slider */}
                              <div className="relative h-8">
                                <div
                                  className="absolute -top-2 transform -translate-x-1/2 text-[#2c6e49] text-lg font-semibold"
                                  style={{ left: `${minkaContribution}%` }}
                                >
                                  {minkaContribution}%
                                </div>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={minkaContribution}
                                onChange={handleMinkaContributionChange}
                                className="w-full h-2 rounded-full appearance-none bg-gray-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2c6e49]"
                              />
                            </div>
                          )}

                          {/* Custom amount mode */}
                          {tipMode === "custom" && (
                            <div className="space-y-2">
                              <label
                                htmlFor="custom-tip"
                                className="block text-sm font-medium text-black"
                              >
                                Ingresa el monto de tu contribución
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-black">
                                  Bs.
                                </span>
                                <input
                                  type="text"
                                  id="custom-tip"
                                  className="block w-full pl-10 pr-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-black"
                                  placeholder="0,00"
                                  value={customTipAmount}
                                  onChange={handleCustomTipChange}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-black">
                              Tu contribución a Minka:
                            </span>
                            <span className="text-sm font-medium text-black">
                              Bs. {platformFee.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Choose payment method */}
              {step === 2 && (
                <div
                  className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="min-h-[600px] flex items-center justify-center">
                    <div className="w-full max-w-3xl mx-auto px-4">
                      {/* Title and description moved to top and centered */}
                      <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6 leading-tight">
                          Elige el método de pago
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                          Marca el método de pago con el que deseas realizar tu
                          aporte. Tu donación está protegida.
                        </p>
                      </div>

                      {/* Payment method cards centered */}
                      <div className="space-y-4">
                        {/* Credit/Debit Card Option */}
                        <div
                          className={`bg-white rounded-lg p-8 border ${
                            paymentMethod === "card"
                              ? "border-[#2c6e49]"
                              : "border-black"
                          } cursor-pointer hover:border-[#2c6e49] transition-colors`}
                          onClick={() => handlePaymentMethodSelect("card")}
                        >
                          <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center">
                                {paymentMethod === "card" ? (
                                  <div className="h-3 w-3 rounded-full bg-[#2c6e49]"></div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
                              <Image
                                src="/icons/credit_card_heart.svg"
                                alt="Credit Card"
                                width={32}
                                height={32}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800 text-lg mb-2">
                                Tarjeta de crédito/débito
                              </h3>
                              <p className="text-base text-gray-600">
                                Ingresa los detalles de tu tarjeta de crédito o
                                débito para procesar tu donación.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Option */}
                        <div
                          className={`bg-white rounded-lg p-8 border ${
                            paymentMethod === "qr"
                              ? "border-[#2c6e49]"
                              : "border-black"
                          } cursor-pointer hover:border-[#2c6e49] transition-colors`}
                          onClick={() => handlePaymentMethodSelect("qr")}
                        >
                          <div className="flex items-start gap-6">
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center">
                                {paymentMethod === "qr" ? (
                                  <div className="h-3 w-3 rounded-full bg-[#2c6e49]"></div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
                              <Image
                                src="/icons/qr_code.svg"
                                alt="QR Code"
                                width={32}
                                height={32}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800 text-lg mb-2">
                                Código QR
                              </h3>
                              <p className="text-base text-gray-600">
                                Abre la aplicación de tu banco, escanea el
                                código QR y sigue las instrucciones.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm donation */}
              {step === 3 && (
                <div
                  className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="min-h-[600px] flex items-center justify-center">
                    <div className="w-full max-w-3xl mx-auto px-4">
                      {/* Title and description moved to top and centered */}
                      <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6 leading-tight">
                          Confirma tu donación
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                          Tu ayuda está a un paso de impulsar sueños. Confirma
                          tu aporte y haz crecer esta causa.
                        </p>
                      </div>

                      {/* Confirmation form centered */}
                      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-black">
                        <div className="flex flex-col items-center mb-6">
                          <Image
                            src="/landing-page/step-4.svg"
                            alt="Donation"
                            width={60}
                            height={60}
                            className="mb-2"
                          />
                          <h3 className="text-lg font-medium text-center text-[#2c6e49]">
                            Tu donación
                          </h3>
                        </div>

                        {/* Donation summary */}
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tu donación</span>
                            <span className="font-medium">
                              Bs. {donationAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Aporte adicional a Minka
                            </span>
                            <span className="font-medium">
                              Bs. {platformFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-3 flex justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-medium">
                              Bs. {totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Disclaimer about Minka fee */}
                        <div className="bg-[#f5f7e9] border border-[#2c6e49]/20 rounded-lg p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <svg
                                className="h-5 w-5 text-[#2c6e49]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-[#2c6e49] font-medium mb-1">
                                Acerca del aporte adicional a Minka
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                El 5% de tu donación va a Minka para mantener la
                                plataforma funcionando, procesar pagos de forma
                                segura y brindar soporte a las campañas.
                                Adicionalmente, puedes agregar un aporte
                                voluntario extra en el paso anterior.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Error notification */}
                        {errorMessage && (
                          <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-red-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm">{errorMessage}</p>
                                {errorMessage.includes("iniciar sesión") && (
                                  <Button
                                    className="mt-2 bg-white border border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={handleLoginRedirect}
                                  >
                                    Iniciar sesión
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Notification preferences */}
              {step === 4 && (
                <div
                  className={`transition-opacity duration-500 ${isAnimating ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="min-h-[600px] flex items-center justify-center">
                    <div className="w-full max-w-3xl mx-auto px-4">
                      {/* Title and description moved to top and centered */}
                      <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6 leading-tight">
                          Recibe actualizaciones sobre tu donación (opcional)
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                          Sigue el avance de la campaña y descubre el impacto de
                          tu aporte.
                        </p>
                        {/* Clarification for unregistered users */}
                        {!user && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                            <p className="text-sm text-blue-800">
                              <strong>Nota:</strong> Para activar las
                              notificaciones, serás dirigido a crear una cuenta.
                              Una vez registrado, podrás recibir actualizaciones
                              sobre el progreso de esta campaña y el impacto de
                              tu donación.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notification preferences form centered */}
                      <div
                        className={`bg-white rounded-lg shadow-sm p-6 mb-8 border ${receiveNotifications ? "border-[#2c6e49]" : "border-black"} hover:border-[#2c6e49] transition-colors`}
                      >
                        <div
                          className="flex items-start space-x-4 cursor-pointer"
                          onClick={() =>
                            handleNotificationToggle(!receiveNotifications)
                          }
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-6 w-6 rounded-full border border-gray-300 flex items-center justify-center">
                              {receiveNotifications ? (
                                <div className="h-3 w-3 rounded-full bg-[#2c6e49]"></div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <Image
                                src="/icons/notifications.svg"
                                alt="Notifications"
                                width={28}
                                height={28}
                                className="mt-1"
                              />
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  Recibir notificaciones
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Recibe actualizaciones por correo electrónico
                                  y/o SMS
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show error message if there is one */}
                      {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4">
                          <span className="block sm:inline">
                            {errorMessage}
                          </span>
                          <button
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                            onClick={() => setErrorMessage(null)}
                          >
                            <span className="sr-only">Cerrar</span>
                            <svg
                              className="h-6 w-6 text-red-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="max-w-3xl mx-auto mt-8 mb-4 px-4 flex justify-between">
                {/* Volver button - always present but invisible in step 1 */}
                <Button
                  className={`bg-white border border-[#2c6e49] text-[#2c6e49] hover:bg-[#e8f0e9] rounded-full px-6 py-2 ${
                    step === 1 || isDonationConfirmed ? "invisible" : "visible"
                  }`}
                  onClick={handleBack}
                  disabled={step === 1 || isDonationConfirmed}
                >
                  Volver
                </Button>

                {/* Continuar button - always positioned on the right */}
                {step < 3 && !isDonationConfirmed && (
                  <Button
                    className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full"
                    onClick={handleContinue}
                    disabled={
                      (step === 1 &&
                        !selectedAmount &&
                        (!customAmount ||
                          Number.parseFloat(customAmount) <= 0)) ||
                      (step === 2 && !paymentMethod)
                    }
                  >
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Confirmar donación button for step 3 */}
                {step === 3 && !isDonationConfirmed && (
                  <Button
                    className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full"
                    onClick={handleConfirmDonation}
                    disabled={isSubmitting}
                  >
                    Confirmar donación <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {/* Completar button for step 4 */}
                {step === 4 && (
                  <Button
                    className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white px-8 py-3 rounded-full"
                    onClick={() => router.push(`/campaign/${campaignId}`)}
                  >
                    Completar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-800/75 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full relative shadow-xl">
            {/* Darker header with X button */}
            <div className="bg-[#FCF9ED] p-3 flex justify-end">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseSuccessModal}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Content area with cream background */}
            <div className="bg-[#FFFDF7] text-center p-8">
              {/* Heart icon from SVG */}
              <div className="mx-auto flex justify-center">
                <Image
                  src="/icons/heart.svg"
                  alt="Heart"
                  width={48}
                  height={48}
                  priority
                />
              </div>

              <h3 className="mt-3 text-xl font-bold text-gray-900">
                ¡Gracias por ser parte del cambio!
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Tu aporte ayuda a construir un futuro mejor.
              </p>

              <p className="mt-1 text-sm text-gray-600">
                ¡Juntos somos más fuertes!
              </p>

              {/* Account creation prompt for unauthenticated users */}
              {!user && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="text-[#2c6e49] font-medium">
                    Crea una cuenta para seguir el impacto de tu donación
                  </span>
                </p>
              )}

              {/* Share section */}
              <div className="mt-4">
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-[#2c6e49] hover:text-[#1e4d33] border border-[#2c6e49] hover:border-[#1e4d33] rounded-full transition-colors"
                    onClick={handleShareClick}
                  >
                    Compartir campaña
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                  </button>

                  {/* Share Options Dropdown */}
                  {showShareOptions && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-10 w-64">
                      <div className="text-sm font-medium text-gray-700 mb-3 text-center">
                        Compartir en:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => shareOnPlatform("whatsapp")}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Image
                            src="/social-media/whatsapp.svg"
                            alt="WhatsApp"
                            width={20}
                            height={20}
                          />
                          <span className="text-sm">WhatsApp</span>
                        </button>

                        <button
                          onClick={() => shareOnPlatform("facebook")}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Image
                            src="/social-media/facebook.svg"
                            alt="Facebook"
                            width={20}
                            height={20}
                          />
                          <span className="text-sm">Facebook</span>
                        </button>

                        <button
                          onClick={() => shareOnPlatform("twitter")}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Image
                            src="/social-media/X.svg"
                            alt="X (Twitter)"
                            width={20}
                            height={20}
                          />
                          <span className="text-sm">X (Twitter)</span>
                        </button>

                        <button
                          onClick={() => shareOnPlatform("linkedin")}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <Image
                            src="/icons/LinkedIN_white.svg"
                            alt="LinkedIn"
                            width={20}
                            height={20}
                            style={{ filter: "brightness(0.43)" }}
                          />
                          <span className="text-sm">LinkedIn</span>
                        </button>

                        <button
                          onClick={() => shareOnPlatform("copy")}
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors col-span-2"
                        >
                          <svg
                            className="h-5 w-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm">Copiar enlace</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setShowShareOptions(false)}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Black separator */}
              <div className="border-t border-black my-4"></div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="inline-flex justify-center border-0 bg-[#2c6e49] px-16 py-2 text-sm font-medium text-white hover:bg-[#1e4d33] focus:outline-none rounded-full"
                  onClick={handleCloseSuccessModal}
                >
                  Inicio
                </button>

                {/* Account creation button for unauthenticated users */}
                {!user && (
                  <button
                    type="button"
                    className="block mx-auto text-sm text-[#2c6e49] hover:text-[#1e4d33] underline focus:outline-none transition-colors"
                    onClick={handleLoginRedirect}
                  >
                    Iniciar sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close share options */}
      {showShareOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareOptions(false)}
        />
      )}
    </div>
  );
}

// Loading fallback component
export function DonatePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" showText={true} text="Cargando..." />
      </div>
    </div>
  );
}
