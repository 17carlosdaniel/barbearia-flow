import type { StoreProductAttributes, StoreProductType } from "@/types/store";

/** Linha de variação no wizard (antes de persistir em `store_product_variants`). */
export type ProductVariantFormRow = {
  /** Chave estável na lista (React + fallback local) */
  clientId: string;
  id?: string;
  sku?: string;
  attrsKey: Record<string, string>;
  stock: string;
  minStock: string;
};

export function makeVariantClientId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const PRODUCT_TYPE_OPTIONS: Array<{ value: StoreProductType; label: string }> = [
  // Roupas
  { value: "camiseta", label: "Camiseta" },
  { value: "camisa", label: "Camisa" },
  { value: "moleton", label: "Moletom" },
  { value: "calca", label: "Calça" },
  { value: "shorts", label: "Shorts" },
  { value: "blusa", label: "Blusa" },
  { value: "jaqueta", label: "Jaqueta" },
  { value: "bone", label: "Boné" },
  { value: "acessorio_roupa", label: "Acessório de roupa (cinto, etc.)" },
  
  // Calçados
  { value: "tenis", label: "Tênis" },
  { value: "sapato", label: "Sapato" },
  { value: "chinelo", label: "Chinelo" },
  { value: "bota", label: "Bota" },
  
  // Produtos físicos gerais
  { value: "liquido", label: "Produto líquido" },
  { value: "solido", label: "Produto sólido" },
  { value: "spray", label: "Produto em spray" },
  { value: "gel", label: "Produto em gel" },
  
  // Outros importantes
  { value: "kit", label: "Kit / Combo" },
  { value: "gift", label: "Gift / Presente" },
  { value: "personalizado", label: "Produto personalizado" },
  { value: "assinatura", label: "Assinatura" },
  
  // Manter compatibilidade com tipos existentes
  { value: "barbearia", label: "Produto de barbearia (pomada, cera, styling…)" },
  { value: "roupa", label: "Roupa (legado)" },
  { value: "calcado", label: "Calçado (legado)" },
  { value: "acessorio", label: "Equipamento / acessório (legado)" },
];

export const EMPTY_ATTRIBUTES_BY_TYPE: Record<StoreProductType, StoreProductAttributes> = {
  barbearia: {
    subtipo: "",
    fixacao: "media",
    volumeMl: undefined,
    uso: "cabelo",
    duracaoEstimadaDias: undefined,
    tipoCabeloRecomendado: "",
  },
  roupa: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  calca: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  blusa: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  moleton: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  camisa: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  calcado: { tamanhoCalcado: "", tamanhosCalcado: [], cor: "", cores: [], marca: "", material: "", materiais: [] },
  sapato: { tamanhoCalcado: "", tamanhosCalcado: [], cor: "", cores: [], marca: "", material: "", materiais: [] },
  tenis: { tamanhoCalcado: "", tamanhosCalcado: [], cor: "", cores: [], marca: "", material: "", materiais: [] },
  liquido: {
    volumeMl: undefined,
    tipoUso: "",
    ingredientes: "",
    indicadoPara: "",
    duracaoEstimadaDias: undefined,
    tipoCabeloRecomendado: "",
    usoProduto: "",
    codigoUniversal: "",
    rendimento: "",
    problemaResolve: "",
    tiposCabeloIndicados: [],
    tiposPeleIndicados: [],
    indicadoParaPrincipal: "",
  },
  acessorio: {
    marca: "",
    material: "",
    cor: "",
    garantia: "",
    tipoFerramenta: "",
    voltagem: "",
    usoProfissional: undefined,
  },
  kit: {
    itensIncluidos: "",
    quantidadeItens: undefined,
    tipoKit: "",
    linhasKit: [],
    precoItensSeparados: undefined,
  },
  // Novos tipos organizados
  camiseta: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  shorts: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  jaqueta: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  bone: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  acessorio_roupa: { tamanho: "", tamanhos: [], cor: "", cores: [], material: "", materiais: [], genero: "" },
  chinelo: { tamanhoCalcado: "", tamanhosCalcado: [], cor: "", cores: [], marca: "", material: "", materiais: [] },
  bota: { tamanhoCalcado: "", tamanhosCalcado: [], cor: "", cores: [], marca: "", material: "", materiais: [] },
  solido: {
    volumeMl: undefined,
    tipoUso: "",
    ingredientes: "",
    indicadoPara: "",
    duracaoEstimadaDias: undefined,
    tipoCabeloRecomendado: "",
    usoProduto: "",
    codigoUniversal: "",
    rendimento: "",
    problemaResolve: "",
    tiposCabeloIndicados: [],
    tiposPeleIndicados: [],
    indicadoParaPrincipal: "",
  },
  spray: {
    volumeMl: undefined,
    tipoUso: "",
    ingredientes: "",
    indicadoPara: "",
    duracaoEstimadaDias: undefined,
    tipoCabeloRecomendado: "",
    usoProduto: "",
    codigoUniversal: "",
    rendimento: "",
    problemaResolve: "",
    tiposCabeloIndicados: [],
    tiposPeleIndicados: [],
    indicadoParaPrincipal: "",
  },
  gel: {
    volumeMl: undefined,
    tipoUso: "",
    ingredientes: "",
    indicadoPara: "",
    duracaoEstimadaDias: undefined,
    tipoCabeloRecomendado: "",
    usoProduto: "",
    codigoUniversal: "",
    rendimento: "",
    problemaResolve: "",
    tiposCabeloIndicados: [],
    tiposPeleIndicados: [],
    indicadoParaPrincipal: "",
  },
  gift: {
    itensIncluidos: "",
    quantidadeItens: undefined,
    tipoKit: "",
    linhasKit: [],
    precoItensSeparados: undefined,
  },
  personalizado: {
    marca: "",
    material: "",
    cor: "",
    garantia: "",
    tipoFerramenta: "",
    voltagem: "",
    usoProfissional: undefined,
  },
  assinatura: {
    itensIncluidos: "",
    quantidadeItens: undefined,
    tipoKit: "",
    linhasKit: [],
    precoItensSeparados: undefined,
  },
};

/** Tamanhos roupa: inclui XS–XL além do BR tradicional e numeração */
export const CLOTH_SIZE_OPTIONS = ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "XS", "S", "P", "M", "G", "L", "GG", "XG", "XL", "XXL"];
export const SHOE_SIZE_OPTIONS = ["38", "39", "40", "41", "42", "43", "44"];
export const COLOR_OPTIONS = ["Preto", "Branco", "Cinza", "Marrom", "Azul", "Verde", "Vermelho", "Amarelo", "Rosa", "Roxo", "Laranja", "Bege", "Cáqui"];
export const MATERIAL_OPTIONS = ["Couro", "Algodão", "Sintético", "Poliéster", "Lona", "Jeans", "Lã", "Seda", "Nylon", "Veludo"];
export const GENDER_OPTIONS = ["Masculino", "Feminino", "Unisex", "Infantil"];
export const CARE_TYPE_OPTIONS = ["Hidratação", "Limpeza", "Proteção", "Tratamento", "Estilo", "Finalização"];
export const FRAGRANCE_OPTIONS = ["Citrico", "Floral", "Madeira", "Herbal", "Doce", "Fresco", "Amadeirado", "Especiarias"];
export const BRAND_OPTIONS = ["BarberFlow", "Premium", "Professional", "Classic", "Modern", "Sport", "Elegance", "Urban"];
export const FIXATION_OPTIONS = ["Leve", "Média", "Forte", "Extra Forte"];
export const FINISH_OPTIONS = ["Fosco", "Brilho", "Natural", "Satinado", "Mate"];
export const HAIR_TYPE_OPTIONS = ["Liso", "Ondulado", "Cacheado", "Crespo", "Loiro", "Castanho", "Preto", "Colorido"];
export const HAIR_PROFILE_OPTIONS = [
  "1A - Liso fino",
  "1B - Liso medio",
  "1C - Liso grosso",
  "2A - Ondulado leve",
  "2B - Ondulado medio",
  "2C - Ondulado marcado",
  "3A - Cacheado aberto",
  "3B - Cacheado medio",
  "3C - Cacheado fechado",
  "4A - Crespo suave",
  "4B - Crespo em Z",
  "4C - Crespo muito fechado",
];
export const SKIN_PROFILE_OPTIONS = [
  "Normal - Equilibrada, poros pequenos e textura suave",
  "Seca - Menor oleosidade, descamacao e sensacao de repuxamento",
  "Oleosa - Brilho intenso, excesso de sebo e poros dilatados",
  "Mista - Oleosa na zona T e seca/normal nas bochechas",
  "Sensivel - Reativa, vermelhidao e irritacao com facilidade",
  "Acneica - Propensa a cravos e espinhas",
  "Madura - Menor firmeza/elasticidade e maior ressecamento",
];
export const DURATION_OPTIONS = ["Até 4h", "Até 8h", "Até 12h", "Até 24h", "48h+", "Semana"];
export const TARGET_AUDIENCE_OPTIONS = ["Masculino", "Feminino", "Unisex", "Infantil", "Teen", "Adulto", "Sênior"];
export const SHOE_TYPE_OPTIONS = ["Casual", "Esportivo", "Social", "Botina", "Tênis corrida", "Sandália", "Chinelo"];
export const DIFFERENTIAL_OPTIONS = ["Sem parabenos", "Alta fixação", "Produto profissional", "Vegano", "Cruelty-free", "Orgânico", "Natural", "Anti-alérgico"];

/** Tipos de produtos que suportam variações por tamanho */
export const PRODUCTS_WITH_SIZES: StoreProductType[] = [
  "roupa",
  "camiseta",
  "camisa",
  "moleton",
  "calca",
  "shorts",
  "blusa",
  "jaqueta",
  "bone",
  "acessorio_roupa",
  "calcado",
  "tenis",
  "sapato",
  "chinelo",
  "bota",
];

export const CATEGORY_OPTIONS = ["Roupas", "Calçados", "Produtos físicos gerais", "Outros importantes"] as const;

/** Rótulo na vitrine/UI; valores canônicos de categoria permanecem em `CATEGORY_OPTIONS`. */
export const CATEGORY_DISPLAY_LABELS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  Roupas: "Roupas",
  Calçados: "Calçados",
  "Produtos físicos gerais": "Produtos físicos gerais",
  "Outros importantes": "Equipamentos & acessórios",
};

export function getCategoryDisplayLabel(category: string): string {
  const c = category as (typeof CATEGORY_OPTIONS)[number];
  return CATEGORY_DISPLAY_LABELS[c] ?? category;
}

/** Categorias com passo extra no wizard: imagens, ingredientes/composição e descrição longa */
export const WIZARD_CONTENT_CATEGORIES: readonly string[] = [
  "Roupas",
  "Calçados",
  "Produtos físicos gerais",
  "Outros importantes",
];

export function isWizardContentCategory(category: string): boolean {
  return WIZARD_CONTENT_CATEGORIES.includes(category);
}

export function getDefaultProductForm(): {
  name: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  category: string;
  description: string;
  imageUrl: string;
  /** Fotos extras (além da capa), em data URL ou URL */
  galleryImageUrls: string[];
  tags: string;
  featured: boolean;
  active: boolean;
  availableInShop: boolean;
  productType: StoreProductType;
  attributes: StoreProductAttributes;
  variants: ProductVariantFormRow[];
  /** ID em `store_products` ao editar produto existente (persistência / variantes) */
  persistedProductId: string | undefined;
} {
  return {
    name: "",
    costPrice: "",
    salePrice: "",
    stock: "",
    minStock: "3",
    category: "Roupas",
    description: "",
    imageUrl: "",
    galleryImageUrls: [],
    tags: "",
    featured: false,
    active: true,
    availableInShop: false,
    productType: "barbearia",
    attributes: EMPTY_ATTRIBUTES_BY_TYPE.barbearia,
    variants: [],
    persistedProductId: undefined,
  };
}

export type ProductFormState = ReturnType<typeof getDefaultProductForm>;
