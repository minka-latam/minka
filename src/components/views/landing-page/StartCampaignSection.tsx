"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";

export function StartCampaignSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Campaign steps data
  const campaignSteps = [
    {
      id: "create",
      step: "01",
      icon: "/landing-page/step-1.svg",
      title: "Crea tu campaña",
      description:
        "Establece tu meta y cuenta tu historia para inspirar a más personas.",
    },
    {
      id: "verify",
      step: "02",
      icon: "/landing-page/step-2.png",
      title: "Verifica tu campaña",
      description:
        "Completa este proceso para garantizar confianza y transparencia.",
    },
    {
      id: "share",
      step: "03",
      icon: "/landing-page/step-3.svg",
      title: "Comparte tu campaña",
      description: "Difunde tu causa y atrae el apoyo que necesitas.",
    },
    {
      id: "manage",
      step: "04",
      icon: "/landing-page/step-4.svg",
      title: "Gestiona y retira los fondos",
      description:
        "Utiliza los fondos recaudados para hacer realidad tu propósito.",
    },
  ];

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % campaignSteps.length);
  }, [isAnimating, campaignSteps.length]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + campaignSteps.length) % campaignSteps.length);
  }, [isAnimating, campaignSteps.length]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
  }, [isAnimating, currentSlide]);

  // Reset animation lock after transition
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative w-full pt-16 md:pt-24 pb-72 md:pb-80 lg:pb-96 overflow-hidden">
      {/* Background SVG */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <Image
          src="/auth/auth-bg.svg"
          alt="Background with plants"
          width={1440}
          height={535}
          priority
          className="h-auto w-full"
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-16 relative z-10">
        {/* Intro header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-[#2c6e49] text-xl md:text-2xl font-medium mb-4 block">
            ¿Tienes una causa que necesita apoyo?
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#333333] mb-6 leading-tight">
            ¡Inicia tu campaña!
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-[#555555] max-w-2xl mx-auto">
            Sigue estos sencillos pasos y empieza a recibir la ayuda que tu
            proyecto merece.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="absolute -left-4 sm:-left-8 md:-left-20 lg:-left-24 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-[#2c6e49] hover:bg-[#2c6e49] hover:text-white transition-colors disabled:opacity-50"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="absolute -right-4 sm:-right-8 md:-right-20 lg:-right-24 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-[#2c6e49] hover:bg-[#2c6e49] hover:text-white transition-colors disabled:opacity-50"
            aria-label="Next step"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Slides container */}
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {campaignSteps.map((step) => (
                <div
                  key={step.id}
                  className="w-full flex-shrink-0 px-2 md:px-4"
                >
                  <div className="text-center py-6 md:py-8">
                    {/* Step icon */}
                    <div className="mb-5">
                      <Image
                        src={step.icon}
                        alt={`Step ${step.step} icon`}
                        width={80}
                        height={80}
                        className="mx-auto"
                      />
                    </div>

                    {/* Step number */}
                    <p className="text-[#2c6e49] text-base md:text-lg font-semibold mb-2 tracking-wider">
                      PASO {step.step}
                    </p>

                    {/* Step title */}
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#333333] mb-3 leading-tight">
                      {step.title}
                    </h3>

                    {/* Step description */}
                    <p className="text-base sm:text-lg md:text-xl text-[#555555] mb-6 max-w-xl mx-auto">
                      {step.description}
                    </p>

                    {/* Step button */}
                    <Link href="/create-campaign">
                      <Button
                        className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto rounded-full"
                        size="lg"
                      >
                        Crear campaña
                        <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {campaignSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-[#2c6e49] w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
