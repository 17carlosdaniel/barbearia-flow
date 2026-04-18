import { supabase } from "@/lib/supabaseClient";
import { getShopProducts } from "@/lib/shopProducts";
import { mockBarbershops } from "@/lib/mockBarbershops";
import { buildQuizRecommendation } from "@/lib/quizRecommendationEngine";

export interface QuizAnswersPayload {
  hairType: string;
  hairLength: string;
  concern: string;
  routine: string;
  budget: string;
  desiredStyle?: string;
}

export interface HairAnalysisResult {
  provider: string;
  confidence: number;
  hairTypePredicted: string;
  porosity: string;
  frizzLevel: string;
  notes: string;
}

export interface QuizRecommendation {
  summary: string;
  premiumTip: string;
  reasoning: string[];
  products: Array<{ productId: string; reason: string; score: number }>;
  cuts: string[];
  confidence: number;
  analysisNotes: string;
}

export function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function uploadQuizHairPhoto(userId: string, file: File): Promise<{ path: string; publicUrl: string } | null> {
  if (!isUuid(userId)) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("quiz-hair-input").upload(path, file, { upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from("quiz-hair-input").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function analyzeHairWithAI(
  imageUrl: string,
  hairTypeHint?: string,
  answers?: Record<string, string>,
): Promise<HairAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("quiz-hair-analysis", {
    body: { imageUrl, hairTypeHint, answers },
  });
  if (error) throw error;
  const out = data as Partial<HairAnalysisResult>;
  return {
    provider: out.provider || "heuristic_fallback",
    confidence: Number(out.confidence ?? 0.6),
    hairTypePredicted: out.hairTypePredicted || "ondulado",
    porosity: out.porosity || "media",
    frizzLevel: out.frizzLevel || "medio",
    notes: out.notes || "Analise concluida.",
  };
}

export async function getQuizRecommendation(
  answers: QuizAnswersPayload,
  analysis?: HairAnalysisResult,
): Promise<QuizRecommendation> {
  const products = getShopProducts().map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    tags: p.tags || [],
    rating: p.rating || 0,
  }));
  try {
    const { data, error } = await supabase.functions.invoke("quiz-produtos", {
      body: { answers, analysis, products },
    });
    if (error) throw error;
    const rec = (data as { recommendation?: Partial<QuizRecommendation> })?.recommendation || {};
    return {
      summary: rec.summary || "Selecionamos opcoes para seu perfil capilar.",
      premiumTip: rec.premiumTip || "Finalize com pouca quantidade para controlar o volume.",
      reasoning: Array.isArray(rec.reasoning) ? rec.reasoning : [],
      products: Array.isArray(rec.products) ? rec.products : [],
      cuts: Array.isArray(rec.cuts) ? rec.cuts : [],
      confidence: Number(rec.confidence ?? 0.6),
      analysisNotes: rec.analysisNotes || "",
    };
  } catch {
    return buildQuizRecommendation(answers, analysis, products);
  }
}

export async function persistQuizRun(params: {
  userId: string;
  answers: QuizAnswersPayload;
  analysis?: HairAnalysisResult;
  imagePath?: string;
  imagePublicUrl?: string;
  recommendation: QuizRecommendation;
}): Promise<string | null> {
  if (!isUuid(params.userId)) return null;
  const nowIso = new Date().toISOString();
  const { data: sessionData, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: params.userId,
      source: "quiz_produtos",
      status: "completed",
      started_at: nowIso,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();
  if (sessionError || !sessionData?.id) return null;
  const sessionId = sessionData.id as string;

  await supabase.from("quiz_answers").upsert({
    session_id: sessionId,
    user_id: params.userId,
    hair_type: params.answers.hairType,
    hair_length: params.answers.hairLength,
    concern: params.answers.concern,
    routine: params.answers.routine,
    budget: params.answers.budget,
    desired_style: params.answers.desiredStyle ?? null,
    payload: params.answers,
    updated_at: nowIso,
  });

  if (params.analysis) {
    await supabase.from("quiz_image_analysis").upsert({
      session_id: sessionId,
      user_id: params.userId,
      image_path: params.imagePath ?? null,
      image_public_url: params.imagePublicUrl ?? null,
      provider: params.analysis.provider,
      confidence: params.analysis.confidence,
      hair_type_predicted: params.analysis.hairTypePredicted,
      porosity: params.analysis.porosity,
      frizz_level: params.analysis.frizzLevel,
      notes: params.analysis.notes,
      raw_response: params.analysis,
      updated_at: nowIso,
    });
  }

  const { data: recommendationRow } = await supabase
    .from("quiz_recommendations")
    .insert({
      session_id: sessionId,
      user_id: params.userId,
      summary: params.recommendation.summary,
      premium_tip: params.recommendation.premiumTip,
      confidence: params.recommendation.confidence,
      reasoning: params.recommendation.reasoning,
      metadata: { analysis_notes: params.recommendation.analysisNotes },
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (recommendationRow?.id) {
    const recommendationId = recommendationRow.id as string;
    if (params.recommendation.products.length > 0) {
      await supabase.from("quiz_recommendation_products").insert(
        params.recommendation.products.map((item) => ({
          recommendation_id: recommendationId,
          user_id: params.userId,
          product_id: item.productId,
          score: item.score,
          reason: item.reason,
        })),
      );
    }
    if (params.recommendation.cuts.length > 0) {
      await supabase.from("quiz_recommendation_styles").insert(
        params.recommendation.cuts.map((cut, idx) => ({
          recommendation_id: recommendationId,
          user_id: params.userId,
          style_name: cut,
          score: Math.max(0.6, 1 - idx * 0.1),
          reason: "Compatibilidade com tipo de cabelo e objetivo de estilo.",
        })),
      );
    }
  }

  await supabase.from("quiz_events").insert([
    {
      session_id: sessionId,
      user_id: params.userId,
      event_name: "quiz_completed",
      metadata: { confidence: params.recommendation.confidence },
    },
  ]);

  return sessionId;
}

export async function trackQuizEvent(userId: string, sessionId: string | null, eventName: string, metadata?: Record<string, unknown>): Promise<void> {
  if (!isUuid(userId) || !sessionId) return;
  await supabase.from("quiz_events").insert({
    session_id: sessionId,
    user_id: userId,
    event_name: eventName,
    metadata: metadata || {},
  });
}

export function getShopProductDetailsFromRecommendation(recommendation: QuizRecommendation) {
  const catalog = getShopProducts();
  return recommendation.products
    .map((item) => {
      const product = catalog.find((entry) => entry.id === item.productId);
      if (!product) return null;
      return { ...product, compatibilityScore: item.score, compatibilityReason: item.reason };
    })
    .filter(Boolean);
}

export function getNearbyBarbershopsForRecommendation(productIds: string[]) {
  const preferredShopId = getShopProducts().find((p) => productIds.includes(p.id))?.barbershopId ?? 1;
  return [...mockBarbershops]
    .sort((a, b) => {
      if (a.id === preferredShopId) return -1;
      if (b.id === preferredShopId) return 1;
      return b.rating - a.rating;
    })
    .slice(0, 3);
}
