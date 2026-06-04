"use client";

import { Facebook, Instagram, Linkedin, Mail, MessageCircle } from "lucide-react";

export function ContactSection() {
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-[#2c6e49] mb-8">
        Atención al cliente
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="https://m.me/minkacomunidadbolivia"
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#478C5C]/20 hover:border-[#2c6e49] transition-colors bg-white"
        >
          <MessageCircle
            className="h-5 w-5 text-[#2c6e49]"
            aria-hidden="true"
          />
          <span className="text-gray-600">Contáctanos por Messenger</span>
        </a>

        <a
          href="mailto:info@minkacomunidad.org"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#478C5C]/20 hover:border-[#2c6e49] transition-colors bg-white"
        >
          <Mail className="h-5 w-5 text-[#2c6e49]" aria-hidden="true" />
          <span className="text-gray-600">
            Escríbenos por correo electrónico
          </span>
        </a>

        <a
          href="https://www.facebook.com/minkacomunidadbolivia"
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#478C5C]/20 hover:border-[#2c6e49] transition-colors bg-white"
        >
          <Facebook className="h-5 w-5 text-[#2c6e49]" aria-hidden="true" />
          <span className="text-gray-600">Síguenos en Facebook</span>
        </a>

        <a
          href="https://www.instagram.com/minka_comunidad"
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#478C5C]/20 hover:border-[#2c6e49] transition-colors bg-white"
        >
          <Instagram className="h-5 w-5 text-[#2c6e49]" aria-hidden="true" />
          <span className="text-gray-600">Síguenos en Instagram</span>
        </a>

        <a
          href="https://www.linkedin.com/company/minka-comunidad/"
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-3 p-4 rounded-lg border-2 border-[#478C5C]/20 hover:border-[#2c6e49] transition-colors bg-white"
        >
          <Linkedin className="h-5 w-5 text-[#2c6e49]" aria-hidden="true" />
          <span className="text-gray-600">Conecta en LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
