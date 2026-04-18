import type { Dispatch, SetStateAction } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, Images, Pencil, Sparkles, Trash2 } from "lucide-react";
import { WizardSection, WIZARD_EASE } from "@/components/shop/wizard/wizardMotion";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { isWizardContentCategory } from "@/lib/storeProductWizardDefaults";
import type { StoreProductType } from "@/types/store";
import { useTheme } from "@/contexts/ThemeContext";

const SUBLABEL = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";
const SUBLABEL_MUTED = "text-[10px] font-medium uppercase tracking-wide text-muted-foreground/85";

const PLACEHOLDER_COMPOSICAO = `° 100% algodão
° couro legítimo
° ingredientes ativos (se aplicável)`;

const PLACEHOLDER_INGREDIENTES = `° Água purificada
° Ativos principais
° Conservantes conforme regulamentação`;

const PLACEHOLDER_DESCRICAO_VENDA =
  "Descreva os benefícios, para quem é indicado e o diferencial do produto…";

/** Mesmo `id` do `<input type="file">` em ProductWizardDialog — abre o seletor com <label htmlFor> */
export const PRODUCT_WIZARD_GALLERY_INPUT_ID = "product-wizard-gallery-input";

type SetForm = Dispatch<SetStateAction<ProductFormState>>;

function usesLiquidoIngredientField(productType: StoreProductType): boolean {
  return productType === "liquido" || productType === "solido" || productType === "spray" || productType === "gel";
}

function getCompositionText(form: ProductFormState): string {
  const a = form.attributes as Record<string, unknown>;
  if (usesLiquidoIngredientField(form.productType)) return String(a.ingredientes ?? "");
  return String(a.composicao ?? "");
}

function setCompositionField(setForm: SetForm, productType: StoreProductType, value: string) {
  const key = usesLiquidoIngredientField(productType) ? "ingredientes" : "composicao";
  setForm((f) => ({
    ...f,
    attributes: {
      ...f.attributes,
      [key]: value,
    } as ProductFormState["attributes"],
  }));
}

export type ProductWizardContentStepProps = {
  form: ProductFormState;
  setForm: SetForm;
  onPickCover: () => void;
  onRemoveGallery: (index: number) => void;
  coverOptimizedHint?: boolean;
  galleryOptimizedHint?: boolean;
};

export function ProductWizardContentStep({
  form,
  setForm,
  onPickCover,
  onRemoveGallery,
  coverOptimizedHint = false,
  galleryOptimizedHint = false,
}: ProductWizardContentStepProps) {
  const { identity } = useTheme();
  
  // Cores dinâmicas por modo
  const CARD_HERO = identity === "modern"
    ? "rounded-xl border border-primary/25 bg-[hsl(var(--card))] p-5 sm:p-6 shadow-sm"
    : "rounded-xl border border-primary/25 bg-[hsl(28_22%_11%/0.5)] p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(245,184,65,0.1)]";
  const CARD_SALES = identity === "modern"
    ? "rounded-xl border border-border/55 bg-[hsl(var(--muted))] p-5 sm:p-5 shadow-sm"
    : "rounded-xl border border-border/55 bg-[hsl(28_22%_11%/0.42)] p-5 sm:p-5 shadow-[inset_0_1px_0_rgba(245,184,65,0.05)]";
  const CARD_GALLERY = identity === "modern"
    ? "rounded-xl border border-border/40 bg-[hsl(var(--background))] p-4 sm:p-4"
    : "rounded-xl border border-border/40 bg-[hsl(28_22%_11%/0.3)] p-4 sm:p-4";
  const CARD_TECH = identity === "modern"
    ? "rounded-xl border border-border/30 bg-[hsl(var(--background))] p-4 sm:p-4 opacity-[0.98]"
    : "rounded-xl border border-border/30 bg-[hsl(28_22%_11%/0.28)] p-4 sm:p-4 opacity-[0.98]";
  const TEXTAREA_SALES = identity === "modern"
    ? "min-h-[160px] rounded-md border border-border/60 bg-[hsl(var(--background))] text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/45 placeholder:text-muted-foreground/45"
    : "min-h-[160px] rounded-md border border-border/60 bg-[hsl(28_18%_11%)] text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/45 placeholder:text-muted-foreground/45";
  const TEXTAREA_TECH = identity === "modern"
    ? "min-h-[96px] rounded-md border border-border/40 bg-[hsl(var(--background))] text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/35 placeholder:text-muted-foreground/40"
    : "min-h-[96px] rounded-md border border-border/40 bg-[hsl(28_18%_11%/0.85)] text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/35 placeholder:text-muted-foreground/40";
    
  const reduceMotion = useReducedMotion();
  const eligible = isWizardContentCategory(form.category);
  const ingredientLabel = usesLiquidoIngredientField(form.productType) ? "Ingredientes" : "Composição / materiais";

  // Títulos e subtítulos por modo
  const stepTitle = identity === "modern" ? "Apresentação do produto" : "Conteúdo da vitrine";
  const stepSubtitle = identity === "modern" 
    ? "Adicione imagens e descrições para exibir o produto com clareza na loja."
    : "Primeiro o visual, depois o texto que vende; por último os detalhes técnicos — na ordem em que o cliente pensa.";
  
  const imageSubtitle = identity === "modern" ? "Imagem principal exibida na loja." : "É o que o cliente vê primeiro — capa em destaque.";
  const descriptionTitle = identity === "modern" ? "Descrição para venda" : "Texto de venda (descrição que aparece na loja)";
  const descriptionHelp = identity === "modern" 
    ? "Inclua uso, diferenciais e informações que ajudam na decisão."
    : "Produtos com boas descrições vendem até 3x mais — benefícios, público e diferencial.";
  const galleryTitle = identity === "modern" ? "Imagens adicionais" : "Galeria de fotos extras";
  const galleryHelp = identity === "modern" ? "Fotos complementares do produto." : "Complementam a imagem principal.";

  if (!eligible) {
    return (
      <motion.div
        className="space-y-4"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: WIZARD_EASE }}
      >
        <header className="space-y-1 border-b border-border/40 pb-4">
          <h3 className="text-base font-semibold text-foreground tracking-tight">{stepTitle}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            {stepSubtitle}
          </p>
        </header>
        <div className={cn(CARD_SALES, "text-center space-y-2 py-8")}>
          <p className="text-sm text-muted-foreground">
            Sua categoria atual é <span className="font-semibold text-foreground">{form.category}</span> — este bloco não se
            aplica. Avance para continuar o cadastro.
          </p>
        </div>
      </motion.div>
    );
  }

  const compositionPlaceholder = usesLiquidoIngredientField(form.productType)
    ? PLACEHOLDER_INGREDIENTES
    : PLACEHOLDER_COMPOSICAO;

  return (
    <motion.div
      className="w-full flex flex-col gap-10 sm:gap-12"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? false : { opacity: 1 }}
      transition={{ duration: 0.38, ease: WIZARD_EASE }}
    >
      <motion.header
        className="space-y-1.5 border-b border-border/40 pb-4"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: WIZARD_EASE }}
      >
        <h3 className="text-base font-semibold text-foreground tracking-tight">{stepTitle}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          {stepSubtitle}
        </p>
      </motion.header>

      {/* ——— BLOCO 1 · Fotos (protagonista) ——— */}
      <WizardSection className={cn(CARD_HERO, "space-y-6")}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-primary/15 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Images className="w-5 h-5 text-primary shrink-0" aria-hidden />
                <h4 className="text-sm font-semibold tracking-tight text-foreground">Imagem principal</h4>
              </div>
              <p className="text-[12px] text-primary/80 mt-1">{imageSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Capa sempre em destaque; galeria logo abaixo (evita sumir em layouts 2 col ou com overflow) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Label className={SUBLABEL}>Foto de capa</Label>
            {coverOptimizedHint ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Sparkles className="w-3 h-3" />
                Imagem otimizada
              </span>
            ) : null}
          </div>
          <motion.button
            type="button"
            onClick={onPickCover}
            whileHover={reduceMotion ? undefined : { scale: 1.01 }}
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            transition={{ duration: 0.2, ease: WIZARD_EASE }}
            className="relative w-full max-w-2xl mx-auto sm:mx-0 aspect-[16/10] min-h-[200px] sm:min-h-[220px] max-h-[300px] rounded-xl border-2 border-border/45 bg-background/25 overflow-hidden flex items-center justify-center hover:border-primary/50 transition-colors group shadow-inner"
          >
            {form.imageUrl ? (
              <>
                <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-2 text-xs font-medium text-gray-900 shadow-lg">
                    <Pencil className="w-3.5 h-3.5" /> Alterar capa
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground flex flex-col items-center gap-2 px-4 text-center">
                <ImageIcon className="w-10 h-10 opacity-55" />
                Clique para enviar a foto principal
              </span>
            )}
          </motion.button>
        </div>

      </WizardSection>

      {/* ——— BLOCO 2 · Venda (conteúdo que converte) ——— */}
      <WizardSection className={cn(CARD_SALES, "space-y-5")}>
        <div className="flex items-start gap-3 border-b border-border/40 pb-4">
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="pw-content-desc" className="text-sm font-semibold text-foreground tracking-tight">
              {descriptionTitle}
            </Label>
            <p className="text-[12px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>
                {descriptionHelp}
              </span>
            </p>
          </div>
        </div>
        <Textarea
          id="pw-content-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder={PLACEHOLDER_DESCRICAO_VENDA}
          className={TEXTAREA_SALES}
          spellCheck={true}
        />
      </WizardSection>

      {/* ——— BLOCO 3 · Galeria (secundário) ——— */}
      <WizardSection className={cn(CARD_GALLERY, "space-y-3.5")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Label className={SUBLABEL}>{galleryTitle}</Label>
            <p className="text-[11px] text-muted-foreground mt-1">{galleryHelp}</p>
          </div>
          {galleryOptimizedHint ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <Sparkles className="w-3 h-3" />
              Fotos otimizadas
            </span>
          ) : null}
          <label
            htmlFor={PRODUCT_WIZARD_GALLERY_INPUT_ID}
            className={cn(
              buttonVariants({ variant: "outlineGold", size: "sm" }),
              "cursor-pointer gap-2 font-medium w-full sm:w-auto",
            )}
          >
            <Images className="w-4 h-4" />
            {(form.galleryImageUrls ?? []).length > 0 ? "Adicionar fotos extras" : "Adicionar fotos extras"}
          </label>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/10 p-3">
          <div className="flex flex-wrap gap-2 min-h-[56px] content-start">
            {(form.galleryImageUrls ?? []).length === 0 ? (
              <p className="text-[12px] text-muted-foreground w-full py-3 text-center sm:text-left">Nenhuma foto extra ainda.</p>
            ) : (
              (form.galleryImageUrls ?? []).map((url, index) => (
                <div
                  key={`${url.slice(0, 48)}-${index}`}
                  className="relative w-[64px] h-[64px] sm:w-[70px] sm:h-[70px] rounded-md overflow-hidden border border-border/40 shrink-0 group/thumb"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveGallery(index)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/75 p-1 text-white opacity-0 group-hover/thumb:opacity-100 group-focus-within/thumb:opacity-100 transition-opacity"
                    aria-label="Remover imagem da galeria"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </WizardSection>

      {/* ——— BLOCO 3 · Técnico (secundário) ——— */}
      <WizardSection className={cn(CARD_TECH, "space-y-3.5")}>
        <div className="flex items-start gap-2.5 pb-1">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes técnicos</h4>
            <Label htmlFor="pw-content-ing" className={cn(SUBLABEL_MUTED, "normal-case tracking-normal text-[13px] font-medium")}>
              {ingredientLabel}
            </Label>
            <p className="text-[10px] text-muted-foreground/90 leading-relaxed pt-0.5">
              Opcional: detalhe para quem quer saber composição, materiais ou INCI. Uma linha com{" "}
              <span className="text-primary/90 font-medium">°</span> por item também funciona bem.
            </p>
          </div>
        </div>
        <Textarea
          id="pw-content-ing"
          value={getCompositionText(form)}
          onChange={(e) => setCompositionField(setForm, form.productType, e.target.value)}
          placeholder={compositionPlaceholder}
          className={TEXTAREA_TECH}
          spellCheck={true}
        />
        <p className="text-[10px] text-muted-foreground/75 italic">
          Ex.: 100% algodão; couro legítimo; lista de ingredientes — o que fizer sentido para o seu tipo de produto.
        </p>
      </WizardSection>
    </motion.div>
  );
}
