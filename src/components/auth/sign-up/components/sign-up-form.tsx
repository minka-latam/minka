"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { Mail, Info, Eye, EyeOff } from "lucide-react";
import { signInWithSocial } from "@/lib/supabase-auth";
import { LoadingScreen } from "@/components/ui/loading-screen";
const signUpFormSchema =
  z
    .object({
      firstName: z.string().min(1, "El nombre es requerido"),
      lastName: z.string().min(1, "Los apellidos son requeridos"),
      email: z
        .string()
        .min(1, "El correo electrónico es requerido")
        .email("Ingresa un correo electrónico válido"),
      password: z
        .string()
        .min(1, "La contraseña es requerida")
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(
          /[A-Z]/,
          "La contraseña debe contener al menos una letra mayúscula"
        )
        .regex(
          /[a-z]/,
          "La contraseña debe contener al menos una letra minúscula"
        )
        .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
      confirmPassword: z.string().min(1, "Confirma tu contraseña"),
      acceptTerms: z.boolean().refine((val) => val === true, {
        message: "Debes aceptar los términos y condiciones",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    });

type SignUpFormData = z.infer<typeof signUpFormSchema>;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(data: SignUpFormData) {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setIsSubmitting(true);

      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Note: Success toast and redirection are now handled in the auth provider
      reset();
    } catch (error) {
      console.error("Error during sign up:", error);

      const errorMessage = error instanceof Error ? error.message : "Error desconocido";

      if (errorMessage === "email_error" || errorMessage.includes("email")) {
        toast({
          title: "Error de registro",
          description: "Este correo electrónico ya está registrado.",
          variant: "destructive",
        });
      } else if (errorMessage === "password_error") {
         toast({
          title: "Error de contraseña",
          description: "La contraseña no cumple con los requisitos.",
          variant: "destructive",
        });
      } else {
        // Show the actual backend error if it's not one of the specific keys, or generic fallback
        toast({
          title: "Error",
          description: errorMessage !== "Registration failed" && errorMessage !== "Error desconocido" 
            ? errorMessage 
            : "No se pudo crear la cuenta. Por favor, verifica tus datos e intenta nuevamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: "google") {
    if (socialLoading) return;

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
    } finally {
      setSocialLoading(null);
    }
  }

  if (isLoading || socialLoading || isSubmitting) {
    return <LoadingScreen />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First Name */}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium mb-2">
          Nombres
        </label>
        <div className="relative">
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Ingresa tu nombre"
            className="w-full border-black"
            aria-invalid={errors.firstName ? "true" : "false"}
            disabled={isLoading || isSubmitting}
          />
        </div>
        {errors.firstName && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium mb-2">
          Apellidos
        </label>
        <div className="relative">
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Ingresa tus apellidos"
            className="w-full border-black"
            aria-invalid={errors.lastName ? "true" : "false"}
            disabled={isLoading || isSubmitting}
          />
        </div>
        {errors.lastName && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* Email */}
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
            disabled={isLoading || isSubmitting}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 mt-1 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Contraseña
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="••••••••"
            className="border-black pr-10"
            aria-invalid={errors.password ? "true" : "false"}
            disabled={isLoading || isSubmitting}
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

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium mb-2"
        >
          Confirmar contraseña
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            placeholder="••••••••"
            className="border-black pr-10"
            aria-invalid={errors.confirmPassword ? "true" : "false"}
            disabled={isLoading || isSubmitting}
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

      {/* Accept Terms */}
      <div className="flex items-center space-x-2">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="terms"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading || isSubmitting}
            />
          )}
        />
        <label htmlFor="terms" className="text-sm leading-none cursor-pointer">
          Acepto los{" "}
          <Link href="/terminos" className="text-[#2c6e49] hover:underline">
            Términos, Condiciones y Políticas de Minka
          </Link>
          .
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-sm text-red-500 mt-1 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          {errors.acceptTerms.message}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white font-medium py-2 rounded-full"
        disabled={isLoading || isSubmitting}
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-300 flex-grow" />
        <span className="mx-4 text-sm text-gray-500">Regístrate con</span>
        <div className="border-t border-gray-300 flex-grow" />
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center border border-black rounded-md h-11"
          onClick={() => handleSocialSignIn("google")}
          disabled={!!socialLoading || isLoading || isSubmitting}
        >
          <Image
            src="/icons/google.svg"
            alt="Google"
            width={20}
            height={20}
          />
          <span className="ml-2">
            {socialLoading === "google" ? "Cargando..." : "Google"}
          </span>
        </Button>
      </div>
    </form>
  );
}
