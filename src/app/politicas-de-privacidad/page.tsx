import { LegalDocumentContent } from "@/components/legal/LegalDocumentContent";
import { Footer } from "@/components/views/landing-page/Footer";
import { Header } from "@/components/views/landing-page/Header";
import { privacyDocument } from "@/lib/legal/documents";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | MINKA",
  description: "Política de privacidad de la plataforma MINKA.",
};

export default function PoliticasDePrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-r from-white to-[#ECF1DC]">
      <Header />
      <main className="container mx-auto max-w-4xl flex-grow px-4 py-28 md:py-32">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#2c6e49]">
          Documento legal
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight text-[#333333] md:text-5xl">
          {privacyDocument.title}
        </h1>
        {privacyDocument.updated && (
          <p className="mb-10 text-sm font-medium text-[#6b7280]">
            {privacyDocument.updated}
          </p>
        )}

        <section className="rounded-2xl border border-[#dbe5cf] bg-white/85 p-5 shadow-sm md:p-8">
          <LegalDocumentContent document={privacyDocument} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
