"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    alert("¡Gracias por contactarnos! Te responderemos pronto.");
    setFormData({
      name: "",
      email: "",
      message: "",
    });
  };

  return (
    <div>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 md:mb-16 text-center">
        Contáctanos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
        <div className="flex items-center justify-center order-2 md:order-1 h-full">
          <div className="h-full flex items-center">
            <Image
              src="/about-us/team-minka.svg"
              alt="Team Minka"
              width={600}
              height={600}
              className="w-full h-auto max-h-full"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm flex flex-col order-1 md:order-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 md:space-y-8 flex-grow"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-base md:text-lg font-medium text-gray-700 mb-2"
              >
                Nombre completo
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#2c6e49] focus:ring-[#2c6e49] h-12 px-4 text-lg"
                placeholder="Ingresa tu nombre"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-base md:text-lg font-medium text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#2c6e49] focus:ring-[#2c6e49] h-12 px-4 text-lg"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-base md:text-lg font-medium text-gray-700 mb-2"
              >
                Mensaje
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#2c6e49] focus:ring-[#2c6e49] p-4 text-lg"
                placeholder="¿Tienes alguna campaña? ¿Cómo te ayudamos?"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2c6e49] hover:bg-[#1e4d33] text-white text-lg"
              size="lg"
            >
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
