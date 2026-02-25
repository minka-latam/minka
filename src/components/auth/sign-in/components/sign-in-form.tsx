"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Mail, Lock, Info, Eye, EyeOff } from "lucide-react";
import { signInWithSocial } from "@/lib/supabase-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useRouter, useSearchParams } from "next/navigation";

const signInFormSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type SignInFormData = z.infer<typeof signInFormSchema>;

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  // Pre-fetch the dashboard page to speed up navigation
  useEffect(() => {
    router.prefetch("/dashboard");
    if (returnUrl) {
      router.prefetch(returnUrl);
    }
  }, [router, returnUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Memoize the submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(
    async (data: SignInFormData) => {
      try {
        setIsLoading(true);

        // The loading screen will show immediately due to isLoading state
        // Start login process with no delay
        await signIn(data.email, data.password);

        // Navigation and toast will be handled in the auth provider
        // The loading screen will continue to show until redirect completes
      } catch (error) {
        console.error("Error during sign in:", error);

        // Show a toast with the generic error message in Spanish
        toast({
          title: "Error",
          description: "Credenciales inválidas",
          variant: "destructive",
        });

        // Only set isLoading to false if there was an error
        setIsLoading(false);
      }
    },
    [signIn, toast]
  );

  const handleSocialSignIn = useCallback(
    async (provider: "google" | "facebook") => {
      try {
        setSocialLoading(provider);
        await signInWithSocial(provider);
        // The redirect will be handled by Supabase
      } catch (error) {
        console.error(`Error signing in with ${provider}:`, error);
        toast({
          title: "Error",
          description: `No se pudo iniciar sesión con ${provider}.`,
          variant: "destructive",
        });
        setSocialLoading(null);
      }
    },
    []
  );

  // Show a simplified loading screen when loading - use immediate to prevent white flash
  if (isLoading || socialLoading) {
    return <LoadingScreen text="Iniciando sesión..." showText={true} immediate={true} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Correo electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="correo@ejemplo.com"
            className="pl-10 border-black"
            aria-invalid={errors.email ? "true" : "false"}
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            className="pl-10 pr-10 border-black"
            aria-invalid={errors.password ? "true" : "false"}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white font-medium py-2 rounded-full"
        disabled={isLoading}
      >
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-300 flex-grow" />
        <span className="mx-4 text-sm text-gray-500">Iniciar sesión con</span>
        <div className="border-t border-gray-300 flex-grow" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center border border-black rounded-md h-11"
          onClick={() => handleSocialSignIn("facebook")}
          disabled={!!socialLoading}
        >
          <Image
            src="/social-icons/Facebook.svg"
            alt="Facebook"
            width={20}
            height={20}
            priority
          />
          <span className="ml-2">
            {socialLoading === "facebook" ? "Cargando..." : "Facebook"}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center border border-black rounded-md h-11"
          onClick={() => handleSocialSignIn("google")}
          disabled={!!socialLoading}
        >
          <Image
            src="/social-icons/Google.svg"
            alt="Google"
            width={20}
            height={20}
            priority
          />
          <span className="ml-2">
            {socialLoading === "google" ? "Cargando..." : "Google"}
          </span>
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-[#2c6e49] hover:underline text-sm font-medium"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  );
}
