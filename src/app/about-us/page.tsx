import { FoundersCarousel } from "@/components/views/about-us/FounderCarousel";
// import { SuccessStory } from "@/components/views/about-us/SuccessStory";
import { ContactSection } from "@/components/views/help/ContactSection";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#f5f7e9] flex flex-col">
      <Header />
      {/* Spacer div to account for the fixed header height */}
      <div className="h-20 md:h-28"></div>
      <main className="container mx-auto px-4 py-16 flex-grow">
        {/* Hero Section */}
        <div className="text-center mb-32">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#333333] mb-8 leading-tight">
            Impulsamos causas, transformamos vidas
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
            En Minka, creemos en el poder de la solidaridad para transformar
            vidas. Somos una plataforma de crowdfunding que conecta a quienes
            necesitan apoyo social con personas dispuestas a ayudar,
            garantizando transparencia y seguridad en cada donación. Nuestro
            objetivo es brindar un espacio accesible y confiable donde cualquier
            causa, desde emergencias hasta proyectos de impacto social, pueda
            recibir el respaldo que merece.
          </p>
        </div>

        {/* Founders Section */}
        <section className="mb-32">
          <FoundersCarousel />
        </section>

        {/* FAQ Section - Replacing Contact Form */}
        <section className="mb-32 max-w-4xl mx-auto">
          <div className="text-center pb-12">
            <h2 className="text-3xl font-bold text-[#2c6e49] mb-6">
              ¿Tienes preguntas?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Consulta nuestra sección de preguntas frecuentes para obtener
              respuestas a las dudas más comunes sobre donaciones, campañas y
              cómo funciona nuestra plataforma.
            </p>
            <Link href="/help">
              <Button className="bg-[#2c6e49] hover:bg-[#1e4d33] text-white text-lg rounded-full px-8 py-6">
                Ver preguntas frecuentes{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <ContactSection />
        </section>

        {/* Success Story Section - hidden for now, keep for future adaptation.
        <section className="mb-32">
          <SuccessStory />
        </section>
        */}
      </main>
      <Footer />
    </div>
  );
}
