"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqCategories, type FaqCategory } from "./help-faq-data";

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
  const [filteredCategories, setFilteredCategories] =
    useState<FaqCategory[]>(faqCategories);
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
      .filter((category): category is FaqCategory => category !== null);

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
                  <div className="whitespace-pre-line leading-relaxed">
                    {renderFormattedText(item.answer, searchTerm)}
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

function renderFormattedText(text: string, searchTerm: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);

        if (boldMatch) {
          return (
            <strong key={index} className="font-semibold text-gray-700">
              {highlightMatch(boldMatch[1], searchTerm)}
            </strong>
          );
        }

        return (
          <span key={index}>{highlightMatch(part, searchTerm)}</span>
        );
      })}
    </>
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
