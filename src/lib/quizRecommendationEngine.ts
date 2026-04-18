export interface QuizAnswersInput {
  hairType?: string;
  hairLength?: string;
  concern?: string;
  routine?: string;
  budget?: string;
  desiredStyle?: string;
}

export interface HairAnalysisInput {
  hairTypePredicted?: string;
  porosity?: string;
  frizzLevel?: string;
  confidence?: number;
  notes?: string;
}

export interface QuizProductInput {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  rating?: number;
}

export interface QuizRecommendedProduct {
  productId: string;
  reason: string;
  score: number;
}

export interface QuizRecommendationOutput {
  summary: string;
  premiumTip: string;
  reasoning: string[];
  products: QuizRecommendedProduct[];
  cuts: string[];
  confidence: number;
  analysisNotes: string;
}

const STYLE_MAP: Record<string, string[]> = {
  liso: ["Side Part", "Slick Back", "Textured Crop"],
  ondulado: ["Low Fade", "Messy Crop", "Mid Fade"],
  cacheado: ["Curly Fade", "Burst Fade", "Drop Fade"],
  crespo: ["High Top Fade", "Taper Fade", "Twist"],
};

function normalizeHairType(answers: QuizAnswersInput, analysis?: HairAnalysisInput): string {
  const fromAnalysis = (analysis?.hairTypePredicted || "").toLowerCase();
  const fromAnswers = (answers.hairType || "").toLowerCase();
  if (["liso", "ondulado", "cacheado", "crespo"].includes(fromAnalysis)) return fromAnalysis;
  if (["liso", "ondulado", "cacheado", "crespo"].includes(fromAnswers)) return fromAnswers;
  return "ondulado";
}

function scoreProduct(product: QuizProductInput, answers: QuizAnswersInput, analysis?: HairAnalysisInput): number {
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
  } else if (haystack.includes("pomada") || haystack.includes("matte") || haystack.includes("fixa")) {
    score += 3;
  }

  if (answers.concern === "oleosidade" && (haystack.includes("sebo") || haystack.includes("shampoo"))) score += 2;
  if (answers.concern === "ressecamento" && (haystack.includes("hidrata") || haystack.includes("mascara"))) score += 2;
  if (answers.concern === "queda" && (haystack.includes("tonico") || haystack.includes("fortale"))) score += 2;
  if (answers.budget === "economico" && !haystack.includes("premium")) score += 1;
  if (answers.budget === "premium" && haystack.includes("premium")) score += 1;

  score += Number(product.rating || 0) * 0.2;
  return Number(score.toFixed(2));
}

function reasonForProduct(product: QuizProductInput, answers: QuizAnswersInput, analysis?: HairAnalysisInput): string {
  const reasons: string[] = [];
  const hairType = normalizeHairType(answers, analysis);
  reasons.push(`tipo capilar: ${hairType}`);
  if (answers.concern) reasons.push(`foco: ${answers.concern}`);
  if (analysis?.frizzLevel) reasons.push(`frizz: ${analysis.frizzLevel}`);
  return `Recomendado por ${reasons.join(" • ")} (${product.name})`;
}

export function buildQuizRecommendation(
  answers: QuizAnswersInput,
  analysis?: HairAnalysisInput,
  products?: QuizProductInput[],
): QuizRecommendationOutput {
  const catalog = Array.isArray(products) ? products : [];
  const scored = catalog
    .map((p) => ({
      productId: p.id,
      score: scoreProduct(p, answers, analysis),
      reason: reasonForProduct(p, answers, analysis),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const hairType = normalizeHairType(answers, analysis);
  const cuts = (STYLE_MAP[hairType] || STYLE_MAP.ondulado).slice(0, 3);

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
