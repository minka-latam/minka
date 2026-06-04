"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Categorized FAQ items
const faqCategories = [
  {
    category: "General",
    items: [
      {
        id: "general-1",
        question: "¿Qué es Minka y cómo funciona?",
        answer:
          "Minka es una plataforma de crowdfunding (financiación colectiva) creada para ayudar a quienes necesitan apoyo económico en Bolivia. Ofrecemos un entorno fácil de navegar, seguro y transparente donde cualquier persona puede iniciar una campaña de recaudación de fondos y/o recibir donaciones mediante transferencias por QR o tarjetas de débito y crédito.",
      },
      {
        id: "general-2",
        question: "¿Dónde está disponible Minka?",
        answer:
          "Minka es una plataforma 100% digital y accesible desde cualquier parte del mundo. Para recibir donaciones, necesitas una cuenta bancaria en Bolivia. Si estás fuera del país, puedes donar usando una tarjeta de crédito o débito.",
      },
      {
        id: "general-3",
        question: "¿Es seguro usar Minka para recaudar fondos?",
        answer:
          '¡Sí! Nos aseguramos de que el dinero recaudado llegue a la persona o institución beneficiaria de la campaña. Para información más específica encontrarás la sección "Credibilidad y seguridad" en la parte inferior de las FAQs.',
      },
      {
        id: "general-4",
        question: "¿Cómo aumentar la probabilidad de éxito de tu campaña?",
        answer:
          "Para que tu campaña sea exitosa, presenta tu necesidad de manera clara y objetiva. Usa fotos y videos auténticos, fija una meta realista y comparte tu campaña en redes sociales. Pide apoyo a familiares y amigos para que donen primero, mantén informados a los donantes con actualizaciones y, si es posible, verifica tu campaña para generar mayor confianza. La clave es ser transparente y aprovechar todas las herramientas disponibles.",
      },
    ],
  },
  {
    category: "Iniciar una campaña",
    items: [
      {
        id: "campaign-1",
        question: "¿Qué tipo de campañas puedo crear?",
        answer:
          "Puedes iniciar campañas para cubrir necesidades personales, ayudar a otras personas o contribuir a organizaciones locales. En cualquiera de las categorías que presentamos: Salud, Educación, Deporte, Medio Ambiente, Veterinaria, Cultura, Igualdad, Otros.",
      },
      {
        id: "campaign-2",
        question: "¿Cómo crear una campaña?",
        answer:
          "Solo necesitas una cuenta autenticada y seguir los pasos de nuestro tutorial: 1) Crear cuenta y autenticarla, 2) Crear tu campaña, 3) Verificar tu campaña (opcional), 4) Compartirla en tus redes y con todas las personas que puedas, 5) Gestionar tu apoyo desde tu cuenta en Minka. Si necesitas ayuda, te brindamos asistencia a través de los canales oficiales para la creación y consejos para la promoción de tu campaña en nuestra plataforma y redes sociales.",
      },
      {
        id: "campaign-3",
        question: "¿Cuál es el precio de crear tu campaña en Minka?",
        answer:
          "Crear una campaña no tiene costo, sin embargo, para garantizar la sostenibilidad de Minka, se cobrará el 5% del monto recaudado para cubrir costos administrativos.",
      },
      {
        id: "campaign-4",
        question: "¿Puedo crear una campaña para otra persona?",
        answer:
          "Sí, puedes crear una campaña para ayudar a un familiar, amigo o incluso una institución, siempre y cuando tengas su consentimiento. Para esto, deberás presentar respaldo oficial, como una autorización firmada o documentos que confirmen la relación con el beneficiario. En el caso de instituciones, se requerirá documentación adicional que acredite su identidad y necesidad. Esto garantiza transparencia y confianza para los donantes.",
      },
      {
        id: "campaign-5",
        question: "¿Qué es la verificación de campañas?",
        answer:
          "La verificación es un proceso opcional en el que validamos los documentos que respaldan una campaña para garantizar su autenticidad y generar mayor confianza en los donantes. Según el tipo de campaña, se solicitarán documentos específicos que prueben la necesidad, como certificaciones, cartas oficiales o informes relevantes. Además, todas las campañas deberán presentar documentos generales, como una identificación personal y un comprobante de domicilio. Verificar tu campaña puede aumentar significativamente su credibilidad y atraer más apoyo.",
      },
      {
        id: "campaign-6",
        question: "¿Qué pasa si no alcanzo mi objetivo de donación?",
        answer:
          "Recibirás todo lo recaudado hasta el vencimiento de la campaña, deduciendo el porcentaje de costos administrativos.",
      },
      {
        id: "campaign-7",
        question: "¿Cómo puedo promocionar mi campaña?",
        answer:
          "Comparte el enlace en redes sociales usando los botones de compartir integrados en Minka y viraliza entre amigos, familiares y comunidades que puedan apoyarte.",
      },
      {
        id: "campaign-8",
        question: "¿Puedo modificar el objetivo de recaudación?",
        answer:
          "Sí, sin embargo, requerirá una comprobación por parte del equipo Minka antes de hacerse efectivo.",
      },
      {
        id: "campaign-9",
        question: "¿Cómo recibo el dinero recaudado?",
        answer:
          "Puedes configurar a través de la plataforma la recepción del dinero cada cierto tiempo, con un par de opciones disponibles. El dinero recaudado se transferirá a la cuenta bancaria asociada a la cuenta del gestor de la campaña.",
      },
    ],
  },
  {
    category: "Donaciones",
    items: [
      {
        id: "donations-1",
        question: "¿Puedo donar de forma anónima?",
        answer:
          "Sí, puedes ocultar tu nombre para que ni el organizador ni el beneficiario lo vean.",
      },
      {
        id: "donations-2",
        question: "¿Cómo saber si mi donación fue recibida?",
        answer:
          "Utilizamos un reconocido intermediario de pagos online (Wolipay), el cual se encarga de la gestión de pagos a través de tarjeta de crédito/débito así como de pagos por QR. Al realizar tu pago online tendrás el código de referencia en caso de que necesites hacer seguimiento.",
      },
      {
        id: "donations-3",
        question: "¿Puedo solicitar un reembolso?",
        answer: "Las donaciones no son reembolsables.",
      },
    ],
  },
  {
    category: "Pagos y tasas",
    items: [
      {
        id: "payments-1",
        question: "¿Cuál es la comisión de Minka?",
        answer:
          "Aplicamos una tasa del 5% para cubrir costos administrativos, que nos permiten mantener y hacer mejoras en nuestra plataforma. Además, los donantes pueden hacer contribuciones voluntarias adicionales para el mantenimiento de la plataforma.",
      },
      {
        id: "payments-2",
        question:
          "¿Cuáles son las opciones de pago, y existe un límite para la donación?",
        answer:
          "Puedes donar con tarjeta de crédito, débito o transferencia por QR (la última opción solamente para bancos en Bolivia). El límite mínimo es __ y el máximo es __ .",
      },
      {
        id: "payments-3",
        question: "¿Puedo retirar los fondos de mi campaña antes de tiempo?",
        answer:
          "En casos excepcionales, podría analizarse un retiro anticipado.",
      },
    ],
  },
  {
    category: "Credibilidad y seguridad",
    items: [
      {
        id: "security-1",
        question: "¿Por qué Minka verifica algunas campañas?",
        answer:
          "Para aumentar la confianza y transparencia. Según nuestra encuesta, el 45% de las personas que normalmente no donarían a desconocidos estarían dispuestas a hacerlo si la campaña está verificada.",
      },
      {
        id: "security-2",
        question: "¿Cómo garantiza Minka la credibilidad de las campañas?",
        answer:
          "Minka asegura la credibilidad mediante la autenticación de cuentas, la verificación de campañas y una supervisión continua. Por ejemplo, durante el proceso de verificación para una campaña de urgencia médica, se revisan los documentos que respaldan la causa, como informes médicos, prescripciones de medicamentos, etc. Si falta información o hay inconsistencias, se notifica al organizador para corregirlo antes de su aprobación. Esto garantiza transparencia y confianza para los donantes.",
      },
      {
        id: "security-3",
        question: "¿Cómo protege Minka mis datos personales y financieros?",
        answer:
          "Usamos encriptación de alta seguridad para proteger tu información y nunca compartimos tus datos sin tu consentimiento. Además, cualquier dato sensible, como información médica proporcionada para la verificación de campañas, será eliminado una vez completado el proceso para garantizar la máxima seguridad y privacidad.",
      },
      {
        id: "security-4",
        question: "¿Cómo se administra el dinero recaudado?",
        answer:
          "Se almacena en una cuenta segura hasta ser transferido al beneficiario.",
      },
      {
        id: "security-5",
        question: "¿Qué hago si detecto una campaña fraudulenta?",
        answer:
          "Reporta el caso a nuestro equipo de soporte para una investigación inmediata.",
      },
    ],
  },
];

interface HelpAccordionProps {
  searchTerm?: string;
}

// Function to normalize text by removing accents for comparison
function normalizeText(text: string): string {
  return text
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .toLowerCase(); // Convert to lowercase
}

export function HelpAccordion({ searchTerm = "" }: HelpAccordionProps) {
  const [filteredCategories, setFilteredCategories] = useState(faqCategories);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Filter faqCategories based on searchTerm
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(faqCategories);
      setExpandedItems([]);
      return;
    }

    const normalizedSearch = normalizeText(searchTerm.trim());

    // Filter categories and their items
    const filtered = faqCategories
      .map((category) => {
        // Filter items that match the search term
        const matchedItems = category.items.filter((item) => {
          const normalizedQuestion = normalizeText(item.question);
          const normalizedAnswer = normalizeText(item.answer);

          return (
            normalizedQuestion.includes(normalizedSearch) ||
            normalizedAnswer.includes(normalizedSearch)
          );
        });

        // If there are matching items, include this category with only the matching items
        return matchedItems.length > 0
          ? { ...category, items: matchedItems }
          : null;
      })
      .filter(Boolean) as typeof faqCategories;

    setFilteredCategories(filtered);

    // Auto-expand items that match the search
    const newExpandedItems = filtered.flatMap((category) =>
      category.items.map((item) => item.id)
    );
    setExpandedItems(newExpandedItems);
  }, [searchTerm]);

  // No results message
  if (searchTerm && filteredCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">
          No se encontraron resultados para &quot;{searchTerm}&quot;
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Intenta con otra búsqueda o revisa todas nuestras preguntas frecuentes
        </p>
      </div>
    );
  }

  return (
    <div className="mb-16 space-y-10">
      {filteredCategories.map((category) => (
        <div key={category.category}>
          <h2 className="text-2xl font-bold text-[#2c6e49] mb-6">
            {category.category}
          </h2>
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="mb-8"
          >
            {category.items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-[#478C5C]/20"
              >
                <AccordionTrigger className="text-xl font-medium text-[#2c6e49] hover:text-[#2c6e49]/90 py-6">
                  <div className="text-left">
                    {highlightMatch(item.question, searchTerm)}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-lg text-gray-600 py-4">
                  <div className="whitespace-normal">
                    {highlightMatch(item.answer, searchTerm)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}

// Function to highlight the matching text
function highlightMatch(text: string, searchTerm: string) {
  if (!searchTerm.trim()) return text;

  try {
    const normalizedSearchTerm = normalizeText(searchTerm.trim());

    // If search term is empty after normalization, return original text
    if (!normalizedSearchTerm) return text;

    // Create a mapping between original text positions and normalized text positions
    const mapping: { original: number; normalized: number }[] = [];
    const normalizedChars: string[] = [];

    // Build the mapping and normalized characters array
    for (let i = 0; i < text.length; i++) {
      const normalizedChar = normalizeText(text[i]);
      mapping.push({ original: i, normalized: normalizedChars.length });
      normalizedChars.push(normalizedChar);
    }

    // Add an extra entry to mark the end of the text
    mapping.push({ original: text.length, normalized: normalizedChars.length });

    const normalizedText = normalizedChars.join("");
    const matches: { start: number; end: number }[] = [];

    // Find all matches in the normalized text
    let startPos = 0;
    while (startPos < normalizedText.length) {
      const matchPos = normalizedText.indexOf(normalizedSearchTerm, startPos);
      if (matchPos === -1) break;

      // Find the original text positions for this match
      const originalStart =
        mapping.find((m) => m.normalized === matchPos)?.original || 0;
      const originalEnd =
        mapping.find(
          (m) => m.normalized === matchPos + normalizedSearchTerm.length
        )?.original || text.length;

      matches.push({ start: originalStart, end: originalEnd });
      startPos = matchPos + 1; // Move past current match
    }

    // If no matches, return the original text
    if (matches.length === 0) return text;

    // Build the highlighted result
    const result: React.ReactNode[] = [];
    let lastEnd = 0;

    matches.forEach((match, index) => {
      // Text before the match
      if (match.start > lastEnd) {
        result.push(
          <span key={`text-${index}-before`}>
            {text.substring(lastEnd, match.start)}
          </span>
        );
      }

      // The highlighted match
      result.push(
        <span
          key={`highlight-${index}`}
          className="bg-yellow-100 font-medium inline"
        >
          {text.substring(match.start, match.end)}
        </span>
      );

      lastEnd = match.end;
    });

    // Text after the last match
    if (lastEnd < text.length) {
      result.push(<span key="text-after">{text.substring(lastEnd)}</span>);
    }

    return <>{result}</>;
  } catch (error) {
    console.error("Error highlighting text:", error);
    return text;
  }
}
