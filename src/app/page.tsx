import { HeroSection } from "@/components/views/landing-page/HeroSection";
import { CausesSection } from "@/components/views/landing-page/CausesSection";
import { TrustSection } from "@/components/views/landing-page/TrustSection";
import { StartCampaignSection } from "@/components/views/landing-page/StartCampaignSection";
import { TestimonialsSection } from "@/components/views/landing-page/TestimonialsSection";
import { PartnersSection } from "@/components/views/landing-page/PartnersSection";
import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "MINKA - Impulsa sueños, transforma vidas | Plataforma de donaciones Bolivia",
  description:
    "Únete a MINKA, la plataforma de donaciones líder en Bolivia. Apoya causas sociales, crea campañas de recaudación y transforma vidas. ¡Empieza tu campaña hoy!",
  keywords: [
    "donaciones Bolivia",
    "crowdfunding Bolivia",
    "causas sociales",
    "recaudación de fondos",
    "ayuda social Bolivia",
    "plataforma donaciones",
    "MINKA",
    "transformar vidas",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MINKA - Impulsa sueños, transforma vidas",
    description:
      "Únete a MINKA, la plataforma de donaciones líder en Bolivia. Apoya causas sociales y transforma vidas.",
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "MINKA",
  },
  twitter: {
    card: "summary_large_image",
    title: "MINKA - Impulsa sueños, transforma vidas",
    description:
      "Únete a MINKA, la plataforma de donaciones líder en Bolivia. Apoya causas sociales y transforma vidas.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ECF1DC]">
      <Header />
      <main className="flex-grow pt-20 md:pt-24">
        <HeroSection />
        <CausesSection />
        <TrustSection />
        <div className="bg-gradient-to-r from-white to-[#ECF1DC]">
          <StartCampaignSection />
        </div>
        <TestimonialsSection />
        <PartnersSection />
      </main>
      <Footer />
    </div>
  );
}
