"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProfileData } from "@/types";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  CheckCircle,
  Bell,
  BarChart,
  Users,
  LibraryBig,
  ArrowRight,
  Building2,
  DollarSign,
  Save,
} from "lucide-react";

interface AdminDashboardContentProps {
  profile: ProfileData | null;
}

export function AdminDashboardContent({ profile }: AdminDashboardContentProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [exchangeRate, setExchangeRate] = useState("");
  const [savedExchangeRate, setSavedExchangeRate] = useState<number | null>(
    null
  );
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSavingExchangeRate, setIsSavingExchangeRate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        setIsLoadingExchangeRate(true);
        const response = await fetch(
          "/api/admin/platform-settings/exchange-rate",
          { cache: "no-store" }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo cargar el tipo de cambio");
        }

        if (!isMounted) return;

        const rate = Number(data.usdToBobExchangeRate);
        setSavedExchangeRate(rate);
        setExchangeRate(String(rate));
      } catch (error) {
        if (!isMounted) return;

        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo cargar el tipo de cambio",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoadingExchangeRate(false);
        }
      }
    };

    loadExchangeRate();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExchangeRateSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const rate = Number(exchangeRate);

    if (!Number.isFinite(rate) || rate <= 0) {
      toast({
        title: "Tipo de cambio inválido",
        description: "Ingresa un número mayor a cero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingExchangeRate(true);
      const response = await fetch(
        "/api/admin/platform-settings/exchange-rate",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usdToBobExchangeRate: rate }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar el tipo de cambio");
      }

      const savedRate = Number(data.usdToBobExchangeRate);
      setSavedExchangeRate(savedRate);
      setExchangeRate(String(savedRate));

      toast({
        title: "Tipo de cambio actualizado",
        description: `1 USD = Bs. ${savedRate.toFixed(4)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el tipo de cambio",
        variant: "destructive",
      });
    } finally {
      setIsSavingExchangeRate(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();

      // Use history API to clean up URL state
      window.history.pushState({}, "", "/");

      // Force redirect to homepage
      router.replace("/");

      // Show toast notification
      toast({
        title: "Éxito",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-5">
      <div className="rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Panel Administrativo</h2>
        <p>
          Bienvenido al panel administrativo, {profile?.name || "Administrador"}
          . Desde aquí puedes gestionar todas las campañas, usuarios y
          configuraciones de la plataforma.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 w-fit">
        <div className="flex items-center mb-4">
          <DollarSign className="h-6 w-6 mr-2 text-[#2c6e49]" />
          <h3 className="text-xl font-semibold">Tipo de cambio</h3>
        </div>
        <form
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center "
          onSubmit={handleExchangeRateSubmit}
        >
          <div>
            <label
              htmlFor="usd-to-bob-exchange-rate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tipo de cambio bs/$:
            </label>
            <Input
              id="usd-to-bob-exchange-rate"
              type="number"
              min="0.0001"
              step="0.0001"
              inputMode="decimal"
              value={exchangeRate}
              onChange={(event) => setExchangeRate(event.target.value)}
              disabled={isLoadingExchangeRate || isSavingExchangeRate}
              placeholder="6.9600"
            />
            <p className="text-sm text-gray-500 mt-2">
              {savedExchangeRate
                ? `Actual: 1 USD = Bs. ${savedExchangeRate.toFixed(4)}`
                : "Se usará para convertir donaciones por tarjeta a Bs."}
            </p>
          </div>
          <Button
            type="submit"
            disabled={isLoadingExchangeRate || isSavingExchangeRate}
            className="bg-[#2c6e49] hover:bg-[#24583b] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSavingExchangeRate ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4">Gestión de Plataforma</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <BarChart className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Estadísticas</h3>
          </div>
          <p className="text-gray-600 mb-6 h-24">
            Visualiza métricas detalladas sobre campañas, donaciones, usuarios y
            desempeño general de la plataforma.
          </p>
          <Link
            href="/dashboard/analytics"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Ver estadísticas <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Verificación</h3>
          </div>
          <p className="text-gray-600 mb-6 h-24">
            Revisa y aprueba solicitudes de verificación de campañas. Valida la
            documentación y autenticidad de los organizadores.
          </p>
          <Link
            href="/dashboard/verification"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Gestionar verificaciones <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Notificaciones</h3>
          </div>
          <p className="text-gray-600 mb-6 h-24">
            Envía notificaciones sobre actualizaciones de la plataforma a los
            usuarios que han dado su consentimiento.
          </p>
          <Link
            href="/dashboard/notifications/admin"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Gestionar notificaciones <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 mt-8">Gestión de Contenido</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <LibraryBig className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Campañas</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Administra todas las campañas activas, revisa contenido y realiza
            modificaciones cuando sea necesario.
          </p>
          <Link
            href="/dashboard/campaigns"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Gestionar campañas <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Usuarios</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Visualiza y administra las cuentas de usuarios, permisos y roles
            dentro de la plataforma.
          </p>
          <Link
            href="/dashboard/users"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Gestionar usuarios <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <Building2 className="h-6 w-6 mr-2 text-[#2c6e49]" />
            <h3 className="text-xl font-semibold">Personas Jurídicas</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Gestiona las organizaciones registradas que pueden crear campañas
            institucionales en la plataforma.
          </p>
          <Link
            href="/dashboard/legal-entities"
            className="text-[#2c6e49] hover:underline font-medium flex items-center"
          >
            Gestionar organizaciones <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
