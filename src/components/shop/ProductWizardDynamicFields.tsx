import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorChipGroup, FixationSelect, SizeChipGroup, VolumeInput } from "@/components/shop/wizard";
import { getShopProductsByBarbershop } from "@/lib/shopProducts";
import { formatBRL, parsePriceInput } from "@/lib/productPricing";
import {
  CLOTH_SIZE_OPTIONS,
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  SHOE_SIZE_OPTIONS,
} from "@/lib/storeProductWizardDefaults";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { toggleStringOption } from "@/lib/storeProductFormHelpers";
import type { ShopProduct } from "@/types/shop";
import type { StoreProductAttributes, StoreProductType } from "@/types/store";

type SetForm = Dispatch<SetStateAction<ProductFormState>>;

const WIZARD_IN = "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0";
const WIZARD_KIT_IN = "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 focus:placeholder:opacity-0";
const WIZARD_SEL =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)]";

export function ProductWizardDynamicFields({
  form,
  setForm,
  barbershopId,
}: {
  form: ProductFormState;
  setForm: SetForm;
  barbershopId?: number;
}) {
  const pt = form.productType as StoreProductType;

  if (pt === "barbearia") {
    const a = form.attributes as {
      subtipo?: string;
      fixacao?: string;
      volumeMl?: number;
      uso?: string;
      duracaoEstimadaDias?: number;
      tipoCabeloRecomendado?: string;
    };
    return (
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={String(a.subtipo ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), subtipo: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Subtipo (pomada, óleo...)"
          className={WIZARD_IN}
        />
        <FixationSelect
          value={String(a.fixacao ?? "media")}
          onChange={(fixacao) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), fixacao } as StoreProductAttributes,
            }))
          }
        />
        <VolumeInput
          value={a.volumeMl}
          onChange={(volumeMl) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), volumeMl } as StoreProductAttributes,
            }))
          }
        />
        <select
          value={String(a.uso ?? "cabelo")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), uso: e.target.value } as StoreProductAttributes,
            }))
          }
          className={WIZARD_SEL}
        >
          <option value="cabelo">Uso: cabelo</option>
          <option value="barba">Uso: barba</option>
          <option value="ambos">Uso: ambos</option>
        </select>
        <Input
          type="number"
          min={0}
          value={a.duracaoEstimadaDias === undefined ? "" : String(a.duracaoEstimadaDias)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                duracaoEstimadaDias: Number(e.target.value || 0) || undefined,
              } as StoreProductAttributes,
            }))
          }
          placeholder="Duração estimada (dias)"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.tipoCabeloRecomendado ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), tipoCabeloRecomendado: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Tipo de cabelo (ex.: cacheado, oleoso)"
          className={WIZARD_IN}
        />
      </div>
    );
  }

  if (pt === "roupa") {
    const tamanhos = (form.attributes as { tamanhos?: string[] }).tamanhos ?? [];
    const cores = (form.attributes as { cores?: string[] }).cores ?? [];
    const materiais = (form.attributes as { materiais?: string[] }).materiais ?? [];
    return (
      <div className="grid grid-cols-2 gap-3">
        <SizeChipGroup
          label="Tamanhos"
          options={CLOTH_SIZE_OPTIONS}
          selected={tamanhos}
          onToggle={(size) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                tamanhos: toggleStringOption((f.attributes as { tamanhos?: string[] }).tamanhos, size),
              } as StoreProductAttributes,
            }))
          }
        />
        <ColorChipGroup
          label="Cores"
          options={COLOR_OPTIONS}
          selected={cores}
          onToggle={(color) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                cores: toggleStringOption((f.attributes as { cores?: string[] }).cores, color),
              } as StoreProductAttributes,
            }))
          }
        />
        <SizeChipGroup
          label="Materiais"
          options={MATERIAL_OPTIONS}
          selected={materiais}
          onToggle={(material) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                materiais: toggleStringOption((f.attributes as { materiais?: string[] }).materiais, material),
              } as StoreProductAttributes,
            }))
          }
        />
        <Input
          value={String((form.attributes as { genero?: string }).genero ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), genero: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Gênero (opcional)"
          className={`${WIZARD_IN} col-span-2`}
        />
      </div>
    );
  }

  if (pt === "calcado") {
    const tamanhosCalcado = (form.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado ?? [];
    const cores = (form.attributes as { cores?: string[] }).cores ?? [];
    return (
      <div className="grid grid-cols-2 gap-3">
        <SizeChipGroup
          label="Tamanhos (38–44)"
          options={SHOE_SIZE_OPTIONS}
          selected={tamanhosCalcado}
          onToggle={(size) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                tamanhosCalcado: toggleStringOption((f.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado, size),
              } as StoreProductAttributes,
            }))
          }
        />
        <ColorChipGroup
          label="Cores disponíveis"
          options={COLOR_OPTIONS}
          selected={cores}
          onToggle={(color) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                cores: toggleStringOption((f.attributes as { cores?: string[] }).cores, color),
              } as StoreProductAttributes,
            }))
          }
        />
        <Input
          value={String((form.attributes as { marca?: string }).marca ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), marca: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Marca"
          className={WIZARD_IN}
        />
        <div className="space-y-1.5">
          <Label className="text-sm text-foreground/80">Material</Label>
          <select
            value={String((form.attributes as { material?: string }).material ?? "")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                attributes: {
                  ...(f.attributes as object),
                  material: e.target.value,
                  materiais: e.target.value ? [e.target.value] : [],
                } as StoreProductAttributes,
              }))
            }
            className={WIZARD_SEL}
          >
            <option value="">Selecione material</option>
            {MATERIAL_OPTIONS.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (pt === "liquido") {
    const a = form.attributes as {
      volumeMl?: number;
      tipoUso?: string;
      ingredientes?: string;
      indicadoPara?: string;
      duracaoEstimadaDias?: number;
      tipoCabeloRecomendado?: string;
    };
    return (
      <div className="grid grid-cols-2 gap-3">
        <VolumeInput
          value={a.volumeMl}
          onChange={(volumeMl) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), volumeMl } as StoreProductAttributes,
            }))
          }
        />
        <Input
          value={String(a.tipoUso ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), tipoUso: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Tipo de uso"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.ingredientes ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), ingredientes: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Ingredientes"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.indicadoPara ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), indicadoPara: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Indicado para"
          className={WIZARD_IN}
        />
        <Input
          type="number"
          min={0}
          value={a.duracaoEstimadaDias === undefined ? "" : String(a.duracaoEstimadaDias)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                duracaoEstimadaDias: Number(e.target.value || 0) || undefined,
              } as StoreProductAttributes,
            }))
          }
          placeholder="Duração estimada (dias)"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.tipoCabeloRecomendado ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), tipoCabeloRecomendado: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Tipo de cabelo recomendado"
          className={WIZARD_IN}
        />
      </div>
    );
  }

  if (pt === "acessorio") {
    const a = form.attributes as {
      marca?: string;
      material?: string;
      cor?: string;
      garantia?: string;
      tipoFerramenta?: string;
      voltagem?: string;
      usoProfissional?: string;
    };
    return (
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={String(a.tipoFerramenta ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), tipoFerramenta: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Tipo (máquina, tesoura, navalha…)"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.marca ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), marca: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Marca"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.voltagem ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), voltagem: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Voltagem (se elétrico)"
          className={WIZARD_IN}
        />
        <select
          value={String(a.usoProfissional ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                usoProfissional: e.target.value === "" ? undefined : (e.target.value as "profissional" | "domestico"),
              } as StoreProductAttributes,
            }))
          }
          className={WIZARD_SEL}
        >
          <option value="">Uso: —</option>
          <option value="profissional">Profissional</option>
          <option value="domestico">Doméstico</option>
        </select>
        <Input
          value={String(a.material ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), material: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Material"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.cor ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), cor: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Cor"
          className={WIZARD_IN}
        />
        <Input
          value={String(a.garantia ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), garantia: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Garantia"
          className={`${WIZARD_IN} col-span-2`}
        />
      </div>
    );
  }

  if (pt === "kit") {
    const a = form.attributes as {
      itensIncluidos?: string;
      quantidadeItens?: number;
      tipoKit?: string;
      linhasKit?: Array<{ nome: string; qtd: number; shopProductId?: string; unitPrice?: number; imageUrl?: string }>;
      precoItensSeparados?: number;
    };
    const linhas = a.linhasKit ?? [];
    const [itemPickerOpen, setItemPickerOpen] = useState(false);
    const [itemQuery, setItemQuery] = useState("");

    const setLinhas = (
      next: Array<{ nome: string; qtd: number; shopProductId?: string; unitPrice?: number; imageUrl?: string }>,
    ) =>
      setForm((f) => ({
        ...f,
        attributes: { ...(f.attributes as object), linhasKit: next } as StoreProductAttributes,
      }));

    const selectedIds = useMemo(
      () => new Set(linhas.map((r) => String(r.shopProductId ?? "").trim()).filter(Boolean)),
      [linhas],
    );
    const availableProducts = useMemo(
      () =>
        getShopProductsByBarbershop(barbershopId)
          .filter((p) => Number(p.stock ?? 0) > 0)
          .sort((x, y) => String(x.name).localeCompare(String(y.name), "pt-BR")),
      [barbershopId],
    );
    const filteredProducts = useMemo(() => {
      const q = itemQuery.trim().toLowerCase();
      return availableProducts.filter((p) => {
        if (selectedIds.has(p.id)) return false;
        if (!q) return true;
        return String(p.name).toLowerCase().includes(q) || String(p.category ?? "").toLowerCase().includes(q);
      });
    }, [availableProducts, selectedIds, itemQuery]);

    const addProductToKit = (p: ShopProduct) => {
      if (selectedIds.has(p.id)) return;
      setLinhas([
        ...linhas,
        {
          shopProductId: p.id,
          nome: String(p.name ?? ""),
          qtd: 1,
          unitPrice: Number(p.price ?? 0) || 0,
          imageUrl: String(p.image ?? ""),
        },
      ]);
      setItemPickerOpen(false);
      setItemQuery("");
    };

    const somaSeparado = linhas.reduce((sum, row) => {
      const unit = Number(row.unitPrice ?? 0);
      const qtd = Number(row.qtd ?? 0);
      if (!Number.isFinite(unit) || !Number.isFinite(qtd)) return sum;
      return sum + Math.max(0, unit) * Math.max(0, qtd);
    }, 0);
    const separadoEfetivo =
      Number.isFinite(a.precoItensSeparados) && Number(a.precoItensSeparados) > 0
        ? Number(a.precoItensSeparados)
        : somaSeparado;
    const kitPrice = parsePriceInput(form.salePrice);
    const economia =
      Number.isFinite(separadoEfetivo) && separadoEfetivo > 0 && Number.isFinite(kitPrice) && kitPrice > 0
        ? Math.max(0, separadoEfetivo - kitPrice)
        : 0;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={String(a.tipoKit ?? "")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                attributes: { ...(f.attributes as object), tipoKit: e.target.value } as StoreProductAttributes,
              }))
            }
            placeholder="Tipo de kit (barba, cabelo, completo…)"
            className={WIZARD_KIT_IN}
          />
          <Input
            type="number"
            min={0}
            value={a.quantidadeItens === undefined ? "" : String(a.quantidadeItens)}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                attributes: {
                  ...(f.attributes as object),
                  quantidadeItens: Number(e.target.value || 0) || undefined,
                } as StoreProductAttributes,
              }))
            }
            placeholder="Qtd. total de itens (opcional)"
            className={WIZARD_KIT_IN}
          />
        </div>

        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <Label className="text-xs text-muted-foreground">Itens do kit</Label>
            <Button
              type="button"
              variant="outlineGold"
              size="sm"
              className="gap-1 sm:self-end sm:ml-auto"
              onClick={() => setItemPickerOpen((v) => !v)}
            >
              <Plus className="w-4 h-4" /> Adicionar produto ao kit
            </Button>
          </div>

          {itemPickerOpen ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={itemQuery}
                  onChange={(e) => setItemQuery(e.target.value)}
                  placeholder="Buscar produto pelo nome..."
                  className={`${WIZARD_KIT_IN} pl-8`}
                />
              </div>
              {availableProducts.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-background/20 p-3 text-xs text-muted-foreground">
                  Você ainda não tem produtos cadastrados para criar kits.
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-background/20 p-3 text-xs text-muted-foreground">
                  Nenhum produto encontrado para essa busca.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="rounded-lg border border-border/50 bg-background/10 p-2.5 flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-md overflow-hidden border border-border/40 shrink-0 bg-muted/20">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatBRL(Number(p.price ?? 0) || 0)} · Estoque: {Number(p.stock ?? 0)}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => addProductToKit(p)}>
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {linhas.length > 0 ? (
            <div className="rounded-xl border border-border/50 bg-background/10 p-3 space-y-2.5">
              <p className="text-xs font-semibold text-primary">Kit contem:</p>
              {linhas.map((row, idx) => (
                <div key={`${row.shopProductId ?? row.nome}-${idx}`} className="rounded-lg border border-border/50 bg-background/15 p-2.5 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-border/40 shrink-0 bg-muted/20">
                    {row.imageUrl ? <img src={row.imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {row.nome || "Item"}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{formatBRL(Number(row.unitPrice ?? 0) || 0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className={`${WIZARD_KIT_IN} w-16 h-9`}
                      value={row.qtd || ""}
                      onChange={(e) => {
                        const next = [...linhas];
                        next[idx] = { ...next[idx], qtd: Math.max(1, Number(e.target.value || 1)) };
                        setLinhas(next);
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => setLinhas(linhas.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <Input
          type="number"
          min={0}
          step={0.01}
          value={a.precoItensSeparados === undefined ? "" : String(a.precoItensSeparados)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: {
                ...(f.attributes as object),
                precoItensSeparados: Number(e.target.value || 0) || undefined,
              } as StoreProductAttributes,
            }))
          }
          placeholder="Preco separado (R$) para mostrar economia"
          className={WIZARD_KIT_IN}
        />

        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs space-y-1">
          <p className="text-muted-foreground">
            Soma produtos: <span className="tabular-nums text-foreground font-semibold">{formatBRL(somaSeparado || 0)}</span>
          </p>
          <p className="text-muted-foreground">
            Preco do kit:{" "}
            <span className="tabular-nums text-primary font-semibold">
              {Number.isFinite(kitPrice) && kitPrice > 0 ? formatBRL(kitPrice) : "—"}
            </span>
          </p>
          {economia > 0 ? <p className="text-emerald-400 font-medium tabular-nums">Economia estimada: {formatBRL(economia)}</p> : null}
        </div>

        <Input
          value={String(a.itensIncluidos ?? "")}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              attributes: { ...(f.attributes as object), itensIncluidos: e.target.value } as StoreProductAttributes,
            }))
          }
          placeholder="Notas livres sobre o kit (opcional)"
          className={WIZARD_KIT_IN}
        />
      </div>
    );
  }

  return null;
}
