"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function PartnersSection() {
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allies = [
    {
      id: 1,
      name: "Banco BISA",
      logo: "/allies/logo bisa fblanco.png",
      surfaceClassName: "rounded-xl bg-[#2c6e49] px-5 py-4",
    },
    {
      id: 2,
      name: "Tripto",
      logo: "/allies/tripto.png",
    },
    {
      id: 3,
      name: "Giro54",
      logo: "/allies/giro54.png",
    },
    {
      id: 4,
      name: "UNIL HUB",
      logo: "/allies/unil-hub.png",
      href: "https://www.unil.ch/",
    },
    {
      id: 5,
      name: "UCreate",
      logo: "/allies/UCreate.png",
    },
    {
      id: 6,
      name: "SAR",
      logo: "/allies/sar.png",
    },
    {
      id: 7,
      name: "Fundacor",
      logo: "/allies/fundacor.png",
    },
  ];

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Infinite scroll animation for mobile
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;

    // Clone the allies for infinite scroll effect
    const scrollContainer = scrollContainerRef.current;
    const scrollWidth = scrollContainer.scrollWidth;

    // Set up the animation
    const startAnimation = () => {
      if (!scrollContainer) return;

      // Reset position if we've scrolled to the end
      if (scrollContainer.scrollLeft >= scrollWidth / 2) {
        scrollContainer.scrollLeft = 0;
      }

      // Scroll one pixel at a time
      scrollContainer.scrollLeft += 1;

      // Continue the animation
      requestAnimationFrame(startAnimation);
    };

    // Start the animation
    const animationId = requestAnimationFrame(startAnimation);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isMobile]);

  return (
    <section className="py-24 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <h2 className="text-6xl md:text-7xl font-bold text-[#333333] mb-16 animate-slide-up text-center">
          Nuestros aliados
        </h2>

        {/* Desktop view - grid */}
        {!isMobile && (
          <div className="mx-auto hidden max-w-5xl grid-cols-3 items-center gap-10 lg:grid-cols-4 md:grid">
            {allies.map((ally) => (
              <div
                key={ally.id}
                className="group flex items-center justify-center h-24"
                title={ally.href ? `Visitar ${ally.name}` : ally.name}
              >
                <PartnerLogo ally={ally} />
              </div>
            ))}
          </div>
        )}

        {/* Mobile view - infinite scroll carousel */}
        {isMobile && (
          <div className="md:hidden overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex items-center space-x-8 overflow-x-auto scrollbar-hide py-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {/* First set of allies */}
              {allies.map((ally) => (
                <div
                  key={`first-${ally.id}`}
                  className="flex-shrink-0 w-32 h-20 flex items-center justify-center"
                  title={ally.href ? `Visitar ${ally.name}` : ally.name}
                >
                  <PartnerLogo ally={ally} sizes="128px" />
                </div>
              ))}

              {/* Duplicate set for infinite scroll effect */}
              {allies.map((ally) => (
                <div
                  key={`second-${ally.id}`}
                  className="flex-shrink-0 w-32 h-20 flex items-center justify-center"
                  title={ally.href ? `Visitar ${ally.name}` : ally.name}
                >
                  <PartnerLogo ally={ally} sizes="128px" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PartnerLogo({
  ally,
  sizes = "(max-width: 768px) 40vw, (max-width: 1024px) 25vw, 20vw",
}: {
  ally: {
    name: string;
    logo: string;
    href?: string;
    surfaceClassName?: string;
  };
  sizes?: string;
}) {
  const content = (
    <div
      className={`relative w-full h-full flex items-center justify-center px-4 ${ally.surfaceClassName || ""}`}
    >
      <Image
        src={ally.logo}
        alt={`Logo de ${ally.name}`}
        fill
        className="object-contain partner-logo group-hover:scale-105"
        sizes={sizes}
      />
    </div>
  );

  if (!ally.href) {
    return content;
  }

  return (
    <a
      href={ally.href}
      rel="noopener noreferrer"
      className="relative block h-full w-full"
    >
      {content}
    </a>
  );
}
