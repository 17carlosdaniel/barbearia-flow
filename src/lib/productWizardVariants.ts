import type { ProductFormState, ProductVariantFormRow } from "@/lib/storeProductWizardDefaults";
import { makeVariantClientId } from "@/lib/storeProductWizardDefaults";
import type { StoreProductType } from "@/types/store";

/** Soma estoque numérico das linhas de variação no formulário */
export function sumVariantStock(variants: ProductVariantFormRow[]): number {
  return variants.reduce((s, v) => s + Math.max(0, Math.floor(Number(String(v.stock).replace(",", ".")) || 0)), 0);
}

export function selectedSizesForProductType(form: ProductFormState): string[] {
  const pt = form.productType as StoreProductType;
  if (["roupa", "camiseta", "camisa", "moleton", "calca", "shorts", "blusa", "jaqueta", "bone", "acessorio_roupa"].includes(pt)) {
    return [...(((form.attributes as { tamanhos?: string[] }).tamanhos ?? []) as string[])].sort();
  }
  if (["calcado", "tenis", "sapato", "chinelo", "bota"].includes(pt)) {
    return [...(((form.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado ?? []) as string[])].sort();
  }
  return [];
}

/** Garante uma linha de variação por combinação selecionada (tamanho x cor). */
export function mergeVariantsWithSizes(form: ProductFormState): ProductVariantFormRow[] {
  const sizes = selectedSizesForProductType(form);
  const colors = [...(((form.attributes as { cores?: string[] }).cores ?? []) as string[])].filter(Boolean).sort();
  const prev = form.variants;
  const out: ProductVariantFormRow[] = [];

  const keys = colors.length > 0
    ? sizes.flatMap((size) => colors.map((cor) => ({ tamanho: size, cor })))
    : sizes.map((size) => ({ tamanho: size }));

  for (const attrsKey of keys) {
    const found = prev.find((v) => {
      const sameSize =
        String(v.attrsKey?.tamanho ?? v.attrsKey?.tamanhoCalcado ?? "") === String(attrsKey.tamanho ?? "");
      const sameColor = String(v.attrsKey?.cor ?? "") === String(attrsKey.cor ?? "");
      return sameSize && sameColor;
    });
    if (found) {
      out.push({ ...found, attrsKey: { ...attrsKey } });
      continue;
    }
    out.push({
      clientId: makeVariantClientId(),
      attrsKey: { ...attrsKey },
      stock: "0",
      minStock: "0",
      sku: "",
    });
  }
  return out;
}
