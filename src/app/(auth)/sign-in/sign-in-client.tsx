"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Use a loading boundary for the form component
const SignInForm = dynamic(
  () =>
    import("@/components/auth/sign-in/components/sign-in-form").then((mod) => ({
      default: mod.SignInForm,
    })),
  {
    ssr: true,
    loading: () => (
      <LoadingScreen
        text="Cargando formulario..."
        showText={true}
        fullScreen={false}
        immediate={true}
        className="min-h-[400px]"
      />
    ),
  }
);

export function SignInClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setIsRedirecting(true);
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");
      const redirectPath =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/dashboard";
      router.replace(redirectPath);
    }
  }, [user, isLoading, router]);

  // If loading, redirecting, or already authenticated, show loading state
  if (isLoading || user || isRedirecting) {
    return (
      <LoadingScreen
        text={isRedirecting ? "Redirigiendo..." : "Cargando..."}
        showText={true}
        fullScreen={false}
        immediate={true}
        className="min-h-[400px]"
      />
    );
  }

  return <SignInForm />;
}
