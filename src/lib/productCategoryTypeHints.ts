import type { StoreProductType } from "@/types/store";

/**
 * Mapa categoria (passo Básico) → tipo de produto sugerido.
 * Regras documentadas para manter UX e dados alinhados (BarberFlow loja).
 *
 * - Pomadas / Óleos / Barba → produtos típicos de styling (barbearia)
 * - Shampoo → líquido (volume/rotulagem diferente de pomada)
 * - Kits → kit
 * - Outros → sem sugestão automática (mantém tipo atual)
 */
const CATEGORY_TO_TYPE: Partial<Record<string, StoreProductType>> = {
  Pomadas: "barbearia",
  Óleos: "barbearia",
  Shampoo: "liquido",
  Kits: "kit",
  Barba: "barbearia",
};

/**
 * Retorna o tipo sugerido para a categoria ou `null` se não houver regra.
 */
export function suggestProductTypeFromCategory(category: string): StoreProductType | null {
  const trimmed = category.trim();
  const hit = CATEGORY_TO_TYPE[trimmed];
  return hit ?? null;
}

export function getCategoryTypeHintDescription(category: string): string | null {
  const t = suggestProductTypeFromCategory(category);
  if (!t) return null;
  const labels: Record<StoreProductType, string> = {
    barbearia: "Produto de barbearia",
    liquido: "Produto líquido",
    kit: "Kit",
    roupa: "Roupa",
    calcado: "Calçado",
    acessorio: "Equipamento / acessório",
  };
  return labels[t] ?? t;
}
