"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserDonationDetails } from "@/hooks/use-user-donations";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@@supabase/ssr";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DonationDetailsProps {
  id: string;
}

export default function DonationDetails({ id }: DonationDetailsProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const {
    donation,
    isLoading: isDonationLoading,
    isError,
  } = useUserDonationDetails(id);

  // Check user authentication
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/sign-in");
      } else {
        setHasSession(true);
      }
      setIsAuthLoading(false);
    };

    checkSession();
  }, [supabase, router]);

  // Show loading while checking auth or fetching donation
  if (isAuthLoading || isDonationLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <LoadingSpinner
          size="md"
          showText
          text="Cargando detalles de la donación..."
        />
      </div>
    );
  }

  // If user is not authenticated, this will redirect (see useEffect)
  if (!hasSession) {
    return null;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="bg-red-50 rounded-lg p-6 text-red-500 text-center">
          <p className="mb-4">
            No se pudo cargar los detalles de esta donación.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/donations")}
          >
            Volver al historial de donaciones
          </Button>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">
            No se encontró la donación solicitada.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/donations")}
          >
            Volver al historial de donaciones
          </Button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get payment status display
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="success"
            className="flex items-center gap-1 px-3 py-1"
          >
            <CheckCircle className="h-4 w-4" />
            Donación Completada
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="warning"
            className="flex items-center gap-1 px-3 py-1"
          >
            <Clock className="h-4 w-4" />
            Donación Pendiente
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" className="flex items-center gap-1 px-3 py-1">
            <XCircle className="h-4 w-4" />
            Donación Fallida
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="info" className="flex items-center gap-1 px-3 py-1">
            <RotateCcw className="h-4 w-4" />
            Donación Reembolsada
          </Badge>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.push("/dashboard/donations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          Detalles de la donación
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-48 w-full">
              {donation.campaign.media && donation.campaign.media.length > 0 ? (
                <Image
                  src={donation.campaign.media[0].mediaUrl}
                  alt={donation.campaign.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-400">No hay imagen disponible</p>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">
                {donation.campaign.title}
              </h2>
              <div className="text-sm text-gray-500 capitalize mb-4">
                {donation.campaign.category.replace(/_/g, " ")}
              </div>
              <p className="text-gray-700 mb-4">
                {donation.campaign.description}
              </p>
              <div className="mt-6">
                <Button
                  className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
                  asChild
                >
                  <Link href={`/campaign/${donation.campaign.id}`}>
                    Ver campaña
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">
            Información de la donación
          </h3>

          <div className="mb-4">
            {getPaymentStatusDisplay(donation.payment_status)}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Monto</div>
              <div className="text-2xl font-bold">
                {donation.currency} {donation.amount.toFixed(2)}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center mb-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Fecha de donación
              </div>
              <div className="text-gray-700">
                {formatDate(donation.created_at)}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center mb-2 text-sm text-gray-500">
                <CreditCard className="h-4 w-4 mr-2" />
                Método de pago
              </div>
              <div className="text-gray-700 capitalize">
                {donation.payment_method.replace(/_/g, " ")}
              </div>
            </div>

            {donation.message && (
              <div className="pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-2">Tu mensaje</div>
                <div className="text-gray-700 bg-gray-50 p-3 rounded-md italic">
                  "{donation.message}"
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-500 mb-2">Donación anónima</div>
              <div className="text-gray-700">
                {donation.is_anonymous ? "Sí" : "No"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
