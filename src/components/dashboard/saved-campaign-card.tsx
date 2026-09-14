"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SavedCampaignCardProps {
  id: string;
  title: string;
  imageUrl: string;
  category?: string;
  location: string;
  isInclusive?: boolean;
  description?: string;
  donorCount?: number;
  amountRaised?: string;
  onUnsave?: (id: string) => Promise<void>;
}

export function SavedCampaignCard({
  id,
  title,
  imageUrl,
  location,
  isInclusive = false,
  description = "Ayuda a esta campaña y sé parte del cambio que queremos ver en el mundo.",
  donorCount = 0,
  amountRaised = "Bs. 0,00",
  onUnsave,
}: SavedCampaignCardProps) {
  const handleUnsave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUnsave) {
      await onUnsave(id);
    }
  };

  return (
    <Link
      href={`/campaign/${id}`}
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-sm overflow-hidden relative hover:shadow-md transition-all duration-200 group h-[180px]"
    >
      <div className="flex overflow-hidden relative h-full">
        <div className="relative w-[140px] group-hover:w-[80px] transition-all duration-300">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover rounded-l-lg"
            sizes="140px"
          />
        </div>

        {/* Verified badge - moves to 50/50 position on hover */}
        <div className="absolute left-[140px] group-hover:left-[80px] top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-500 ease-in-out">
          <div className="bg-[#2c6e49] group-hover:bg-[#2c6e49] rounded-full p-1 flex items-center justify-center w-[30px] h-[30px] group-hover:w-[36px] group-hover:h-[36px] transition-all duration-500 ease-in-out shadow-sm">
            <Image
              src="/icons/verified.svg"
              alt="Verified"
              width={20}
              height={20}
              className="brightness-0 invert transition-all duration-500 ease-in-out" /* Always white */
            />
          </div>
        </div>

        {/* Unsave button */}
        {onUnsave && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white hover:text-red-500 z-20"
            onClick={handleUnsave}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Eliminar de guardados</span>
          </Button>
        )}

        <div className="flex-1 p-2 flex flex-col justify-between h-full overflow-hidden">
          <div className="flex-1 min-h-0 relative">
            <div className="h-6 mb-1">
              <h3 className="font-semibold text-gray-900 flex-shrink-0 truncate overflow-hidden">
                {title}
              </h3>
            </div>

            {/* Tags */}
            <div className="flex gap-2 mt-1 flex-shrink-0 min-h-[24px] overflow-hidden">
              {isInclusive && (
                <span className="text-xs font-medium py-1 px-2 rounded-full bg-[#e8f5ed] text-[#2c6e49] truncate max-w-[80px]">
                  Inclusivo
                </span>
              )}
              <span className="text-xs font-medium py-1 px-2 rounded-full bg-[#e8f5ed] text-[#2c6e49] truncate max-w-[100px]">
                {location}
              </span>
            </div>

            {/* Description - Only visible on hover, positioned absolutely */}
            <div className="absolute top-12 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 z-20">
              <div className="bg-white rounded p-2 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Stats - Only visible on hover, positioned absolutely */}
            <div className="absolute top-20 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 z-20">
              <div className="bg-white rounded p-2 shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-[#2c6e49]">
                  <div className="overflow-hidden">
                    <span className="font-medium text-sm block truncate">
                      Donadores
                    </span>
                    <p className="font-bold text-lg truncate">{donorCount}</p>
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-medium text-sm block truncate">
                      Recaudado
                    </span>
                    <p className="font-bold text-lg truncate">{amountRaised}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator - Only visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center">
          <div className="w-px h-12 bg-gray-200"></div>
        </div>

        <div className="flex items-center pr-2 self-center flex-shrink-0">
          <div className="text-[#2c6e49] hover:bg-[#e8f5ed] border border-[#2c6e49] rounded-full px-5 py-2 text-sm flex items-center gap-2 font-medium transition-colors">
            Aportar
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
