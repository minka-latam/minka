import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VALID_FIELD_TYPES = ["title", "description", "story", "beneficiaries"] as const;
type FieldType = typeof VALID_FIELD_TYPES[number];

const MAX_LENGTHS: Record<FieldType, number> = {
  title: 50,
  description: 120,
  story: 600,
  beneficiaries: 600,
};

export async function POST(request: NextRequest) {
  try {
    // Auth check — server side
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para usar esta función" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { text, fieldType } = body;

    // Validate fieldType
    if (!fieldType || !VALID_FIELD_TYPES.includes(fieldType as FieldType)) {
      return NextResponse.json(
        { error: "Tipo de campo inválido" },
        { status: 400 }
      );
    }

    // Validate text
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "El texto es requerido" },
        { status: 400 }
      );
    }

    const maxLength = MAX_LENGTHS[fieldType as FieldType];
    const trimmedText = text.trim();

    if (trimmedText.length < 10) {
      return NextResponse.json(
        { error: "El texto es muy corto para mejorar" },
        { status: 400 }
      );
    }

    if (trimmedText.length > maxLength) {
      return NextResponse.json(
        { error: `El texto excede el límite de ${maxLength} caracteres` },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const fieldInstructions: Record<FieldType, string> = {
      title: "título de una campaña de crowdfunding",
      description: "descripción breve de una campaña de crowdfunding",
      story: "historia y presentación de una campaña de crowdfunding",
      beneficiaries: "descripción de los beneficiarios de una campaña de crowdfunding",
    };

    const fieldContext = fieldInstructions[fieldType as FieldType];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Eres un experto en redacción para campañas de crowdfunding en Bolivia y Latinoamérica. 
Tu tarea es mejorar el siguiente texto que será usado como ${fieldContext}.

Instrucciones:
- Mantén el significado y la esencia original del texto
- Mejora la gramática, ortografía y puntuación
- Usa un tono emotivo y cercano que conecte con donantes latinoamericanos
- Mantén un lenguaje claro y accesible
- No agregues información que no esté en el texto original
- Responde ÚNICAMENTE con el texto mejorado, sin explicaciones ni comentarios
- El texto mejorado NO debe exceder ${maxLength} caracteres
- Mantén una longitud similar al original

Texto original:
${trimmedText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic API error:", error);
      return NextResponse.json(
        { error: "Error al conectar con el servicio de IA" },
        { status: 500 }
      );
    }

    const data = await response.json();
    let improvedText = data.content[0]?.text || "";

    // Enforce max length server-side as final safety net
    if (improvedText.length > maxLength) {
      improvedText = improvedText.slice(0, maxLength);
    }

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Error al mejorar el texto" },
      { status: 500 }
    );
  }
}