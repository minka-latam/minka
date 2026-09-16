"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import Image from "next/image";

interface CompletedCampaignCardProps {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  donorCount?: number;
  amountRaised?: string;
  totalGoal?: string;
}

export function CompletedCampaignCard({
  id,
  title,
  imageUrl,
  description,
  donorCount = 0,
  amountRaised = "Bs. 0,00",
  totalGoal = "Bs. 0,00",
}: CompletedCampaignCardProps) {
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

        <div className="flex-1 p-2 flex items-center justify-between h-full overflow-hidden">
          <div className="flex-1 min-h-0 relative">
            <div className="h-6 mb-1">
              <h3 className="font-semibold text-gray-900 flex-shrink-0 truncate overflow-hidden">
                {title}
              </h3>
            </div>
            {description && (
              <div className="h-5 mb-1">
                <p className="text-sm text-gray-600 mt-1 line-clamp-1 flex-shrink-0 truncate overflow-hidden">
                  {description}
                </p>
              </div>
            )}

            {/* Status indicator with a bigger point */}
            <div className="mt-1 flex-shrink-0 min-h-[28px]">
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-600 truncate max-w-[120px]">
                <span className="text-lg inline-block leading-none">•</span>{" "}
                Finalizada
              </span>
            </div>

            {/* Expanded description - Only visible on hover, positioned absolutely */}
            <div className="absolute top-16 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 z-20">
              <div className="bg-white rounded p-2 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {description && description.length > 50
                    ? description
                    : "Esta campaña ha sido completada exitosamente gracias a la colaboración de todas las personas que aportaron."}
                </p>
              </div>
            </div>

            {/* Stats - Only visible on hover, positioned absolutely */}
            <div className="absolute top-28 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 z-20">
              <div className="bg-white rounded p-2 shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-[#2c6e49]">
                  <div className="overflow-hidden">
                    <span className="font-medium text-sm block truncate">
                      Colaboradores
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

          {/* Separator - Only visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center flex-shrink-0">
            <div className="w-px h-12 bg-gray-200"></div>
          </div>

          <div
            className="text-[#2c6e49] flex items-center hover:underline font-bold px-2 py-2 rounded-full transition-all duration-300 self-center flex-shrink-0 max-w-[150px]"
            onClick={(e) => e.stopPropagation()}
          >
            Administrar Campaña <Edit className="ml-2 h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
