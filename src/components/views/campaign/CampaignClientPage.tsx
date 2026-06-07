"use client";

import { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@/providers/auth-provider";
import { useSavedCampaigns } from "@/hooks/use-saved-campaigns";
import {
  SAVE_CAMPAIGN_INTENT_KEY,
  SAVE_CAMPAIGN_INTENT_UPDATED_EVENT,
} from "@/constants/saved-campaign";
import { formatRegionDisplayName } from "@/lib/region-utils";
import { formatCampaignCategory } from "@/lib/campaign-categories";

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
    createdAt: campaign.created_at || new Date().toISOString(),
    currentAmount: campaign.collected_amount || 0,
    targetAmount: campaign.goal_amount || 0,
    donorsCount: campaign.donor_count || 0,
  };

  // Create default organizer data structure
  const organizerData = {
    name: campaign.organizer?.name || "Organizador",
    role: "Organizador de campaña",
    location:
      formatRegionDisplayName(campaign.organizer?.location) ||
      "Ubicación no indicada",
    profilePicture: campaign.organizer?.profilePicture || null,
    memberSince: campaign.organizer?.join_date
      ? new Date(campaign.organizer.join_date).getFullYear().toString()
      : new Date().getFullYear().toString(),
    successfulCampaigns: campaign.organizer?.active_campaigns_count || 0,
    bio: campaign.organizer?.bio?.trim() || "",
  };

  const beneficiaries = campaign.beneficiaries_description?.trim() || "";
  const description = campaign.description?.trim() || "";
  const recipientType =
    campaign.recipient_type ||
    (campaign.legal_entity
      ? "persona_juridica"
      : campaign.beneficiary_name ||
          campaign.beneficiary_relationship ||
          beneficiaries
        ? "otra_persona"
        : null);

  return {
    title: campaign.title,
    subtitle: campaign.subtitle || "",
    description,
    beneficiaries,
    recipientType,
    beneficiaryName: campaign.beneficiary_name,
    beneficiaryRelationship: campaign.beneficiary_relationship,
    legalEntity: campaign.legal_entity,
    location: formatRegionDisplayName(campaign.location) || "Bolivia",
    category: formatCampaignCategory(campaign.category),
    images: galleryItems,
    progress: progressData,
    organizer: organizerData,
    updates: formattedUpdates,
  };
}

// Custom CampaignDetails component
function CustomCampaignDetails({
  organizer,
  description,
  beneficiaries,
  recipientType,
  beneficiaryName,
  beneficiaryRelationship,
  legalEntity,
  isVerified,
  campaignLocation,
  campaignCategory,
}: {
  organizer: {
    name: string;
    role: string;
    location: string;
    profilePicture: string | null;
    memberSince: string;
    successfulCampaigns: number;
    bio: string;
  };
  description: string;
  beneficiaries: string;
  recipientType?: "tu_mismo" | "otra_persona" | "persona_juridica" | null;
  beneficiaryName?: string | null;
  beneficiaryRelationship?: string | null;
  legalEntity?: {
    id: string;
    name: string;
    description?: string | null;
    website?: string | null;
  } | null;
  isVerified: boolean;
  campaignLocation: string;
  campaignCategory: string;
}) {
  const campaignMeta = [campaignLocation, campaignCategory]
    .filter(Boolean)
    .join(" | ");
  const relationship = beneficiaryRelationship
    ? beneficiaryRelationship.charAt(0).toUpperCase() +
      beneficiaryRelationship.slice(1)
    : "";
  const hasBeneficiaryInfo =
    (recipientType === "otra_persona" &&
      (Boolean(beneficiaryName) ||
        Boolean(relationship) ||
        beneficiaries.trim().length > 0)) ||
    recipientType === "persona_juridica";
  const createdCampaignsLabel =
    organizer.successfulCampaigns === 1 ? "1 campaña" : `${organizer.successfulCampaigns} campañas`;

  return (
    <div className="space-y-8">
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

      {/* Campaign meta */}
      {campaignMeta && (
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-base font-medium text-[#2c6e49] break-words">
            {campaignMeta}
          </h3>
        </div>
      )}

      {/* Campaign Description */}
      {description.trim().length > 0 && (
        <div className="space-y-4 pb-8 border-b border-gray-200">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
            Descripción de la campaña
          </h2>
          <p className="text-base text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}

      {hasBeneficiaryInfo && (
        <div className="space-y-4 pb-8 border-b border-gray-200">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
            Quién recibirá el apoyo
          </h2>

          {recipientType === "otra_persona" && (
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed break-words">
              {beneficiaryName && (
                <p>
                  <span className="font-medium text-[#2c6e49]">
                    Beneficiario:
                  </span>{" "}
                  {beneficiaryName}
                </p>
              )}
              {relationship && (
                <p>
                  <span className="font-medium text-[#2c6e49]">
                    Relación:
                  </span>{" "}
                  {relationship}
                </p>
              )}
            </div>
          )}

          {recipientType === "persona_juridica" && (
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed break-words">
              <p>
                <span className="font-medium text-[#2c6e49]">
                  Institución beneficiaria:
                </span>{" "}
                {legalEntity?.name || "Institución seleccionada"}
              </p>
              {legalEntity?.description && (
                <p className="whitespace-pre-wrap">
                  {legalEntity.description}
                </p>
              )}
              {legalEntity?.website && (
                <a
                  href={legalEntity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-[#2c6e49] underline"
                >
                  Sitio web
                </a>
              )}
            </div>
          )}

          {recipientType === "otra_persona" &&
            beneficiaries.trim().length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-[#2c6e49]">
                Destino de los fondos
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                {beneficiaries}
              </p>
            </div>
          )}
        </div>
      )}

      {/* About Organizer */}
      <div className="space-y-6 pb-8 border-b border-gray-200">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Sobre el organizador
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-full bg-[#e8f0e9] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {organizer.profilePicture ? (
              <Image
                src={organizer.profilePicture}
                alt={organizer.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-base font-medium text-[#2c6e49]">
                {organizer.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-[#2c6e49] break-words">
              {organizer.name}
            </h3>
            <p className="text-base text-gray-600 break-words">
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
                Campañas creadas
              </span>
            </div>
          </div>
          <p className="pl-6 text-lg break-words">
            {createdCampaignsLabel}
          </p>
        </div>

        {organizer.bio && (
        <div>
          <h4 className="font-medium mb-2 text-xl text-[#2c6e49] break-words">
            Biografía
          </h4>
          <p className="text-base text-black break-words whitespace-pre-wrap leading-relaxed">
            {organizer.bio}
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

// Async function to fetch related campaigns
async function fetchRelatedCampaigns(category: string, id: string) {
  try {
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
  const autoSaveHandledRef = useRef(false);
  const { session, isLoading: authLoading } = useAuth();
  const {
    saveCampaign,
    isCampaignSaved,
    isLoading: savedCampaignsLoading,
  } = useSavedCampaigns();

  // Debug campaign ID
  useEffect(() => {
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

  useEffect(() => {
    const tryAutoSave = async () => {
      if (
        autoSaveHandledRef.current ||
        authLoading ||
        savedCampaignsLoading ||
        !session
      ) {
        return;
      }

      const rawIntent = sessionStorage.getItem(
        SAVE_CAMPAIGN_INTENT_KEY
      );
      if (!rawIntent) return;

      autoSaveHandledRef.current = true;

      try {
        const parsedIntent = JSON.parse(rawIntent) as {
          campaignId?: string;
        };

        if (parsedIntent?.campaignId !== id) return;

        if (!isCampaignSaved(id)) {
          await saveCampaign(id, { silent: true });
        }
      } catch (intentError) {
        console.error(
          "Error processing save campaign intent:",
          intentError
        );
      } finally {
        sessionStorage.removeItem(SAVE_CAMPAIGN_INTENT_KEY);
        window.dispatchEvent(
          new Event(SAVE_CAMPAIGN_INTENT_UPDATED_EVENT)
        );
      }
    };

    void tryAutoSave();
  }, [
    id,
    session,
    authLoading,
    savedCampaignsLoading,
    isCampaignSaved,
    saveCampaign,
  ]);

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
            {formattedData.subtitle}
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
                  campaignTitle={formattedData.title}
                  campaignSubtitle={formattedData.subtitle}
                  campaignDescription={formattedData.description}
                  campaignImageUrl={formattedData.images[0]?.url}
                  campaignId={id}
                />
              </StickyProgressWrapper>
            </div>

            {/* Tab Navigation */}
            <div className="mt-10 border-b border-gray-200 overflow-x-auto">
              <div className="flex items-center min-w-max sm:min-w-0">
                <button
                  onClick={() => setActiveTab("descripcion")}
                  className={`pb-4 px-2 text-lg font-bold whitespace-nowrap ${
                    activeTab === "descripcion"
                      ? "text-[#2c6e49] border-b-2 border-[#2c6e49]"
                      : "text-gray-500"
                  }`}
                >
                  Descripción
                </button>
                <span className="px-3 pb-4 text-lg font-bold text-gray-300">
                  |
                </span>
                <button
                  onClick={() => setActiveTab("actualizaciones")}
                  className={`pb-4 px-2 text-lg font-bold whitespace-nowrap ${
                    activeTab === "actualizaciones"
                      ? "text-[#2c6e49] border-b-2 border-[#2c6e49]"
                      : "text-gray-500"
                  }`}
                >
                  Actualizaciones
                </button>
                <span className="px-3 pb-4 text-lg font-bold text-gray-300">
                  |
                </span>
                <button
                  onClick={() => setActiveTab("comentarios")}
                  className={`pb-4 px-2 text-lg font-bold whitespace-nowrap ${
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
                  description={formattedData.description}
                  beneficiaries={formattedData.beneficiaries}
                  recipientType={formattedData.recipientType}
                  beneficiaryName={formattedData.beneficiaryName}
                  beneficiaryRelationship={
                    formattedData.beneficiaryRelationship
                  }
                  legalEntity={formattedData.legalEntity}
                  isVerified={formattedData.progress.isVerified}
                  campaignLocation={formattedData.location}
                  campaignCategory={formattedData.category}
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
                campaignTitle={formattedData.title}
                campaignSubtitle={formattedData.subtitle}
                campaignDescription={formattedData.description}
                campaignImageUrl={formattedData.images[0]?.url}
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
