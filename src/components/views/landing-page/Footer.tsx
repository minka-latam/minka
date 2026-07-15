"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <div className="container mx-auto px-4 mt-auto">
      <footer className="bg-[#2c6e49] rounded-t-3xl text-white">
        <div className="p-8 md:p-16">
          <div className="grid gap-10 mb-8 lg:mb-16 lg:grid-cols-3 lg:items-center">
            <p className="text-center text-2xl font-bold leading-tight text-white md:text-3xl lg:text-left">
              Tu apoyo tiene poder. <br />
              Conecta con Minka.
            </p>

            <div className="flex justify-center">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-2S5vgSiFRwu8gClKBuwTXkOi5H46aN.svg"
                alt="MINKA Logo"
                width={180}
                height={70}
                className="h-16 w-auto brightness-0 invert"
              />
            </div>

            <div className="flex flex-col items-center gap-7 lg:items-end">
              <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-10 lg:justify-end">
                <Link
                  href="/help"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
                >
                  Ayuda
                </Link>
                <Link
                  href="/all-campaigns"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
                >
                  Explorar
                </Link>
                <Link
                  href="/about-us"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
                >
                  Nosotros
                </Link>
              </nav>

              <div className="flex gap-6">
                <Link
                  href="https://www.facebook.com/minkacomunidadbolivia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-3 hover:bg-white/10 transition-colors duration-300"
                  aria-label="Síguenos en Facebook"
                >
                  <Image
                    src="/icons/footer-icons/Facebook_white/Minka.svg"
                    alt="Facebook"
                    width={63}
                    height={63}
                    className="h-16 w-16"
                  />
                </Link>
                <Link
                  href="https://www.instagram.com/minka_comunidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-3 hover:bg-white/10 transition-colors duration-300"
                  aria-label="Síguenos en Instagram"
                >
                  <Image
                    src="/icons/footer-icons/Instagram_white/Minka.svg"
                    alt="Instagram"
                    width={63}
                    height={63}
                    className="h-16 w-16"
                  />
                </Link>
                {/* <Link
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-3 hover:bg-white/10 transition-colors duration-300"
                  aria-label="Contáctanos por WhatsApp"
                >
                  <Image
                    src="/icons/footer-icons/WhatsApp_white/Minka.svg"
                    alt="WhatsApp"
                    width={63}
                    height={63}
                    className="h-16 w-16"
                  />
                </Link> */}
                <Link
                  href="https://www.linkedin.com/company/minka-comunidad/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-3 hover:bg-white/10 transition-colors duration-300"
                  aria-label="Síguenos en LinkedIn"
                >
                  <Image
                    src="/icons/footer-icons/LinkedIN_white/Minka.svg"
                    alt="LinkedIn"
                    width={63}
                    height={63}
                    className="h-16 w-16"
                  />
                </Link>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#4a8c67] mb-2 lg:mb-10" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/80">
            <p>© {new Date().getFullYear()} Minka. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link
                href="/terminos"
                className="hover:text-white transition-colors underline underline-offset-4"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/politicas-de-privacidad"
                className="hover:text-white transition-colors underline underline-offset-4"
              >
                Política de privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
