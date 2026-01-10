"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Mail, Info } from "lucide-react";
import { createClient } from "@/lib/supabase-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingresa un correo electrónico válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Create reset link with callback URL to our reset-password page
        const { error } = await supabase.auth.resetPasswordForEmail(
          data.email,
          {
            redirectTo: `${window.location.origin}/auth/callback`,
          }
        );

        if (error) throw error;

        // Show success message
        setEmailSent(true);
      } catch (error) {
        console.error("Error sending reset email:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo de recuperación.";

        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("correo")
        ) {
          setError("email", {
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
    [setError]
  );

  // Show a loading screen when loading
  if (isLoading) {
    return (
      <LoadingScreen
        text="Enviando correo de recuperación..."
        showText={true}
      />
    );
  }

  // Show success message if email was sent
  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-green-800">
            Correo enviado con éxito
          </h3>
          <p className="text-green-700 mt-2">
            Hemos enviado un enlace a tu correo electrónico para restablecer tu
            contraseña.
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
        </p>
        <Button
          className="w-full mt-4 bg-[#2c6e49] hover:bg-[#1e4d33] text-white"
          asChild
        >
          <Link href="/sign-in">Volver a inicio de sesión</Link>
        </Button>
      </div>
    );
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

      <Button
        type="submit"
        className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white font-medium py-2 rounded-full"
      >
        Enviar correo de recuperación
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
