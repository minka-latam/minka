"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Lock, Info, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "La confirmación de contraseña es requerida"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if we have a recovery token on page load
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      // If we have an active session, but no recovery token,
      // the user has arrived at this page incorrectly
      if (error || !data.session) {
        const hasRecoveryToken = window.location.hash.includes("type=recovery");

        if (!hasRecoveryToken) {
          toast({
            title: "Error",
            description: "Enlace de recuperación inválido o expirado.",
            variant: "destructive",
          });
          router.push("/sign-in");
          return;
        }
      }

      setIsInitializing(false);
    };

    checkSession();
  }, [router]);

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Update the user's password
        const { error } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (error) throw error;

        // Show success message
        toast({
          title: "Éxito",
          description: "Tu contraseña ha sido actualizada correctamente.",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to sign in page
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Error resetting password:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la contraseña.";

        if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("contraseña")
        ) {
          setError("password", {
            type: "manual",
            message: errorMessage,
          });
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router, setError]
  );

  // Show a loading screen when loading
  if (isLoading || isInitializing) {
    return (
      <LoadingScreen
        text={isInitializing ? "Verificando..." : "Actualizando contraseña..."}
        showText={true}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Nueva contraseña
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
            autoComplete="new-password"
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

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium mb-2"
        >
          Confirmar contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            className="pl-10 pr-10 border-black"
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white font-medium py-2 rounded-full"
      >
        Actualizar contraseña
      </Button>

      <div className="text-center">
        <Link
          href="/sign-in"
          className="text-[#2c6e49] hover:underline text-sm font-medium"
        >
          Volver a inicio de sesión
        </Link>
      </div>
    </form>
  );
}
