"use client";

import { Clock } from "lucide-react";
import { useEffect } from "react";

export interface CampaignUpdateType {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  youtubeUrl?: string;
  imageUrl?: string;
}

interface CampaignUpdatesProps {
  updates: CampaignUpdateType[];
}

export function CampaignUpdates({ updates }: CampaignUpdatesProps) {
  useEffect(() => {
  }, [updates]);

  if (!updates || updates.length === 0) {
    return null;
  }

  // Function to extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;

    // Match YouTube URL patterns and extract the video ID
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
        Actualizaciones de la campaña
      </h2>
      <div className="space-y-6">
        {updates.map((update) => {

          const youtubeId = update.youtubeUrl
            ? getYoutubeVideoId(update.youtubeUrl)
            : null;

          return (
            <div
              key={update.id}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-[#2c6e49] flex-shrink-0" />
                <span className="text-gray-600 break-words">
                  {typeof update.createdAt === "string"
                    ? new Date(update.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Fecha no disponible"}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2 break-words">
                {update.title}
              </h3>
              <p className="text-gray-700 mb-4 break-words whitespace-pre-wrap leading-relaxed">
                {update.message}
              </p>

              {update.imageUrl && (
                <div className="mt-4 mb-4 rounded-lg overflow-hidden">
                  <div className="relative h-60 w-full">
                    <img
                      src={update.imageUrl}
                      alt={update.title}
                      className="object-cover w-full h-full rounded-lg"
                      onError={(e) => {
                        console.error(
                          `Failed to load image: ${update.imageUrl}`
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {update.youtubeUrl && youtubeId && (
                <div className="mt-4 mb-4 aspect-video w-full rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={update.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
