"use client";

import { CreateCampaignHeader } from "@/components/views/create-campaign/CreateCampaignHeader";
import { CampaignForm } from "@/components/views/create-campaign/CampaignForm";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import Image from "next/image";
import { CampaignFormProvider } from "@/components/providers/campaign-form-provider";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  CurrentStepProvider,
  useCurrentStep,
} from "@/contexts/current-step-context";

function CreateCampaignPageContent() {
  const { currentStep } = useCurrentStep();

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9]">
      <Header />

      {/* Spacer div to account for the fixed header height */}
      <div className="h-20 md:h-28"></div>

      {/* Page header with increased height - Hide when step >= 2 */}
      {currentStep === 1 && (
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
              Crea tu campaña
            </h1>
          </div>
        </div>
      )}

      {/* Page subtitle - Hide when step >= 2 */}
      {currentStep === 1 && (
        <div className="w-full py-10 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl md:text-7xl font-bold text-center text-[#333333] mb-6 leading-tight">
              Cuenta tu historia e inspira
            </h2>
          </div>
        </div>
      )}

      <main className="overflow-x-hidden">
        {currentStep === 1 && <CreateCampaignHeader />}
        <div className="container mx-auto py-8">
          <CampaignFormProvider>
            <CampaignForm />
          </CampaignFormProvider>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CreateCampaignPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to sign-in
    if (!isLoading && !user) {
      router.push("/sign-in?returnUrl=/create-campaign");
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If no user and not loading, don't render the content
  // The useEffect will handle the redirect
  if (!user) {
    return null;
  }

  return (
    <CurrentStepProvider>
      <CreateCampaignPageContent />
    </CurrentStepProvider>
  );
}
