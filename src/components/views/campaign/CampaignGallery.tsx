"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";

interface CampaignGalleryProps {
  images: { url: string; type: "image" | "video"; id: string }[];
  campaignTitle?: string;
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
    openModal(selectedImage);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-gray-200 cursor-pointer group"
          onClick={handleMainImageClick}
        >
          <Image
            src={images[selectedImage].url || "/placeholder.svg"}
            alt={`${campaignTitle} - ${images[selectedImage].type === "video" ? "Video thumbnail" : "Main photo"} ${selectedImage + 1}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {images[selectedImage].type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-12 w-12 text-white" />
            </div>
          )}
          {/* Click overlay hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              Click to enlarge
            </div>
          </div>
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
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={`${campaignTitle} - ${image.type === "video" ? "Video thumbnail" : "Photo"} ${originalIndex + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {image.type === "video" && (
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
          {images.length} {images.length === 1 ? "image" : "images"}
        </div>
      </div>

      {/* Modal - Adapts to image resolution with no rounded borders */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-8">
          <div className="bg-[#f5f3f0] shadow-2xl max-w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#f0ede8] border-b border-[#e8e3dc]">
              <h2 className="text-xl font-semibold text-[#2c6e49]">
                Galería de imágenes
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
                <Image
                  src={images[modalImageIndex].url || "/placeholder.svg"}
                  alt={`${campaignTitle} - ${images[modalImageIndex].type === "video" ? "Video" : "Image"} ${modalImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: "60vh" }}
                />
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
