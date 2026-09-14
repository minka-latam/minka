"use client";

import Image from "next/image";

export function TrustSection() {
  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-6xl md:text-7xl font-bold text-[#333333] mb-6">
          ¿Por qué confiar en Minka?
        </h2>
        <p className="text-2xl md:text-3xl text-[#555555]">
          Transparencia y seguridad para aportar y transformar vidas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-10">
          <div className="flex items-start gap-8 pb-8 border-b border-gray-200">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/confirm-icon-w3wxFZSZtxoy7Iwk0KN3doxhlRbznf.svg"
              alt="Campañas verificadas"
              width={96}
              height={96}
              className="w-16 h-16 flex-shrink-0"
            />
            <div>
              <h3 className="text-3xl font-medium text-[#2c6e49] mb-3">
                Campañas verificadas
              </h3>
              <p className="text-xl md:text-2xl text-gray-600">
                Procuramos que la mayoría de las campañas estén verificadas para
                asegurar su autenticidad.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-8 pb-8 border-b border-gray-200">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lock-icon-aJZX8cQjGhXaCTSTUKeC9e8y6oAnKK.svg"
              alt="Transacción segura"
              width={96}
              height={96}
              className="w-16 h-16 flex-shrink-0"
            />
            <div>
              <h3 className="text-3xl font-medium text-[#2c6e49] mb-3">
                Transacción segura
              </h3>
              <p className="text-xl md:text-2xl text-gray-600">
                Trabajamos con plataformas de pago seguras para garantizar la
                protección de tus aportes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hand-heart-icon-jFHBzjmxk7RiW97nj44Nfj5AtbGuqO.svg"
              alt="Impacto social"
              width={96}
              height={96}
              className="w-16 h-16 flex-shrink-0"
            />
            <div>
              <h3 className="text-3xl font-medium text-[#2c6e49] mb-3">
                Impacto social
              </h3>
              <p className="text-xl md:text-2xl text-gray-600">
                Tus aportes contribuyen a generar un impacto positivo en
                comunidades y proyectos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comunidad-shGBfLnX8D5ExYDMXxU2YJluRrAPb5.svg"
            alt="Comunidad Minka"
            width={600}
            height={600}
            className="w-full max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}
