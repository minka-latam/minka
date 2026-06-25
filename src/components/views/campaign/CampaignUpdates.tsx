"use client";

import { useState } from "react";
import { Clock, Expand, Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  if (!updates || updates.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#2c6e49] break-words">
          Actualizaciones de la campaña
        </h2>
        <div className="text-center py-8">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No hay actualizaciones aún
          </h3>
          <p className="text-base text-gray-500">
            El organizador todavía no publicó novedades para esta campaña.
          </p>
        </div>
      </div>
    );
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
                <span className="text-base text-gray-600 break-words">
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
              <p className="text-base text-gray-700 mb-4 break-words whitespace-pre-wrap leading-relaxed">
                {update.message}
              </p>

              {update.imageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImage({
                      url: update.imageUrl!,
                      title: update.title,
                    })
                  }
                  className="group mt-4 mb-4 flex w-full max-w-sm items-center gap-4 rounded-lg border border-gray-200 bg-[#f9faf6] p-2 text-left transition hover:border-[#2c6e49]/40 hover:bg-[#f5f8ef] focus:outline-none focus:ring-2 focus:ring-[#2c6e49]/30 sm:max-w-md"
                  aria-label={`Ampliar imagen de ${update.title}`}
                >
                  <span className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-md bg-gray-100 sm:h-28 sm:w-40">
                    <img
                      src={update.imageUrl}
                      alt={update.title}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      onError={(e) => {
                        console.error(
                          `Failed to load image: ${update.imageUrl}`
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#2c6e49]">
                      Ver imagen
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      Haz click para ampliar esta actualización.
                    </span>
                  </span>
                  <Expand className="h-5 w-5 shrink-0 text-[#2c6e49]" />
                </button>
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
      <Dialog
        open={Boolean(selectedImage)}
        onOpenChange={(open) => {
          if (!open) setSelectedImage(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden rounded-xl bg-white p-3 sm:p-4">
          <DialogTitle className="sr-only">
            {selectedImage?.title || "Imagen de actualización"}
          </DialogTitle>
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-h-[82vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
