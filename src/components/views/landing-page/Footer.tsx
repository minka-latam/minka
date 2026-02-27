"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <div className="container mx-auto px-4 mt-auto">
      <footer className="bg-[#2c6e49] rounded-t-3xl text-white">
        <div className="p-8 md:p-16">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 lg:mb-16">
            <div className="mb-8 md:mb-0">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-2S5vgSiFRwu8gClKBuwTXkOi5H46aN.svg"
                alt="MINKA Logo"
                width={180}
                height={70}
                className="h-16 w-auto brightness-0 invert"
              />
            </div>

            <nav className="flex md:flex-row items-center gap-6 md:gap-12">
              <Link
                href="/help"                
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
              >
                Centro de ayuda
              </Link>
              <Link
                href="/campaign"                
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
              >
                Donar
              </Link>
              <Link
                href="/about-us"                
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-colors underline underline-offset-4 text-lg font-bold"
              >
                Nosotros
              </Link>
            </nav>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-4 lg:mb-12">
            <p className="text-white font-bold text-2xl md:text-3xl mb-3 max-w-xl">
              Tu apoyo tiene poder. <br />
              Conecta con Minka.
            </p>

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

          <div className="h-px bg-[#4a8c67] mb-2 lg:mb-10" />

          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/80">
            <p>© {new Date().getFullYear()} Minka. Todos los derechos reservados.</p>
            <Link
              href="/politicas-de-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline underline-offset-4 mt-4 md:mt-0"
            >
              Políticas de privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
