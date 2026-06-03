"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Loading component
function DonatePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-[#e8f0e9] flex items-center justify-center animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-[#2c6e49]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

// Client component that uses searchParams
function DonatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for campaign ID in query parameters for backward compatibility
  useEffect(() => {
    const id = searchParams.get("id");

    // If an ID is provided, redirect to the dynamic route
    if (id) {
      router.replace(`/donate/${id}`);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex flex-col">
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
            Ver campañas
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto py-16 px-4 flex-grow">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2c6e49] mb-6">
            Explora campañas para apoyar
          </h2>
          <p className="text-gray-700 mb-8">
            Puedes explorar nuestras campañas actuales o visitar directamente
            una campaña específica.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white py-6 px-8 rounded-full"
              asChild
            >
              <Link href="/campaign">Ver campañas</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Main donate page with Suspense boundary
export default function DonatePage() {
  return (
    <Suspense fallback={<DonatePageLoading />}>
      <DonatePageContent />
    </Suspense>
  );
}
