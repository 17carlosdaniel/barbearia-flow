import type { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { CLOTH_SIZE_OPTIONS, COLOR_OPTIONS, GENDER_OPTIONS, SHOE_SIZE_OPTIONS, CARE_TYPE_OPTIONS, FRAGRANCE_OPTIONS } from "@/lib/storeProductWizardDefaults";
import type { StoreProductAttributes, StoreProductEmbalagem } from "@/types/store";

type SetForm = Dispatch<SetStateAction<ProductFormState>>;

const WIZARD_IN =
  "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0";
const WIZARD_SEL =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)] focus:outline-none";

function getEmbalagem(attrs: StoreProductAttributes): StoreProductEmbalagem {
  return (attrs as { embalagem?: StoreProductEmbalagem }).embalagem ?? {};
}

function setEmbalagemPatch(
  prev: ProductFormState,
  patch: Partial<StoreProductEmbalagem>,
): ProductFormState {
  const cur = getEmbalagem(prev.attributes);
  const nextEmb: StoreProductEmbalagem = { ...cur, ...patch };
  const cleaned = Object.fromEntries(
    Object.entries(nextEmb).filter(([, v]) => v !== undefined && v !== "" && !(typeof v === "number" && Number.isNaN(v))),
  ) as StoreProductEmbalagem;
  return {
    ...prev,
    attributes: {
      ...(prev.attributes as object),
      embalagem: Object.keys(cleaned).length ? cleaned : undefined,
    } as StoreProductAttributes,
  };
}

export function PackagingStep({ form, setForm }: { form: ProductFormState; setForm: SetForm }) {
  const e = getEmbalagem(form.attributes);
  const uDim = e.unidadeDimensao ?? "cm";
  const uPeso = e.unidadePeso ?? "kg";

  const dimLabel = uDim === "m" ? "m" : "cm";
  const pesoLabel = uPeso === "g" ? "g" : "kg";

  // Verificar se é categoria de roupas ou calçados
  const isClothingCategory = form.category === "Roupas";
  const isShoesCategory = form.category === "Calçados";
  const isGeneralProductsCategory = form.category === "Produtos físicos gerais";

  const fmtDim = (n: number | undefined) =>
    n === undefined || Number.isNaN(n) ? "—" : `${n} ${dimLabel}`;
  const fmtPeso = (n: number | undefined) =>
    n === undefined || Number.isNaN(n) ? "—" : `${n} ${pesoLabel}`;

  // Mapeamento de cores para bolinhas coloridas
  const colorSwatches: Record<string, string> = {
    "Preto": "bg-black",
    "Branco": "bg-white border border-gray-300",
    "Cinza": "bg-gray-500",
    "Marrom": "bg-amber-800",
    "Azul": "bg-blue-500",
    "Verde": "bg-green-500",
    "Vermelho": "bg-red-500",
    "Amarelo": "bg-yellow-400",
    "Rosa": "bg-pink-400",
    "Roxo": "bg-purple-500",
    "Laranja": "bg-orange-500",
    "Bege": "bg-stone-400",
    "Cáqui": "bg-cyan-500",
  };

  // Funções para gerenciar tamanhos e cores de roupas
  const handleSizeToggle = (size: string) => {
    setForm((f) => {
      if (isClothingCategory) {
        const currentSizes = (f.attributes as any).tamanhos || [];
        const newSizes = currentSizes.includes(size)
          ? currentSizes.filter(s => s !== size)
          : [...currentSizes, size];
        
        return {
          ...f,
          attributes: {
            ...f.attributes,
            tamanhos: newSizes,
            tamanho: newSizes.length > 0 ? newSizes[0] : "",
          } as any,
        };
      } else if (isShoesCategory) {
        const currentSizes = (f.attributes as any).tamanhosCalcado || [];
        const newSizes = currentSizes.includes(size)
          ? currentSizes.filter(s => s !== size)
          : [...currentSizes, size];
        
        return {
          ...f,
          attributes: {
            ...f.attributes,
            tamanhosCalcado: newSizes,
            tamanhoCalcado: newSizes.length > 0 ? newSizes[0] : "",
          } as any,
        };
      }
      return f;
    });
  };

  const handleColorToggle = (color: string) => {
    setForm((f) => {
      const currentColors = (f.attributes as any).cores || [];
      const newColors = currentColors.includes(color)
        ? currentColors.filter(c => c !== color)
        : [...currentColors, color];
      
      return {
        ...f,
        attributes: {
          ...f.attributes,
          cores: newColors,
          cor: newColors.length > 0 ? newColors[0] : "",
        } as any,
      };
    });
  };

  const handleGenderChange = (gender: string) => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        genero: gender,
      } as any,
    }));
  };

  const handleCareTypeChange = (careType: string) => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        tipoCuidado: careType,
      } as any,
    }));
  };

  const handleFragranceChange = (fragrance: string) => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        fragrancia: fragrance,
      } as any,
    }));
  };

  const currentSizes = isClothingCategory 
    ? (form.attributes as any).tamanhos || []
    : isShoesCategory 
    ? (form.attributes as any).tamanhosCalcado || []
    : [];
  const currentColors = (form.attributes as any).cores || [];
  const currentGender = (form.attributes as any).genero || "";
  const currentCareType = (form.attributes as any).tipoCuidado || "";
  const currentFragrance = (form.attributes as any).fragrancia || "";
  const currentVolume = (form.attributes as any).volume || "";
  const currentWeight = (form.attributes as any).pesoLiquido || "";

  return (
    <div className="space-y-4">
      {isClothingCategory ? (
        // Interface para Roupas
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tamanhos disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {CLOTH_SIZE_OPTIONS.map((size) => (
                <Badge
                  key={size}
                  variant={currentSizes.includes(size) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
            {currentSizes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentSizes.length} tamanho(s) selecionado(s)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Cores disponíveis</Label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((color) => (
                <div
                  key={color}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                      colorSwatches[color] || "bg-gray-300",
                      currentColors.includes(color)
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    title={color}
                  />
                  {currentColors.includes(color) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {currentColors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentColors.length} cor(es) selecionada(s)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Gênero</Label>
            <Select value={currentGender} onValueChange={handleGenderChange}>
              <SelectTrigger className={WIZARD_SEL}>
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : isShoesCategory ? (
        // Interface para Calçados
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Números disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {SHOE_SIZE_OPTIONS.map((size) => (
                <Badge
                  key={size}
                  variant={currentSizes.includes(size) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </Badge>
              ))}
            </div>
            {currentSizes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentSizes.length} número(s) selecionado(s)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Cores disponíveis</Label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((color) => (
                <div
                  key={color}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                      colorSwatches[color] || "bg-gray-300",
                      currentColors.includes(color)
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                    title={color}
                  />
                  {currentColors.includes(color) && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {currentColors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {currentColors.length} cor(es) selecionada(s)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Gênero</Label>
            <Select value={currentGender} onValueChange={handleGenderChange}>
              <SelectTrigger className={WIZARD_SEL}>
                <SelectValue placeholder="Selecione o gênero" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : isGeneralProductsCategory ? (
        // Interface para Produtos físicos gerais
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw-weight">Peso líquido</Label>
              <Input
                id="pw-weight"
                type="text"
                value={currentWeight}
                onChange={(ev) =>
                  setForm((f) => ({
                    ...f,
                    attributes: {
                      ...f.attributes,
                      pesoLiquido: ev.target.value,
                    } as any,
                  }))
                }
                placeholder="Ex: 200g, 500ml"
                className={WIZARD_IN}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-volume">Volume da unidade</Label>
              <Input
                id="pw-volume"
                type="text"
                value={currentVolume}
                onChange={(ev) =>
                  setForm((f) => ({
                    ...f,
                    attributes: {
                      ...f.attributes,
                      volume: ev.target.value,
                    } as any,
                  }))
                }
                placeholder="Ex: 100ml, 250g"
                className={WIZARD_IN}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Gênero</Label>
              <Select value={currentGender} onValueChange={handleGenderChange}>
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de cuidado</Label>
              <Select value={currentCareType} onValueChange={handleCareTypeChange}>
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CARE_TYPE_OPTIONS.map((careType) => (
                    <SelectItem key={careType} value={careType}>
                      {careType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Fragrância</Label>
            <Select value={currentFragrance} onValueChange={handleFragranceChange}>
              <SelectTrigger className={WIZARD_SEL}>
                <SelectValue placeholder="Selecione a fragrância" />
              </SelectTrigger>
              <SelectContent>
                {FRAGRANCE_OPTIONS.map((fragrance) => (
                  <SelectItem key={fragrance} value={fragrance}>
                    {fragrance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        // Interface original para outras categorias
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Unidade de dimensão</Label>
              <select
                value={uDim}
                onChange={(ev) =>
                  setForm((f) => setEmbalagemPatch(f, { unidadeDimensao: ev.target.value as "cm" | "m" }))
                }
                className={WIZARD_SEL}
              >
                <option value="cm">Centímetros (cm)</option>
                <option value="m">Metros (m)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Unidade de peso</Label>
              <select
                value={uPeso}
                onChange={(ev) =>
                  setForm((f) => setEmbalagemPatch(f, { unidadePeso: ev.target.value as "kg" | "g" }))
                }
                className={WIZARD_SEL}
              >
                <option value="kg">Quilogramas (kg)</option>
                <option value="g">Gramas (g)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pw-pkg-alt">Altura</Label>
              <Input
                id="pw-pkg-alt"
                type="number"
                min={0}
                step="any"
                value={e.altura === undefined ? "" : String(e.altura)}
                onChange={(ev) =>
                  setForm((f) =>
                    setEmbalagemPatch(f, {
                      altura: ev.target.value === "" ? undefined : Number(ev.target.value),
                    }),
                  )
                }
                placeholder="0"
                className={WIZARD_IN}
              />
              <span className="text-[10px] text-muted-foreground">{dimLabel}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-pkg-lar">Tamanho</Label>
              <Input
                id="pw-pkg-lar"
                type="number"
                min={0}
                step="any"
                value={e.largura === undefined ? "" : String(e.largura)}
                onChange={(ev) =>
                  setForm((f) =>
                    setEmbalagemPatch(f, {
                      largura: ev.target.value === "" ? undefined : Number(ev.target.value),
                    }),
                  )
                }
                placeholder="0"
                className={WIZARD_IN}
              />
              <span className="text-[10px] text-muted-foreground">{dimLabel}</span>
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="pw-pkg-prof">Profundidade (opcional)</Label>
              <Input
                id="pw-pkg-prof"
                type="number"
                min={0}
                step="any"
                value={e.profundidade === undefined ? "" : String(e.profundidade)}
                onChange={(ev) =>
                  setForm((f) =>
                    setEmbalagemPatch(f, {
                      profundidade: ev.target.value === "" ? undefined : Number(ev.target.value),
                    }),
                  )
                }
                placeholder="0"
                className={WIZARD_IN}
              />
              <span className="text-[10px] text-muted-foreground">{dimLabel}</span>
            </div>
          </div>
        </>
      )}

      {/* Resumo (diferente para cada categoria) */}
      {isClothingCategory ? (
        <div className="rounded-xl border border-border/60 bg-[hsl(28_22%_11%/0.55)] px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Resumo do produto</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p className="text-muted-foreground">
              Tamanhos: <span className="text-foreground tabular-nums">{currentSizes.length > 0 ? currentSizes.join(", ") : "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Cores: <span className="text-foreground tabular-nums">{currentColors.length > 0 ? currentColors.join(", ") : "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Gênero: <span className="text-foreground tabular-nums">{currentGender || "—"}</span>
            </p>
            <p className="text-muted-foreground sm:col-span-2 text-xs pt-1 border-t border-border/40">
              Categoria: Roupas · Variações disponíveis para venda
            </p>
          </div>
        </div>
      ) : isShoesCategory ? (
        <div className="rounded-xl border border-border/60 bg-[hsl(28_22%_11%/0.55)] px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Resumo do produto</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p className="text-muted-foreground">
              Números: <span className="text-foreground tabular-nums">{currentSizes.length > 0 ? currentSizes.join(", ") : "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Cores: <span className="text-foreground tabular-nums">{currentColors.length > 0 ? currentColors.join(", ") : "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Gênero: <span className="text-foreground tabular-nums">{currentGender || "—"}</span>
            </p>
            <p className="text-muted-foreground sm:col-span-2 text-xs pt-1 border-t border-border/40">
              Categoria: Calçados · Variações disponíveis para venda
            </p>
          </div>
        </div>
      ) : isGeneralProductsCategory ? (
        <div className="rounded-xl border border-border/60 bg-[hsl(28_22%_11%/0.55)] px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Resumo do produto</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p className="text-muted-foreground">
              Peso líquido: <span className="text-foreground tabular-nums">{currentWeight || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Volume: <span className="text-foreground tabular-nums">{currentVolume || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Gênero: <span className="text-foreground tabular-nums">{currentGender || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Tipo cuidado: <span className="text-foreground tabular-nums">{currentCareType || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              Fragrância: <span className="text-foreground tabular-nums">{currentFragrance || "—"}</span>
            </p>
            <p className="text-muted-foreground sm:col-span-2 text-xs pt-1 border-t border-border/40">
              Categoria: Produtos físicos gerais · Especificações do produto
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-[hsl(28_22%_11%/0.55)] px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Especificações para Envio</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <p className="text-muted-foreground">
              Altura: <span className="text-foreground tabular-nums">{fmtDim(e.altura)}</span>
            </p>
            <p className="text-muted-foreground">
              Tamanho: <span className="text-foreground tabular-nums">{fmtDim(e.largura)}</span>
            </p>
            <p className="text-muted-foreground">
              Profundidade: <span className="text-foreground tabular-nums">{fmtDim(e.profundidade)}</span>
            </p>
            <p className="text-muted-foreground">
              Peso: <span className="text-foreground tabular-nums">{fmtPeso(e.peso)}</span>
            </p>
            <p className="text-muted-foreground sm:col-span-2 text-xs pt-1 border-t border-border/40">
              Unidade dimensão: {uDim === "m" ? "Metros (m)" : "Centímetros (cm)"} · Unidade peso:{" "}
              {uPeso === "g" ? "Gramas (g)" : "Quilogramas (kg)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
