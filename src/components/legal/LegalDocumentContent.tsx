import type { LegalDocument } from "@/lib/legal/documents";

interface LegalDocumentContentProps {
  document: LegalDocument;
}

export function LegalDocumentContent({ document }: LegalDocumentContentProps) {
  return (
    <article className="space-y-5 text-[#4b5563]">
      {document.blocks.map((block, index) => {
        if (block.type === "title" || block.type === "updated") {
          return null;
        }

        if (block.type === "chapter") {
          return (
            <h2
              key={`${document.id}-${index}`}
              className="pt-6 text-2xl font-bold leading-tight text-[#1f2937]"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "section") {
          return (
            <h3
              key={`${document.id}-${index}`}
              className="pt-3 text-lg font-semibold leading-snug text-[#244f38]"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "listItem") {
          return (
            <p
              key={`${document.id}-${index}`}
              className="ml-4 leading-8 text-[#4b5563]"
            >
              {block.text}
            </p>
          );
        }

        return (
          <p key={`${document.id}-${index}`} className="leading-8">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
