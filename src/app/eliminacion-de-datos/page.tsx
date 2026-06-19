import type { Metadata } from "next";
import { Footer } from "@/components/views/landing-page/Footer";
import { Header } from "@/components/views/landing-page/Header";

export const metadata: Metadata = {
  title: "Eliminación de datos de usuario | MINKA",
  description:
    "Instrucciones para solicitar la eliminación de datos de usuario en MINKA.",
};

export default function EliminacionDeDatosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ECF1DC] flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-32 max-w-4xl flex-grow">
        <h1 className="text-4xl font-bold text-[#333333] mb-8">
          Eliminación de datos de usuario
        </h1>
        <p className="text-gray-500 mb-12">Última actualización: junio 2026</p>

        <section className="space-y-8 text-[#555555]">
          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Uso de Facebook
            </h2>
            <p className="leading-relaxed">
              MINKA utiliza herramientas de Facebook únicamente para permitir
              que las personas compartan enlaces públicos de campañas. MINKA no
              solicita permisos de Facebook Login ni almacena datos personales
              obtenidos desde Facebook para esta función de compartir.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Cómo solicitar la eliminación de tus datos
            </h2>
            <p className="leading-relaxed">
              Si tienes una cuenta en MINKA y quieres solicitar la eliminación
              de tus datos personales, escríbenos a{" "}
              <a
                href="mailto:info@minkacomunidad.org?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20datos&body=Hola%20Minka%2C%20quiero%20solicitar%20la%20eliminaci%C3%B3n%20de%20mis%20datos%20personales%20asociados%20a%20mi%20cuenta.%0A%0ACorreo%20de%20mi%20cuenta%3A%0ANombre%20completo%3A"
                className="text-[#2c6e49] hover:underline font-medium"
              >
                info@minkacomunidad.org
              </a>{" "}
              indicando el correo asociado a tu cuenta y tu nombre completo.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Plazo de atención
            </h2>
            <p className="leading-relaxed">
              Revisaremos tu solicitud y responderemos al correo indicado. Si
              corresponde, eliminaremos o anonimizaremos la información personal
              asociada a tu cuenta, salvo aquella que debamos conservar por
              obligaciones legales, contables, antifraude o de seguridad de la
              plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              Contacto
            </h2>
            <p className="leading-relaxed">
              Para cualquier consulta adicional sobre privacidad o eliminación
              de datos, puedes contactarnos en{" "}
              <a
                href="mailto:info@minkacomunidad.org"
                className="text-[#2c6e49] hover:underline font-medium"
              >
                info@minkacomunidad.org
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
