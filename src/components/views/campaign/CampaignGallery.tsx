"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";

type CampaignGalleryItem = {
  url: string;
  type: "image" | "video" | "youtube";
  id: string;
};

interface CampaignGalleryProps {
  images: CampaignGalleryItem[];
  campaignTitle?: string;
}

function getYoutubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      const [section, videoId] = parsedUrl.pathname.split("/").filter(Boolean);
      if (["embed", "shorts"].includes(section) && videoId) {
        return videoId;
      }
    }
  } catch {
    // Fall back to regex parsing for partial or legacy values.
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtube\.com\/embed\/)([^?&]+)/,
    /(?:youtu\.be\/)([^?&]+)/,
    /(?:youtube\.com\/shorts\/)([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function getYoutubeEmbedUrl(url: string) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
}

function getYoutubeThumbnailUrl(url: string) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function MediaPreview({
  item,
  alt,
  className,
  priority = false,
}: {
  item: CampaignGalleryItem;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  if (item.type === "youtube") {
    const thumbnailUrl = getYoutubeThumbnailUrl(item.url);

    return thumbnailUrl ? (
      <img
        src={thumbnailUrl}
        alt={alt}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    ) : (
      <div className={`absolute inset-0 h-full w-full ${className} flex items-center justify-center bg-gray-900 text-white text-sm`}>
        Video
      </div>
    );
  }

  return (
    <Image
      src={item.url || "/placeholder.svg"}
      alt={alt}
      fill
      priority={priority}
      className={className}
    />
  );
}

export function CampaignGallery({
  images,
  campaignTitle = "Campaign",
}: CampaignGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const openModal = (index: number) => { // Debug log
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToPrevious = () => {
    setModalImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setModalImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (event.key) {
        case "Escape":
          closeModal();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Prevent body scroll when modal is open
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Get thumbnails (exclude the currently selected main image)
  const thumbnails = images.filter((_, index) => index !== selectedImage);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handleMainImageClick = () => { // Debug log
    if (images[selectedImage]?.type === "youtube") return;
    openModal(selectedImage);
  };

  const selectedItem = images[selectedImage];
  const selectedYoutubeEmbedUrl =
    selectedItem.type === "youtube" ? getYoutubeEmbedUrl(selectedItem.url) : null;
  const modalItem = images[modalImageIndex];
  const modalYoutubeEmbedUrl =
    modalItem?.type === "youtube" ? getYoutubeEmbedUrl(modalItem.url) : null;

  return (
    <>
      <div className="space-y-4">
        {/* Main Media */}
        <div
          className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 group ${
            selectedItem.type === "youtube" ? "bg-black" : "cursor-pointer"
          }`}
          onClick={handleMainImageClick}
        >
          {selectedItem.type === "youtube" && selectedYoutubeEmbedUrl ? (
            <iframe
              src={selectedYoutubeEmbedUrl}
              title={`${campaignTitle} - Video de YouTube`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <MediaPreview
              item={selectedItem}
              alt={`${campaignTitle} - ${selectedItem.type === "video" ? "Video thumbnail" : "Main photo"} ${selectedImage + 1}`}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority
            />
          )}
          {selectedItem.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-12 w-12 text-white" />
            </div>
          )}
          {/* Click overlay hint */}
          {selectedItem.type !== "youtube" && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                Ampliar
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Grid */}
        {thumbnails.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {thumbnails.map((image, thumbIndex) => {
              // Find the original index of this image
              const originalIndex = images.findIndex(
                (img) => img.id === image.id
              );

              return (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => setSelectedImage(originalIndex)}
                  onDoubleClick={() => openModal(originalIndex)}
                  className="relative aspect-square overflow-hidden rounded-xl border-2 border-transparent hover:border-[#2c6e49] transition-colors duration-200 group cursor-pointer"
                >
                  <MediaPreview
                    item={image}
                    alt={`${campaignTitle} - ${image.type === "youtube" ? "Video de YouTube" : image.type === "video" ? "Video thumbnail" : "Photo"} ${originalIndex + 1}`}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {(image.type === "video" || image.type === "youtube") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Show total count */}
        <div className="text-center text-sm text-gray-600">
          {images.length} {images.length === 1 ? "medio" : "medios"}
        </div>
      </div>

      {/* Modal - Adapts to image resolution with no rounded borders */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-8">
          <div className="bg-[#f5f3f0] shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#f0ede8] border-b border-[#e8e3dc]">
              <h2 className="text-xl font-semibold text-[#2c6e49]">
                Galería de medios
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#e8e3dc] transition-colors duration-200"
              >
                <X className="h-5 w-5 text-[#2c6e49]" />
              </button>
            </div>

            {/* Modal Content - Image covers full width */}
            <div className="flex items-center justify-center bg-[#f5f3f0]">
              <div className="relative w-full">
                {modalItem.type === "youtube" && modalYoutubeEmbedUrl ? (
                  <div className="relative aspect-video w-[80vw] max-w-5xl">
                    <iframe
                      src={modalYoutubeEmbedUrl}
                      title={`${campaignTitle} - Video de YouTube`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : modalItem.type === "youtube" ? (
                  <div className="flex aspect-video w-[80vw] max-w-5xl items-center justify-center bg-gray-900 text-white">
                    Video no disponible
                  </div>
                ) : (
                  <Image
                    src={modalItem.url || "/placeholder.svg"}
                    alt={`${campaignTitle} - ${modalItem.type === "video" ? "Video" : "Image"} ${modalImageIndex + 1}`}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: "60vh" }}
                  />
                )}
                {images[modalImageIndex].type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-16 w-16 text-white drop-shadow-lg" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Navigation Arrows */}
            <div className="bg-[#f0ede8] p-6 border-t border-[#e8e3dc]">
              <div className="flex items-center justify-center gap-8">
                {/* Previous Arrow */}
                <button
                  onClick={goToPrevious}
                  className="p-4 bg-[#2c6e49] hover:bg-[#1f4d33] text-white rounded-full transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={images.length <= 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Image Counter */}
                <span className="text-sm text-[#6b5b47] font-medium px-6 py-2 bg-[#e8e3dc] min-w-[80px] text-center">
                  {modalImageIndex + 1} de {images.length}
                </span>

                {/* Next Arrow */}
                <button
                  onClick={goToNext}
                  className="p-4 bg-[#2c6e49] hover:bg-[#1f4d33] text-white rounded-full transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={images.length <= 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
