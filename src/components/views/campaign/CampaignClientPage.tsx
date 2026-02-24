"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Award } from "lucide-react";

import { useCampaign } from "@/hooks/useCampaign";
import { CampaignGallery } from "@/components/views/campaign/CampaignGallery";
import { CampaignProgress } from "@/components/views/campaign/CampaignProgress";
import { StickyProgressWrapper } from "@/components/views/campaign/StickyProgressWrapper";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import { CampaignCard } from "@/components/views/campaigns/CampaignCard";
import { CampaignUpdates } from "@/components/views/campaign/CampaignUpdates";
import { CampaignComments } from "@/components/views/campaign/CampaignComments";
import Loading from "@/app/campaign/[id]/loading";

// Helper function to format campaign data for components
function formatCampaignData(campaign: any) {
  // Format gallery images
  // Sort media to put primary image first
  const sortedMedia = campaign.media
    ? [...campaign.media].sort((a: any, b: any) => {
        if (a.is_primary === b.is_primary) return 0;
        return a.is_primary ? -1 : 1;
      })
    : [];

  const galleryItems =
    sortedMedia.map((item: any) => ({
      url: item.media_url,
      type: item.type as "image" | "video",
      id: item.id,
    })) || [];

  // Format updates from campaign data
  const formattedUpdates: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string;
    imageUrl?: string;
    youtubeUrl?: string;
  }> =
    campaign.updates?.map((update: any) => ({
      id: update.id,
      title: update.title,
      message: update.content,
      createdAt: update.created_at,
      imageUrl: update.image_url,
      youtubeUrl: update.youtube_url,
    })) || [];

  const progressData = {
    isVerified: campaign.verification_status || false,
    createdAt: campaign.created_at
      ? new Date(campaign.created_at).toLocaleDateString()
      : new Date().toLocaleDateString(),
    currentAmount: campaign.collected_amount || 0,
    targetAmount: campaign.goal_amount || 0,
    donorsCount: campaign.donor_count || 0,
  };

  // Create default organizer data structure
  const organizerData = {
    name: campaign.organizer?.name || "Organizador",
    role: "Organizador de campaña",
    location: campaign.organizer?.location || campaign.location || "Bolivia",
    memberSince: campaign.organizer?.join_date
      ? new Date(campaign.organizer.join_date).getFullYear().toString()
      : new Date().getFullYear().toString(),
    successfulCampaigns: campaign.organizer?.active_campaigns_count || 0,
    bio: campaign.organizer?.bio || "Sin biografía",
  };

  return {
    title: campaign.title,
    description: campaign.description,
    story: campaign.story || campaign.description,
    beneficiaries:
      campaign.beneficiaries_description ||
      "Información de beneficiarios no disponible",
    images: galleryItems,
    progress: progressData,
    organizer: organizerData,
    updates: formattedUpdates,
  };
}

// Helper to format category for display
function formatCategory(category: string) {
  const categories: Record<string, string> = {
    educacion: "Educación",
    salud: "Salud",
    medioambiente: "Medio ambiente",
    cultura_arte: "Cultura y arte",
    emergencia: "Emergencia",
    igualdad: "Igualdad",
  };

  return categories[category] || category;
}

// Custom CampaignDetails component
function CustomCampaignDetails({
  organizer,
  description,
  beneficiaries,
  isVerified,
}: {
  organizer: {
    name: string;
    role: string;
    location: string;
    memberSince: string;
    successfulCampaigns: number;
    bio: string;
  };
  description: string;
  beneficiaries: string;
  isVerified: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Organizer Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-[#2c6e49]">
            {organizer.name[0]}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[#2c6e49] break-words">
            {organizer.name}
          </h3>
          <p className="text-sm text-gray-600 break-words">
            {organizer.role} | {organizer.location}
          </p>
        </div>
      </div>

      {/* Verification Badge - Only show if verified */}
      {isVerified && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Image
              src="/landing-page/step-2.png"
              alt="Verified"
              width={32}
              height={32}
              className="text-[#2c6e49] flex-shrink-0"
            />
            <span className="text-[#2c6e49] text-xl font-medium break-words">
              Campaña verificada por Minka
            </span>
          </div>
          <Link
            href="#"
            className="text-[#2c6e49] underline text-base break-words whitespace-nowrap"
          >
            Más información sobre la verificación
          </Link>
        </div>
      )}

      {/* Campaign Description */}
      <div className="space-y-4 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Descripción de la campaña
        </h2>
        <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
          {description}
        </p>
      </div>

      {/* Beneficiaries */}
      <div className="space-y-4 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Beneficiarios
        </h2>
        <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
          {beneficiaries}
        </p>
      </div>

      {/* About Organizer */}
      <div className="space-y-6 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Sobre el organizador
        </h2>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#e8f0e9] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-[#2c6e49]">
              {organizer.name[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-[#2c6e49] break-words">
              {organizer.name}
            </h3>
            <p className="text-sm text-gray-600 break-words">
              Gestor de campaña | {organizer.location}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-[#2c6e49] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-lg font-medium text-[#2c6e49] break-words">
                Tiempo en la plataforma
              </span>
            </div>
          </div>
          <p className="pl-6 text-lg break-words">
            Miembro desde {organizer.memberSince}
          </p>

          <div className="flex items-start gap-2">
            <Award className="h-5 w-5 text-[#2c6e49] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-lg font-medium text-[#2c6e49] break-words">
                Otras campañas
              </span>
            </div>
          </div>
          <p className="pl-6 text-lg break-words">
            {organizer.successfulCampaigns} campañas exitosas
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-xl text-[#2c6e49] break-words">
            Biografía
          </h4>
          <p className="text-black break-words whitespace-pre-wrap leading-relaxed">
            {organizer.bio}
          </p>
        </div>
      </div>
    </div>
  );
}

// Async function to fetch related campaigns
async function fetchRelatedCampaigns(category: string, id: string) {
  try {
    console.log(
      `Client: Fetching related campaigns for category ${category} excluding ${id}`
    );
    const response = await fetch(
      `/api/campaign/related?category=${category}&excludeId=${id}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch related campaigns");
    }
    return await response.json();
  } catch (error) {
    console.error("Client: Error fetching related campaigns:", error);
    return { campaigns: [] };
  }
}

export default function CampaignClientPage({ id }: { id: string }) {
  const { campaign, isLoading, error } = useCampaign(id);
  const [relatedCampaigns, setRelatedCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("descripcion");

  // Debug campaign ID
  useEffect(() => {
    console.log("CampaignClientPage: Campaign ID received:", id);
    console.log(
      "CampaignClientPage: Campaign data:",
      campaign?.id,
      campaign?.title
    );
  }, [id, campaign]);

  useEffect(() => {
    if (campaign?.category) {
      fetchRelatedCampaigns(campaign.category, id)
        .then(setRelatedCampaigns)
        .catch((err) =>
          console.error("Error fetching related campaigns:", err)
        );
    }
  }, [campaign, id]);

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="h-20 md:h-28"></div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-2xl text-red-600 mb-2 break-words">Error</h2>
            <p className="text-gray-700 break-words">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle loading state
  if (isLoading || !campaign) {
    return <Loading />;
  }

  // Format campaign data for components
  const formattedData = formatCampaignData(campaign);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="h-20 md:h-28"></div>
      <main className="container mx-auto px-4 py-10 flex-1">
        {/* Campaign Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-black mb-4 break-words leading-tight">
            {campaign.title}
          </h1>
          <p className="text-lg md:text-xl text-black leading-relaxed break-words whitespace-pre-wrap max-w-4xl mx-auto">
            {formattedData.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 min-w-0">
            {/* Campaign Gallery */}
            <CampaignGallery images={formattedData.images} />

            {/* Tabs for mobile view */}
            <div className="mt-8 lg:hidden">
              <StickyProgressWrapper>
                <CampaignProgress
                  currentAmount={formattedData.progress.currentAmount}
                  targetAmount={formattedData.progress.targetAmount}
                  donorsCount={formattedData.progress.donorsCount}
                  isVerified={formattedData.progress.isVerified}
                  createdAt={formattedData.progress.createdAt}
                  campaignId={id}
                />
              </StickyProgressWrapper>
            </div>

            {/* Tab Navigation */}
            <div className="mt-10 border-b border-gray-200 overflow-x-auto">
              <div className="flex gap-6 min-w-max sm:min-w-0">
                <button
                  onClick={() => setActiveTab("descripcion")}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${
                    activeTab === "descripcion"
                      ? "text-[#2c6e49] border-b-2 border-[#2c6e49]"
                      : "text-gray-500"
                  }`}
                >
                  Descripción
                </button>
                <button
                  onClick={() => setActiveTab("actualizaciones")}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${
                    activeTab === "actualizaciones"
                      ? "text-[#2c6e49] border-b-2 border-[#2c6e49]"
                      : "text-gray-500"
                  }`}
                >
                  Actualizaciones
                </button>
                <button
                  onClick={() => setActiveTab("comentarios")}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${
                    activeTab === "comentarios"
                      ? "text-[#2c6e49] border-b-2 border-[#2c6e49]"
                      : "text-gray-500"
                  }`}
                >
                  Comentarios
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="my-8 min-w-0">
              {activeTab === "descripcion" && (
                <CustomCampaignDetails
                  organizer={formattedData.organizer}
                  description={formattedData.story}
                  beneficiaries={formattedData.beneficiaries}
                  isVerified={formattedData.progress.isVerified}
                />
              )}

              {activeTab === "actualizaciones" && (
                <CampaignUpdates updates={formattedData.updates} />
              )}

              {activeTab === "comentarios" && (
                <CampaignComments
                  campaignId={id}
                  organizerId={campaign.organizer?.id}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar - Sticky on desktop */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-32">
              <CampaignProgress
                currentAmount={formattedData.progress.currentAmount}
                targetAmount={formattedData.progress.targetAmount}
                donorsCount={formattedData.progress.donorsCount}
                isVerified={formattedData.progress.isVerified}
                createdAt={formattedData.progress.createdAt}
                campaignId={id}
              />
            </div>
          </div>
        </div>

        {/* Related Campaigns */}
        {relatedCampaigns.length > 0 && (
          <div className="mt-16" id="related-campaigns">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2c6e49] break-words">
                Causas similares
              </h2>
              <Link
                href="/campaigns"
                className="flex items-center text-[#2c6e49] font-medium whitespace-nowrap"
              >
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  title={campaign.title}
                  image={campaign.primaryImage || ""}
                  category={campaign.category}
                  location={campaign.location as any}
                  progress={campaign.percentageFunded}
                  verified={campaign.verified}
                  description={campaign.description}
                  donorCount={campaign.donorCount}
                  amountRaised={`Bs. ${campaign.collectedAmount.toLocaleString("es-BO")}`}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
