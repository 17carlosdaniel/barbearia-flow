const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface HairAnalysisInput {
  imageUrl?: string;
  hairTypeHint?: string;
  answers?: Record<string, string>;
}

interface HairAnalysisOutput {
  provider: string;
  confidence: number;
  hairTypePredicted: string;
  porosity: string;
  frizzLevel: string;
  notes: string;
}

function heuristicAnalysis(input: HairAnalysisInput): HairAnalysisOutput {
  const hint = (input.hairTypeHint || "").toLowerCase();
  const mappedType =
    hint.includes("crespo")
      ? "crespo"
      : hint.includes("cache")
        ? "cacheado"
        : hint.includes("ondul")
          ? "ondulado"
          : hint.includes("liso")
            ? "liso"
            : "ondulado";

  const porosity = mappedType === "crespo" || mappedType === "cacheado" ? "media_alta" : "media";
  const frizzLevel = mappedType === "liso" ? "baixo" : mappedType === "ondulado" ? "medio" : "alto";

  return {
    provider: "heuristic_fallback",
    confidence: 0.51,
    hairTypePredicted: mappedType,
    porosity,
    frizzLevel,
    notes: "Analise por heuristica local enquanto a IA externa nao esta disponivel.",
  };
}

async function openAiVisionAnalysis(input: HairAnalysisInput): Promise<HairAnalysisOutput> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey || !input.imageUrl) {
    return heuristicAnalysis(input);
  }

  const prompt =
    "Voce e especialista em diagnostico capilar. Analise a imagem e retorne JSON estrito com chaves: " +
    "hairTypePredicted (liso|ondulado|cacheado|crespo), porosity (baixa|media|alta|media_alta), " +
    "frizzLevel (baixo|medio|alto), confidence (0-1), notes (curto). " +
    "Considere tambem o contexto textual do quiz quando existir.";

  const quizContext = input.answers
    ? `Contexto do quiz: ${JSON.stringify(input.answers)}`
    : "Contexto do quiz: nao informado";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Retorne somente JSON valido." },
        {
          role: "user",
          content: [
            { type: "text", text: `${prompt}\n\n${quizContext}` },
            { type: "image_url", image_url: { url: input.imageUrl } },
          ],
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return heuristicAnalysis(input);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return heuristicAnalysis(input);

  try {
    const parsed = JSON.parse(raw) as Partial<HairAnalysisOutput>;
    return {
      provider: "openai_vision",
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.7))),
      hairTypePredicted: String(parsed.hairTypePredicted ?? "ondulado"),
      porosity: String(parsed.porosity ?? "media"),
      frizzLevel: String(parsed.frizzLevel ?? "medio"),
      notes: String(parsed.notes ?? "Analise concluida."),
    };
  } catch {
    return heuristicAnalysis(input);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as HairAnalysisInput;
    const result = await openAiVisionAnalysis(body);
    const normalized = {
      provider: result.provider || "heuristic_fallback",
      confidence: Math.max(0, Math.min(1, Number(result.confidence ?? 0.51))),
      hairTypePredicted: String(result.hairTypePredicted || "ondulado"),
      porosity: String(result.porosity || "media"),
      frizzLevel: String(result.frizzLevel || "medio"),
      notes: String(result.notes || "Analise concluida com fallback."),
    };
    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
