"use client";

import { CampaignVerificationView } from "@/components/views/campaign-verification/CampaignVerificationView";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CampaignVerificationPage() {
  return (
    <Suspense fallback={<CampaignVerificationPageSkeleton />}>
      <CampaignVerificationPageContent />
    </Suspense>
  );
}

function CampaignVerificationPageContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id");

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]">
      <Header />

      {/* Spacer div to account for the fixed header height */}
      <div className="h-20 md:h-28"></div>

      <div className="w-full h-[300px] md:h-[500px] relative border-t border-[#2c6e49]/5">
        <Image
          src="/page-header.svg"
          alt="Page Header"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-bold text-white text-center">
            Verifica tu campaña
          </h1>
        </div>
      </div>
      <main className="overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <CampaignVerificationView campaignId={campaignId || undefined} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Skeleton loading state
function CampaignVerificationPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]">
      <Header />

      {/* Spacer div to account for the fixed header height */}
      <div className="h-20 md:h-28"></div>

      <div className="w-full h-[300px] md:h-[500px] relative border-t border-[#2c6e49]/5">
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
      <main className="overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center">
            <LoadingSpinner
              showText
              text="Cargando formulario de verificación..."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
