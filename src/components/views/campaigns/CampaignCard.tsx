"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRegionDisplayName, Region } from "@/lib/region-utils";

interface CampaignCardProps {
  id?: string | number;
  title: string;
  image: string;
  category: string;
  location: Region;
  progress: number;
  verified?: boolean;
  description?: string;
  donorCount?: number;
  amountRaised?: string;
  href?: string;
}

export function CampaignCard({
  id,
  title,
  image,
  category,
  location,
  progress,
  verified = true,
  description = "Ayuda a esta campaña y sé parte del cambio que queremos ver en el mundo.",
  donorCount = 0,
  amountRaised = "Bs. 0,00",
  href,
}: CampaignCardProps) {
  // Generate the campaign URL - if href is provided use it, otherwise use /campaign/id
  const campaignUrl = href || (id ? `/campaign/${id}` : "/campaign");

  return (
    <Link
      href={campaignUrl}
      rel="noopener noreferrer"
      className="block h-full rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <div className="bg-white rounded-xl overflow-hidden group relative transition-all duration-300 h-full flex flex-col h-[520px]">
        {/* Campaign Image - Animated height */}
        <div className="relative h-64 group-hover:h-32 transition-all duration-300 overflow-hidden flex-shrink-0">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
          />
        </div>

        {/* Verified badge - moves to 50/50 position on hover */}
        <div className="absolute left-4 top-4 opacity-0 group-hover:opacity-100 group-hover:top-32 group-hover:-translate-y-1/2 transition-all duration-500 ease-in-out z-10">
          {verified && (
            <div className="w-12 h-12 rounded-full bg-[#2c6e49] flex items-center justify-center transition-all duration-500 ease-in-out shadow-sm">
              <Image
                src="/landing-page/step-2.png"
                alt="Verified"
                width={32}
                height={32}
                className="brightness-0 invert transition-all duration-500 ease-in-out"
              />
            </div>
          )}
        </div>

        {/* Card Content - Fixed height to prevent expansion */}
        <div className="p-3 bg-white flex flex-col relative flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col mb-1 flex-shrink-0">
            <div className="mb-1 flex-shrink-0 h-8 group-hover:opacity-0 transition-opacity duration-500 ease-in-out">
              {verified ? (
                <Image
                  src="/landing-page/step-2.png"
                  alt="Verified"
                  width={32}
                  height={32}
                  className="text-[#2c6e49] transition-opacity duration-500 ease-in-out"
                />
              ) : (
                <div className="w-8 h-8" />
              )}
            </div>
            <div className="h-16 flex items-start">
              <h3 className="font-medium text-2xl text-[#2c6e49] line-clamp-2 leading-tight overflow-hidden">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center text-base text-gray-600 mb-2 flex-wrap gap-2 flex-shrink-0 min-h-[32px]">
            <span className="bg-[#F8FAF2] text-[#2c6e49] px-2 py-1 rounded-md truncate max-w-[120px]">
              {category}
            </span>
            <span className="bg-[#F8FAF2] text-[#2c6e49] px-2 py-1 rounded-md truncate max-w-[120px]">
              {getRegionDisplayName(location)}
            </span>
          </div>

          {/* Description - Only visible on hover, positioned absolutely to not affect layout */}
          <div className="absolute top-[140px] left-3 right-3 overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-20 z-10">
            <div className="bg-white rounded p-2 shadow-sm relative">
              <p className="text-gray-600 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 leading-relaxed text-sm">
                {description}
              </p>
              
            </div>
          </div>

          {/* Stats - Only visible on hover, positioned absolutely to not affect layout */}
          <div className="absolute top-[200px] left-3 right-3 overflow-hidden transition-all duration-300 max-h-0 group-hover:max-h-24 z-10">
            <div className="bg-white rounded p-2 shadow-sm">
              <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                <div className="grid grid-cols-2 gap-4 text-[#2c6e49]">
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">Donadores</p>
                    <p className="text-lg font-bold truncate">{donorCount}</p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">Recaudado</p>
                    <p className="text-lg font-bold truncate">{amountRaised}</p>
                  </div><span className="absolute top-[-10px] right-2 text-[11px] text-[#2c6e49] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 overflow-visibles">
                ver más
              </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky/Floating button area - Always at bottom with fixed height */}
        <div className="bg-white p-3 pt-0 border-t-0 flex-shrink-0 h-[90px] flex flex-col justify-end">
          {/* Progress Bar and Separator Container - Fixed height */}
          <div className="h-10 mb-2 flex items-center relative">
            {/* Progress Bar - Hidden on hover */}
            <div className="w-full group-hover:opacity-0 transition-opacity duration-300">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#EBEDE6] rounded-full h-3">
                  <div
                    className="bg-[#2c6e49] h-3 rounded-full transition-all duration-300 max-w-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-base text-[#2c6e49] font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Separator - Only visible on hover, overlaid */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center">
              <div className="w-full h-px bg-gray-200"></div>
            </div>
          </div>

          {/* Donate Button - Fixed height */}
          <div className="h-10">
            <Button className="w-full h-full bg-white text-[#2c6e49] hover:bg-[#2c6e49] hover:text-white text-lg shadow-none border-0 rounded-full justify-start transition-all duration-300">
              Donar ahora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
