export type StoreProductType =
  | "barbearia"
  | "roupa"
  | "calca"
  | "blusa"
  | "moleton"
  | "camisa"
  | "calcado"
  | "sapato"
  | "tenis"
  | "liquido"
  | "acessorio"
  | "kit"
  // Novos tipos organizados
  | "camiseta"
  | "shorts"
  | "jaqueta"
  | "bone"
  | "acessorio_roupa"
  | "chinelo"
  | "bota"
  | "solido"
  | "spray"
  | "gel"
  | "gift"
  | "personalizado"
  | "assinatura";

/** Dimensões e peso para envio (passo Embalagem do wizard) — opcional em todos os tipos */
export interface StoreProductEmbalagem {
  unidadeDimensao?: "cm" | "m";
  altura?: number;
  largura?: number;
  profundidade?: number;
  unidadePeso?: "kg" | "g";
  peso?: number;
}

/** Subfluxo na categoria "Outros importantes" — equipamentos, acessórios, cosméticos de bancada, kits */
export type StoreUtilitarianFamily = "maquina" | "acessorio" | "pecas" | "cosmetico" | "kit_combo";

/** Campos estratégicos comuns a TODOS os tipos de produto (CONVERSÃO) */
export interface StoreProductAttributesBase {
  // Identidade
  marca?: string;
  skuInterno?: string;
  ean?: string;

  // Marketing & Conversão
  descricaoLonga?: string; // 200-500 chars diferente de description no produto
  diferenciais?: string[]; // Tags: "Sem parabenos", "Profissional", "Vegano", etc
  
  // Público-alvo (cross-cutting)
  publicoAlvo?: ("masculino" | "feminino" | "infantil" | "unisex")[];
  
  // Confiança & Transparência
  composicao?: string; // "Água, álcool, mentol..." ou "100% algodão"
  duracaoEfeito?: string; // "Até 12h", "24h duração", "Até 60 dias"
  indicadoPara?: string; // "Cabelo cacheado", "Pele sensível", "Cabelo masculino"
  
  // SEO & Busca
  tagsSearchInternas?: string[]; // Palavras-chave para busca interna e descoberta

  /** --- Ferramentas / equipamentos (wizard · Outros importantes) --- */
  utilitarianFamily?: StoreUtilitarianFamily;
  potenciaW?: string;
  tipoMotorUtil?: "rotativo" | "magnetico" | "";
  semFio?: boolean;
  autonomiaBateriaMin?: string;
  tempoCarregamentoMin?: string;
  tipoAcessorioDetalhe?: string;
  materialAcessorioDetalhe?: string;
  materialAcessorioDetalhes?: string[];
  tamanhoAcessorio?: string;
  tipoPecaReposicao?: "lamina" | "pente_encaixe" | "oleo" | "bateria" | "outro" | "";
  compatibilidadePeca?: string;
  compatibilidadePecaLista?: string[];
  funcaoPeca?: "reposicao" | "upgrade" | "manutencao" | "";
  medidaPeca?: string;
  volumeMlPeca?: string;
  materialSecundarioPeca?: string;
  garantiaMesesUtil?: string;
  vidaUtilEstimada?: string;
  nivelProdutoUtil?: "basico" | "intermediario" | "profissional" | "";
  usoIndicadoBarbearia?: "iniciante" | "profissional" | "domestico" | "intenso" | "";
}

export interface StoreAttributesBarbearia extends StoreProductAttributesBase {
  embalagem?: StoreProductEmbalagem;
  subtipo?: string;
  fixacao?: "baixa" | "media" | "alta";
  volumeMl?: number;
  uso?: "cabelo" | "barba" | "ambos";
  /** Duração estimada em dias (uso típico) */
  duracaoEstimadaDias?: number;
  /** Ex.: cacheado, oleoso, seco */
  tipoCabeloRecomendado?: string;
}

export interface StoreAttributesRoupa extends StoreProductAttributesBase {
  embalagem?: StoreProductEmbalagem;
  tamanho?: string;
  tamanhos?: string[];
  cor?: string;
  cores?: string[];
  material?: string;
  materiais?: string[];
  genero?: string;
}

export interface StoreAttributesCalcado extends StoreProductAttributesBase {
  embalagem?: StoreProductEmbalagem;
  tamanhoCalcado?: string;
  tamanhosCalcado?: string[];
  cor?: string;
  cores?: string[];
  material?: string;
  materiais?: string[];
}

export interface StoreAttributesLiquido extends StoreProductAttributesBase {
  embalagem?: StoreProductEmbalagem;
  volumeMl?: number;
  tipoUso?: string;
  ingredientes?: string;
  duracaoEstimadaDias?: number;
  tipoCabeloRecomendado?: string;
}

export interface StoreAttributesAcessorio {
  embalagem?: StoreProductEmbalagem;
  marca?: string;
  skuInterno?: string;
  ean?: string;
  material?: string;
  cor?: string;
  garantia?: string;
  /** Ex.: maquina, tesoura, navalha */
  tipoFerramenta?: string;
  voltagem?: string;
  /** profissional | domestico */
  usoProfissional?: "profissional" | "domestico";
  utilitarianFamily?: StoreUtilitarianFamily;
  potenciaW?: string;
  tipoMotorUtil?: "rotativo" | "magnetico" | "";
  semFio?: boolean;
  autonomiaBateriaMin?: string;
  tempoCarregamentoMin?: string;
  tipoAcessorioDetalhe?: string;
  materialAcessorioDetalhe?: string;
  materialAcessorioDetalhes?: string[];
  tamanhoAcessorio?: string;
  tipoPecaReposicao?: "lamina" | "pente_encaixe" | "oleo" | "bateria" | "outro" | "";
  compatibilidadePeca?: string;
  compatibilidadePecaLista?: string[];
  funcaoPeca?: "reposicao" | "upgrade" | "manutencao" | "";
  medidaPeca?: string;
  volumeMlPeca?: string;
  materialSecundarioPeca?: string;
  garantiaMesesUtil?: string;
  vidaUtilEstimada?: string;
  nivelProdutoUtil?: "basico" | "intermediario" | "profissional" | "";
  usoIndicadoBarbearia?: "iniciante" | "profissional" | "domestico" | "intenso" | "";
}

export interface StoreAttributesKit {
  embalagem?: StoreProductEmbalagem;
  skuInterno?: string;
  ean?: string;
  itensIncluidos?: string;
  quantidadeItens?: number;
  tipoKit?: string;
  /** Linhas estruturadas para UX (nome + qtd) */
  linhasKit?: Array<{
    nome: string;
    qtd: number;
    shopProductId?: string;
    unitPrice?: number;
    imageUrl?: string;
  }>;
  /** Soma fictícia “separado” para mostrar economia (R$) */
  precoItensSeparados?: number;
  utilitarianFamily?: StoreUtilitarianFamily;
  potenciaW?: string;
  tipoMotorUtil?: "rotativo" | "magnetico" | "";
  semFio?: boolean;
  autonomiaBateriaMin?: string;
  tempoCarregamentoMin?: string;
  tipoAcessorioDetalhe?: string;
  materialAcessorioDetalhe?: string;
  tamanhoAcessorio?: string;
  garantiaMesesUtil?: string;
  vidaUtilEstimada?: string;
  nivelProdutoUtil?: "basico" | "intermediario" | "profissional" | "";
  usoIndicadoBarbearia?: "iniciante" | "profissional" | "domestico" | "";
}

export type StoreProductAttributes =
  | StoreAttributesBarbearia
  | StoreAttributesRoupa
  | StoreAttributesCalcado
  | StoreAttributesLiquido
  | StoreAttributesAcessorio
  | StoreAttributesKit;

/** Variação / SKU (tabela `store_product_variants`) */
export interface StoreProductVariant {
  id: string;
  productId: string;
  sku?: string;
  attrsKey: Record<string, string>;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreProduct {
  id: string;
  barbershopId: number;
  name: string;
  description: string;
  category: string;
  productType: StoreProductType;
  attributes: StoreProductAttributes;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = "IN" | "OUT";
export type StockMovementReason = "SALE" | "ADJUSTMENT" | "RESTOCK";

export interface StockMovement {
  id: string;
  productId: string;
  barbershopId: number;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  referenceId?: string;
  purchaseCode?: string;
  orderPublicCode?: string;
  createdAt: string;
}

export type StoreSaleSource = "store" | "appointment_upsell";

export interface StoreSale {
  id: string;
  productId: string;
  barbershopId: number;
  barberId?: string;
  sellerName?: string;
  purchaseCode?: string;
  orderPublicCode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  commissionRate: number;
  commissionAmount: number;
  paymentMethod: "pix" | "card" | "boleto" | "cash";
  source: StoreSaleSource;
  createdAt: string;
}
