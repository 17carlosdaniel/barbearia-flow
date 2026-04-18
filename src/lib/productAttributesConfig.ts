import type { StoreProductType } from "@/types/store";
import {
  BRAND_OPTIONS,
  FIXATION_OPTIONS,
  FINISH_OPTIONS,
  MATERIAL_OPTIONS,
  HAIR_TYPE_OPTIONS,
  DURATION_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  SHOE_TYPE_OPTIONS,
  DIFFERENTIAL_OPTIONS,
  CARE_TYPE_OPTIONS,
  FRAGRANCE_OPTIONS,
} from "@/lib/storeProductWizardDefaults";
import { TrendingUp } from "lucide-react";

export interface AttributeField {
  key: string;
  label: string;
  type: "select" | "text" | "number" | "tags";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  category?: "specifications" | "characteristics" | "identity";
}

export interface ProductAttributesConfig {
  fields: AttributeField[];
  suggestions: string[];
  copy: string;
}

// Configurações específicas por tipo de produto
const PRODUCT_ATTRIBUTES_CONFIG: Partial<Record<StoreProductType, ProductAttributesConfig>> = {
  // Produtos de cabelo e beleza
  liquido: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "tipoCuidado",
        label: "Tipo de cuidado",
        type: "select",
        options: CARE_TYPE_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "volume",
        label: "Volume (ml)",
        type: "text",
        placeholder: "Ex: 200ml, 500ml",
        category: "specifications",
        required: true,
      },
      {
        key: "fragrancia",
        label: "Fragrância",
        type: "select",
        options: FRAGRANCE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "tipoCabelo",
        label: "Tipo de cabelo/pele",
        type: "select",
        options: HAIR_TYPE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Produtos sem parabenos vendem 2x mais",
      "🎯 Dica: Fragrâncias cítricas são preferidas para o verão",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Volume acima de 250ml justifica preço premium",
    ],
    copy: "Configure os atributos que seu cliente busca em produtos de beleza",
  },

  spray: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "fixacao",
        label: "Fixação",
        type: "select",
        options: FIXATION_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "acabamento",
        label: "Acabamento",
        type: "select",
        options: FINISH_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "volume",
        label: "Volume (ml)",
        type: "text",
        placeholder: "Ex: 100ml, 250g",
        category: "specifications",
        required: true,
      },
      {
        key: "fragrancia",
        label: "Fragrância",
        type: "select",
        options: FRAGRANCE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "tipoCabelo",
        label: "Tipo de cabelo",
        type: "select",
        options: HAIR_TYPE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "duracao",
        label: "Duração do efeito",
        type: "select",
        options: DURATION_OPTIONS,
        category: "characteristics",
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Sprays com fixação média são os mais versáteis",
      "🎯 Dica: Acabamento natural é preferido para uso diário",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Volume entre 200-300ml tem melhor custo-benefício",
    ],
    copy: "Configure os atributos que fazem seu spray único e eficaz",
  },

  gel: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "fixacao",
        label: "Fixação",
        type: "select",
        options: FIXATION_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "acabamento",
        label: "Acabamento",
        type: "select",
        options: FINISH_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "volume",
        label: "Volume (ml)",
        type: "text",
        placeholder: "Ex: 100ml, 250g",
        category: "specifications",
        required: true,
      },
      {
        key: "fragrancia",
        label: "Fragrância",
        type: "select",
        options: FRAGRANCE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "tipoCabelo",
        label: "Tipo de cabelo",
        type: "select",
        options: HAIR_TYPE_OPTIONS,
        category: "characteristics",
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Géis com alta fixação são ideais para penteados estruturados",
      "🎯 Dica: Acabamento brilhoso é clássico e nunca sai de moda",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Géis sem álcool são preferidos para cabelos sensíveis",
    ],
    copy: "Configure os atributos essenciais para seu gel de cabelo",
  },

  // Roupas
  roupa: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: MATERIAL_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "👕 Dica: Materiais como algodão e lã vendem mais no inverno",
      "🎯 Dica: Roupas com marca definida têm 40% mais conversão",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Diferenciais como 'orgânico' aumentam o valor percebido",
    ],
    copy: "Adicione os detalhes que valorizam sua peça de roupa",
  },

  camiseta: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: MATERIAL_OPTIONS.filter(m => ["Algodão", "Poliéster", "Nylon"].includes(m)),
        category: "characteristics",
        required: true,
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "👕 Dica: Camisetas 100% algodão são as mais vendidas",
      "🎯 Dica: Estampas e logos aumentam o valor percebido",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Fit moderno (slim) vende mais que o tradicional",
    ],
    copy: "Configure os atributos que fazem sua camiseta especial",
  },

  // Calçados
  calcado: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: MATERIAL_OPTIONS.filter(m => ["Couro", "Sintético", "Lona", "Nylon"].includes(m)),
        category: "characteristics",
        required: true,
      },
      {
        key: "tipoCalcado",
        label: "Tipo",
        type: "select",
        options: SHOE_TYPE_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Calçados de couro têm 60% mais durabilidade percebida",
      "🎯 Dica: Tipo 'esportivo' vende 3x mais para público jovem",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Marca é o fator #1 na decisão de compra de calçados",
    ],
    copy: "Configure os atributos essenciais para seu calçado",
  },

  tenis: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: MATERIAL_OPTIONS.filter(m => ["Couro", "Sintético", "Nylon", "Lona"].includes(m)),
        category: "characteristics",
        required: true,
      },
      {
        key: "tipoCalcado",
        label: "Tipo",
        type: "select",
        options: SHOE_TYPE_OPTIONS.filter(t => ["Casual", "Esportivo", "Tênis corrida"].includes(t)),
        category: "characteristics",
        required: true,
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Tênis com tecnologia de amortecimento vendem mais",
      "🎯 Dica: Design minimalista está em alta",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Tênis esportivos têm maior ticket médio",
    ],
    copy: "Configure os atributos que seu cliente busca em um tênis",
  },

  // Acessórios
  acessorio: {
    fields: [
      {
        key: "marca",
        label: "Marca",
        type: "select",
        options: BRAND_OPTIONS,
        category: "identity",
        required: true,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: MATERIAL_OPTIONS,
        category: "characteristics",
        required: true,
      },
      {
        key: "publicoAlvo",
        label: "Público-alvo",
        type: "select",
        options: TARGET_AUDIENCE_OPTIONS,
        category: "identity",
      },
      {
        key: "diferenciais",
        label: "Diferenciais",
        type: "tags",
        options: DIFFERENTIAL_OPTIONS,
        category: "characteristics",
      },
    ],
    suggestions: [
      "🎩 Dica: Acessórios de marca premium têm 70% mais margem",
      "🎯 Dica: Material durável é fator decisivo na compra",
      "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Design exclusivo justifica preço premium",
    ],
    copy: "Configure os atributos que destacam seu acessório",
  },
};

// Configuração padrão para tipos não específicos
const DEFAULT_CONFIG: ProductAttributesConfig = {
  fields: [
    {
      key: "marca",
      label: "Marca",
      type: "select",
      options: BRAND_OPTIONS,
      category: "identity",
      required: true,
    },
    {
      key: "volume",
      label: "Volume/Peso",
      type: "text",
      placeholder: "Ex: 100ml, 200g",
      category: "specifications",
      required: true,
    },
    {
      key: "publicoAlvo",
      label: "Público-alvo",
      type: "select",
      options: TARGET_AUDIENCE_OPTIONS,
      category: "identity",
    },
    {
      key: "diferenciais",
      label: "Diferenciais",
      type: "tags",
      options: DIFFERENTIAL_OPTIONS,
      category: "characteristics",
    },
  ],
  suggestions: [
    "💡 Dica: Produtos com atributos completos vendem 2x mais",
    "🎯 Dica: Marca definida aumenta confiança na compra",
    "<TrendingUp className='w-4 h-4 inline mr-1' /> Dica: Diferenciais criam percepção de valor",
  ],
  copy: "Adicione detalhes que ajudam seu produto a vender mais",
};

export function getProductAttributesConfig(productType: StoreProductType): ProductAttributesConfig {
  return PRODUCT_ATTRIBUTES_CONFIG[productType] || DEFAULT_CONFIG;
}

export function getFieldsByCategory(fields: AttributeField[]): Record<string, AttributeField[]> {
  return fields.reduce((acc, field) => {
    const category = field.category || "characteristics";
    if (!acc[category]) acc[category] = [];
    acc[category].push(field);
    return acc;
  }, {} as Record<string, AttributeField[]>);
}
