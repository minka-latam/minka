import Link from "next/link";
import { Suspense } from "react";
import { SignInClient } from "./sign-in-client";
import { LoadingScreen } from "@/components/ui/loading-screen";

// This function is used to safely get the registered status from searchParams
function getRegistrationStatus(registered?: string): boolean {
  return registered === "true";
}

// Define proper type for page props according to Next.js 15 standards
export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  // Get registration status directly from the param
  const params = await searchParams;
  const registered = params.registered as string | undefined;
  const isRegistered = getRegistrationStatus(registered);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
        <p className="text-black">
          Vuelve a conectarte con proyectos que inspiran.
        </p>
      </div>

      {isRegistered && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-md">
          <p>
            ¡Tu cuenta ha sido creada exitosamente! Por favor revisa tu correo
            electrónico para confirmarla antes de iniciar sesión.
          </p>
        </div>
      )}

      <Suspense
        fallback={
          <LoadingScreen
            text="Cargando formulario..."
            showText={true}
            fullScreen={false}
            immediate={true}
            className="min-h-[400px]"
          />
        }
      >
        <SignInClient />
      </Suspense>

      <div className="mt-8 text-center">
        <p className="text-black">
          ¿Es la primera vez que usas Minka?{" "}
          <Link
            href="/sign-up"
            className="text-[#2c6e49] font-medium hover:underline"
            prefetch={true}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
