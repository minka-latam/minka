import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text, fieldType } = await request.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "El texto es muy corto para mejorar" },
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

   const fieldInstructions: Record<string, string> = {
  title: "título de una campaña de crowdfunding",
  description: "descripción de una campaña de crowdfunding",
  story: "historia y presentación de una campaña de crowdfunding",
  beneficiaries: "descripción de los beneficiarios de una campaña de crowdfunding",
};

    const fieldContext = fieldInstructions[fieldType] || "texto de campaña";

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
- Mantén una longitud similar al original

Texto original:
${text}`,
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
    const improvedText = data.content[0]?.text || "";

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error("Error improving text:", error);
    return NextResponse.json(
      { error: "Error al mejorar el texto" },
      { status: 500 }
    );
  }
}