"use client";

import Image from "next/image";

const steps = [
  {
    id: "step-1",
    icon: "/landing-page/step-1.svg",
    label: "Crea tu campaña",
  },
  {
    id: "step-2",
    icon: "/landing-page/step-2.png",
    label: "Verifícala",
  },
  {
    id: "step-3",
    icon: "/landing-page/step-3.svg",
    label: "Compártela",
  },
  {
    id: "step-4",
    icon: "/landing-page/step-4.svg",
    label: "Gestiona los fondos",
  },
];

export function CreateCampaignHeader() {
  return (
    <div className="relative py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-600 mb-4">
            Personaliza tu campaña y comparte tu historia de forma gratuita.
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Sigue estos simples pasos y empieza a recaudar fondos.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Mobile view - Vertical steps with text to the right */}
          <div className="md:hidden py-6">
            <div className="relative flex flex-col space-y-0 max-w-[320px] mx-auto">
              {/* Vertical connecting line - single continuous line */}
              <div
                className="absolute w-[2px] bg-[#478C5C]"
                style={{
                  left: "45px",
                  top: "45px",
                  bottom: "45px",
                  transform: "translateX(-50%)",
                }}
              ></div>

              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center py-4">
                  {/* Step circle with icon */}
                  <div className="w-[90px] h-[90px] rounded-full border-[2px] border-[#478C5C] flex items-center justify-center bg-white z-10">
                    <Image
                      src={step.icon}
                      alt={step.label}
                      width={50}
                      height={50}
                    />
                  </div>

                  {/* Step label to the right */}
                  <div className="ml-6">
                    <span className="text-lg font-bold text-gray-700">
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop view - Horizontal steps */}
          <div className="hidden md:block py-8">
            <div className="relative flex items-center justify-between max-w-5xl mx-auto px-8">
              {/* Connecting line */}
              <div
                className="absolute h-[2px] bg-[#478C5C]"
                style={{
                  left: "140px",
                  right: "140px",
                  top: "40px",
                }}
              ></div>

              {/* Steps with more spacing */}
              <div className="w-full flex justify-between">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex flex-col items-center justify-start"
                  >
                    <div className="w-[80px] h-[80px] rounded-full bg-white border-[2px] border-[#478C5C] flex items-center justify-center mb-4 z-10 relative">
                      <Image
                        src={step.icon}
                        alt={step.label}
                        width={45}
                        height={45}
                      />
                    </div>
                    <span className="text-base font-bold text-gray-700 text-center">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
