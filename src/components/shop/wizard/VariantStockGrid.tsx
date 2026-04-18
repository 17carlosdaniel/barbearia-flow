import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import type { ProductFormState, StoreProductVariant } from "@/lib/storeProductWizardDefaults";
import { mergeVariantsWithSizes } from "@/lib/productWizardVariants";
import type { StoreProductType } from "@/types/store";

type SetForm = Dispatch<SetStateAction<ProductFormState>>;

export function VariantStockGrid({ form, setForm }: { form: ProductFormState; setForm: SetForm }) {
  const { identity } = useTheme();
  const pt = form.productType as StoreProductType;
  if (!["roupa", "camiseta", "camisa", "moleton", "calca", "shorts", "blusa", "jaqueta", "bone", "acessorio_roupa", "calcado", "tenis", "sapato", "chinelo", "bota"].includes(pt)) return null;

  const [applyAllStock, setApplyAllStock] = useState("");
  const attrs = form.attributes as { stockMode?: "single" | "variants"; showAdvancedStock?: boolean };
  const stockMode = attrs.stockMode ?? "single";
  const showAdvanced = !!attrs.showAdvancedStock;

  const merged = mergeVariantsWithSizes(form);
  if (merged.length === 0) {
    return (
      <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/60 px-3 py-2">
        Selecione tamanhos acima para habilitar o controle de estoque por variacao.
      </p>
    );
  }

  const updateRow = (clientId: string, field: "stock" | "minStock" | "sku", value: string) => {
    setForm((prev) => {
      const base = mergeVariantsWithSizes(prev);
      const next = base.map((r) => (r.clientId === clientId ? { ...r, [field]: value } : r));
      return { ...prev, variants: next };
    });
  };

  const byColor = useMemo(() => {
    const map = new Map<string, typeof merged>();
    for (const row of merged) {
      const color = String(row.attrsKey.cor ?? "Sem cor");
      const list = map.get(color) ?? [];
      list.push(row);
      map.set(color, list);
    }
    return [...map.entries()];
  }, [merged]);

  const missingStock = merged.filter((r) => Number(r.stock || "0") <= 0).length;

  const setStockMode = (mode: "single" | "variants") => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        stockMode: mode,
      } as ProductFormState["attributes"],
    }));
  };

  const applyStockToAll = () => {
    if (!applyAllStock.trim()) return;
    setForm((prev) => {
      const base = mergeVariantsWithSizes(prev);
      return {
        ...prev,
        variants: base.map((r) => ({ ...r, stock: applyAllStock })),
      };
    });
  };

  return (
    <div className={cn(
      "space-y-3 rounded-lg border border-primary/20 p-3",
      identity === "modern" ? "bg-[hsl(var(--muted))]" : "bg-[hsl(28_22%_11%/0.5)]"
    )}>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-primary">Controle por cor e tamanho (opcional)</p>
        <p className="text-[11px] text-muted-foreground">
          Modo atual:{" "}
          <span className={stockMode === "single" ? "text-emerald-400 font-medium" : "text-primary font-medium"}>
            {stockMode === "single" ? "Estoque unico" : "Por variacao"}
          </span>
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStockMode("single")}
            className={`rounded-md border px-2.5 py-1 ${stockMode === "single" ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}
          >
            Usar estoque unico
          </button>
          <button
            type="button"
            onClick={() => setStockMode("variants")}
            className={`rounded-md border px-2.5 py-1 ${stockMode === "variants" ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}
          >
            Controlar por variacao
          </button>
        </div>
      </div>
      {stockMode === "single" ? (
        <div className="rounded-md border border-border/50 bg-background/20 p-3 grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Estoque geral</Label>
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="product-wizard-input h-9 text-sm tabular-nums"
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Estoque minimo</Label>
            <Input
              type="number"
              min={0}
              value={form.minStock}
              onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
              className="product-wizard-input h-9 text-sm tabular-nums"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">{merged.length} variacao(oes) configuradas</span>
            {missingStock > 0 ? <span className="text-amber-300">Faltam {missingStock} sem estoque</span> : null}
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-[11px] text-muted-foreground">Aplicar estoque para todos</Label>
              <Input
                type="number"
                min={0}
                value={applyAllStock}
                onChange={(e) => setApplyAllStock(e.target.value)}
                className="product-wizard-input h-9 text-sm tabular-nums"
                placeholder="Ex.: 10"
              />
            </div>
            <Button type="button" size="sm" variant="outlineGold" onClick={applyStockToAll}>
              Aplicar
            </Button>
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                attributes: { ...f.attributes, showAdvancedStock: !showAdvanced } as ProductFormState["attributes"],
              }))
            }
            className="text-[11px] text-muted-foreground underline underline-offset-2"
          >
            {showAdvanced ? "Ocultar avancado" : "Mostrar avancado (SKU e minimo)"}
          </button>

          <div className="space-y-2.5">
            {byColor.map(([color, rows]) => (
              <div key={color} className="rounded-md border border-border/50 bg-background/20 p-2.5">
                <p className="mb-2 text-xs font-semibold text-foreground">{color}</p>
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.clientId} className="grid grid-cols-[auto_1fr] items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums">Tam. {row.attrsKey.tamanho ?? "—"}</span>
                      <Input
                        type="number"
                        min={0}
                        value={row.stock}
                        onChange={(e) => updateRow(row.clientId, "stock", e.target.value)}
                        className="product-wizard-input h-8 text-sm tabular-nums"
                        placeholder="Estoque"
                      />
                      {showAdvanced ? (
                        <>
                          <span className="text-[10px] text-muted-foreground">SKU</span>
                          <Input
                            value={row.sku ?? ""}
                            onChange={(e) => updateRow(row.clientId, "sku", e.target.value)}
                            className="product-wizard-input h-8 text-xs"
                            placeholder="opcional"
                          />
                          <span className="text-[10px] text-muted-foreground">Min.</span>
                          <Input
                            type="number"
                            min={0}
                            value={row.minStock}
                            onChange={(e) => updateRow(row.clientId, "minStock", e.target.value)}
                            className="product-wizard-input h-8 text-sm tabular-nums"
                          />
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
