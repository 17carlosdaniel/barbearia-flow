import { describe, expect, it } from "vitest";
import { buildQuizRecommendation } from "@/lib/quizRecommendationEngine";

const catalog = [
  {
    id: "BF-1001",
    name: "Pomada Matte Premium",
    description: "Fixacao forte matte para finalizacao.",
    category: "Pomadas",
    tags: ["pomada", "matte"],
    rating: 4.7,
  },
  {
    id: "BF-1002",
    name: "Oleo para Barba",
    description: "Hidratacao intensa para fios ressecados.",
    category: "Cuidados",
    tags: ["oleo", "hidrata"],
    rating: 4.5,
  },
];

describe("buildQuizRecommendation", () => {
  it("prioriza hidratacao para cacheado", () => {
    const rec = buildQuizRecommendation(
      { hairType: "cacheado", concern: "ressecamento", budget: "premium" },
      { frizzLevel: "alto", porosity: "media_alta", confidence: 0.8 },
      catalog,
    );

    expect(rec.products.length).toBeGreaterThan(0);
    expect(rec.products[0].productId).toBe("BF-1002");
    expect(rec.cuts.length).toBe(3);
  });

  it("mantem fallback seguro quando faltam sinais", () => {
    const rec = buildQuizRecommendation({}, undefined, catalog);

    expect(rec.summary.length).toBeGreaterThan(10);
    expect(rec.confidence).toBeGreaterThan(0);
    expect(rec.reasoning.length).toBeGreaterThan(0);
  });
});
