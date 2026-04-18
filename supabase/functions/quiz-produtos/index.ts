const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface QuizAnswers {
  hairType?: string;
  hairLength?: string;
  concern?: string;
  routine?: string;
  budget?: string;
  desiredStyle?: string;
}

interface HairAnalysis {
  hairTypePredicted?: string;
  porosity?: string;
  frizzLevel?: string;
  confidence?: number;
  notes?: string;
}

interface ProductInput {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  rating?: number;
}

interface RecommendationProduct {
  productId: string;
  reason: string;
  score: number;
}

interface RecommendationResponse {
  summary: string;
  premiumTip: string;
  reasoning: string[];
  products: RecommendationProduct[];
  cuts: string[];
  confidence: number;
  analysisNotes: string;
}

const styleMap: Record<string, string[]> = {
  liso: ["Side Part", "Slick Back", "Textured Crop"],
  ondulado: ["Low Fade", "Messy Crop", "Mid Fade"],
  cacheado: ["Curly Fade", "Burst Fade", "Drop Fade"],
  crespo: ["High Top Fade", "Taper Fade", "Twist"],
};

function normalizeHairType(answers: QuizAnswers, analysis?: HairAnalysis): string {
  const fromAnalysis = (analysis?.hairTypePredicted || "").toLowerCase();
  const fromAnswers = (answers.hairType || "").toLowerCase();
  if (["liso", "ondulado", "cacheado", "crespo"].includes(fromAnalysis)) return fromAnalysis;
  if (["liso", "ondulado", "cacheado", "crespo"].includes(fromAnswers)) return fromAnswers;
  return "ondulado";
}

function scoreProduct(product: ProductInput, answers: QuizAnswers, analysis?: HairAnalysis): number {
  const haystack = [
    product.name,
    product.description || "",
    product.category || "",
    ...(product.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const hairType = normalizeHairType(answers, analysis);
  if (hairType === "cacheado" || hairType === "crespo") {
    if (haystack.includes("hidrata") || haystack.includes("oleo") || haystack.includes("leave")) score += 3;
  } else {
    if (haystack.includes("pomada") || haystack.includes("matte") || haystack.includes("fixa")) score += 3;
  }

  if (answers.concern === "oleosidade" && (haystack.includes("sebo") || haystack.includes("shampoo"))) score += 2;
  if (answers.concern === "ressecamento" && (haystack.includes("hidrata") || haystack.includes("mascara"))) score += 2;
  if (answers.concern === "queda" && (haystack.includes("tonico") || haystack.includes("fortale"))) score += 2;
  if (answers.budget === "economico" && !haystack.includes("premium")) score += 1;
  if (answers.budget === "premium" && haystack.includes("premium")) score += 1;
  score += Number(product.rating || 0) * 0.2;

  return Number(score.toFixed(2));
}

function reasonForProduct(product: ProductInput, answers: QuizAnswers, analysis?: HairAnalysis): string {
  const reasons: string[] = [];
  const hairType = normalizeHairType(answers, analysis);
  reasons.push(`tipo capilar: ${hairType}`);
  if (answers.concern) reasons.push(`preocupacao: ${answers.concern}`);
  if (analysis?.frizzLevel) reasons.push(`frizz: ${analysis.frizzLevel}`);
  return `Recomendado por ${reasons.join(" • ")}`;
}

function buildRecommendation(answers: QuizAnswers, analysis?: HairAnalysis, products?: ProductInput[]): RecommendationResponse {
  const catalog = Array.isArray(products) ? products : [];
  const scored: RecommendationProduct[] = catalog
    .map((p) => ({
      productId: p.id,
      score: scoreProduct(p, answers, analysis),
      reason: reasonForProduct(p, answers, analysis),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const hairType = normalizeHairType(answers, analysis);
  const cuts = (styleMap[hairType] || styleMap.ondulado).slice(0, 3);

  const reasoning = [
    `Tipo capilar identificado: ${hairType}`,
    answers.concern ? `Foco principal: ${answers.concern}` : "Foco principal: manutencao geral",
    analysis?.porosity ? `Porosidade: ${analysis.porosity}` : "Porosidade: media",
    analysis?.frizzLevel ? `Frizz: ${analysis.frizzLevel}` : "Frizz: medio",
  ];

  return {
    summary: "Analise concluida com sucesso. Selecionamos produtos e cortes com base no seu perfil.",
    premiumTip:
      "Use a finalizacao principal com o cabelo levemente umido para melhor distribuicao e fixacao.",
    reasoning,
    products: scored,
    cuts,
    confidence: Number(analysis?.confidence ?? 0.7),
    analysisNotes: analysis?.notes ?? "Diagnostico gerado por regras e sinais da imagem.",
  };
}

const edgeRuntime = globalThis as unknown as {
  Deno?: {
    serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  };
};

if (!edgeRuntime.Deno?.serve) {
  throw new Error("Deno runtime indisponivel para esta Edge Function.");
}

edgeRuntime.Deno.serve(async (req) => {
  // Preflight: o browser envia OPTIONS antes do POST; tem que responder 200 + CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as {
      answers?: QuizAnswers;
      analysis?: HairAnalysis;
      products?: ProductInput[];
    };
    const answers = body?.answers ?? {};
    const recommendation = buildRecommendation(answers, body.analysis, body.products);
    const fallbackUsed = !body?.analysis || body.analysis.confidence == null || Number(body.analysis.confidence) < 0.55;

    return new Response(
      JSON.stringify({
        recommendation,
        engine: fallbackUsed ? "rules_fallback" : "hybrid_ai_rules",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
