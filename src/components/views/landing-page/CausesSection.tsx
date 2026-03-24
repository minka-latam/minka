"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CampaignCard } from "@/components/views/campaigns/CampaignCard";
import { Region } from "@/lib/region-utils";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function CausesSection() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch top 3 featured campaigns on component mount
  useEffect(() => {
    const fetchFeaturedCampaigns = async () => {
      setIsLoading(true);
      try {
        // Fetch campaigns with limit=3 and sort by most popular
        const url = new URL("/api/campaign/list", window.location.origin);
        url.searchParams.append("limit", "3");
        url.searchParams.append("sortBy", "popular");
        url.searchParams.append("verified", "true");

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error("Failed to fetch campaigns");
        }

        const data = await response.json();

        if (data.campaigns && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
        } else {
          setError("Error loading campaigns");
          setCampaigns([]);
        }
      } catch (err) {
        console.error("Error fetching featured campaigns:", err);
        setError("Failed to load campaigns");
        setCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCampaigns();
  }, []);

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-6xl md:text-7xl font-bold text-[#333333] mb-6 text-center">
          Causas que inspiran
        </h2>
        <p className="text-2xl md:text-3xl text-[#555555] max-w-3xl mx-auto">
          Conoce las causas o campañas que están activas transformando vidas ¡y
          haz la diferencia con tu aporte!
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" showText text="Cargando campañas..." />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600 mb-6">
            No se pudieron cargar las campañas. Por favor, intenta de nuevo más
            tarde.
          </p>
          <Link href="/campaign" rel="noopener noreferrer">
            <Button className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] hover:text-white rounded-full">
              Ver todas las campañas
            </Button>
          </Link>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600 mb-6">
            No hay campañas disponibles en este momento.
          </p>
          <Link href="/create-campaign" rel="noopener noreferrer">
            <Button className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] hover:text-white rounded-full">
              Crear una campaña
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              title={campaign.title}
              image={
                campaign.primaryImage || "/landing-page/dummies/Card/Imagen.png"
              }
              category={campaign.category}
              location={campaign.location as Region}
              progress={campaign.percentageFunded || 0}
              verified={campaign.verified || false}
              description={campaign.description}
              donorCount={campaign.donorCount || 0}
              amountRaised={`Bs. ${campaign.collectedAmount?.toLocaleString("es-BO") || "0,00"}`}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && campaigns.length > 0 && (
        <div className="flex justify-center mt-12">
          <Link href="/campaign" rel="noopener noreferrer">
            <Button
              className="bg-[#2c6e49] text-white hover:bg-[#1e4d33] hover:text-white text-xl shadow-none border-0 rounded-full"
              size="lg"
            >
              Ver más campañas <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
