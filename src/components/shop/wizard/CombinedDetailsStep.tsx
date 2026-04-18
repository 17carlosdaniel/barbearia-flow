import { useState, useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { X, Plus, Droplets, SprayCan, FlaskConical, Package, Check, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BRAND_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  HAIR_TYPE_OPTIONS,
  DIFFERENTIAL_OPTIONS,
  CLOTH_SIZE_OPTIONS,
  SHOE_SIZE_OPTIONS,
  COLOR_OPTIONS,
  GENDER_OPTIONS,
  MATERIAL_OPTIONS,
} from "@/lib/storeProductWizardDefaults";
import { WizardSection, WIZARD_EASE } from "@/components/shop/wizard/wizardMotion";
import { OutrosUtilitarianDetails } from "@/components/shop/wizard/OutrosUtilitarianDetails";
import { useTheme } from "@/contexts/ThemeContext";

const WIZARD_IN =
  "product-wizard-input h-10 w-full text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 focus:placeholder:opacity-0";
const WIZARD_SEL =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0";
const SECTION_HEAD = "text-xs font-semibold uppercase tracking-wider text-primary/90";
const SECTION_HEAD_STRONG = "text-sm font-bold uppercase tracking-wide text-primary";
const SUBLABEL = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

/** Diferenciais com linguagem mais adequada a vestuario / calcados (evita chips de cosméticos). */
const APPAREL_DIFFERENTIAL_OPTIONS = [
  "Tecido / material premium",
  "Alta durabilidade",
  "Conforto no uso",
  "Facil de combinar",
  "Respiravel",
  "Costura reforcada",
  "Leve",
  "Edicao limitada",
];

const UTIL_MACHINE_DIFF = [
  "Profissional",
  "Uso continuo",
  "Baixo ruido",
  "Alta durabilidade",
  "Precisao de corte",
  "Ergonômico",
];
const UTIL_ACCESSORY_DIFF = [
  "Leve",
  "Resistente",
  "Antiderrapante",
  "Precisao de corte",
  "Profissional",
  "Alta durabilidade",
];
const UTIL_KIT_DIFF = [
  "Economia no pacote",
  "Montagem pratica",
  "Ticket medio alto",
  "Presenteavel",
  "Profissional",
  "Itens complementares",
];
const UTIL_PARTS_DIFF = [
  "Alta durabilidade",
  "Corte preciso",
  "Fácil encaixe",
  "Compatível com múltiplos modelos",
  "Uso profissional",
];

type SetForm = Dispatch<SetStateAction<ProductFormState>>;
interface CombinedDetailsStepProps {
  form: ProductFormState;
  setForm: SetForm;
}
type SizeMode = "numerico" | "padrao" | "personalizado";

const NUMERIC_SIZES = CLOTH_SIZE_OPTIONS.filter((v) => /^\d+$/.test(v));
const LETTER_SIZES = CLOTH_SIZE_OPTIONS.filter((v) => !/^\d+$/.test(v));

type SkinIconKey = "normal" | "seca" | "oleosa" | "mista" | "sensivel" | "acneica" | "madura";

const SKIN_TYPE_CHOICES: Array<{ label: string; hint: string; iconKey: SkinIconKey }> = [
  { label: "Normal", hint: "Equilibrada, sem excesso de oleosidade ou ressecamento.", iconKey: "normal" },
  { label: "Seca", hint: "Produz menos oleo e pode gerar repuxamento.", iconKey: "seca" },
  { label: "Oleosa", hint: "Brilho intenso, sebo alto e poros dilatados.", iconKey: "oleosa" },
  { label: "Mista", hint: "Zona T oleosa e bochechas secas/normal.", iconKey: "mista" },
  { label: "Sensivel", hint: "Reativa, com tendencia a vermelhidao e irritacao.", iconKey: "sensivel" },
  { label: "Acneica", hint: "Maior propensao a cravos e espinhas.", iconKey: "acneica" },
  { label: "Madura", hint: "Menor firmeza/elasticidade e mais ressecamento.", iconKey: "madura" },
];

/** Mesmo array — nome em camelCase para alinhar a `hairTypeChoices` e evitar ReferenceError em referencias antigas. */
const skinTypeChoices = SKIN_TYPE_CHOICES;

function generateSkuFromContext(name: string, productType: string): string {
  const rawName = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .trim();
  const words = rawName.split(/\s+/).filter(Boolean);
  const head = (words[0]?.slice(0, 2) ?? "PR") + (words[1]?.slice(0, 1) ?? "");
  const type = String(productType || "prod").replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase();
  const suffix = String(Date.now()).slice(-4);
  return `${(type || "PRD").padEnd(3, "D")}-${head.padEnd(3, "X")}-${suffix}`;
}

function SkinIllustration({ type }: { type: SkinIconKey }) {
  const common = { width: 28, height: 28, viewBox: "0 0 24 24" as const, fill: "none" as const, "aria-hidden": true as const };
  switch (type) {
    case "normal":
      return (
        <svg {...common} className="text-current">
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "seca":
      return (
        <svg {...common} className="text-current">
          <path
            d="M12 4C9 8 7 10 7 13a5 5 0 0 0 10 0c0-3-2-5-5-9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M10 11l1.5 2L10 15l2 1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "oleosa":
      return (
        <svg {...common} className="text-current">
          <path
            d="M12 4C9 8 7 10 7 13a5 5 0 0 0 10 0c0-3-2-5-5-9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 7.5l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4.4-1.1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mista":
      return (
        <svg {...common} className="text-current">
          <path
            d="M12 4C9 8 7 10 7 13a5 5 0 0 0 10 0c0-3-2-5-5-9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 8V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9.5 12.5c.7-.8 1.7-.8 2.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "sensivel":
      return (
        <svg {...common} className="text-current">
          <path
            d="M12 4l6 2v5c0 4.2-2.5 6.8-6 9-3.5-2.2-6-4.8-6-9V6l6-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9.5 12.5c1.2-1.4 3.8-1.4 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "acneica":
      return (
        <svg {...common} className="text-current">
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
          <circle cx="14" cy="11.5" r="1" fill="currentColor" />
          <circle cx="11.5" cy="14.5" r="1" fill="currentColor" />
        </svg>
      );
    case "madura":
      return (
        <svg {...common} className="text-current">
          <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M9 10.5c1-.8 2-.8 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 13.5c1-.8 2-.8 3 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function CombinedDetailsStep({ form, setForm }: CombinedDetailsStepProps) {
  const { identity } = useTheme();
  
  const SECTION_CARD = identity === "modern"
    ? "rounded-xl border border-border/50 bg-[hsl(var(--card))] p-4 sm:p-5 shadow-sm"
    : "rounded-xl border border-border/50 bg-[hsl(28_22%_11%/0.4)] p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(245,184,65,0.06)]";
  const WIZARD_SEL = identity === "modern"
    ? "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(var(--background))] focus-visible:ring-0 focus-visible:ring-offset-0"
    : "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)] focus-visible:ring-0 focus-visible:ring-offset-0";
    
  const detailsTitle = identity === "modern" ? "Dados do produto" : "Detalhes do produto";
  const detailsSubtitle =
    identity === "modern"
      ? "Preencha os dados técnicos e comerciais necessários para organizar a venda."
      : "Monte a ficha aos poucos — sem precisar preencher tudo de uma vez.";
  const [differentials, setDifferentials] = useState<string[]>(
    (form.attributes as { diferenciais?: string[] }).diferenciais || [],
  );
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [lastTouchedColor, setLastTouchedColor] = useState<string | null>(null);
  /** Passo “Detalhes”: animações desligadas para reduzir peso do assistente. */
  const reduceMotion = true;
  const isClothingCategory = form.category === "Roupas";
  const isShoesCategory = form.category === "Calçados";
  const isGeneralPhysicalCategory = form.category === "Produtos físicos gerais";
  const isOtherImportantCategory = form.category === "Outros importantes";
  const utilitarianFamily = (form.attributes as { utilitarianFamily?: string }).utilitarianFamily;
  const maxDifferentials = isOtherImportantCategory ? 5 : 8;

  useEffect(() => {
    if (!isOtherImportantCategory) return;
    if (utilitarianFamily) return;
    if (form.productType !== "kit") return;
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, utilitarianFamily: "kit_combo" },
    }));
  }, [isOtherImportantCategory, form.productType, utilitarianFamily, setForm]);
  const colorSwatches: Record<string, string> = {
    Preto: "bg-black",
    Branco: "bg-white border border-gray-300",
    Cinza: "bg-gray-500",
    Marrom: "bg-amber-800",
    Azul: "bg-blue-500",
    Verde: "bg-green-500",
    Vermelho: "bg-red-500",
    Amarelo: "bg-yellow-400",
    Rosa: "bg-pink-400",
    Roxo: "bg-purple-500",
    Laranja: "bg-orange-500",
    Bege: "bg-stone-400",
    "Cáqui": "bg-cyan-500",
  };

  const updateAttribute = useCallback(
    (key: string, value: unknown) => {
      setForm((f) => ({
        ...f,
        attributes: { ...f.attributes, [key]: value },
      }));
    },
    [setForm],
  );
  const skuInterno = String((form.attributes as { skuInterno?: string }).skuInterno ?? "").trim();
  const ean = String((form.attributes as { ean?: string }).ean ?? "").trim();

  useEffect(() => {
    if (skuInterno) return;
    if (!form.name.trim()) return;
    const auto = generateSkuFromContext(form.name, form.productType);
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, skuInterno: auto },
    }));
  }, [skuInterno, form.name, form.productType, setForm]);

  const sizeMode = ((form.attributes as { tamanhoModo?: SizeMode }).tamanhoModo ?? "numerico") as SizeMode;
  const currentSizes = isClothingCategory
    ? (form.attributes as { tamanhos?: string[] }).tamanhos || []
    : isShoesCategory
      ? (form.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado || []
      : [];
  const currentColors = (form.attributes as { cores?: string[] }).cores || [];
  const currentGender = (form.attributes as { genero?: string }).genero || "";
  const currentMaterial = (form.attributes as { material?: string }).material || "";
  const currentBrand = (form.attributes as { marcaPersonalizada?: string }).marcaPersonalizada || "";
  const customSizes = (form.attributes as { tamanhosPersonalizados?: string[] }).tamanhosPersonalizados || [];
  const generalAttrs = form.attributes as {
    tiposCabeloIndicados?: string[];
    tiposPeleIndicados?: string[];
    indicadoParaPrincipal?: "cabelo" | "pele" | "ambos" | "";
    tipoAplicacao?: "cabelo" | "pele";
    tipoCabelo?: string;
  };
  const legacyArea = generalAttrs.tipoAplicacao ?? "";
  const legacyProfile = String(generalAttrs.tipoCabelo ?? "").trim();
  const selectedHairTypes =
    Array.isArray(generalAttrs.tiposCabeloIndicados) && generalAttrs.tiposCabeloIndicados.length
      ? generalAttrs.tiposCabeloIndicados
      : legacyArea === "cabelo" && legacyProfile
        ? [legacyProfile]
        : [];

  type HairGroup = "liso" | "ondulado" | "cacheado" | "crespo";
  const hairGroups: Record<HairGroup, { label: string; levels: string[] }> = {
    liso: { label: "Lisos", levels: ["1A", "1B", "1C"] },
    ondulado: { label: "Ondulados", levels: ["2A", "2B", "2C"] },
    cacheado: { label: "Cacheados", levels: ["3A", "3B", "3C"] },
    crespo: { label: "Crespos", levels: ["4A", "4B", "4C"] },
  };
  const deriveInitialHairGroup = (): HairGroup => {
    const first = selectedHairTypes[0];
    if (!first) return "liso";
    const found = (Object.entries(hairGroups) as Array<[HairGroup, { label: string; levels: string[] }]>).find(([, v]) =>
      v.levels.includes(first),
    );
    return found?.[0] ?? "liso";
  };

  const [activeHairGroup, setActiveHairGroup] = useState<HairGroup>(() => deriveInitialHairGroup());
  const [hairSkinOpen, setHairSkinOpen] = useState(false);
  const [generalTechExtraOpen, setGeneralTechExtraOpen] = useState(false);

  const HairIllustration = ({ group }: { group: HairGroup }) => {
    const stroke = "currentColor";
    if (group === "liso") {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
          <line x1="6" y1="4" x2="6" y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="4" x2="18" y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (group === "ondulado") {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
          <path
            d="M6 4C8 6 4 8 6 10C8 12 4 14 6 16C8 18 6 20 6 20"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 4C14 6 10 8 12 10C14 12 10 14 12 16C14 18 12 20 12 20"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 4C20 6 16 8 18 10C20 12 16 14 18 16C20 18 18 20 18 20"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    if (group === "cacheado") {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
          <path d="M6 6C6 4 10 4 10 6C10 8 6 8 6 10C6 12 10 12 10 14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M14 6C14 4 18 4 18 6C18 8 14 8 14 10C14 12 18 12 18 14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    // crespo
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-muted-foreground">
        <path d="M6 4C8 6 4 8 6 10C8 12 4 14 6 16C8 18 6 20 6 20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 4C14 6 10 8 12 10C14 12 10 14 12 16C14 18 12 20 12 20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M18 4C20 6 16 8 18 10C20 12 16 14 18 16C20 18 18 20 18 20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };
  const selectedSkinTypes =
    Array.isArray(generalAttrs.tiposPeleIndicados) && generalAttrs.tiposPeleIndicados.length
      ? generalAttrs.tiposPeleIndicados
      : legacyArea === "pele" && legacyProfile
        ? [legacyProfile]
        : [];
  const rendimentoValue = String((form.attributes as { rendimento?: string }).rendimento ?? "").trim();
  const problemaResolveValue = String((form.attributes as { problemaResolve?: string }).problemaResolve ?? "").trim();
  const autoOpenHairSkinDone = useRef(false);
  const autoOpenGeneralExtraDone = useRef(false);
  useEffect(() => {
    if (autoOpenHairSkinDone.current) return;
    if (selectedHairTypes.length > 0 || selectedSkinTypes.length > 0) {
      setHairSkinOpen(true);
    }
    autoOpenHairSkinDone.current = true;
  }, [selectedHairTypes, selectedSkinTypes]);
  useEffect(() => {
    if (autoOpenGeneralExtraDone.current) return;
    if (rendimentoValue || problemaResolveValue) {
      setGeneralTechExtraOpen(true);
    }
    autoOpenGeneralExtraDone.current = true;
  }, [rendimentoValue, problemaResolveValue]);
  const principalTypeRaw = generalAttrs.indicadoParaPrincipal ?? (legacyArea === "cabelo" || legacyArea === "pele" ? legacyArea : "");
  const principalType: "cabelo" | "pele" | "ambos" | "" =
    principalTypeRaw === "cabelo" || principalTypeRaw === "pele" || principalTypeRaw === "ambos" ? principalTypeRaw : "";
  const hairTypeChoices = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B", "4C"];
  const toggleGeneralSelect = (key: "tiposCabeloIndicados" | "tiposPeleIndicados", value: string) => {
    const current = ((form.attributes as Record<string, unknown>)[key] as string[] | undefined) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    updateAttribute(key, next);
  };

  const setPrincipal = (next: "cabelo" | "pele" | "ambos") => {
    if (next === "cabelo") {
      updateAttribute("indicadoParaPrincipal", "cabelo");
      updateAttribute("tiposPeleIndicados", []);
    } else if (next === "pele") {
      updateAttribute("indicadoParaPrincipal", "pele");
      updateAttribute("tiposCabeloIndicados", []);
    } else {
      updateAttribute("indicadoParaPrincipal", "ambos");
    }
  };
  const variantCount = currentSizes.length * Math.max(1, currentColors.length);
  const generatedVariants =
    currentSizes.length === 0
      ? []
      : (currentColors.length > 0
          ? currentSizes.flatMap((size) => currentColors.map((color) => ({ size, color })))
          : currentSizes.map((size) => ({ size, color: "Sem cor" })));

  const toggleSize = (size: string) => {
    setForm((f) => {
      if (isClothingCategory) {
        const current = (f.attributes as { tamanhos?: string[] }).tamanhos || [];
        const next = current.includes(size) ? current.filter((s) => s !== size) : [...current, size];
        return { ...f, attributes: { ...f.attributes, tamanhos: next, tamanho: next[0] ?? "" } };
      }
      if (isShoesCategory) {
        const current = (f.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado || [];
        const next = current.includes(size) ? current.filter((s) => s !== size) : [...current, size];
        return { ...f, attributes: { ...f.attributes, tamanhosCalcado: next, tamanhoCalcado: next[0] ?? "" } };
      }
      return f;
    });
  };
  const toggleColor = (color: string) =>
    setForm((f) => {
      const current = (f.attributes as { cores?: string[] }).cores || [];
      const next = current.includes(color) ? current.filter((c) => c !== color) : [...current, color];
      return { ...f, attributes: { ...f.attributes, cores: next, cor: next[0] ?? "" } };
    });

  const addCustomSize = () => {
    const value = customSizeInput.trim().toUpperCase();
    if (!value) return;
    if (customSizes.includes(value)) return;
    const next = [...customSizes, value];
    updateAttribute("tamanhosPersonalizados", next);
    if (isClothingCategory) updateAttribute("tamanhos", next);
    setCustomSizeInput("");
  };

  const addDifferential = useCallback(
    (differential: string) => {
      if (differentials.includes(differential)) return;
      if (differentials.length >= maxDifferentials) return;
      const next = [...differentials, differential];
      setDifferentials(next);
      updateAttribute("diferenciais", next);
    },
    [differentials, maxDifferentials, updateAttribute],
  );
  const removeDifferential = useCallback(
    (toRemove: string) => {
      const next = differentials.filter((d) => d !== toRemove);
      setDifferentials(next);
      updateAttribute("diferenciais", next);
    },
    [differentials, updateAttribute],
  );

  const sizeOptions = isShoesCategory
    ? SHOE_SIZE_OPTIONS
    : sizeMode === "numerico"
      ? NUMERIC_SIZES
      : sizeMode === "padrao"
        ? LETTER_SIZES
        : customSizes;
  const apparelSizesMissing = (isClothingCategory || isShoesCategory) && currentSizes.length === 0;

  return (
    <motion.div
      className="w-full space-y-6"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? false : { opacity: 1 }}
      transition={{ duration: 0.35, ease: WIZARD_EASE }}
    >
      <motion.header
        className="space-y-1 border-b border-border/40 pb-4"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: WIZARD_EASE }}
      >
        <h3 className="text-base font-semibold text-foreground tracking-tight">{detailsTitle}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{detailsSubtitle}</p>
      </motion.header>

      <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
        <h4 className={SECTION_HEAD}>Identificação</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cds-sku" className={SUBLABEL}>Código do produto (SKU/EAN)</Label>
            <Input
              id="cds-sku"
              name="skuInterno"
              value={skuInterno}
              onChange={(e) => updateAttribute("skuInterno", e.target.value)}
              placeholder="Ex.: BARB-TSR-001"
              className={WIZARD_IN}
            />
            <p className="text-[11px] text-muted-foreground">
              Opcional — ajuda no controle de estoque.
            </p>
            <div>
              <Button
                type="button"
                variant="outlineGold"
                size="sm"
                className="h-8 text-xs"
                onClick={() => updateAttribute("skuInterno", generateSkuFromContext(form.name, form.productType))}
              >
                Gerar SKU automático
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cds-ean" className={SUBLABEL}>EAN (opcional)</Label>
            <Input
              id="cds-ean"
              name="ean"
              value={ean}
              onChange={(e) => updateAttribute("ean", e.target.value.replace(/\D/g, ""))}
              placeholder="Ex.: 7891234567890"
              className={WIZARD_IN}
            />
            <p className="text-[11px] text-muted-foreground">Apenas números (8, 12 ou 13 dígitos).</p>
          </div>
        </div>
      </WizardSection>

      {(isClothingCategory || isShoesCategory) ? (
        <>
          <WizardSection className={cn(SECTION_CARD, "space-y-4 sm:space-y-5")}>
            <div className="space-y-1">
              <h4 className={SECTION_HEAD_STRONG}>Estrutura de venda</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Defina tamanhos e cores para criar variações do produto.
              </p>
            </div>

            {isClothingCategory ? (
              <div className="space-y-2">
                <Label className={SUBLABEL}>Tipo de tamanho</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "numerico", label: "Numerico (34-56)" },
                    { id: "padrao", label: "Padrao (P/M/G)" },
                    { id: "personalizado", label: "Personalizado" },
                  ].map((mode) => (
                    <motion.button
                      key={mode.id}
                      type="button"
                      onClick={() => updateAttribute("tamanhoModo", mode.id)}
                      whileHover={reduceMotion ? undefined : { scale: 1.04, y: -1 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      transition={{ duration: 0.18, ease: WIZARD_EASE }}
                      className={cn(
                        "text-xs rounded-lg border px-2.5 py-1.5",
                        sizeMode === mode.id
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode.label}
                    </motion.button>
                  ))}
                </div>
                {sizeMode === "personalizado" ? (
                  <div className="flex gap-2">
                    <Input
                      id="cds-custom-size"
                      name="customSize"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      placeholder="Adicionar tamanho (ex.: XGG)"
                      className={WIZARD_IN}
                    />
                    <Button type="button" size="sm" variant="outlineGold" onClick={addCustomSize}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label className={cn(SUBLABEL, apparelSizesMissing && "text-red-300/90")}>
                  {isClothingCategory ? "Tamanhos" : "Numeracao"} <span className="text-primary">*</span>
                </Label>
                <span
                  className={cn("text-[10px] font-medium", apparelSizesMissing ? "text-red-300" : "text-muted-foreground")}
                >
                  {apparelSizesMissing
                    ? "Obrigatorio — sem isso nao ha variacao para venda"
                    : `${currentSizes.length} selecionado(s)`}
                </span>
              </div>
              <motion.div
                className={cn(
                  "rounded-xl p-2.5 sm:p-3 max-h-[168px] overflow-y-auto",
                  apparelSizesMissing
                    ? "border-2 border-destructive/60 bg-destructive/[0.06] shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                    : "border-2 border-primary/40 bg-background/20",
                )}
                animate={apparelSizesMissing && !reduceMotion ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
                transition={{ duration: 0.4, ease: WIZARD_EASE }}
              >
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {sizeOptions.map((size) => {
                    const selected = currentSizes.includes(size);
                    return (
                      <motion.button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                        className={cn(
                          "inline-flex items-center justify-center gap-1 rounded-full border-2 font-bold tabular-nums transition-colors",
                          isShoesCategory
                            ? "min-h-[2.65rem] min-w-[2.65rem] px-3 text-sm"
                            : "min-h-9 min-w-[2.35rem] px-2.5 text-xs sm:min-h-10 sm:min-w-[2.55rem] sm:text-sm",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_0_22px_-4px_rgba(245,184,65,0.7),0_0_0_1px_rgba(245,184,65,0.35)]"
                            : "border-border/55 bg-background/30 text-muted-foreground hover:border-primary/45 hover:text-foreground",
                        )}
                      >
                        {selected ? <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
                        {size}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <div className="space-y-2 sm:opacity-90">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90">
                Cores na loja <span className="font-normal normal-case text-muted-foreground">(opcional)</span>
              </Label>
              <p className="text-[10px] text-muted-foreground/90">
                Selecione as cores disponiveis. Passe o mouse na bolinha para ver o nome.
              </p>
              <div className="rounded-lg border border-border/30 bg-background/10 p-2 sm:p-2.5">
                <div className="grid grid-cols-9 sm:grid-cols-11 gap-1.5 justify-items-center">
                  {COLOR_OPTIONS.map((color) => (
                    <motion.button
                      key={color}
                      type="button"
                      onClick={() => {
                        setLastTouchedColor(color);
                        toggleColor(color);
                      }}
                      title={color}
                      aria-label={color}
                      whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 460, damping: 24 }}
                      className={cn(
                        "relative h-5 w-5 sm:h-5 sm:w-5 rounded-full border-2",
                        colorSwatches[color] || "bg-gray-300",
                        currentColors.includes(color)
                          ? "border-primary ring-2 ring-primary/45 shadow-[0_0_10px_-2px_rgba(245,184,65,0.55)]"
                          : "border-border/40 opacity-85 hover:opacity-100 hover:border-primary/35",
                      )}
                    >
                      {currentColors.includes(color) ? (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Check
                            className="h-2.5 w-2.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                      ) : null}
                    </motion.button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground min-h-[1.1rem]">
                {currentColors.length > 0 ? (
                  <>
                    <span className="text-emerald-400/95 font-medium">Selecionadas:</span>{" "}
                    <span className="text-foreground">{currentColors.join(", ")}</span>
                  </>
                ) : lastTouchedColor ? (
                  <span>
                    Cor tocada: <span className="text-foreground font-medium">{lastTouchedColor}</span>
                    {" — "}
                    toque de novo para marcar ou desmarcar.
                  </span>
                ) : (
                  <span className="italic opacity-80">
                    Nenhuma cor — o cliente pode ver o produto como unicolor na vitrine.
                  </span>
                )}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2.5",
                apparelSizesMissing
                  ? "border-destructive/50 bg-destructive/10"
                  : "border-primary/25 bg-primary/5",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-semibold leading-snug flex gap-2 items-start",
                  apparelSizesMissing ? "text-red-100" : "text-primary/95",
                )}
              >
                <span className="text-base leading-none shrink-0" aria-hidden>
                  {apparelSizesMissing ? "⚠" : "✓"}
                </span>
                <span>
                  {currentSizes.length > 0
                    ? `Voce criou ${variantCount} variacao(oes) prontas para estoque e vitrine.`
                    : "Escolha ao menos uma numeracao acima. Sem tamanho, o assistente nao consegue gerar variacoes — e o fluxo avisa antes de continuar."}
                </span>
              </p>
            </div>

            {generatedVariants.length > 0 ? (
              <div className="space-y-2">
                <Label className={SUBLABEL}>Variacoes geradas</Label>
                <div className="rounded-lg border border-border/40 bg-background/10 overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border/40">
                    <span>Tamanho</span>
                    <span>Cor</span>
                    <span>Preco</span>
                    <span>Estoque</span>
                  </div>
                  <motion.div
                    className="max-h-40 overflow-y-auto"
                    initial={reduceMotion ? false : "hidden"}
                    animate={reduceMotion ? false : "visible"}
                    variants={
                      reduceMotion
                        ? undefined
                        : {
                            visible: { transition: { staggerChildren: 0.035 } },
                            hidden: {},
                          }
                    }
                  >
                    {generatedVariants.map((v, idx) => (
                      <motion.div
                        key={`${v.size}-${v.color}-${idx}`}
                        variants={
                          reduceMotion
                            ? undefined
                            : {
                                hidden: { opacity: 0, x: -6 },
                                visible: { opacity: 1, x: 0 },
                              }
                        }
                        className="grid grid-cols-4 gap-2 px-3 py-2 text-[11px] border-b border-border/20 last:border-0"
                      >
                        <span className="text-foreground tabular-nums">{v.size}</span>
                        <span className="text-foreground">{v.color}</span>
                        <span className="text-muted-foreground">R$ —</span>
                        <span className="text-muted-foreground">—</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            ) : null}
          </WizardSection>

          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <div className="space-y-1">
              <h4 className={SECTION_HEAD_STRONG}>Identidade do produto</h4>
              <p className="text-[11px] text-muted-foreground">Público e marca para organização da loja.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SUBLABEL}>Para quem e esse produto? (opcional)</Label>
                <Select value={currentGender} onValueChange={(v) => updateAttribute("genero", v)}>
                  <SelectTrigger className={WIZARD_SEL}>
                    <SelectValue placeholder="Ex.: masculino, feminino, infantil" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cds-brand-personalizada" className={SUBLABEL}>Marca do produto (opcional)</Label>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  Digite, escolha uma sugestao ou limpe para marca propria.
                </p>
                <div className="space-y-2">
                  <Input
                    id="cds-brand-personalizada"
                    name="marcaPersonalizada"
                    list="brand-suggestions"
                    value={currentBrand}
                    onChange={(e) => updateAttribute("marcaPersonalizada", e.target.value)}
                    placeholder="Ex.: Nike, Adidas, sua marca..."
                    className={WIZARD_IN}
                  />
                  <datalist id="brand-suggestions">
                    {BRAND_OPTIONS.map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {BRAND_OPTIONS.slice(0, 6).map((brand) => (
                      <Badge
                        key={brand}
                        variant={currentBrand === brand ? "default" : "outline"}
                        className="cursor-pointer text-[10px] border-primary/25"
                        onClick={() => updateAttribute("marcaPersonalizada", currentBrand === brand ? "" : brand)}
                      >
                        {brand}
                      </Badge>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outlineGold"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => updateAttribute("marcaPersonalizada", "")}
                    >
                      Limpar / criar marca
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </WizardSection>

          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <div className="space-y-1">
              <h4 className={SECTION_HEAD_STRONG}>Características</h4>
              <p className="text-[11px] text-muted-foreground">Material e diferenciais comerciais.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/85">
                Material <span className="font-normal normal-case">(opcional)</span>
              </Label>
              <div className="flex flex-wrap gap-1">
                {MATERIAL_OPTIONS.slice(0, 8).map((mat) => (
                  <Badge
                    key={mat}
                    variant={currentMaterial === mat ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer border-border/40 font-normal text-[10px] py-0 px-2 h-7",
                      currentMaterial === mat ? "border-primary/40" : "opacity-80 hover:opacity-100",
                    )}
                    onClick={() => updateAttribute("material", currentMaterial === mat ? "" : mat)}
                  >
                    {currentMaterial === mat ? "✓ " : ""}
                    {mat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-1 border-t border-border/35">
              <h5 className="text-xs font-semibold text-foreground">Destaque seu produto</h5>
              <p className="text-[10px] text-muted-foreground">
                Vantagem competitiva na vitrine — nao e so um campo extra.
              </p>
              {differentials.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {differentials.map((differential) => (
                    <motion.div
                      key={differential}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      animate={reduceMotion ? false : { opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    >
                      <Badge variant="default" className="flex items-center gap-1 text-xs font-medium">
                        {differential}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-300 shrink-0"
                          onClick={() => removeDifferential(differential)}
                        />
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              ) : null}
              <p className="text-[10px] text-muted-foreground">
                Sugestoes · selecionados: <span className="text-foreground font-medium">{differentials.length}</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {APPAREL_DIFFERENTIAL_OPTIONS.map((option) => (
                  <motion.div
                    key={option}
                    whileHover={reduceMotion ? undefined : { scale: 1.04, y: -1 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    transition={{ duration: 0.18, ease: WIZARD_EASE }}
                  >
                    <Badge
                      variant={differentials.includes(option) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-[10px] font-medium border-primary/25",
                        differentials.includes(option)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary hover:text-primary-foreground",
                      )}
                      onClick={() => (differentials.includes(option) ? removeDifferential(option) : addDifferential(option))}
                    >
                      {differentials.includes(option) ? "✓ " : "+ "}
                      {option}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </WizardSection>
        </>
      ) : (
        <>
          {isGeneralPhysicalCategory ? (
            <>
              <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
                <h4 className={SECTION_HEAD}>Estrutura do produto</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cds-generic-brand" className={SUBLABEL}>Marca *</Label>
                    <Input
                      id="cds-generic-brand"
                      name="genericBrand"
                      value={(form.attributes as { marcaPersonalizada?: string }).marcaPersonalizada || ""}
                      onChange={(e) => updateAttribute("marcaPersonalizada", e.target.value)}
                      placeholder="Ex.: L'Oreal, Wahl, etc"
                      className={WIZARD_IN}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={SUBLABEL}>Indicado para *</Label>
                    <Select
                      value={(form.attributes as { publicoAlvo?: string }).publicoAlvo || ""}
                      onValueChange={(value) => updateAttribute("publicoAlvo", value)}
                    >
                      <SelectTrigger className={WIZARD_SEL}>
                        <SelectValue placeholder="Ex.: Masculino, feminino, infantil" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_AUDIENCE_OPTIONS.map((audience) => (
                          <SelectItem key={audience} value={audience}>
                            {audience}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className={SUBLABEL}>Uso do produto (opcional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Uso profissional", "Uso pessoal", "Ambos"].map((usage) => (
                        <Badge
                          key={usage}
                          variant={(form.attributes as { usoProduto?: string }).usoProduto === usage ? "default" : "outline"}
                          className="cursor-pointer border-primary/25"
                          onClick={() =>
                            updateAttribute(
                              "usoProduto",
                              (form.attributes as { usoProduto?: string }).usoProduto === usage ? "" : usage,
                            )
                          }
                        >
                          {usage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={SUBLABEL}>Foco do produto</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "cabelo", label: "Cabelo" },
                      { id: "pele", label: "Pele" },
                      { id: "ambos", label: "Ambos" },
                    ].map((item) => (
                      <Badge
                        key={item.id}
                        variant={principalType === item.id ? "default" : "outline"}
                        className="cursor-pointer border-primary/25"
                        onClick={() => setPrincipal(item.id as "cabelo" | "pele" | "ambos")}
                      >
                        {item.label}
                      </Badge>
                    ))}
                  </div>
                  {selectedHairTypes.length || selectedSkinTypes.length ? (
                    <p className="text-[10px] text-muted-foreground">
                      Cabelo ({selectedHairTypes.length}) · Pele ({selectedSkinTypes.length})
                    </p>
                  ) : null}
                </div>

                <Collapsible open={hairSkinOpen} onOpenChange={setHairSkinOpen} className="space-y-2">
                  <CollapsibleTrigger
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/10 px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-background/15"
                  >
                    <span>Detalhar cabelo e pele (opcional)</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", hairSkinOpen && "rotate-180")}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {!principalType ? (
                      <p className="text-[11px] text-muted-foreground">Escolha o foco acima para usar os seletores.</p>
                    ) : null}
                    {(principalType === "cabelo" || principalType === "ambos") ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className={SUBLABEL}>Cabelo (1A a 4C)</Label>
                      <div className="rounded-lg border border-border/35 bg-background/15 p-2.5 space-y-3">
                      <p className="text-[10px] text-muted-foreground">
                        Primeiro escolha o grupo. Depois selecione 1 ou mais niveis para indicar o contexto do produto.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.entries(hairGroups) as Array<[HairGroup, { label: string; levels: string[] }]>).map(([key, cfg]) => {
                          const active = activeHairGroup === key;
                          return (
                            <motion.button
                              key={key}
                              type="button"
                              onClick={() => setActiveHairGroup(key)}
                              whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
                              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                              transition={{ type: "spring", stiffness: 400, damping: 26 }}
                              className={cn(
                                "rounded-lg border px-2 py-2 text-left",
                                active ? "border-primary bg-primary/15 text-primary shadow-[0_8px_24px_-12px_rgba(245,184,65,0.45)]" : "border-border/50 bg-background/10 text-muted-foreground hover:border-primary/35",
                              )}
                            >
                              <div className="flex flex-col items-start gap-1.5">
                                <motion.span
                                  className="inline-flex"
                                  animate={active && !reduceMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.45, ease: WIZARD_EASE }}
                                >
                                  <HairIllustration group={key} />
                                </motion.span>
                                <span className="text-[11px] font-semibold">{cfg.label}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold text-foreground/95">
                            Niveis de {hairGroups[activeHairGroup].label}
                          </p>
                          {hairGroups[activeHairGroup].levels.some((lvl) => selectedHairTypes.includes(lvl)) ? (
                            <p className="text-[10px] text-muted-foreground">
                              Selecionados:{" "}
                              {hairGroups[activeHairGroup].levels.filter((lvl) => selectedHairTypes.includes(lvl)).length}
                            </p>
                          ) : null}
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeHairGroup}
                            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                            animate={reduceMotion ? false : { opacity: 1, x: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, x: 10 }}
                            transition={{ duration: 0.22, ease: WIZARD_EASE }}
                            className="flex flex-wrap gap-1.5"
                          >
                            {hairGroups[activeHairGroup].levels.map((type, idx) => (
                              <motion.div
                                key={type}
                                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                                animate={reduceMotion ? false : { opacity: 1, scale: 1 }}
                                transition={{ delay: reduceMotion ? 0 : 0.03 * idx, ease: WIZARD_EASE }}
                              >
                                <Badge
                                  variant={selectedHairTypes.includes(type) ? "default" : "outline"}
                                  className="cursor-pointer justify-center border-primary/25"
                                  onClick={() => toggleGeneralSelect("tiposCabeloIndicados", type)}
                                >
                                  {type}
                                </Badge>
                              </motion.div>
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      </div>
                    </div>
                  ) : null}

                  {(principalType === "pele" || principalType === "ambos") ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className={SUBLABEL}>Pele</Label>
                      <div className="rounded-lg border border-border/35 bg-background/15 p-2.5 space-y-3">
                        <p className="text-[10px] text-muted-foreground">
                          Toque nos cards para selecionar um ou mais tipos. Icones em gotas e circulos diferenciam este bloco do
                          de cabelo.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {skinTypeChoices.map((type) => {
                            const active = selectedSkinTypes.includes(type.label);
                            return (
                              <motion.button
                                key={type.label}
                                type="button"
                                title={type.hint}
                                onClick={() => toggleGeneralSelect("tiposPeleIndicados", type.label)}
                                aria-pressed={active}
                                whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
                                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                                className={cn(
                                  "group flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center",
                                  active
                                    ? "border-primary bg-primary/15 text-primary shadow-[0_8px_24px_-12px_rgba(245,184,65,0.4)]"
                                    : "border-border/50 bg-background/10 text-muted-foreground hover:border-primary/35",
                                )}
                              >
                                <motion.div
                                  className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center",
                                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                                  )}
                                  animate={active && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                                  transition={{ duration: 0.4, ease: WIZARD_EASE }}
                                >
                                  <SkinIllustration type={type.iconKey} />
                                </motion.div>
                                <span className="text-[11px] font-semibold leading-tight">{type.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                        <div className="rounded-lg border border-border/35 bg-background/10 p-2">
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {skinTypeChoices.filter((s) => selectedSkinTypes.includes(s.label))
                              .slice(0, 2)
                              .map((s) => `${s.label}: ${s.hint}`)
                              .join(" | ") || "Selecione tipos de pele."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </WizardSection>
              <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
                <h4 className={SECTION_HEAD}>Formato do produto</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "liquido", label: "Liquido", icon: Droplets },
                    { value: "gel", label: "Gel", icon: FlaskConical },
                    { value: "spray", label: "Spray", icon: SprayCan },
                    { value: "solido", label: "Solido", icon: Package },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = form.productType === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, productType: item.value as ProductFormState["productType"] }))}
                        whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        transition={{ duration: 0.2, ease: WIZARD_EASE }}
                        className={cn(
                          "rounded-lg border px-2.5 py-2 text-left text-xs flex items-center gap-2",
                          active
                            ? "border-primary bg-primary/15 text-primary shadow-[0_6px_20px_-10px_rgba(245,184,65,0.35)]"
                            : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/35",
                        )}
                      >
                        <span className="inline-flex">
                          <Icon className="w-4 h-4 shrink-0" />
                        </span>
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </WizardSection>
              <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
                <h4 className={SECTION_HEAD}>Dados técnicos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cds-volume" className={SUBLABEL}>Volume (ml)</Label>
                    <Input
                      id="cds-volume"
                      name="volumeMl"
                      value={(form.attributes as { volume?: string }).volume || ""}
                      onChange={(e) => updateAttribute("volume", e.target.value)}
                      placeholder="Ex.: 100 ml"
                      className={WIZARD_IN}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cds-peso" className={SUBLABEL}>Peso (g)</Label>
                    <Input
                      id="cds-peso"
                      name="pesoGramas"
                      value={(form.attributes as { pesoLiquido?: string }).pesoLiquido || ""}
                      onChange={(e) => updateAttribute("pesoLiquido", e.target.value)}
                      placeholder="Ex.: 200 g"
                      className={WIZARD_IN}
                    />
                  </div>
                </div>
                <Collapsible open={generalTechExtraOpen} onOpenChange={setGeneralTechExtraOpen} className="space-y-2">
                  <CollapsibleTrigger
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/10 px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-background/15"
                  >
                    <span>Mais detalhes (opcional)</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        generalTechExtraOpen && "rotate-180",
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cds-rendimento" className={SUBLABEL}>Rendimento (opcional)</Label>
                        <Input
                          id="cds-rendimento"
                          name="rendimento"
                          value={(form.attributes as { rendimento?: string }).rendimento || ""}
                          onChange={(e) => updateAttribute("rendimento", e.target.value)}
                          placeholder="Ex.: ate 30 usos / dura 2 meses"
                          className={WIZARD_IN}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="cds-problema-resolve" className={SUBLABEL}>Problema que resolve (opcional)</Label>
                        <Input
                          id="cds-problema-resolve"
                          name="problemaResolve"
                          value={(form.attributes as { problemaResolve?: string }).problemaResolve || ""}
                          onChange={(e) => updateAttribute("problemaResolve", e.target.value)}
                          placeholder="Ex.: controla frizz, fixa penteado, hidrata barba"
                          className={WIZARD_IN}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <p className="text-[11px] text-muted-foreground">Marca, público e volume cobrem o essencial.</p>
              </WizardSection>
            </>
          ) : isOtherImportantCategory ? (
            <OutrosUtilitarianDetails form={form} setForm={setForm} />
          ) : (
            <>
              <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
                <h4 className={SECTION_HEAD}>Caracteristicas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cds-alt-brand" className={SUBLABEL}>Marca</Label>
                    <Input
                      id="cds-alt-brand"
                      name="altBrand"
                      value={(form.attributes as { marcaPersonalizada?: string }).marcaPersonalizada || ""}
                      onChange={(e) => updateAttribute("marcaPersonalizada", e.target.value)}
                      placeholder="Ou escrever sua marca..."
                      className={WIZARD_IN}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={SUBLABEL}>Indicado para</Label>
                    <Select
                      value={(form.attributes as { publicoAlvo?: string }).publicoAlvo || ""}
                      onValueChange={(value) => updateAttribute("publicoAlvo", value)}
                    >
                      <SelectTrigger className={WIZARD_SEL}>
                        <SelectValue placeholder="Selecione o publico" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_AUDIENCE_OPTIONS.map((audience) => (
                          <SelectItem key={audience} value={audience}>
                            {audience}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className={SUBLABEL}>Tipo de cabelo / pele</Label>
                    <Select
                      value={(form.attributes as { tipoCabelo?: string }).tipoCabelo || ""}
                      onValueChange={(value) => updateAttribute("tipoCabelo", value)}
                    >
                      <SelectTrigger className={WIZARD_SEL}>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </WizardSection>
              <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
                <h4 className={SECTION_HEAD}>Especificacoes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cds-alt-volume" className={SUBLABEL}>Volume</Label>
                    <Input
                      id="cds-alt-volume"
                      name="altVolume"
                      value={(form.attributes as { volume?: string }).volume || ""}
                      onChange={(e) => updateAttribute("volume", e.target.value)}
                      placeholder="Ex.: 100 ml"
                      className={WIZARD_IN}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cds-alt-peso" className={SUBLABEL}>Peso liquido</Label>
                    <Input
                      id="cds-alt-peso"
                      name="altPesoLiquido"
                      value={(form.attributes as { pesoLiquido?: string }).pesoLiquido || ""}
                      onChange={(e) => updateAttribute("pesoLiquido", e.target.value)}
                      placeholder="Ex.: 200 g"
                      className={WIZARD_IN}
                    />
                  </div>
                </div>
              </WizardSection>
            </>
          )}
        </>
      )}

      {!(isClothingCategory || isShoesCategory) ? (
        <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
          <h4 className={SECTION_HEAD}>
            {isGeneralPhysicalCategory || isOtherImportantCategory ? "Diferenciais que ajudam a vender" : "Diferenciais"}
          </h4>
          {differentials.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {differentials.map((differential) => (
                <motion.div
                  key={differential}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={reduceMotion ? false : { opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                >
                  <Badge variant="default" className="flex items-center gap-1 text-xs font-medium">
                    {differential}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-300 shrink-0" onClick={() => removeDifferential(differential)} />
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Sugestoes rapidas. Selecionados:{" "}
              <span className={cn("font-medium", differentials.length >= maxDifferentials ? "text-amber-300" : "text-foreground")}>
                {differentials.length}/{maxDifferentials}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(isOtherImportantCategory
                ? utilitarianFamily === "maquina"
                  ? UTIL_MACHINE_DIFF
                  : utilitarianFamily === "acessorio"
                    ? UTIL_ACCESSORY_DIFF
                    : utilitarianFamily === "pecas"
                      ? UTIL_PARTS_DIFF
                    : utilitarianFamily === "kit_combo"
                      ? UTIL_KIT_DIFF
                      : utilitarianFamily === "cosmetico"
                        ? DIFFERENTIAL_OPTIONS.slice(0, 8)
                        : []
                : DIFFERENTIAL_OPTIONS.slice(0, 8)
              ).map((option) => (
                <motion.div
                  key={option}
                  whileHover={reduceMotion ? undefined : { scale: 1.05, y: -1 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  transition={{ duration: 0.18, ease: WIZARD_EASE }}
                >
                  <Badge
                    variant={differentials.includes(option) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs font-medium border-primary/25",
                      differentials.includes(option)
                        ? "bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.6)]"
                        : "hover:bg-primary hover:text-primary-foreground",
                      !differentials.includes(option) && differentials.length >= maxDifferentials && "opacity-45 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                    )}
                    onClick={() => (differentials.includes(option) ? removeDifferential(option) : addDifferential(option))}
                  >
                    {differentials.includes(option) ? "✓ " : "+ "}
                    {option}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </WizardSection>
      ) : null}
    </motion.div>
  );
}
