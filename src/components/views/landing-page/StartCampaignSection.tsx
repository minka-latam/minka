"use client";

import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  landingPrimaryButton,
  landingSecondaryButton,
} from "./landing-button-styles";

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
      title: "Verificala",
      description:
        "Completa este proceso para garantizar confianza y transparencia.",
    },
    {
      id: "share",
      step: "03",
      icon: "/landing-page/step-3.svg",
      title: "Comparte en tus redes",
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

  // Reset animation lock
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Auto-advance carousel on mobile every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative container mx-auto px-4 pt-24 md:pb-0 lg:pb-40">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 relative z-10">
        {/* Intro Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="text-[#2c6e49] text-lg md:text-xl font-semibold uppercase tracking-wider mb-3 block">
            ¿Tienes una causa que necesita apoyo?
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#333333] mb-6 leading-tight tracking-tight">
            ¡Inicia tu campaña!
          </h2>
          <p className="text-lg sm:text-xl text-[#555555] max-w-2xl mx-auto font-light">
            Sigue estos sencillos pasos y empieza a recibir la ayuda que tu
            proyecto merece.
          </p>
        </div>

        {/* DESKTOP VIEW: Beautiful static timeline grid (LG screens and up) */}
        <div className="hidden lg:grid grid-cols-4 gap-6 max-w-7xl mx-auto relative mb-16">
          {campaignSteps.map((step, idx) => (
            <div
              key={step.id}
              className="relative flex flex-col items-center text-center p-8 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group"
            >
              {/* Step indicator badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2c6e49] text-white font-bold text-sm px-3 py-1 rounded-full shadow-sm">
                PASO {step.step}
              </div>

              {/* Icon Container with subtle animation */}
              <div className="w-20 h-20 flex items-center justify-center bg-[#f0f7f4] rounded-full mb-6 mt-2 group-hover:scale-110 transition-transform duration-300">
                <Image
                  src={step.icon}
                  alt={`Step ${step.step} icon`}
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </div>

              {/* Step Title */}
              <h3 className="text-xl font-bold text-[#333333] mb-3 group-hover:text-[#2c6e49] transition-colors">
                {step.title}
              </h3>

              {/* Step Description */}
              <p className="text-base text-[#555555] leading-relaxed">
                {step.description}
              </p>

              {/* Visual connector lines between steps */}
              {idx < 3 && (
                <div className="hidden xl:block absolute top-[52px] -right-4 w-8 h-[2px] border-t-2 border-dashed border-gray-200 z-10" />
              )}
            </div>
          ))}
        </div>

        {/* MOBILE & TABLET VIEW: Compact Swipeable Carousel (MD screens and down) */}
        <div className="block lg:hidden relative max-w-lg mx-auto mb-12">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md text-[#2c6e49] hover:bg-[#2c6e49] hover:text-white transition-colors disabled:opacity-40"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md text-[#2c6e49] hover:bg-[#2c6e49] hover:text-white transition-colors disabled:opacity-40"
            aria-label="Next step"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slides Container */}
          <div className="overflow-hidden rounded-2xl mx-6 sm:mx-8">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {campaignSteps.map((step) => (
                <div key={step.id} className="w-full flex-shrink-0 px-2">
                  <div className="text-center py-8 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    {/* Step badge */}
                    <span className="inline-block bg-[#f0f7f4] text-[#2c6e49] text-sm font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-4">
                      PASO {step.step}
                    </span>

                    {/* Icon */}
                    <div className="mb-5 flex justify-center">
                      <div className="w-20 h-20 flex items-center justify-center bg-[#f0f7f4] rounded-full">
                        <Image
                          src={step.icon}
                          alt={`Step ${step.step} icon`}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-[#333333] mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-[#555555] leading-relaxed max-w-sm mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {campaignSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-[#2c6e49] w-6"
                    : "bg-gray-200 hover:bg-gray-300 w-2"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Unified Call To Action Buttons */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
          <Button
            asChild
            size="lg"
            className={`${landingPrimaryButton} text-base md:text-lg`}
          >
            <Link href="/create-campaign">
              Crear mi campaña
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className={`${landingSecondaryButton} text-base md:text-lg`}
          >
            <Link href="/help">Ver Preguntas Frecuentes</Link>
          </Button>
        </div>

        <div className="relative z-10 mx-auto mt-24 lg:mt-0 h-72 w-72 overflow-visible lg:absolute lg:-right-0 lg:top-[45rem] xl:h-[24rem] xl:w-[24rem]">
          <Image
            src="/landing-page/muleta.png"
            alt=""
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 352px, 320px"
            className="scale-[1.45] object-contain lg:scale-[1.55]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
