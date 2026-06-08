"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#333333] mb-8 leading-tight">
          Impulsa sueños, transforma vidas
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl text-[#555555] mb-10">
          Conectamos a quienes anhelan recibir ayuda, con aquellos que quieren
          hacer sueños realidad, a través de una plataforma segura que facilita
          las donaciones.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/all-campaigns" rel="noopener noreferrer">
            <Button
              className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white text-xl w-full sm:w-auto rounded-full"
              size="lg"
            >
              Explorar <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/create-campaign" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="bg-white border-[#2c6e49] text-[#2c6e49] hover:bg-[#f5f7e9] text-xl w-full sm:w-auto rounded-full"
              size="lg"
            >
              Crear Campaña
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex justify-center">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Home-NGwlOMn4tqq2NFWU5hMqqcgTWQcUmi.svg"
          alt="Personas diversas"
          width={800}
          height={400}
          className="w-full max-w-4xl"
        />
      </div>
    </section>
  );
}
