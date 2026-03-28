import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | MINKA",
  description: "Términos y condiciones de uso de la plataforma MINKA.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ECF1DC] flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-32 max-w-4xl flex-grow">
        <h1 className="text-4xl font-bold text-[#333333] mb-8">
          Términos y Condiciones
        </h1>
        <p className="text-gray-500 mb-12">Última actualización: marzo 2026</p>

        <section className="space-y-8 text-[#555555]">
          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              1. Aceptación de los términos
            </h2>
            <p className="leading-relaxed">
              Al registrarte y usar MINKA, aceptas estos términos y condiciones
              en su totalidad. Si no estás de acuerdo con alguna parte de estos
              términos, no debes usar nuestra plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              2. Descripción del servicio
            </h2>
            <p className="leading-relaxed">
              MINKA es una plataforma de crowdfunding que permite a los usuarios
              crear campañas de recaudación de fondos y realizar donaciones a
              causas sociales en Bolivia y Latinoamérica. MINKA actúa como
              intermediario entre donantes y organizadores de campañas.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              3. Registro de cuenta
            </h2>
            <p className="leading-relaxed">
              Para usar ciertos servicios de MINKA, debes crear una cuenta
              proporcionando información precisa y actualizada. Eres responsable
              de mantener la confidencialidad de tu contraseña y de todas las
              actividades que ocurran bajo tu cuenta.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              4. Campañas y donaciones
            </h2>
            <p className="leading-relaxed">
              Los organizadores de campañas son responsables de la veracidad de
              la información publicada. MINKA se reserva el derecho de verificar
              y suspender campañas que no cumplan con nuestras políticas. Las
              donaciones realizadas a través de MINKA son procesadas por
              proveedores de pago seguros y certificados.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              5. Comisiones y tarifas
            </h2>
            <p className="leading-relaxed">
              MINKA puede cobrar una comisión por las donaciones procesadas a
              través de la plataforma. Esta comisión se destina a mantener y
              mejorar los servicios de la plataforma. Los detalles específicos
              de las comisiones se comunican claramente durante el proceso de
              donación.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              6. Conducta del usuario
            </h2>
            <p className="leading-relaxed">
              Los usuarios se comprometen a no usar MINKA para actividades
              ilegales, fraudulentas o que violen los derechos de terceros. MINKA
              se reserva el derecho de suspender o eliminar cuentas que violen
              estos términos.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              7. Propiedad intelectual
            </h2>
            <p className="leading-relaxed">
              Todo el contenido de MINKA, incluyendo logos, diseños y textos,
              es propiedad de MINKA y está protegido por las leyes de propiedad
              intelectual. Los usuarios conservan los derechos sobre el contenido
              que publican en la plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              8. Limitación de responsabilidad
            </h2>
            <p className="leading-relaxed">
              MINKA no se hace responsable por daños indirectos, incidentales o
              consecuentes que resulten del uso de la plataforma. Nuestra
              responsabilidad máxima se limita al monto de las comisiones
              cobradas en los últimos 12 meses.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              9. Modificaciones
            </h2>
            <p className="leading-relaxed">
              MINKA se reserva el derecho de modificar estos términos en
              cualquier momento. Los cambios significativos serán notificados
              a los usuarios por correo electrónico o mediante un aviso en la
              plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              10. Contacto
            </h2>
            <p className="leading-relaxed">
              Si tienes preguntas sobre estos términos y condiciones, puedes
              contactarnos a través de nuestro{" "}
              <a href="/help" className="text-[#2c6e49] hover:underline font-medium">
                centro de ayuda
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}