"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SavedCampaignCard } from "@/components/dashboard/saved-campaign-card";
import { useSavedCampaigns } from "@/hooks/use-saved-campaigns";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SavedCampaignsPage() {
  const { loading: authLoading } = useAuth();
  const { savedCampaigns, isLoading, error, unsaveCampaign } =
    useSavedCampaigns();

  const handleUnsave = async (campaignId: string) => {
    await unsaveCampaign(campaignId);
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If there was an error fetching saved campaigns
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg py-12 px-4 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <Info className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-800 text-lg text-center mb-8">
          Ocurrió un error al cargar tus campañas guardadas
        </p>
        <Button
          className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full px-8 py-3 text-base"
          onClick={() => window.location.reload()}
        >
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Campañas guardadas</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="md" text="Cargando campañas guardadas..." />
        </div>
      ) : savedCampaigns && savedCampaigns.length > 0 ? (
        <div className="space-y-6">
          {savedCampaigns.map((campaign, index) => (
            <div key={campaign.id} className="space-y-6">
              <SavedCampaignCard
                id={campaign.id}
                title={campaign.title}
                imageUrl={campaign.imageUrl}
                location={campaign.location}
                isInclusive={campaign.category === "igualdad"}
                onUnsave={() => handleUnsave(campaign.id)}
              />
              {index < savedCampaigns.length - 1 && (
                <div className="h-px bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg py-12 px-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <Info className="h-6 w-6 text-blue-500" />
          </div>

          <p className="text-gray-800 text-lg text-center mb-8">
            No tienes campañas guardadas todavía
          </p>

          <Button
            className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white rounded-full px-8 py-3 text-base"
            asChild
          >
            <Link href="/all-campaigns">Explorar campañas</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
