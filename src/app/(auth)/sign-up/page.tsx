"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up/components/sign-up-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DONATION_CLAIM_INTENT_KEY } from "@/constants/donation-claim";

export default function SignUpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasDonationClaimIntent, setHasDonationClaimIntent] = useState(false);

  useEffect(() => {
    setHasDonationClaimIntent(
      Boolean(localStorage.getItem(DONATION_CLAIM_INTENT_KEY)),
    );
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // If loading or already authenticated, show loading state with the spinner
  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="md" showText text="Cargando..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Regístrate</h1>
        <p className="text-black">
          Tu primer paso hacia un impacto positivo comienza aquí.
        </p>
      </div>

      {hasDonationClaimIntent && (
        <div className="mb-6 rounded-lg border border-[#2c6e49]/30 bg-[#f5f7e9] p-4 text-sm text-[#1f4d33]">
          <p className="font-semibold">Haz visible el impacto de tu donación.</p>
          <p className="mt-1">
            Al crear tu cuenta, vincularemos la donación que acabas de hacer,
            tu nombre podrá aparecer en los últimos donadores, podrás revisar tu
            historial, guardar campañas favoritas, crear campañas y recibir
            notificaciones dentro de Minka.
          </p>
          <p className="font-semibold">Toma pocos segundos!</p>
        </div>
      )}

      <SignUpForm />

      <div className="mt-8 text-center">
        <p className="text-black">
          ¿Ya formas parte de Minka?{" "}
          <Link
            href={hasDonationClaimIntent ? "/sign-in?donationClaim=1" : "/sign-in"}
            className="text-[#2c6e49] font-medium hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
