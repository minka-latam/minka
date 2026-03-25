import { Header } from "@/components/views/landing-page/Header";
import { Footer } from "@/components/views/landing-page/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Políticas de Privacidad | MINKA",
  description: "Políticas de privacidad de la plataforma MINKA.",
};

export default function PoliticasDePrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#ECF1DC] flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-32 max-w-4xl flex-grow">
        <h1 className="text-4xl font-bold text-[#333333] mb-8">
          Políticas de Privacidad
        </h1>
        <p className="text-gray-500 mb-12">Última actualización: marzo 2026</p>

        <section className="space-y-8 text-[#555555]">
          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              1. Información que recopilamos
            </h2>
            <p className="leading-relaxed">
              En MINKA recopilamos información que nos proporcionas directamente,
              como tu nombre, correo electrónico, número de teléfono y número de
              identidad al registrarte. También recopilamos información sobre tus
              donaciones y campañas creadas en nuestra plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              2. Cómo usamos tu información
            </h2>
            <p className="leading-relaxed">
              Usamos la información recopilada para procesar donaciones, gestionar
              tu cuenta, enviarte notificaciones relacionadas con tus campañas y
              donaciones, y mejorar nuestros servicios. No vendemos ni
              compartimos tu información personal con terceros con fines
              comerciales.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              3. Seguridad de los datos
            </h2>
            <p className="leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para
              proteger tu información personal contra acceso no autorizado,
              pérdida o alteración. Todos los pagos son procesados a través de
              plataformas de pago seguras y certificadas.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              4. Cookies
            </h2>
            <p className="leading-relaxed">
              Utilizamos cookies esenciales para el funcionamiento de la
              plataforma, incluyendo cookies de autenticación y sesión. Estas
              cookies son necesarias para que puedas iniciar sesión y utilizar
              los servicios de MINKA.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              5. Tus derechos
            </h2>
            <p className="leading-relaxed">
              Tienes derecho a acceder, corregir o eliminar tu información
              personal en cualquier momento. Para ejercer estos derechos, puedes
              contactarnos a través de nuestro centro de ayuda o escribirnos
              directamente a nuestro correo de soporte.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              6. Retención de datos
            </h2>
            <p className="leading-relaxed">
              Conservamos tu información personal mientras tu cuenta esté activa
              o según sea necesario para prestarte servicios. Si deseas eliminar
              tu cuenta, puedes solicitarlo a través de nuestro centro de ayuda.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              7. Cambios a esta política
            </h2>
            <p className="leading-relaxed">
              Podemos actualizar esta política de privacidad ocasionalmente. Te
              notificaremos sobre cambios significativos mediante un aviso en
              nuestra plataforma o por correo electrónico.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[#333333] mb-4">
              8. Contacto
            </h2>
            <p className="leading-relaxed">
              Si tienes preguntas sobre estas políticas de privacidad, puedes
              contactarnos a través de nuestro{" "}
              
                href="/help"
                className="text-[#2c6e49] hover:underline font-medium"
              >
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