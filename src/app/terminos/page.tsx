import { LegalDocumentContent } from '@/components/legal/LegalDocumentContent'
import { Footer } from '@/components/views/landing-page/Footer'
import { Header } from '@/components/views/landing-page/Header'
import { legalDocuments } from '@/lib/legal/documents'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | MINKA',
  description:
    'Términos y condiciones, políticas de privacidad, desembolsos y verificación de campañas de MINKA.',
}

const documentDescriptions: Record<string, string> = {
  terms:
    'Condiciones generales de uso de la plataforma, campañas, donaciones y obligaciones de usuarios.',
  privacy:
    'Tratamiento de datos personales, privacidad, conservación de información y derechos de los usuarios.',
  disbursements:
    'Reglas aplicables a solicitudes, revisión y entrega de fondos recaudados.',
  verification:
    'Criterios, documentación y proceso de revisión de campañas en MINKA.',
}

export default function TerminosPage() {
  return (
    <div className='flex min-h-screen flex-col bg-gradient-to-r from-white to-[#ECF1DC]'>
      <Header />
      <main className='container mx-auto max-w-7xl flex-grow px-4 py-28 md:py-32'>
        <div className='mb-10 max-w-4xl'>
          <p className='mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#2c6e49]'>
            Documentos legales
          </p>
          <h1 className='mb-5 text-4xl font-bold leading-tight text-[#333333] md:text-5xl'>
            Términos y Condiciones de Minka
          </h1>
          <p className='text-base leading-7 text-[#5f6673] md:text-lg'>
            Aquí puedes revisar los documentos públicos que
            regulan el uso de la plataforma, la privacidad,
            la verificación de campañas y los desembolsos.
          </p>
        </div>

        <div className='grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start'>
          <aside className='rounded-2xl border border-[#dbe5cf] bg-white/75 p-5 lg:sticky lg:top-24'>
            <p className='mb-4 text-sm font-semibold text-[#333333]'>
              En esta página
            </p>
            <nav className='space-y-2'>
              {legalDocuments.map((document) => (
                <a
                  key={document.id}
                  href={`#${document.slug}`}
                  className='block rounded-xl px-3 py-2 text-sm font-medium text-[#2c6e49] transition-colors hover:bg-[#ECF1DC]'
                >
                  {document.title}
                </a>
              ))}
            </nav>
          </aside>

          <section className='space-y-5'>
            {legalDocuments.map((document, index) => (
              <details
                key={document.id}
                id={document.slug}
                // open={index === 0}
                className='group scroll-mt-28 rounded-2xl border border-[#dbe5cf] bg-white/85 p-5 shadow-sm md:p-7'
              >
                <summary className='cursor-pointer list-none'>
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div className='max-w-[80%]'>
                      <h2 className='text-2xl font-bold leading-tight text-[#333333]'>
                        {document.title}
                      </h2>
                      {document.updated && (
                        <p className='mt-2 text-sm font-medium text-[#6b7280]'>
                          {document.updated}
                        </p>
                      )}
                      <p className='mt-3 max-w-3xl text-sm leading-6 text-[#5f6673]'>
                        {documentDescriptions[document.id]}
                      </p>
                    </div>
                    <span className='rounded-full border border-[#2c6e49] px-4 py-2 text-sm font-semibold text-[#2c6e49] transition-colors group-open:bg-[#2c6e49] group-open:text-white'>
                      Ver documento
                    </span>
                  </div>
                </summary>

                <div className='mt-8 border-t border-[#e3ead8] pt-2'>
                  <LegalDocumentContent
                    document={document}
                  />
                </div>
              </details>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
