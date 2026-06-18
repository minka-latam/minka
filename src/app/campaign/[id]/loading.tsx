"use client";

import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="h-20 lg:h-28"></div>
      <div className="min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-7rem)] flex justify-center items-center py-20 px-4">
        <LoadingSpinner size="lg" showText text="Cargando campaña..." />
      </div>
      <Footer />
    </div>
  );
}
