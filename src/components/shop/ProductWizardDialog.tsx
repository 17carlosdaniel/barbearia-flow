import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Image as ImageIcon,
  Lightbulb,
  Package,
  Pencil,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getShopCouponsByBarbershop } from "@/lib/shopProducts";
import type { ShopCoupon } from "@/types/shop";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  currencyMask,
  formatBRL,
  formatMoneyInputFromNumber,
  MAX_BRL_VALUE,
  parsePriceInput,
  sanitizeMoneyInput,
  SUGGESTED_PRICE_EXPLANATION,
  suggestedSalePriceFromCost,
} from "@/lib/productPricing";
import {
  calcProfit,
  getPreviewAttributeLine,
  getTypeInsight,
  getTypeLabel,
} from "@/lib/storeProductFormHelpers";
import {
  CATEGORY_OPTIONS,
  EMPTY_ATTRIBUTES_BY_TYPE,
  getCategoryDisplayLabel,
  getDefaultProductForm,
  isWizardContentCategory,
  PRODUCT_TYPE_OPTIONS,
  PRODUCTS_WITH_SIZES,
  type ProductFormState,
} from "@/lib/storeProductWizardDefaults";
import { ProductWizardDynamicFields } from "@/components/shop/ProductWizardDynamicFields";
import { KitSummary, VariantStockGrid } from "@/components/shop/wizard";
import { CombinedDetailsStep } from "@/components/shop/wizard/CombinedDetailsStep";
import {
  ProductWizardContentStep,
  PRODUCT_WIZARD_GALLERY_INPUT_ID,
} from "@/components/shop/wizard/ProductWizardContentStep";
import { suggestProductTypeFromCategory } from "@/lib/productCategoryTypeHints";
import { mergeVariantsWithSizes, selectedSizesForProductType, sumVariantStock } from "@/lib/productWizardVariants";
import type { StoreAttributesKit, StoreProductType } from "@/types/store";

const DRAFT_KEY = (barbershopId: number) => `barberflow-store-product-draft-${barbershopId}`;

const WIZARD_VERSION = 3;

const WIZARD_STEPS_MODERN = [
  { id: 1, label: "Básico", subtitle: "Informações principais" },
  { id: 2, label: "Preço e margem", subtitle: "Precificação" },
  { id: 3, label: "Especificações", subtitle: "Dados do produto" },
  { id: 4, label: "Conteúdo", subtitle: "Apresentação" },
  { id: 5, label: "Estoque e vitrine", subtitle: "Publicação" },
  { id: 6, label: "Revisão", subtitle: "Revisão final" },
] as const;

const WIZARD_STEPS_VINTAGE = [
  { id: 1, label: "Essencial", subtitle: "A base do item" },
  { id: 2, label: "Preço", subtitle: "Valores e margem" },
  { id: 3, label: "Detalhes", subtitle: "Características" },
  { id: 4, label: "Exibição", subtitle: "Imagem e texto" },
  { id: 5, label: "Exposição e estoque", subtitle: "Vitrine e quantidades" },
  { id: 6, label: "Revisão", subtitle: "Conferir e publicar" },
] as const;

const STEP_BODY_HINTS_MODERN: Record<number, string> = {
  1: "Defina nome, categoria e tipo antes de configurar preço e detalhes.",
  2: "Defina custo, preço final e acompanhe a margem em tempo real.",
  3: "Preencha os dados técnicos e comerciais necessários para organizar a venda.",
  4: "Adicione imagens e descrições para exibir o produto com clareza na loja.",
  5: "Defina disponibilidade, exposição e regras de estoque antes de publicar.",
  6: "Confira os dados principais antes de publicar o produto na loja.",
};

const STEP_BODY_HINTS_VINTAGE: Record<number, string> = {
  1: "Monte a base: nome, categoria e tipo.",
  2: "Ajuste valores com calma — a margem aparece ao lado.",
  3: "Detalhes que definem a peça na vitrine.",
  4: "Imagem e texto como o cliente vai ver.",
  5: "Estoque e presença na loja.",
  6: "Última conferência antes de colocar no ar.",
};

const STEP4_TIPS_BY_TYPE: Partial<Record<StoreProductType, string>> = {
  roupa: "Produtos com variação de tamanho vendem mais quando o estoque por SKU está claro.",
  calca: "Produtos com variação de tamanho vendem mais quando o estoque por SKU está claro.",
  blusa: "Produtos com variação de tamanho vendem mais quando o estoque por SKU está claro.",
  moleton: "Produtos com variação de tamanho vendem mais quando o estoque por SKU está claro.",
  camisa: "Produtos com variação de tamanho vendem mais quando o estoque por SKU está claro.",
  calcado: "Informe quantidades por número para reduzir ruptura e dúvidas na vitrine.",
  sapato: "Informe quantidades por número para reduzir ruptura e dúvidas na vitrine.",
  tenis: "Informe quantidades por número para reduzir ruptura e dúvidas na vitrine.",
  kit: "Kits aumentam ticket médio — use o preço “separado” para mostrar economia.",
  barbearia: "Volume, uso e tipo de cabelo ajudam na busca e na decisão de compra.",
  liquido: "Volume e indicação reforçam confiança em shampoos e tratamentos.",
  acessorio: "Tipo de ferramenta e voltagem evitam retrabalho no balcão.",
};

const wizardInputClass =
  "product-wizard-input h-10 md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 transition-[box-shadow,border-color,transform] duration-200 placeholder:text-transparent";
const wizardInputTagsClass =
  "product-wizard-input h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 transition-[box-shadow,border-color,transform] duration-200 placeholder:text-muted-foreground/60 focus:placeholder:opacity-0";
const wizardSelectClass =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0 transition-[box-shadow,border-color] duration-200";

const normalizeCategoryText = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const canonicalCategory = (value: string) => {
  const n = normalizeCategoryText(value);
  if (n === "roupas") return "Roupas";
  if (n === "calcados") return "Calçados";
  if (n === "produtos fisicos gerais") return "Produtos físicos gerais";
  if (n === "outros importantes") return "Outros importantes";
  return CATEGORY_OPTIONS[0];
};

const getNormalizedDefaultForm = (): ProductFormState => {
  const base = getDefaultProductForm();
  const category = canonicalCategory(base.category);
  const suggestedType = suggestProductTypeFromCategory(category) ?? base.productType;
  return {
    ...base,
    category,
    productType: suggestedType,
    attributes: EMPTY_ATTRIBUTES_BY_TYPE[suggestedType],
    variants: [],
  };
};

const PRODUCT_IMAGE_MAX_W = 1400;
const PRODUCT_IMAGE_MAX_H = 1400;
const PRODUCT_IMAGE_QUALITY = 0.8;

const GALLERY_IMAGE_MAX_W = 1200;
const GALLERY_IMAGE_MAX_H = 1200;
const GALLERY_IMAGE_QUALITY = 0.72;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
    r.onerror = () => reject(new Error("Erro ao ler arquivo"));
    r.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = dataUrl;
  });

async function compressImageFile(file: File, maxW: number, maxH: number, quality: number): Promise<string> {
  const originalDataUrl = await fileToDataUrl(file);
  try {
    const img = await loadImageFromDataUrl(originalDataUrl);
    const ratio = Math.min(maxW / Math.max(1, img.width), maxH / Math.max(1, img.height), 1);
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return originalDataUrl;
  }
}

function cloneForm(f: ProductFormState): ProductFormState {
  return {
    ...f,
    galleryImageUrls: [...(f.galleryImageUrls ?? [])],
    attributes: JSON.parse(JSON.stringify(f.attributes)) as ProductFormState["attributes"],
    variants: (f.variants ?? []).map((v) => ({
      ...v,
      attrsKey: { ...v.attrsKey },
    })),
  };
}

export type ProductWizardSaveResult = { shopProductId?: string; productName: string };

export type ProductWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  barbershopId: number;
  seedForm: ProductFormState | null;
  editingShopId: string | null;
  onSave: (form: ProductFormState, editingShopId: string | null) => Promise<ProductWizardSaveResult>;
  onApplyOffer: (form: ProductFormState, shopProductId?: string) => Promise<void>;
};

export function ProductWizardDialog({
  open,
  onOpenChange,
  mode,
  barbershopId,
  seedForm,
  editingShopId,
  onSave,
  onApplyOffer,
}: ProductWizardDialogProps) {
  const { identity } = useTheme();
  const wizardSteps = identity === "modern" ? WIZARD_STEPS_MODERN : WIZARD_STEPS_VINTAGE;
  const stepBodyHints = identity === "modern" ? STEP_BODY_HINTS_MODERN : STEP_BODY_HINTS_VINTAGE;
  const reduceMotion = useReducedMotion();
  const stepEase = [0.22, 1, 0.36, 1] as const;
  /** Troca de etapa: só fade rápido (sem slide/scale — bem mais leve no modal). */
  const stepTransition = {
    duration: reduceMotion ? 0 : 0.14,
    ease: stepEase,
  };
  const stepVariants = {
    initial: () =>
      reduceMotion ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
    exit: () => (reduceMotion ? { opacity: 1 } : { opacity: 0 }),
  };
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [productNameFocused, setProductNameFocused] = useState(false);
  const [form, setForm] = useState<ProductFormState>(() => getNormalizedDefaultForm());
  const productNameLabelFloating = productNameFocused || form.name.trim().length > 0;
  const [success, setSuccess] = useState<null | ProductWizardSaveResult>(null);
  const [saving, setSaving] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [isKitMode, setIsKitMode] = useState(false);
  const [coverOptimizedHint, setCoverOptimizedHint] = useState(false);
  const [galleryOptimizedHint, setGalleryOptimizedHint] = useState(false);
  const lastFormRef = useRef<ProductFormState | null>(null);
  const draftToastShown = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para cupons
  const [availableCoupons, setAvailableCoupons] = useState<ShopCoupon[]>([]);
  const [acceptCoupons, setAcceptCoupons] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  // Carregar cupons disponíveis
  useEffect(() => {
    if (barbershopId) {
      setAvailableCoupons(getShopCouponsByBarbershop(barbershopId));
    }
  }, [barbershopId]);

  // Função para filtrar tipos de produtos com base na categoria
  const getFilteredProductTypes = () => {
    const normalizedCategory = normalizeCategoryText(form.category ?? "");

    if (normalizedCategory === "roupas") {
      return PRODUCT_TYPE_OPTIONS.filter(item => 
        ["camiseta", "camisa", "moleton", "calca", "shorts", "blusa", "jaqueta", "bone", "acessorio_roupa"].includes(item.value)
      );
    }
    if (normalizedCategory === "calcados") {
      return PRODUCT_TYPE_OPTIONS.filter(item => 
        ["tenis", "sapato", "chinelo", "bota"].includes(item.value)
      );
    }
    if (normalizedCategory === "produtos fisicos gerais") {
      return PRODUCT_TYPE_OPTIONS.filter(item => 
        ["liquido", "solido", "spray", "gel"].includes(item.value)
      );
    }
    if (normalizedCategory === "outros importantes") {
      return PRODUCT_TYPE_OPTIONS.filter(item => 
        ["kit", "gift", "personalizado", "assinatura"].includes(item.value)
      );
    }
    return PRODUCT_TYPE_OPTIONS;
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", variant: "destructive" });
      return;
    }
    void compressImageFile(file, PRODUCT_IMAGE_MAX_W, PRODUCT_IMAGE_MAX_H, PRODUCT_IMAGE_QUALITY).then((result) => {
      if (result) {
        setForm((f) => ({ ...f, imageUrl: result }));
        setCoverOptimizedHint(true);
      }
    });
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast({ title: "Selecione apenas imagens", variant: "destructive" });
      return;
    }
    const room = Math.max(0, 12 - (form.galleryImageUrls?.length ?? 0));
    if (room === 0) {
      toast({ title: "Galeria cheia", description: "Remova uma foto extra para adicionar outras (máx. 12).", variant: "destructive" });
      return;
    }
    const compressors = images
      .slice(0, room)
      .map((file) => compressImageFile(file, GALLERY_IMAGE_MAX_W, GALLERY_IMAGE_MAX_H, GALLERY_IMAGE_QUALITY));
    void Promise.all(compressors).then((urls) => {
      const next = urls.filter(Boolean);
      if (!next.length) return;
      setForm((f) => ({ ...f, galleryImageUrls: [...(f.galleryImageUrls ?? []), ...next] }));
      setGalleryOptimizedHint(true);
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setForm((f) => ({
      ...f,
      galleryImageUrls: (f.galleryImageUrls ?? []).filter((_, i) => i !== index),
    }));
  };

  const resetWizard = useCallback(() => {
    setStep(1);
    setDirection(1);
    setSuccess(null);
    setForm(getNormalizedDefaultForm());
    setStrategyOpen(false);
    setCoverOptimizedHint(false);
    setGalleryOptimizedHint(false);
    lastFormRef.current = null;
    draftToastShown.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    setSuccess(null);
    setStep(1);
    setDirection(1);
    draftToastShown.current = false;

    if (mode === "edit" && seedForm) {
      const f = cloneForm(seedForm);
      const rawCategory = f.category;
      const normalizedCategory = canonicalCategory(rawCategory);
      const nextType =
        normalizedCategory !== rawCategory
          ? suggestProductTypeFromCategory(normalizedCategory) ?? f.productType
          : f.productType;
      f.category = normalizedCategory;
      f.productType = nextType;
      if (normalizedCategory !== rawCategory) {
        f.attributes = EMPTY_ATTRIBUTES_BY_TYPE[nextType];
        f.variants = [];
      }
      const cp = parsePriceInput(f.costPrice);
      const sp = parsePriceInput(f.salePrice);
      if (Number.isFinite(cp)) f.costPrice = formatMoneyInputFromNumber(cp);
      if (Number.isFinite(sp)) f.salePrice = formatMoneyInputFromNumber(sp);
      setForm(f);
      return;
    }

    if (mode === "create") {
      try {
        const raw = localStorage.getItem(DRAFT_KEY(barbershopId));
        if (raw) {
          const parsed = JSON.parse(raw) as { form?: ProductFormState; step?: number };
          if (parsed?.form) {
            const rawCategory = parsed.form.category ?? "";
            const cat = canonicalCategory(rawCategory);
            const draftType = parsed.form.productType ?? "barbearia";
            const pt = rawCategory !== cat ? suggestProductTypeFromCategory(cat) ?? draftType : draftType;
            setForm({
              ...getNormalizedDefaultForm(),
              ...parsed.form,
              category: cat,
              productType: pt,
              attributes: rawCategory !== cat ? EMPTY_ATTRIBUTES_BY_TYPE[pt] : parsed.form.attributes ?? EMPTY_ATTRIBUTES_BY_TYPE[pt],
              variants: rawCategory !== cat ? [] : Array.isArray(parsed.form.variants) ? parsed.form.variants : [],
              persistedProductId: parsed.form.persistedProductId,
              galleryImageUrls: Array.isArray(parsed.form.galleryImageUrls) ? parsed.form.galleryImageUrls : [],
            });
            if (parsed.step && parsed.step >= 1 && parsed.step <= 6) {
              let s = parsed.step;
              const v = (parsed as { wizardVersion?: number }).wizardVersion;
              if (v !== WIZARD_VERSION && s >= 4) {
                s += 1;
              }
              setStep(Math.min(6, Math.max(1, s)));
            }
            if (!draftToastShown.current) {
              draftToastShown.current = true;
              toast({ title: "Rascunho recuperado", description: "Continuamos de onde você parou." });
            }
            return;
          }
        }
      } catch {
        /* ignore */
      }
      setForm(getNormalizedDefaultForm());
    }
  }, [open, mode, seedForm, barbershopId]);

  useEffect(() => {
    if (!open || mode !== "create") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(barbershopId), JSON.stringify({ form, step, wizardVersion: WIZARD_VERSION }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, step, open, mode, barbershopId]);

  // Auto-set kit mode based on product type
  useEffect(() => {
    setIsKitMode(form.productType === "kit");
  }, [form.productType]);

  const costNum = parsePriceInput(form.costPrice);
  const saleNum = parsePriceInput(form.salePrice);
  const { profit, margin, badge } = calcProfit(
    Number.isFinite(costNum) ? costNum : 0,
    Number.isFinite(saleNum) ? saleNum : 0,
  );
  const suggested = suggestedSalePriceFromCost(Number.isFinite(costNum) && costNum > 0 ? costNum : 0);

  /** Etapa Detalhes: roupa/calçado exige ao menos um tamanho antes de continuar. */
  const apparelStep3Blocked =
    step === 3 &&
    (form.category === "Roupas" || form.category === "Calçados") &&
    (form.category === "Roupas"
      ? ((form.attributes as { tamanhos?: string[] }).tamanhos ?? []).filter(Boolean).length === 0
      : ((form.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado ?? []).filter(Boolean).length === 0);

  const variantSizeKey = useMemo(() => selectedSizesForProductType(form).join("|"), [form]);

  useEffect(() => {
    if (step !== 6) return;
    if (!PRODUCTS_WITH_SIZES.includes(form.productType as any)) return;
    setForm((f) => ({ ...f, variants: mergeVariantsWithSizes(f) }));
  }, [step, variantSizeKey, form.productType]);

  const applySuggestedPrice = () => {
    if (suggested <= 0) return;
    setForm((f) => ({ ...f, salePrice: formatMoneyInputFromNumber(suggested) }));
    toast({ title: "Preço ajustado", description: `Sugestão aplicada: ${formatBRL(suggested)}` });
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!form.name.trim()) {
        toast({ title: "Nome obrigatório", description: "Informe o nome do produto.", variant: "destructive" });
        return false;
      }
      if (!form.category?.trim()) {
        toast({ title: "Categoria obrigatória", description: "Selecione a categoria do produto.", variant: "destructive" });
        return false;
      }
      if (!form.productType?.trim()) {
        toast({ title: "Tipo obrigatório", description: "Selecione o tipo de produto.", variant: "destructive" });
        return false;
      }
      return true;
    }
    if (s === 2) {
      const c = parsePriceInput(form.costPrice);
      const sa = parsePriceInput(form.salePrice);
      if (!Number.isFinite(c) || !Number.isFinite(sa)) {
        toast({
          title: "Preços inválidos",
          description: `Informe custo e venda válidos (até ${formatBRL(MAX_BRL_VALUE)}).`,
          variant: "destructive",
        });
        return false;
      }
      if (c < 0 || sa <= 0) {
        toast({
          title: "Preços obrigatórios",
          description: "Informe custo válido e preço de venda maior que zero.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    if (s === 3) {
      const attrsCommon = form.attributes as Record<string, unknown>;
      const ean = String(attrsCommon.ean ?? "").trim();
      if (ean && !/^(\d{8}|\d{12}|\d{13})$/.test(ean)) {
        toast({
          title: "EAN inválido",
          description: "Use apenas números com 8, 12 ou 13 dígitos.",
          variant: "destructive",
        });
        return false;
      }
      if (form.category === "Produtos físicos gerais") {
        const attrs = form.attributes as Record<string, unknown>;
        const brand = String(attrs.marcaPersonalizada ?? attrs.marca ?? "").trim();
        const audience = String(attrs.publicoAlvo ?? attrs.indicadoPara ?? "").trim();
        const volume = String(attrs.volume ?? "").trim();
        const weight = String(attrs.pesoLiquido ?? "").trim();
        if (!brand) {
          toast({ title: "Marca obrigatoria", description: "Informe a marca para continuar.", variant: "destructive" });
          return false;
        }
        if (!audience) {
          toast({ title: "Publico obrigatorio", description: "Informe para quem o produto e indicado.", variant: "destructive" });
          return false;
        }
        if (!volume && !weight) {
          toast({
            title: "Detalhe tecnico obrigatorio",
            description: "Informe ao menos volume ou peso para continuar.",
            variant: "destructive",
          });
          return false;
        }
      }
      if (form.category === "Roupas") {
        const sizes = ((form.attributes as { tamanhos?: string[] }).tamanhos ?? []).filter(Boolean);
        if (sizes.length === 0) {
          toast({ title: "Selecione tamanhos", description: "Para roupas, informe ao menos um tamanho.", variant: "destructive" });
          return false;
        }
      }
      if (form.category === "Calçados") {
        const sizes = ((form.attributes as { tamanhosCalcado?: string[] }).tamanhosCalcado ?? []).filter(Boolean);
        if (sizes.length === 0) {
          toast({ title: "Selecione numerações", description: "Para calçados, informe ao menos uma numeração.", variant: "destructive" });
          return false;
        }
      }
      if (form.category === "Outros importantes") {
        const a = form.attributes as Record<string, unknown>;
        const family = String(a.utilitarianFamily ?? "").trim();
        const marca = String(a.marcaPersonalizada ?? a.marca ?? "").trim();
        if (!family || !["maquina", "acessorio", "pecas"].includes(family)) {
          toast({
            title: "Tipo de produto obrigatório",
            description: "Selecione Máquina, Ferramentas ou Peças & reposição para continuar.",
            variant: "destructive",
          });
          return false;
        }
        if (!marca) {
          toast({ title: "Marca obrigatória", description: "Informe a marca para continuar.", variant: "destructive" });
          return false;
        }
        if (family === "maquina") {
          const pot = String(a.potenciaW ?? "").trim();
          const motor = String(a.tipoMotorUtil ?? "").trim();
          const aut = String(a.autonomiaBateriaMin ?? "").trim();
          const sem = a.semFio === true;
          if (!pot && !motor && !aut && !sem) {
            toast({
              title: "Especificação técnica",
              description: "Informe potência, tipo de motor, autonomia ou marque “sem fio”.",
              variant: "destructive",
            });
            return false;
          }
        }
        if (family === "acessorio") {
          const tipo = String(a.tipoAcessorioDetalhe ?? "").trim();
          const mats = Array.isArray(a.materialAcessorioDetalhes)
            ? (a.materialAcessorioDetalhes as string[]).filter(Boolean)
            : [];
          const mat = String(a.materialAcessorioDetalhe ?? "").trim();
          const tam = String(a.tamanhoAcessorio ?? "").trim();
          if (!tipo) {
            toast({
              title: "Ferramenta incompleta",
              description: "Selecione o tipo da ferramenta.",
              variant: "destructive",
            });
            return false;
          }
          if (mats.length === 0 && !mat) {
            toast({
              title: "Material obrigatório",
              description: "Selecione ao menos um material principal.",
              variant: "destructive",
            });
            return false;
          }
          if (tipo.toLowerCase().includes("tesoura") && !tam) {
            toast({
              title: "Tamanho obrigatório",
              description: "Para tesoura, informe o tamanho (ex.: 6\").",
              variant: "destructive",
            });
            return false;
          }
        }
        if (family === "cosmetico") {
          const vol = String(a.volume ?? "").trim();
          const peso = String(a.pesoLiquido ?? "").trim();
          if (!vol && !peso) {
            toast({
              title: "Volume ou peso",
              description: "Informe volume ou peso líquido do cosmético.",
              variant: "destructive",
            });
            return false;
          }
        }
        if (family === "pecas") {
          const tipo = String(a.tipoPecaReposicao ?? "").trim();
          const comp = String(a.compatibilidadePeca ?? "").trim();
          const mats = Array.isArray(a.materialAcessorioDetalhes) ? (a.materialAcessorioDetalhes as string[]).filter(Boolean) : [];
          const medida = String(a.medidaPeca ?? "").trim();
          const volume = String(a.volumeMlPeca ?? "").trim();
          if (!tipo) {
            toast({
              title: "Tipo de peça obrigatório",
              description: "Selecione o tipo da peça para continuar.",
              variant: "destructive",
            });
            return false;
          }
          if (!comp) {
            toast({
              title: "Compatibilidade obrigatória",
              description: "Informe com quais máquinas a peça é compatível.",
              variant: "destructive",
            });
            return false;
          }
          if (mats.length === 0) {
            toast({
              title: "Material obrigatório",
              description: "Selecione ao menos um material principal da peça.",
              variant: "destructive",
            });
            return false;
          }
          if (tipo === "oleo" && !volume) {
            toast({
              title: "Volume obrigatório",
              description: "Para óleo, informe o volume em ml.",
              variant: "destructive",
            });
            return false;
          }
          if (tipo !== "oleo" && !medida) {
            toast({
              title: "Medida obrigatória",
              description: "Informe tamanho/medida da peça (ex.: 1.5mm, #2).",
              variant: "destructive",
            });
            return false;
          }
        }
      }
      return true;
    }
    if (s === 4) {
      if (isWizardContentCategory(form.category)) {
        if (!form.imageUrl) {
          toast({
            title: "Imagem principal obrigatória",
            description: "Adicione a imagem principal para continuar.",
            variant: "destructive",
          });
          return false;
        }
        if (form.description.trim().length < 12) {
          toast({
            title: "Descrição obrigatória",
            description: "Escreva uma descrição com pelo menos 12 caracteres.",
            variant: "destructive",
          });
          return false;
        }
      }
      return true;
    }
    if (s === 5) {
      const st = Number(form.stock || "0");
      const mn = Number(form.minStock || "0");
      const stockMode = (form.attributes as { stockMode?: "single" | "variants" })?.stockMode ?? "single";
      if (!Number.isFinite(st) || st < 0 || !Number.isFinite(mn) || mn < 0) {
        toast({ title: "Estoque inválido", description: "Use números válidos.", variant: "destructive" });
        return false;
      }
      if (stockMode === "variants" && PRODUCTS_WITH_SIZES.includes(form.productType as any) && form.variants.length > 0) {
        const total = sumVariantStock(form.variants);
        if (!Number.isFinite(total) || total <= 0) {
          toast({
            title: "Estoque obrigatório",
            description: "Defina estoque maior que zero nas variações para continuar.",
            variant: "destructive",
          });
          return false;
        }
      } else if (!Number.isFinite(st) || st <= 0) {
        toast({
          title: "Estoque obrigatório",
          description: "Informe estoque atual maior que zero para continuar.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((prev) => Math.min(6, prev + 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY(barbershopId));
    } catch {
      /* ignore */
    }
  };

  const handleFinalize = async () => {
    for (let i = 1; i <= 5; i += 1) {
      if (!validateStep(i)) {
        setDirection(-1);
        setStep(i);
        return;
      }
    }

    const name = form.name.trim();
    const costPrice = parsePriceInput(form.costPrice);
    const salePrice = parsePriceInput(form.salePrice);
    if (!name || !Number.isFinite(costPrice) || !Number.isFinite(salePrice)) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: `Nome, custo e preço de venda são obrigatórios (até ${formatBRL(MAX_BRL_VALUE)}).`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      let toSave = cloneForm(form);
      const stockMode = (toSave.attributes as { stockMode?: "single" | "variants" })?.stockMode ?? "single";
      if (
        stockMode === "variants" &&
        PRODUCTS_WITH_SIZES.includes(toSave.productType as any) &&
        toSave.variants.length > 0
      ) {
        toSave = { ...toSave, stock: String(sumVariantStock(toSave.variants)) };
      }
      const result = await onSave(toSave, editingShopId);
      lastFormRef.current = cloneForm(toSave);
      clearDraft();
      if (mode === "create") {
        setSuccess(result);
      } else {
        toast({ title: "Produto atualizado", description: `${result.productName} foi salvo.` });
        onOpenChange(false);
        resetWizard();
      }
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnother = () => {
    resetWizard();
    setForm(getNormalizedDefaultForm());
  };

  const handleCreateOffer = async () => {
    const f = lastFormRef.current ?? form;
    const sid = success?.shopProductId;
    setOfferLoading(true);
    try {
      await onApplyOffer(f, sid);
      toast({ title: "Oferta aplicada", description: "Produto destacado com preço promocional." });
      onOpenChange(false);
      resetWizard();
    } catch {
      toast({ title: "Não foi possível aplicar a oferta", variant: "destructive" });
    } finally {
      setOfferLoading(false);
    }
  };

  const renderPreview = () => {
    const profitKey = reduceMotion ? "p" : `p-${profit.toFixed(2)}-m-${Math.round(margin)}`;
    const wellPositioned = margin >= 40;
    const lowMargin = margin < 40 && Number.isFinite(saleNum) && saleNum > 0;
    const highConversion = !!form.imageUrl && form.name.trim().length > 0;

    if (step === 1) {
      const previewKey = `${form.name}|${form.category}|${form.productType}|${form.imageUrl ? "1" : "0"}`;
      return (
        <div className="wizard-preview-showcase p-2.5 sm:p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/85">Vitrine</p>
            {acceptCoupons && selectedCoupons.length > 0 && (
              <span className="wizard-badge-pulse inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                <Tag className="w-3 h-3 shrink-0" />
                Com desconto disponível
              </span>
            )}
          </div>

          {/* Mais "banner" que pôster: menos altura que 16/10 */}
          <div 
            className="wizard-preview-well relative w-full aspect-[2.55/1] rounded-xl border overflow-hidden flex items-center justify-center shadow-inner cursor-pointer hover:border-primary/50 transition-colors"
            onClick={handleImageUpload}
          >
            {form.imageUrl ? (
              <>
                <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-2">
                    <Pencil className="w-4 h-4 text-gray-700" />
                  </div>
                </div>
              </>
            ) : (
              <Package className="relative z-[1] w-10 h-10 sm:w-11 sm:h-11 text-muted-foreground/75" />
            )}
          </div>

          <div key={previewKey} className="space-y-1.5">
            <p className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight truncate">
              {form.name.trim() || "Nome do produto"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {getCategoryDisplayLabel(form.category)} · {getTypeLabel(form.productType)}
              </p>
              {form.productType === "kit" ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Kit
                </span>
              ) : null}
            </div>
            <div className="pt-2 mt-0.5 border-t border-primary/15 space-y-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pronto para configurar
              </p>
            </div>
          </div>

          <p
            className={cn(
              "text-[11px] pt-1 cursor-pointer transition-colors",
              form.imageUrl ? "text-muted-foreground/90" : "text-muted-foreground hover:text-foreground/90",
            )}
            onClick={handleImageUpload}
          >
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              {form.imageUrl ? "Toque para trocar a foto de capa." : "Foto de capa fica para a etapa Conteúdo — pode adicionar aqui se quiser."}
            </span>
          </p>
        </div>
      );
    }
    if (step === 2) {
      const marginStrong = margin >= 40;
      const profitFinite = Number.isFinite(profit) && profit > 0 && Number.isFinite(saleNum) && saleNum > 0;
      const tenX = profit * 10;
      return (
        <div className="wizard-finance-hero wizard-intelligence-panel p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary/90">Simulador de lucro</p>
            <span
              className={cn(
                "wizard-margin-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
                marginStrong
                  ? "wizard-margin-badge--good border-emerald-500/45 bg-emerald-500/15 text-emerald-300"
                  : "wizard-margin-badge--warn border-amber-500/45 bg-amber-500/12 text-amber-200",
              )}
            >
              {marginStrong ? <Flame className="w-3 h-3 shrink-0" /> : <Sparkles className="w-3 h-3 shrink-0" />}
              {badge}
            </span>
          </div>

          <div className={cn(
            "rounded-xl border border-primary/20 px-4 py-4 shadow-[inset_0_1px_0_rgba(var(--primary)_0.08)]",
            identity === "modern" ? "bg-[hsl(var(--card))]" : "bg-[hsl(28_22%_11%/0.85)]"
          )}>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Lucro por venda</p>
            <p
              key={profitKey}
              className="mt-1 text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight break-all min-w-0"
            >
              {Number.isFinite(profit) ? formatBRL(profit) : "—"}
            </p>
          </div>

          <div className="wizard-stat-cell rounded-xl p-3 min-w-0">
            <p className="text-[11px] text-muted-foreground">Margem</p>
            <p
              key={profitKey}
              className={cn(
                "text-lg font-bold tabular-nums mt-0.5",
                marginStrong ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {Math.round(margin)}%
            </p>
            <p className={cn("text-xs mt-1 leading-snug", marginStrong ? "text-emerald-400/90" : "text-amber-300/95")}>
              {marginStrong ? "Margem saudável" : "Margem baixa"}
            </p>
            {profitFinite ? (
              <p className="text-[11px] text-muted-foreground mt-2">
                10 vendas ≈ <span className="text-foreground/90 font-medium tabular-nums">{formatBRL(tenX)}</span>
              </p>
            ) : null}
          </div>

          {margin < 40 && Number.isFinite(saleNum) && saleNum > 0 ? (
            <div className="rounded-lg border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/25 text-amber-200 text-[10px] font-bold">
                  !
                </span>
                Margem baixa — sugerir ajuste?
              </span>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs border-amber-500/40" onClick={applySuggestedPrice}>
                Aplicar sugestão
              </Button>
            </div>
          ) : null}
        </div>
      );
    }
    if (step === 3) {
      const attrs = form.attributes as Record<string, unknown>;
      const isClothing = form.category === "Roupas";
      const isShoes = form.category === "Calçados";
      const rawSizes = (isClothing ? attrs.tamanhos : isShoes ? attrs.tamanhosCalcado : []) as unknown;
      const sizeList = Array.isArray(rawSizes) ? (rawSizes as string[]) : [];
      const rawColors = attrs.cores as unknown;
      const colorList = Array.isArray(rawColors) ? (rawColors as string[]) : [];
      const gender = String(attrs.genero ?? "").trim();
      const material = String(attrs.material ?? "").trim();
      const marcaPers = String(attrs.marcaPersonalizada ?? "").trim();
      const marcaSel = String(attrs.marca ?? "").trim();
      const pub = String(attrs.publicoAlvo ?? "").trim();
      const tipoCabelo = String(attrs.tipoCabelo ?? "").trim();
      const tipoAplicacao = String(attrs.tipoAplicacao ?? "").trim();
      const tiposCabeloIndicados = Array.isArray(attrs.tiposCabeloIndicados)
        ? (attrs.tiposCabeloIndicados as string[])
        : tipoAplicacao === "cabelo" && tipoCabelo
          ? [tipoCabelo]
          : [];
      const tiposPeleIndicados = Array.isArray(attrs.tiposPeleIndicados)
        ? (attrs.tiposPeleIndicados as string[])
        : tipoAplicacao === "pele" && tipoCabelo
          ? [tipoCabelo]
          : [];
      const indicadoParaPrincipal = String(attrs.indicadoParaPrincipal ?? "").trim();
      const volume = String(attrs.volume ?? "").trim();
      const peso = String(attrs.pesoLiquido ?? "").trim();
      const usoProduto = String(attrs.usoProduto ?? "").trim();
      const skuInterno = String(attrs.skuInterno ?? "").trim();
      const ean = String(attrs.ean ?? "").trim();
      const codigoUniversal = String(attrs.codigoUniversal ?? "").trim();
      const rendimento = String(attrs.rendimento ?? "").trim();
      const problemaResolve = String(attrs.problemaResolve ?? "").trim();
      const rawDifs = attrs.diferenciais as unknown;
      const difList = Array.isArray(rawDifs) ? (rawDifs as string[]) : [];
      const isGeneralPhysical = form.category === "Produtos físicos gerais";
      const isOutrosUtil = form.category === "Outros importantes";
      const uFam = String(attrs.utilitarianFamily ?? "").trim();
      const potenciaWU = String(attrs.potenciaW ?? "").trim();
      const tipoMotorU = String(attrs.tipoMotorUtil ?? "").trim();
      const semFioU = attrs.semFio === true;
      const autonomiaU = String(attrs.autonomiaBateriaMin ?? "").trim();
      const tipoAccU = String(attrs.tipoAcessorioDetalhe ?? "").trim();
      const matAccU = String(attrs.materialAcessorioDetalhe ?? "").trim();
      const matsAccU = Array.isArray(attrs.materialAcessorioDetalhes)
        ? (attrs.materialAcessorioDetalhes as string[]).filter(Boolean)
        : [];
      const tamAccU = String(attrs.tamanhoAcessorio ?? "").trim();
      const tipoPecaU = String(attrs.tipoPecaReposicao ?? "").trim();
      const compPecaU = String(attrs.compatibilidadePeca ?? "").trim();
      const compPecaList = Array.isArray(attrs.compatibilidadePecaLista) ? (attrs.compatibilidadePecaLista as string[]) : [];
      const funcaoPecaU = String(attrs.funcaoPeca ?? "").trim();
      const medidaPecaU = String(attrs.medidaPeca ?? "").trim();
      const volumePecaU = String(attrs.volumeMlPeca ?? "").trim();
      const matSecPecaU = String(attrs.materialSecundarioPeca ?? "").trim();
      const usoBarb = String(attrs.usoIndicadoBarbearia ?? "").trim();
      const nivelU = String(attrs.nivelProdutoUtil ?? "").trim();
      const garU = String(attrs.garantiaMesesUtil ?? "").trim();
      const vidaU = String(attrs.vidaUtilEstimada ?? "").trim();
      const rawLinhasKit = attrs.linhasKit as unknown;
      const linhasKitCount = Array.isArray(rawLinhasKit)
        ? (rawLinhasKit as { nome?: string }[]).filter((r) => String(r?.nome ?? "").trim()).length
        : 0;
      const variantCount = sizeList.length * Math.max(1, colorList.length);
      const hasDetails =
        sizeList.length > 0 ||
        colorList.length > 0 ||
        gender ||
        material ||
        marcaPers ||
        marcaSel ||
        pub ||
        tipoCabelo ||
        tipoAplicacao ||
        tiposCabeloIndicados.length > 0 ||
        tiposPeleIndicados.length > 0 ||
        indicadoParaPrincipal ||
        volume ||
        peso ||
        usoProduto ||
        skuInterno ||
        ean ||
        codigoUniversal ||
        rendimento ||
        problemaResolve ||
        difList.length > 0 ||
        (isOutrosUtil &&
          (Boolean(uFam) ||
            Boolean(potenciaWU) ||
            Boolean(tipoMotorU) ||
            semFioU ||
            Boolean(autonomiaU) ||
            Boolean(tipoAccU) ||
            Boolean(matAccU) ||
            Boolean(tamAccU) ||
            Boolean(usoBarb) ||
            Boolean(nivelU) ||
            linhasKitCount > 0));

      const utilTaglineParts: string[] = [];
      if (isOutrosUtil && uFam === "maquina") {
        if (semFioU) utilTaglineParts.push("Sem fio");
        if (autonomiaU) utilTaglineParts.push(`${autonomiaU} min bateria`);
        if (tipoMotorU) utilTaglineParts.push(`Motor ${tipoMotorU === "magnetico" ? "magnético" : "rotativo"}`);
        if (potenciaWU) utilTaglineParts.push(`${potenciaWU} W`);
      } else if (isOutrosUtil && uFam === "acessorio") {
        if (tipoAccU) utilTaglineParts.push(tipoAccU);
        if (matsAccU.length > 0) utilTaglineParts.push(matsAccU.join(", "));
        else if (matAccU) utilTaglineParts.push(matAccU);
        if (tamAccU) utilTaglineParts.push(tamAccU);
      } else if (isOutrosUtil && uFam === "cosmetico") {
        if (volume) utilTaglineParts.push(`Vol. ${volume}`);
        if (peso) utilTaglineParts.push(`Peso ${peso}`);
        if (tipoCabelo) utilTaglineParts.push(tipoCabelo);
      } else if (isOutrosUtil && uFam === "pecas") {
        const compLine = compPecaList.length > 0 ? compPecaList.slice(0, 2).join(" / ") : compPecaU;
        if (compLine) utilTaglineParts.push(`Compatível com ${compLine}`);
        if (tipoPecaU) utilTaglineParts.push(tipoPecaU === "pente_encaixe" ? "Pente de encaixe" : tipoPecaU);
        if (volumePecaU) utilTaglineParts.push(`${volumePecaU} ml`);
        else if (medidaPecaU) utilTaglineParts.push(medidaPecaU);
        if (funcaoPecaU) utilTaglineParts.push(funcaoPecaU);
      } else if (isOutrosUtil && uFam === "kit_combo") {
        if (linhasKitCount > 0) utilTaglineParts.push(`${linhasKitCount} itens no kit`);
        const pSep = typeof attrs.precoItensSeparados === "number" ? Number(attrs.precoItensSeparados) : 0;
        if (pSep > 0) utilTaglineParts.push(`Ref. separado ${formatBRL(pSep)}`);
      }
      const utilUsoLine = (() => {
        if (!usoBarb) return "";
        if (usoBarb === "iniciante") return "Indicado para iniciante";
        if (usoBarb === "profissional") return "Uso profissional";
        if (usoBarb === "intenso") return "Barbearia / uso intenso";
        if (usoBarb === "domestico") return "Uso doméstico";
        return "";
      })();
      const utilNivelLine = (() => {
        if (!nivelU) return "";
        if (nivelU === "basico") return "Nível básico";
        if (nivelU === "intermediario") return "Nível intermediário";
        if (nivelU === "profissional") return "Nível profissional";
        return "";
      })();
      const utilFamilyLabel = (() => {
        if (uFam === "maquina") return "Máquina";
        if (uFam === "acessorio") return "Ferramentas";
        if (uFam === "pecas") return "Peças & reposição";
        if (uFam === "cosmetico") return "Cosmético";
        if (uFam === "kit_combo") return "Kit / combo";
        return "";
      })();
      const utilHeadline = (() => {
        if (!isOutrosUtil || uFam !== "acessorio") return form.name.trim() || "Nome do produto";
        const m = matsAccU[0] ?? matAccU;
        const level = nivelU === "profissional" ? "Profissional" : nivelU === "intermediario" ? "Intermediária" : "";
        return [tipoAccU, level, m].filter(Boolean).join(" ") || (form.name.trim() || "Nome do produto");
      })();
      const utilHeadlinePecas = (() => {
        if (!isOutrosUtil || uFam !== "pecas") return "";
        const level = nivelU === "profissional" ? "Profissional" : "";
        const tipoP = tipoPecaU === "pente_encaixe" ? "Pente de encaixe" : tipoPecaU;
        const matP = matsAccU[0] ?? matAccU;
        return [tipoP, matP, level].filter(Boolean).join(" ");
      })();
      const showProfessionalBadge =
        isOutrosUtil &&
        (nivelU === "profissional" ||
          usoBarb === "profissional" ||
          usoBarb === "intenso" ||
          matsAccU.some((m) => m.toLowerCase().includes("inox")) ||
          difList.some((d) => ["alta precisão", "precisao de corte", "profissional"].includes(String(d).toLowerCase())));

      const apparelCreatingParts: string[] = [];
      if (isClothing || isShoes) {
        apparelCreatingParts.push(getTypeLabel(form.productType));
        if (colorList[0]) apparelCreatingParts.push(colorList[0]);
        if (sizeList[0]) apparelCreatingParts.push(isClothing ? `Tam. ${sizeList[0]}` : `Num. ${sizeList[0]}`);
      }
      const apparelCreatingLine = apparelCreatingParts.join(" · ");

      const SummaryRow = ({ label, children }: { label: string; children: ReactNode }) => (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="text-sm text-foreground/95 leading-snug">{children}</div>
        </div>
      );

      return (
        <div className="wizard-intelligence-panel p-3 sm:p-3.5 space-y-2.5 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-2 shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">Resumo</p>
            <Package className="w-4 h-4 text-muted-foreground/70 shrink-0" aria-hidden />
          </div>

          <div className={cn(
            "rounded-xl border border-border/50 px-3 py-2.5 space-y-2 min-h-0 flex-1 flex flex-col",
            identity === "modern" ? "bg-[hsl(var(--muted))]" : "bg-[hsl(28_22%_11%/0.45)]"
          )}>
            <p className="text-xs font-semibold text-foreground border-b border-primary/10 pb-2 shrink-0 truncate" title={form.name}>
              {form.name.trim() || "Nome ainda não definido"}
            </p>
            <p className="text-[11px] text-muted-foreground shrink-0">
              {getCategoryDisplayLabel(form.category)} · {isOutrosUtil && utilFamilyLabel ? utilFamilyLabel : getTypeLabel(form.productType)}
            </p>

            {isOutrosUtil && uFam ? (
              <div className="rounded-lg border border-border/45 bg-background/20 p-2.5 space-y-1.5 shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Prévia</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2" title={form.name}>
                  {(uFam === "pecas" ? utilHeadlinePecas : utilHeadline) || form.name.trim() || "Nome do produto"}
                </p>
                {utilTaglineParts.length > 0 ? (
                  <p className="text-[12px] text-foreground/90 leading-snug">{utilTaglineParts.join(" · ")}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Preencha especificações à esquerda para gerar a linha técnica.</p>
                )}
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  {utilUsoLine ? <span className="text-primary/90 font-medium">{utilUsoLine}</span> : null}
                  {utilNivelLine ? <span>{utilNivelLine}</span> : null}
                  {uFam === "pecas" && matSecPecaU ? <span>Extra: {matSecPecaU}</span> : null}
                  {garU ? <span>Garantia: {garU}</span> : null}
                  {vidaU ? <span>Vida útil: {vidaU}</span> : null}
                </div>
                {showProfessionalBadge ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-400/45 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    🔥 Produto profissional
                  </span>
                ) : null}
                <p className="text-lg font-bold text-primary tabular-nums">
                  {Number.isFinite(saleNum) && saleNum > 0 ? formatBRL(saleNum) : "Preço (etapa 2)"}
                </p>
              </div>
            ) : null}

            {(isClothing || isShoes) ? (
              <div className="rounded-lg border border-border/45 bg-background/20 p-2.5 space-y-1.5 shrink-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Prévia</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-snug line-clamp-2" title={form.name}>
                  {form.name.trim() || "Nome do produto"}
                </p>
                <p className="text-lg font-bold text-primary tabular-nums">
                  {Number.isFinite(saleNum) && saleNum > 0 ? formatBRL(saleNum) : "Preço (etapa 2)"}
                </p>
                {sizeList.length > 0 ? (
                  <p className="text-[12px] text-foreground/95 leading-snug">
                    <span className="text-muted-foreground">Você está criando:</span>{" "}
                    <span className="font-semibold text-primary">{apparelCreatingLine}</span>
                    {sizeList.length > 1 || colorList.length > 1 ? (
                      <span className="text-muted-foreground font-normal"> — e mais variantes.</span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-[11px] text-red-300/95 font-medium leading-snug rounded-md border border-red-500/35 bg-red-500/10 px-2 py-1.5">
                    ⚠ Falta numeração: escolha ao menos um tamanho à esquerda para liberar variantes e continuar.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2 max-h-[min(260px,40vh)] overflow-y-auto overscroll-contain pr-1 -mr-1">
              {!hasDetails ? (
                <p className="text-[11px] text-muted-foreground/90 leading-relaxed py-1">
                  {isGeneralPhysical
                    ? "Marca, público e medidas completam a ficha."
                    : isClothing || isShoes
                      ? "O bloco acima mostra o essencial; detalhes abaixo quando precisar."
                      : isOutrosUtil
                        ? "Preencha o tipo e as especificações à esquerda."
                        : "Preencha à esquerda para ver o resumo."}
                </p>
              ) : (
                <>
                  {isGeneralPhysical ? (
                    <SummaryRow label="Falta algo?">
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {[!(marcaPers || marcaSel) && "marca", !pub && "público", !(volume || peso) && "volume ou peso"]
                          .filter(Boolean)
                          .join(" · ") || "Campos principais ok."}
                      </p>
                    </SummaryRow>
                  ) : null}
                  {(isClothing || isShoes) && sizeList.length > 0 ? (
                    <SummaryRow label="Status">
                      <span className="text-emerald-400">Produto com variacoes ({variantCount})</span>
                    </SummaryRow>
                  ) : null}
                  {(isClothing || isShoes) && sizeList.length > 0 ? (
                    <SummaryRow label="Resumo rapido">
                      <span>
                        {isClothing ? "Tamanhos" : "Numeros"}: {sizeList.join(", ")}
                        {colorList.length > 0 ? ` · Cores: ${colorList.join(", ")}` : ""}
                      </span>
                    </SummaryRow>
                  ) : null}

                  {(isClothing || isShoes) && sizeList.length > 0 ? (
                    <SummaryRow label={isClothing ? "Tamanhos" : "Números"}>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeList.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[11px] font-medium tabular-nums">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </SummaryRow>
                  ) : null}

                  {(isClothing || isShoes) && colorList.length > 0 ? (
                    <SummaryRow label="Cores">
                      <div className="flex flex-wrap gap-1.5">
                        {colorList.map((c) => (
                          <Badge key={c} variant="outline" className="text-[11px] font-medium border-primary/25">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </SummaryRow>
                  ) : null}

                  {(isClothing || isShoes) && gender ? (
                    <SummaryRow label="Indicado para">
                      <span>{gender}</span>
                    </SummaryRow>
                  ) : null}

                  {(isClothing || isShoes) && material ? (
                    <SummaryRow label="Material">
                      <span>{material}</span>
                    </SummaryRow>
                  ) : null}

                  {(isClothing || isShoes) && marcaPers ? (
                    <SummaryRow label="Marca">
                      <span>{marcaPers}</span>
                    </SummaryRow>
                  ) : null}

                  {!isClothing && !isShoes && (marcaSel || marcaPers) ? (
                    <SummaryRow label="Marca">
                      <span>{marcaPers || marcaSel}</span>
                    </SummaryRow>
                  ) : null}

                  {!isClothing && !isShoes && (skuInterno || ean) ? (
                    <SummaryRow label="Código">
                      <span>
                        {skuInterno ? `SKU ${skuInterno}` : ""}
                        {skuInterno && ean ? " · " : ""}
                        {ean ? `EAN ${ean}` : ""}
                      </span>
                    </SummaryRow>
                  ) : null}

                  {!isClothing && !isShoes && pub ? (
                    <SummaryRow label="Público-alvo">
                      <span>{pub}</span>
                    </SummaryRow>
                  ) : null}

                  {!isClothing && !isShoes && tipoAplicacao ? (
                    <SummaryRow label="Aplicacao">
                      <span>{tipoAplicacao === "pele" ? "Pele" : tipoAplicacao === "cabelo" ? "Cabelo" : tipoAplicacao}</span>
                    </SummaryRow>
                  ) : null}
                  {!isClothing && !isShoes && tiposCabeloIndicados.length > 0 ? (
                    <SummaryRow label="Indicado para (cabelo)">
                      <span>{tiposCabeloIndicados.join(", ")}</span>
                    </SummaryRow>
                  ) : null}
                  {!isClothing && !isShoes && tiposPeleIndicados.length > 0 ? (
                    <SummaryRow label="Indicado para (pele)">
                      <span>{tiposPeleIndicados.join(", ")}</span>
                    </SummaryRow>
                  ) : null}
                  {!isClothing && !isShoes && indicadoParaPrincipal ? (
                    <SummaryRow label="Principal">
                      <span>{indicadoParaPrincipal === "ambos" ? "Ambos" : indicadoParaPrincipal === "cabelo" ? "Cabelo" : "Pele"}</span>
                    </SummaryRow>
                  ) : null}

                  {!isClothing && !isShoes && (volume || peso) ? (
                    <SummaryRow label="Medidas">
                      <span>
                        {[volume && `Vol. ${volume}`, peso && `Peso ${peso}`].filter(Boolean).join(" · ")}
                      </span>
                    </SummaryRow>
                  ) : null}
                  {isGeneralPhysical && usoProduto ? (
                    <SummaryRow label="Uso">
                      <span>{usoProduto}</span>
                    </SummaryRow>
                  ) : null}
                  {isGeneralPhysical && rendimento ? (
                    <SummaryRow label="Rendimento">
                      <span>{rendimento}</span>
                    </SummaryRow>
                  ) : null}
                  {isGeneralPhysical && problemaResolve ? (
                    <SummaryRow label="Problema que resolve">
                      <span>{problemaResolve}</span>
                    </SummaryRow>
                  ) : null}
                  {isGeneralPhysical && codigoUniversal ? (
                    <SummaryRow label="Codigo">
                      <span className="tabular-nums">{codigoUniversal}</span>
                    </SummaryRow>
                  ) : null}

                  {difList.length > 0 ? (
                    <SummaryRow label="Diferenciais">
                      <div className="flex flex-wrap gap-1.5">
                        {difList.map((d) => (
                          <Badge key={d} className="text-[11px] font-medium bg-primary/15 text-primary border border-primary/25">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </SummaryRow>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (step === 4) {
      const attrs = form.attributes as Record<string, unknown>;
      const liq = form.productType === "liquido" || form.productType === "solido" || form.productType === "spray" || form.productType === "gel";
      const comp = liq ? String(attrs.ingredientes ?? "").trim() : String(attrs.composicao ?? "").trim();
      const desc = form.description.trim();
      const extra = (form.galleryImageUrls ?? []).length;
      return (
        <div className="wizard-intelligence-panel p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-primary/90">Conteúdo na vitrine</p>
            <ImageIcon className="w-5 h-5 text-primary/80 shrink-0" aria-hidden />
          </div>
          <div className={cn(
            "rounded-xl border border-border/60 p-3 space-y-3",
            identity === "modern" ? "bg-[hsl(var(--muted))]" : "bg-[hsl(28_22%_11%/0.55)]"
          )}>
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="relative aspect-[16/9] bg-background/20 flex items-center justify-center">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground/70" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground truncate">{form.name.trim() || "Nome do produto"}</p>
              <p className="text-[11px] text-muted-foreground">{form.category} · {getTypeLabel(form.productType)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                R$ —
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Em destaque
              </span>
              {extra > 0 ? (
                <span className="inline-flex items-center rounded-full border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{extra} foto(s) extra(s)
                </span>
              ) : null}
            </div>
            <div className="rounded-md border border-border/35 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed line-clamp-4">
              {desc || "Adicione uma descricao para a vitrine — e o texto que ajuda o cliente a decidir."}
            </div>
            {comp ? (
              <p className="text-[10px] text-muted-foreground border-t border-border/35 pt-2 line-clamp-3">
                {liq ? "Ingredientes" : "Composicao"}: {comp}
              </p>
            ) : null}
          </div>
        </div>
      );
    }
    if (step === 5) {
      const rawSt = String(form.stock ?? "").trim();
      const rawMn = String(form.minStock ?? "").trim();
      const stNum = rawSt === "" ? NaN : Number(rawSt);
      const mnNum = rawMn === "" ? NaN : Number(rawMn);
      const stOk = Number.isFinite(stNum) && stNum >= 0;
      const mnOk = Number.isFinite(mnNum) && mnNum >= 0;
      const minEffective = mnOk ? mnNum : 0;

      type StockHealth = "empty" | "below" | "at" | "above";
      let health: StockHealth = "empty";
      if (stOk && mnOk) {
        if (stNum < minEffective) health = "below";
        else if (stNum === minEffective) health = "at";
        else health = "above";
      } else if (stOk && !mnOk) {
        health = stNum > 0 ? "above" : "at";
      }

      const borderRing =
        health === "below"
          ? "border-red-500/35 shadow-[0_0_24px_rgba(239,68,68,0.12)]"
          : health === "at"
            ? "border-amber-500/35 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
            : health === "above"
              ? "border-emerald-500/30 shadow-[0_0_24px_rgba(34,197,94,0.1)]"
              : "border-primary/15";

      const pedidosCobertos = stOk ? Math.max(0, Math.floor(stNum)) : null;
      const vendasPorDia = 2;
      const diasCobertura =
        stOk && pedidosCobertos !== null && pedidosCobertos > 0
          ? Math.max(1, Math.ceil(pedidosCobertos / vendasPorDia))
          : null;

      return (
        <div className={cn("wizard-intelligence-panel p-3 sm:p-4 space-y-3 transition-[border-color,box-shadow] duration-300", borderRing)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/90">Estoque</p>
            {health === "above" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                Saudável
              </span>
            ) : health === "at" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                No limite
              </span>
            ) : health === "below" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/45 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Atenção
              </span>
            ) : null}
          </div>

          {!stOk && rawSt === "" ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Informe o <strong className="text-foreground">estoque atual</strong> para ver o status ao lado.
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-border/40 bg-background/15 px-2.5 py-2 space-y-1">
                {health === "below" ? (
                  <p className="text-xs font-medium text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Abaixo do mínimo — repor em breve.
                  </p>
                ) : health === "at" ? (
                  <p className="text-xs font-medium text-amber-200">No mínimo — planeje reposição.</p>
                ) : (
                  <p className="text-xs font-medium text-emerald-300/95 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Acima do mínimo.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">
                  Atual:{" "}
                  <strong className={cn("tabular-nums", health === "below" ? "text-red-300" : health === "at" ? "text-amber-300" : "text-primary")}>
                    {stOk ? stNum : "—"}
                  </strong>
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">
                  Mínimo: <strong className="tabular-nums text-foreground/90">{mnOk ? mnNum : "—"}</strong>
                </span>
              </div>

              {stOk && pedidosCobertos !== null && pedidosCobertos >= 0 ? (
                <p
                  key={`${stNum}-${mnNum}`}
                  className="text-[11px] text-muted-foreground leading-snug flex items-start gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    ~<strong className="text-foreground tabular-nums">{pedidosCobertos}</strong> pedidos de 1 un.
                    {diasCobertura !== null ? (
                      <>
                        {" "}
                        · ~<strong className="text-foreground tabular-nums">{diasCobertura}</strong>d a {vendasPorDia} un./dia
                      </>
                    ) : null}
                  </span>
                </p>
              ) : null}
            </>
          )}
        </div>
      );
    }
    if (step === 6) {
      const stockMode = (form.attributes as { stockMode?: "single" | "variants" })?.stockMode ?? "single";
      const hasName = form.name.trim().length > 0;
      const hasPrice = Number.isFinite(saleNum) && saleNum > 0;
      const hasImage = !!form.imageUrl;
      const stockTotal = stockMode === "variants" && PRODUCTS_WITH_SIZES.includes(form.productType as any) && form.variants.length > 0
        ? sumVariantStock(form.variants)
        : Number(form.stock || "0");
      const hasStock = Number.isFinite(stockTotal) && stockTotal > 0;

      const reviewReady = hasName && hasPrice && hasStock && hasImage;
      return (
      <div className="space-y-3">
        <div className="wizard-intelligence-panel p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Revisão final</p>
              <p className="text-sm text-foreground font-semibold">{identity === "modern" ? "Seu produto está pronto" : "Confira e publique"}</p>
            </div>
            {reviewReady ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/45 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 shrink-0">
                <Sparkles className="w-3 h-3 shrink-0" />
                Pronto para venda
              </span>
            ) : null}
          </div>
          <div className="flex gap-4">
            <div className="wizard-preview-well w-28 h-28 rounded-xl border border-primary/30 overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(245,184,65,0.12)]">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-lg text-foreground leading-snug truncate">{form.name || "Produto"}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {form.category} · {getTypeLabel(form.productType)}
              </p>
              <p className="text-primary font-bold text-xl mt-2 tabular-nums">{Number.isFinite(saleNum) ? formatBRL(saleNum) : "—"}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{getPreviewAttributeLine(form.productType, form.attributes)}</p>
              {form.productType === "kit" ? (
                <KitSummary kit={form.attributes as StoreAttributesKit} salePriceNum={Number.isFinite(saleNum) ? saleNum : 0} />
              ) : null}
              {stockMode === "variants" && PRODUCTS_WITH_SIZES.includes(form.productType as any) && form.variants.length > 0 ? (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Estoque (variações):{" "}
                  <span className="font-semibold text-foreground tabular-nums">{sumVariantStock(form.variants)}</span> un.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Estoque: <span className="font-semibold text-foreground tabular-nums">{Number(form.stock || "0")}</span> un.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-border/45 bg-background/20 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status do produto</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              <p className={cn("flex items-center gap-1.5", hasName ? "text-emerald-400" : "text-amber-300")}>
                {hasName ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                Nome definido
              </p>
              <p className={cn("flex items-center gap-1.5", hasPrice ? "text-emerald-400" : "text-amber-300")}>
                {hasPrice ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                Preço configurado
              </p>
              <p className={cn("flex items-center gap-1.5", hasImage ? "text-emerald-400" : "text-amber-300")}>
                {hasImage ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                Imagem adicionada
              </p>
              <p className={cn("flex items-center gap-1.5", hasStock ? "text-emerald-400" : "text-amber-300")}>
                {hasStock ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                Estoque definido
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-background/15 p-2.5 text-[11px] text-muted-foreground leading-snug">
            Com vitrine e destaque ativos, o item entra na loja conforme você definiu nas etapas anteriores.
          </div>

          {!hasStock ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sem estoque o produto não pode ser vendido. Ajuste na etapa anterior se precisar.</span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {wellPositioned ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold">
                {identity === "modern" ? "Boa posição na vitrine" : "Bem posicionado"}
              </span>
            ) : null}
            {lowMargin ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-amber-500/45 bg-amber-500/15 text-amber-300 font-semibold">
                Margem baixa
              </span>
            ) : null}
            {highConversion ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 font-semibold">
                <Flame className="w-3 h-3" /> Alta conversão esperada
              </span>
            ) : null}
          </div>
        </div>
        <div className="wizard-tip-panel p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground flex items-center gap-1 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Dica
          </p>
          <p>{getTypeInsight(form.productType, form.attributes)}</p>
          <p className="mt-1">Produtos com imagem e descricao clara tendem a converter mais.</p>
          {!form.imageUrl ? <p className="mt-2">Fotos reais aumentam a conversão.</p> : null}
        </div>
      </div>
      );
    }
    return null;
  };

  const renderStepForm = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="relative wizard-field-wrap rounded-md">
              <Input
                id="pw-product-name"
                name="productName"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onFocus={() => setProductNameFocused(true)}
                onBlur={() => setProductNameFocused(false)}
                placeholder="Ex: Pomada Matte Premium"
                autoComplete="off"
                className={cn(
                  "product-wizard-input md:text-sm placeholder:text-transparent focus-visible:ring-0 focus-visible:ring-offset-0 transition-[box-shadow,border-color] duration-200 relative z-0",
                  productNameLabelFloating ? "h-10 py-2" : "h-11 pt-5 pb-2",
                )}
              />
              <Label
                htmlFor="pw-product-name"
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-muted-foreground transition-opacity duration-200",
                  productNameLabelFloating ? "opacity-0 invisible" : "opacity-100 visible",
                )}
              >
                Nome do produto
              </Label>
            </div>
            <div className="wizard-field-wrap space-y-1.5 rounded-md">
              <Label htmlFor="pw-category" className="text-xs text-muted-foreground">
                Categoria
              </Label>
              <select
                id="pw-category"
                name="category"
                value={form.category}
                onChange={(e) => {
                  const nextCat = canonicalCategory(e.target.value);
                  setForm((f) => {
                    const suggested = suggestProductTypeFromCategory(nextCat);
                    
                    // Se mudar para categoria específica e o tipo atual não for válido, limpa o tipo
                    const shouldResetType = 
                      (nextCat === "Roupas" && !["camiseta", "camisa", "moleton", "calca", "shorts", "blusa", "jaqueta", "bone", "acessorio_roupa"].includes(f.productType)) ||
                      (nextCat === "Calçados" && !["tenis", "sapato", "chinelo", "bota"].includes(f.productType)) ||
                      (nextCat === "Produtos físicos gerais" && !["liquido", "solido", "spray", "gel"].includes(f.productType)) ||
                      (nextCat === "Outros importantes" && !["kit", "gift", "personalizado", "assinatura"].includes(f.productType));
                    
                    if (suggested && suggested !== f.productType) {
                      toast({
                        title: "Tipo sugerido",
                        description: `Ajustamos o tipo de produto com base em "${nextCat}". Você pode alterar manualmente.`,
                      });
                      return {
                        ...f,
                        category: nextCat,
                        productType: suggested,
                        attributes: EMPTY_ATTRIBUTES_BY_TYPE[suggested],
                        variants: [],
                      };
                    }
                    
                    let defaultType = f.productType;
                    let defaultAttrs = f.attributes;
                    
                    if (nextCat === "Roupas" && shouldResetType) {
                      defaultType = "camiseta";
                      defaultAttrs = EMPTY_ATTRIBUTES_BY_TYPE["camiseta"];
                    } else if (nextCat === "Calçados" && shouldResetType) {
                      defaultType = "tenis";
                      defaultAttrs = EMPTY_ATTRIBUTES_BY_TYPE["tenis"];
                    } else if (nextCat === "Produtos físicos gerais" && shouldResetType) {
                      defaultType = "liquido";
                      defaultAttrs = EMPTY_ATTRIBUTES_BY_TYPE["liquido"];
                    } else if (nextCat === "Outros importantes" && shouldResetType) {
                      defaultType = "kit";
                      defaultAttrs = EMPTY_ATTRIBUTES_BY_TYPE["kit"];
                    }
                    
                    return { 
                      ...f, 
                      category: nextCat,
                      productType: shouldResetType ? defaultType : f.productType,
                      attributes: shouldResetType ? defaultAttrs : f.attributes,
                      variants: shouldResetType ? [] : f.variants
                    };
                  });
                }}
                className={wizardSelectClass}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {getCategoryDisplayLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            {form.category !== "Produtos físicos gerais" ? (
              <div className="wizard-field-wrap space-y-1.5 rounded-md">
                <p className="text-xs text-muted-foreground">
                  Tipo de produto
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Escolha como o item será exibido e organizado na loja.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getFilteredProductTypes().map((item) => {
                    const active = form.productType === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            productType: item.value,
                            attributes: EMPTY_ATTRIBUTES_BY_TYPE[item.value],
                            variants: [],
                          }))
                        }
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border/60 bg-background/10 text-muted-foreground hover:border-primary/35 hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            {suggested > 0 ? (
              <div className="wizard-suggestion-hero rounded-xl border border-primary/35 bg-primary/[0.12] p-4 shadow-[0_0_32px_-8px_rgba(245,184,65,0.22)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/15">
                    <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Preço recomendado</p>
                      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatBRL(suggested)}</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">Baseado em produtos similares da categoria.</p>
                    <Button type="button" variant="gold" size="sm" className="mt-1 w-full sm:w-auto" onClick={applySuggestedPrice}>
                      Aplicar sugestão
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="wizard-field-wrap space-y-1.5 rounded-md">
                <Label htmlFor="pw-cost">Preço de custo</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="pw-cost"
                    name="costPrice"
                    value={form.costPrice}
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      setForm((f) => ({ ...f, costPrice: masked.formatted }));
                      if (masked.error) {
                        toast({ title: "Limite atingido", description: masked.error, variant: "destructive" });
                      }
                    }}
                    placeholder="0,00"
                    inputMode="numeric"
                    autoComplete="off"
                    className={cn(wizardInputClass, "pl-10 tabular-nums")}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Máx: {formatBRL(MAX_BRL_VALUE)}</p>
              </div>
              <div className="wizard-field-wrap space-y-1.5 rounded-md">
                <Label htmlFor="pw-sale">Preço de venda</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="pw-sale"
                    name="salePrice"
                    value={form.salePrice}
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      setForm((f) => ({ ...f, salePrice: masked.formatted }));
                      if (masked.error) {
                        toast({ title: "Limite atingido", description: masked.error, variant: "destructive" });
                      }
                    }}
                    placeholder="0,00"
                    inputMode="numeric"
                    autoComplete="off"
                    className={cn(wizardInputClass, "pl-10 tabular-nums")}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Máx: {formatBRL(MAX_BRL_VALUE)}</p>
              </div>
            </div>

            {/* Bloco de Promoções e Cupons */}
            <div className="wizard-intelligence-panel p-4 space-y-4 border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Promoções e Cupons</p>
                </div>
                <Switch
                  checked={acceptCoupons}
                  onCheckedChange={setAcceptCoupons}
                />
              </div>

              {acceptCoupons ? (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      Cupons ajudam a aumentar conversão em até <strong className="text-foreground">35%</strong>
                    </p>

                    {availableCoupons.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Cupons disponíveis</p>
                        <div className="grid grid-cols-1 gap-2">
                          {availableCoupons.filter(c => c.active).map((coupon) => (
                            <div
                              key={coupon.code}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all",
                                selectedCoupons.includes(coupon.code)
                                  ? "border-primary/50 bg-primary/10"
                                  : "border-border/60 hover:border-primary/30 hover:bg-primary/5"
                              )}
                              onClick={() => {
                                setSelectedCoupons(prev => 
                                  prev.includes(coupon.code)
                                    ? prev.filter(c => c !== coupon.code)
                                    : [...prev, coupon.code]
                                );
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {coupon.code}
                                </Badge>
                                <span className="text-xs font-medium">
                                  {coupon.discountType === "percentual" ? `${coupon.discount}%` : formatBRL(coupon.discount)}
                                </span>
                              </div>
                              {selectedCoupons.includes(coupon.code) && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhum cupom disponível. Crie cupons na gestão da loja.
                      </p>
                    )}
                </div>
              ) : null}
            </div>
          </div>
        );
      case 3:
        return <CombinedDetailsStep form={form} setForm={setForm} />;
      case 4:
        return (
          <ProductWizardContentStep
            form={form}
            setForm={setForm}
            onPickCover={handleImageUpload}
            onRemoveGallery={handleRemoveGalleryImage}
            coverOptimizedHint={coverOptimizedHint}
            galleryOptimizedHint={galleryOptimizedHint}
          />
        );
      case 5:
        return (
          <div className="space-y-6">
            {/* 🟨 BLOCO 1 — Controle de estoque (principal) */}
            <section className={cn(
              "rounded-xl border-2 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(var(--primary)_0.1)] space-y-5",
              identity === "modern" 
                ? "border-primary/25 bg-[hsl(var(--background))]" 
                : "border-primary/25 bg-[hsl(28_22%_11%/0.5)]"
            )}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/15 text-lg font-bold text-primary">
                  1
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{identity === "modern" ? "Controle de estoque" : "Controle de estoque"}</h3>
                  <p className="text-sm text-primary/80">{identity === "modern" ? "Defina disponibilidade e regras de estoque" : "Defina seu estoque para evitar perder vendas"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pw-stock-current" className="text-sm font-medium">Estoque atual</Label>
                  <Input
                    id="pw-stock-current"
                    name="stockCurrent"
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="Ex.: 10 unidades"
                    className={wizardInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-stock-min" className="text-sm font-medium">Estoque mínimo</Label>
                  <Input
                    id="pw-stock-min"
                    name="stockMin"
                    type="number"
                    min={0}
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                    placeholder="Ex.: 3"
                    className={wizardInputClass}
                  />
                </div>
              </div>

              {/* Card inteligente de estoque integrado */}
              {(form.stock || form.minStock) ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">Status do estoque</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Atual: </span>
                      <span className="font-semibold tabular-nums">{form.stock || "0"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mínimo: </span>
                      <span className="font-semibold tabular-nums">{form.minStock || "3"}</span>
                    </div>
                  </div>
                  {Number(form.stock) < Number(form.minStock || 3) && (
                    <div className="flex items-center gap-2 text-amber-500 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{identity === "modern" ? "Estoque baixo - repor recomendado" : "Abaixo do ideal - considere repor"}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {/* 🟨 BLOCO 2 — Kits / Combos (condicional) */}
            <section className={cn(
              "rounded-xl border border-border/55 p-5 sm:p-5 shadow-[inset_0_1px_0_rgba(var(--primary)_0.05)] space-y-4",
              identity === "modern" ? "bg-[hsl(var(--card))]" : "bg-[hsl(28_22%_11%/0.42)]"
            )}>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-sm font-bold text-foreground">
                  2
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h4 className="text-base font-semibold text-foreground tracking-tight">Kits / Combos</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="pw-is-kit"
                      checked={isKitMode}
                      onCheckedChange={setIsKitMode}
                    />
                    <Label htmlFor="pw-is-kit" className="text-sm text-muted-foreground cursor-pointer">
                      Este produto é um kit / combo
                    </Label>
                  </div>
                </div>
              </div>

              {isKitMode ? (
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <ProductWizardDynamicFields form={form} setForm={setForm} barbershopId={barbershopId} />
                  {STEP4_TIPS_BY_TYPE["kit"] ? (
                    <p className="text-[11px] text-primary/85 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {STEP4_TIPS_BY_TYPE["kit"]}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            {/* BLOCO 3 — Estratégia de venda (leve) */}
            <section className="rounded-xl border border-border/30 p-4 sm:p-4 opacity-[0.98] space-y-4">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/35 bg-muted/20 text-xs font-semibold text-muted-foreground">
                  3
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{identity === "modern" ? "Exposição na loja" : "Exposição na loja (opcional)"}</h4>
                  <p className="text-[10px] text-muted-foreground/90">{identity === "modern" ? "Defina visibilidade e status do produto" : "Tags, vitrine e destaques para aumentar visibilidade"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pw-tags" className="text-xs font-medium text-foreground/90">Tags</Label>
                  <Input 
                    id="pw-tags"
                    name="tags"
                    value={form.tags} 
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} 
                    placeholder="novo, oferta, promocao" 
                    className={wizardInputTagsClass} 
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {identity === "modern" ? "Status do produto" : "Exposição rápida"}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg border border-border/60 bg-background/10 px-2.5 py-2 min-h-0 min-w-0 overflow-hidden space-y-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <Label htmlFor="pw-available-in-shop" className="cursor-pointer text-[13px] font-medium leading-tight shrink min-w-0">Vitrine</Label>
                        <Switch id="pw-available-in-shop" className="scale-[0.88] origin-right shrink-0" checked={form.availableInShop} onCheckedChange={(c) => setForm((f) => ({ ...f, availableInShop: !!c }))} />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug break-words">Aparece na loja para compra.</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/10 px-2.5 py-2 min-h-0 min-w-0 overflow-hidden space-y-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <Label htmlFor="pw-featured" className="cursor-pointer text-[13px] font-medium leading-tight shrink min-w-0">Destacar</Label>
                        <Switch id="pw-featured" className="scale-[0.88] origin-right shrink-0" checked={form.featured} onCheckedChange={(c) => setForm((f) => ({ ...f, featured: !!c }))} />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug break-words">Recebe mais destaque visual.</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/10 px-2.5 py-2 min-h-0 min-w-0 overflow-hidden space-y-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <Label htmlFor="pw-active" className="cursor-pointer text-[13px] font-medium leading-tight shrink min-w-0">Ativo</Label>
                        <Switch id="pw-active" className="scale-[0.88] origin-right shrink-0" checked={form.active} onCheckedChange={(c) => setForm((f) => ({ ...f, active: !!c }))} />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug break-words">Controla se o item fica liberado.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Atributos dinâmicos para produtos não-kit */}
            {!isKitMode && (
              <div className="wizard-intelligence-panel p-3 space-y-2">
                <p className="text-xs font-semibold text-primary">Atributos · {getTypeLabel(form.productType)}</p>
                <ProductWizardDynamicFields form={form} setForm={setForm} barbershopId={barbershopId} />
                {STEP4_TIPS_BY_TYPE[form.productType] ? (
                  <p className="text-[11px] text-primary/85 flex items-start gap-1.5 pt-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {STEP4_TIPS_BY_TYPE[form.productType]}
                  </p>
                ) : null}
                <VariantStockGrid form={form} setForm={setForm} />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const title = editingShopId 
    ? "Editar produto" 
    : (identity === "modern" ? "Cadastro de produto" : "Novo produto");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetWizard();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="product-wizard !bg-transparent sm:max-w-5xl w-[min(100vw-1.5rem,56rem)] max-h-[92vh] overflow-y-auto border shadow-2xl">
        {/* Input de arquivo permanente para upload de imagem */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          id={PRODUCT_WIZARD_GALLERY_INPUT_ID}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryFileChange}
        />
        <DialogHeader>
          <DialogTitle className={cn("text-xl sm:text-2xl font-semibold", identity === "modern" && "text-primary")}>
            {success && mode === "create" ? (
              <span className="inline-flex items-center justify-center gap-2 flex-wrap">
                <Sparkles className="w-6 h-6 text-primary shrink-0" aria-hidden />
                Produto criado com sucesso
              </span>
            ) : (
              title
            )}
          </DialogTitle>
          {!success ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Passo <span className="font-semibold text-foreground tabular-nums">{step}</span> de 6
                </span>
                <span className="tabular-nums text-primary/90 font-medium">{Math.round((step / 6) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden border border-border/40">
                <div
                  className={cn("h-full transition-[width] duration-150 ease-out rounded-full", identity === "modern" ? "bg-primary" : "bg-primary")}
                  style={{ width: `${(step / 6) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </DialogHeader>

        {success && mode === "create" ? (
          <div
            key="wizard-success"
            className="relative py-6 sm:py-8 px-1 sm:px-2 text-center space-y-5 overflow-hidden rounded-xl min-h-[min(520px,70vh)] flex flex-col justify-center"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_80%_70%_at_50%_0%,rgba(34,197,94,0.14),transparent_65%)]"
              aria-hidden
            />
            <div className="relative mx-auto flex justify-center">
              <div
                className="absolute inset-0 m-auto h-28 w-28 rounded-full bg-emerald-500/25 blur-2xl"
                aria-hidden
              />
              <div className="relative rounded-full ring-2 ring-emerald-400/30">
                <CheckCircle2
                  className="relative h-20 w-20 sm:h-24 sm:w-24 text-emerald-400 drop-shadow-[0_0_24px_rgba(34,197,94,0.45)]"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
            </div>

            <div className="relative space-y-2 max-w-lg mx-auto">
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Seu produto está no ar</p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Agora é só começar a vender. Seu produto já pode aparecer na sua loja e os clientes já podem comprá-lo.
              </p>
            </div>

            <div className={cn(
              "relative max-w-md mx-auto rounded-xl border border-primary/20 px-4 py-3 text-left shadow-inner",
              identity === "modern" ? "bg-[hsl(var(--muted))]" : "bg-[hsl(28_22%_11%/0.75)]"
            )}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome do produto</p>
              <p className="text-lg font-semibold text-foreground truncate mt-0.5" title={success.productName}>
                {success.productName?.trim() || "Produto"}
              </p>
            </div>

            <div className="relative space-y-1 max-w-md mx-auto">
              <p className="text-sm font-medium text-foreground">Quer aumentar suas vendas?</p>
              <p className="text-xs text-primary/90">Crie uma oferta para esse produto — destaque preço e chame mais atenção.</p>
            </div>

            <div className="relative flex flex-col gap-2.5 max-w-md mx-auto pt-1 w-full">
              <Button
                type="button"
                variant="goldHero"
                size="lg"
                className="w-full gap-2 font-semibold shadow-lg"
                disabled={offerLoading}
                onClick={() => void handleCreateOffer()}
              >
                {offerLoading ? (
                  "Aplicando…"
                ) : (
                  <>
                    <Flame className="w-4 h-4 shrink-0" />
                    Criar oferta
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full border-primary/35" onClick={handleCreateAnother}>
                + Adicionar outro produto
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onOpenChange(false);
                  resetWizard();
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar para loja
              </Button>
            </div>

            <p className="relative text-[11px] text-muted-foreground max-w-md mx-auto pt-2 border-t border-border/50 leading-relaxed">
              <span className="font-medium text-foreground/90">Dica: </span>
              produtos com oferta costumam vender bem mais — experimente destacar este item.
            </p>
          </div>
        ) : (
          <div className="wizard-dialog-fixed-body flex min-h-[min(480px,68vh)] flex-col">
            <nav
                className="grid grid-cols-6 gap-1.5 sm:gap-2 py-3 border-b border-[rgba(245,184,65,0.14)] items-stretch"
                aria-label="Etapas do cadastro de produto"
              >
                {wizardSteps.map((s) => {
                  const isActive = step === s.id;
                  const isDone = step > s.id;
                  return (
                    <div key={s.id} className="min-w-0 flex relative rounded-lg">
                      {isActive ? (
                        <div
                          className="absolute inset-0 z-0 rounded-lg pointer-events-none wizard-step-pill-active border border-primary transition-[box-shadow,background-color,border-color] duration-200 ease-out"
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={cn(
                          "relative z-[1] flex w-full min-h-0 flex-col justify-center gap-0.5 rounded-lg border px-2 py-1.5 sm:py-2 text-left transition-colors duration-200",
                          isActive && "border-transparent text-primary",
                          !isActive && isDone && "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-400/95",
                          !isActive && !isDone && "border-[rgba(245,184,65,0.16)] text-muted-foreground/75",
                          isActive && !reduceMotion && "scale-[1.02]",
                          isActive && reduceMotion && "scale-100",
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden />
                          ) : (
                            <span className="text-[11px] font-bold tabular-nums opacity-80 shrink-0">{s.id}</span>
                          )}
                          <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-1">{s.label}</span>
                        </div>
                        <p
                          className={cn(
                            "text-[9px] sm:text-[10px] leading-snug line-clamp-2",
                            isActive ? "text-primary/80" : isDone ? "text-emerald-500/70" : "text-muted-foreground",
                          )}
                        >
                          {s.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </nav>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 py-3 lg:grid-cols-2 lg:min-h-[280px]">
              <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-visible">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={stepTransition}
                    className="space-y-1"
                  >
                    <p className="text-sm text-muted-foreground/90 mb-4 leading-relaxed">{stepBodyHints[step]}</p>
                    {renderStepForm()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="space-y-3 lg:sticky lg:top-0 self-start min-h-[140px] flex-1">
                {/* Só slide/fade por etapa — sem layout/layoutId (evita oscilação dentro do dialog com scroll). */}
                <div className={cn("relative overflow-hidden rounded-2xl", step === 3 ? "min-h-[120px]" : "min-h-[180px]")}>
                  <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={stepTransition}
                      className="relative z-0 h-full min-h-0"
                    >
                      {renderPreview()}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {step === 2 ? (
                  <p className="text-[11px] text-muted-foreground/85 px-0.5">
                    Lucro e margem atualizam conforme você digita.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {!success ? (
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearDraft();
                onOpenChange(false);
                resetWizard();
              }}
            >
              Cancelar
            </Button>
            <div className="flex flex-wrap gap-2 justify-end">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>
              ) : null}
              {step < 6 ? (
                <Button
                  type="button"
                  variant="goldHero"
                  onClick={goNext}
                  disabled={apparelStep3Blocked}
                  className="group gap-1.5 font-semibold px-5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continuar
                  <ChevronRight
                    className={cn(
                      "w-4 h-4",
                      !reduceMotion && "transition-transform duration-150 group-hover:translate-x-0.5",
                    )}
                  />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="goldHero"
                  onClick={() => void handleFinalize()}
                  disabled={saving}
                  className="font-semibold min-w-[10rem]"
                >
                  {saving ? "Salvando..." : mode === "edit" ? "Salvar alteracoes" : "Publicar produto"}
                </Button>
              )}
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
