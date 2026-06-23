"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const communityVoices = [
  {
    id: 1,
    quote:
      "Como donante, quiero entender bien quién organiza la campaña, cuál es la necesidad y cómo se usará mi aporte antes de ayudar.",
    title: "Donante anónimo",
  },
  {
    id: 2,
    quote:
      "Para una familia o una causa pequeña, tener un enlace claro para compartir puede hacer más simple explicar la situación y recibir apoyo.",
    title: "Valeria - Organizadora",
  },
  {
    id: 3,
    quote:
      "Cuando una campaña muestra contexto, documentos y, mejor si está verificada, es más fácil decidir si puedo aportar o compartirla con otras personas.",
    title: "Rodrigo - Donante",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState(3);
  const maxIndex = Math.max(communityVoices.length - visibleItems, 0);
  const hasCarouselControls = communityVoices.length > visibleItems;

  // Check if we're on mobile and set visible items
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        setVisibleItems(3);
      } else if (width >= 768) {
        setVisibleItems(2);
      } else {
        setVisibleItems(1);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      // If we're at the last possible position (considering visible items), go back to 0
      return nextIndex > maxIndex ? 0 : nextIndex;
    });
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex - 1;
      // If we're at the first position, go to the last possible position
      return nextIndex < 0 ? maxIndex : nextIndex;
    });
  }, [maxIndex]);

  const goToSlide = useCallback(
    (index: number) => {
      // Ensure we don't go beyond the last possible position
      if (index > maxIndex) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(index);
      }
    },
    [maxIndex]
  );

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (!hasCarouselControls) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasCarouselControls, nextSlide]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-5xl font-bold leading-tight text-[#333333] md:text-6xl">
            Una comunidad que necesita confianza
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#555555] md:text-xl">
            Minka está empezando. Estas son las necesidades que queremos atender
            para donantes, organizadores e instituciones.
          </p>
        </div>

        {/* Carousel for both mobile and desktop */}
        <div className="relative max-w-7xl mx-auto px-8 md:px-12">
          <div ref={carouselRef} className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
              }}
            >
              {communityVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="px-4 md:px-6 py-4"
                  style={{ flex: `0 0 ${100 / visibleItems}%` }}
                >
                  <div className="testimonial-card h-full rounded-xl bg-white p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md md:p-8">
                    <div className="mb-6 md:mb-8">
                      <svg
                        className="w-8 h-8 md:w-10 md:h-10 text-[#2c6e49] mx-auto mb-3 md:mb-4 opacity-20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-label="Quote Icon"
                        role="img"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <p className="text-base md:text-lg text-gray-600 mb-5 md:mb-6 leading-relaxed">
                        {voice.quote}
                      </p>
                    </div>
                    <div className="animate-fade-in">
                      <p className="font-medium text-lg md:text-xl text-[#2c6e49] mb-1">
                        {voice.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasCarouselControls && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100 md:-translate-x-0"
                aria-label="Previous community note"
                type="button"
              >
                <ChevronLeft className="h-5 w-5 text-[#2c6e49] md:h-6 md:w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-100 md:translate-x-0"
                aria-label="Next community note"
                type="button"
              >
                <ChevronRight className="h-5 w-5 text-[#2c6e49] md:h-6 md:w-6" />
              </button>

              <div className="mt-8 flex justify-center space-x-2">
                {communityVoices.slice(0, maxIndex + 1).map((voice, index) => (
                  <button
                    key={voice.id}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-6 bg-[#2c6e49]"
                        : "w-2 bg-gray-300"
                    }`}
                    aria-label={`Go to community note ${index + 1}`}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
