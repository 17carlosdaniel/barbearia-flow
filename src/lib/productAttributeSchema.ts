/**
 * Sistema de Schemas de Atributos Dinâmicos por Tipo de Produto
 * 
 * Define quais campos, em qual grupo semântico, com que tipo de input,
 * para cada tipo de produto. Permite evolução sem modificar tipos TypeScript.
 * 
 * Arquitectura:
 * - AttributeFieldDef: Define um campo (label, tipo, opções, hint)
 * - AttributeGroupDef: Agrupa campos por seção semântica (Especificações, Características, etc)
 * - AttributeSchema: Mapeia um tipo de produto → seus grupos de atributos
 */

import type { StoreProductType } from "@/types/store";

/** Tipo de input para um campo de atributo */
export type FieldType = "text" | "number" | "select" | "multiselect" | "textarea" | "chips" | "checkbox";

/** Definição de um campo de atributo individual */
export interface AttributeFieldDef {
  /** Chave do atributo (ex: "fixacao", "marca", "composicao") */
  key: string;

  /** Label exibido (ex: "Fixação", "Marca", "Composição") */
  label: string;

  /** Tipo de input (select, text, multiselect, etc) */
  type: FieldType;

  /** Grupo semântico (onde aparece na UI) */
  group: "especificacoes" | "caracteristicas" | "identidade" | "diferenciais" | "busca";

  /** Dica/help text explicando o campo */
  hint?: string;

  /** Placeholder para inputs de texto */
  placeholder?: string;

  /** Opções pré-definidas (para select/multiselect) */
  options?: string[];

  /** Se o campo é obrigatório */
  required?: boolean;

  /** Máximo de caracteres (para text/textarea) */
  maxChars?: number;

  /** Priority para ordenação na seção (maior = mais acima) */
  priority?: number;
}

/** Definição de um grupo semântico de atributos */
export interface AttributeGroupDef {
  /** Identificador único (ex: "especificacoes") */
  key: "especificacoes" | "caracteristicas" | "identidade" | "diferenciais" | "busca";

  /** Label do grupo em português */
  label: string;

  /** Emoji/ícone para o grupo */
  icon: string;

  /** Descrição breve do grupo */
  description: string;

  /** Campos pertencentes a este grupo */
  fields: AttributeFieldDef[];
}

/** Schema completo para um tipo de produto */
export interface AttributeSchema {
  /** Tipo de produto (ex: "barbearia", "roupa") */
  type: StoreProductType;

  /** Grupos de atributos deste tipo */
  groups: AttributeGroupDef[];

  /** Insights/sugestões inteligentes para este tipo */
  insights?: {
    title: string;
    message: string;
    priority?: "high" | "medium" | "low";
  }[];
}

/** Dicionário de schemas por tipo de produto */
export const ATTRIBUTE_SCHEMAS: Record<StoreProductType, AttributeSchema> = {
  // ============================================
  // BARBEARIA (Pomadas, Óleos, Ceras, Styling)
  // ============================================
  barbearia: {
    type: "barbearia",
    insights: [
      {
        title: "Marca profissional",
        message: "Produtos com marca clear vendem 3x mais",
        priority: "high",
      },
      {
        title: "Composição completa",
        message: "Adicione composição para aumentar confiança",
        priority: "medium",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Peso, volume, dimensões",
        fields: [
          {
            key: "volumeMl",
            label: "Volume (ml)",
            type: "number",
            group: "especificacoes",
            placeholder: "Ex: 50, 100, 500",
            hint: "Volume em mililitros — ajuda comparação e decisão de compra",
            priority: 10,
          },
          {
            key: "subtipo",
            label: "Subtipo",
            type: "select",
            group: "especificacoes",
            options: ["Pomada", "Óleo", "Cera", "Gel", "Spray", "Pasta", "Bálsamo"],
            hint: "Tipo específico de produto",
            priority: 9,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "Fixação, duração, indicações",
        fields: [
          {
            key: "fixacao",
            label: "Fixação",
            type: "select",
            group: "caracteristicas",
            options: ["Leve", "Média", "Alta", "Extra"],
            hint: "Nível de fixação/hold — essencial para estilo",
            priority: 10,
          },
          {
            key: "uso",
            label: "Uso",
            type: "select",
            group: "caracteristicas",
            options: ["Cabelo", "Barba", "Ambos"],
            hint: "Onde o produto é aplicado",
            priority: 9,
          },
          {
            key: "tipoCabeloRecomendado",
            label: "Tipo de cabelo",
            type: "chips",
            group: "caracteristicas",
            options: ["Liso", "Ondulado", "Cacheado", "Afro", "Masculino", "Qualquer"],
            hint: "Para qual tipo de cabelo funciona melhor",
            priority: 8,
          },
          {
            key: "duracaoEstimadaDias",
            label: "Duração estimada (dias)",
            type: "number",
            group: "caracteristicas",
            placeholder: "Ex: 30, 60",
            hint: "Quanto tempo dura aproximadamente (uso típico)",
            priority: 7,
          },
        ],
      },
      {
        key: "identidade",
        label: "🏷️ Identidade",
        icon: "🏷️",
        description: "Marca, público-alvo",
        fields: [
          {
            key: "marca",
            label: "Marca",
            type: "text",
            group: "identidade",
            placeholder: "Ex: OilArt, BarberMax",
            hint: "Marca do produto — aumenta valor percebido",
            priority: 10,
          },
          {
            key: "publicoAlvo",
            label: "Público-alvo",
            type: "multiselect",
            group: "identidade",
            options: ["Masculino", "Feminino", "Infantil", "Unisex"],
            hint: "Para quem este produto é ideal",
            priority: 9,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais & Marketing",
        icon: "⭐",
        description: "Composição, benefícios, tags",
        fields: [
          {
            key: "composicao",
            label: "Composição",
            type: "textarea",
            group: "diferenciais",
            placeholder: "Ex: Água, álcool, mentol, silicone...",
            hint: "Ingredientes principais — confiança profissional",
            maxChars: 300,
            priority: 10,
          },
          {
            key: "diferenciais",
            label: "Diferenciais (tags)",
            type: "chips",
            group: "diferenciais",
            options: [
              "Sem parabenos",
              "Vegano",
              "Profissional",
              "Acabamento matte",
              "Brilho natural",
              "À prova d'água",
              "Aroma único",
              "Hidratante",
            ],
            hint: "Tags de marketing — benefícios principais",
            priority: 9,
          },
          {
            key: "descricaoLonga",
            label: "Descrição detalhada",
            type: "textarea",
            group: "diferenciais",
            placeholder: "Ex: Pomada profissional com fixação extra...",
            hint: "200-500 chars para convencer o cliente",
            maxChars: 500,
            priority: 8,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Tags internas, palavras-chave",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave (busca interna)",
            type: "chips",
            group: "busca",
            hint: "Ex: pomada strong, matte, cabelo masculino — melhora descoberta interna",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // ROUPA (Camiseta, Camisa, Moletom, etc)
  // ============================================
  roupa: {
    type: "roupa",
    insights: [
      {
        title: "Tamanho + Cor = conversão",
        message: "Especifique tamanhos e cores disponíveis — aumenta CTR",
        priority: "high",
      },
      {
        title: "Material é diferenciador",
        message: "100% Algodão ou Poliéster — declare claramente",
        priority: "medium",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Material, composição",
        fields: [
          {
            key: "material",
            label: "Material",
            type: "select",
            group: "especificacoes",
            options: ["Algodão 100%", "Algodão/Poliéster", "Poliéster 100%", "Linho", "Viscose"],
            hint: "Material principal — impacta conforto e durabilidade",
            priority: 10,
          },
          {
            key: "composicao",
            label: "Composição %",
            type: "text",
            group: "especificacoes",
            placeholder: "Ex: 70% algodão, 30% poliéster",
            hint: "Porcentagem exata de materiais",
            priority: 9,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "Tamanho, cor, ajuste",
        fields: [
          {
            key: "tamanho",
            label: "Tamanho único ou Tamanhos disponíveis",
            type: "text",
            group: "caracteristicas",
            placeholder: "Ex: Único, ou P/M/G",
            hint: "Se há múltiplos tamanhos, use variações",
            priority: 10,
          },
          {
            key: "cor",
            label: "Cor",
            type: "select",
            group: "caracteristicas",
            options: [
              "Preto",
              "Branco",
              "Cinza",
              "Azul",
              "Verde",
              "Vermelho",
              "Amarelo",
              "Rosa",
              "Roxo",
              "Caramelo",
            ],
            hint: "Cor principal — para variações use o builder",
            priority: 9,
          },
        ],
      },
      {
        key: "identidade",
        label: "🏷️ Identidade",
        icon: "🏷️",
        description: "Marca, público, gênero",
        fields: [
          {
            key: "marca",
            label: "Marca",
            type: "text",
            group: "identidade",
            placeholder: "Ex: StudioStyle",
            hint: "Marca da roupa",
            priority: 10,
          },
          {
            key: "publicoAlvo",
            label: "Público-alvo",
            type: "multiselect",
            group: "identidade",
            options: ["Masculino", "Feminino", "Unisex", "Infantil"],
            hint: "Para quem é a roupa",
            priority: 9,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais",
        icon: "⭐",
        description: "Benefícios, cuidados especiais",
        fields: [
          {
            key: "diferenciais",
            label: "Diferenciais (tags)",
            type: "chips",
            group: "diferenciais",
            options: ["Sustentável", "Artesanal", "Hipoalergênico", "Anti-odor", "Respirável", "Conforto máximo"],
            hint: "Benefícios principais",
            priority: 10,
          },
          {
            key: "descricaoLonga",
            label: "Descrição detalhada",
            type: "textarea",
            group: "diferenciais",
            placeholder: "Conforto extremo, perfeita para...",
            maxChars: 500,
            priority: 9,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Tags de busca",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave",
            type: "chips",
            group: "busca",
            hint: "Ex: camiseta branca, algodão, casual",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // CALÇADO (Tênis, Sapato, Chinelo, etc)
  // ============================================
  calcado: {
    type: "calcado",
    insights: [
      {
        title: "Tamanho é crítico",
        message: "Especifique tamanhosapós (38-44) — melhora confiança",
        priority: "high",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Material, solado",
        fields: [
          {
            key: "material",
            label: "Material",
            type: "select",
            group: "especificacoes",
            options: ["Couro", "Lona", "Sintético", "Malha", "Borracha"],
            hint: "Material principal",
            priority: 10,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "Tamanho, cor, tipo",
        fields: [
          {
            key: "tamanhoCalcado",
            label: "Tamanho",
            type: "text",
            group: "caracteristicas",
            placeholder: "Ex: 40 ou 38-44",
            hint: "Tamanho — ou use variações para múltiplos",
            priority: 10,
          },
          {
            key: "cor",
            label: "Cor",
            type: "select",
            group: "caracteristicas",
            options: ["Preto", "Branco", "Cinza", "Marrom", "Azul", "Vermelho"],
            priority: 9,
          },
        ],
      },
      {
        key: "identidade",
        label: "🏷️ Identidade",
        icon: "🏷️",
        description: "Marca, público",
        fields: [
          {
            key: "marca",
            label: "Marca",
            type: "text",
            group: "identidade",
            placeholder: "Ex: Nike, Adidas",
            priority: 10,
          },
          {
            key: "publicoAlvo",
            label: "Público-alvo",
            type: "multiselect",
            group: "identidade",
            options: ["Masculino", "Feminino", "Unisex", "Infantil"],
            priority: 9,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais",
        icon: "⭐",
        description: "Tipo, uso, benefícios",
        fields: [
          {
            key: "diferenciais",
            label: "Tipo/Benefício",
            type: "chips",
            group: "diferenciais",
            options: ["Confortável", "Casual", "Esportivo", "Profissional", "Leve", "Durável"],
            priority: 10,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Palavras-chave",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave",
            type: "chips",
            group: "busca",
            hint: "Ex: tênis preto, esporte, casual",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // LÍQUIDO (Shampoo, Condicionador, Loção)
  // ============================================
  liquido: {
    type: "liquido",
    insights: [
      {
        title: "Volume = confiança",
        message: "Especifique volume (ml) — facilita comparação",
        priority: "high",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Volume, tipo de produto",
        fields: [
          {
            key: "volumeMl",
            label: "Volume (ml)",
            type: "number",
            group: "especificacoes",
            placeholder: "Ex: 250, 500, 1000",
            hint: "Volume em mililitros",
            priority: 10,
          },
          {
            key: "tipoUso",
            label: "Tipo de uso",
            type: "select",
            group: "especificacoes",
            options: ["Shampoo", "Condicionador", "Loção", "Tônico", "Sérum", "Máscara"],
            priority: 9,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "Duração, indicações",
        fields: [
          {
            key: "duracaoEstimadaDias",
            label: "Duração (dias)",
            type: "number",
            group: "caracteristicas",
            placeholder: "Ex: 30, 60",
            hint: "Quanto tempo dura aproximadamente",
            priority: 10,
          },
          {
            key: "indicadoPara",
            label: "Indicado para",
            type: "chips",
            group: "caracteristicas",
            options: ["Cabelo seco", "Cabelo oleoso", "Cabelo normal", "Pele sensível", "Queda", "Volume"],
            hint: "Qual problema/tipo trata",
            priority: 9,
          },
        ],
      },
      {
        key: "identidade",
        label: "🏷️ Identidade",
        icon: "🏷️",
        description: "Marca",
        fields: [
          {
            key: "marca",
            label: "Marca",
            type: "text",
            group: "identidade",
            placeholder: "Ex: NaturalCare",
            priority: 10,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais",
        icon: "⭐",
        description: "Composição, benefícios",
        fields: [
          {
            key: "composicao",
            label: "Composição",
            type: "textarea",
            group: "diferenciais",
            placeholder: "Ingredientes principais...",
            maxChars: 300,
            priority: 10,
          },
          {
            key: "diferenciais",
            label: "Benefícios",
            type: "chips",
            group: "diferenciais",
            options: ["Sem parabenos", "Natural", "Vegano", "Forte", "Suave", "Aroma agradável"],
            priority: 9,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Palavras-chave",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave",
            type: "chips",
            group: "busca",
            hint: "Ex: shampoo sem parabeno, cabelo seco",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // KIT (Combo, Gift Set)
  // ============================================
  kit: {
    type: "kit",
    insights: [
      {
        title: "Mostre a economia",
        message: "Kit com economia clara aumenta ticket médio",
        priority: "high",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Itens, quantidade",
        fields: [
          {
            key: "quantidadeItens",
            label: "Quantidade de itens",
            type: "number",
            group: "especificacoes",
            placeholder: "Ex: 3, 5, 10",
            hint: "Quantos itens no kit",
            priority: 10,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "O que inclui",
        fields: [
          {
            key: "itensIncluidos",
            label: "Itens inclusos",
            type: "textarea",
            group: "caracteristicas",
            placeholder: "Ex: Pomada 100ml, Óleo 50ml, Pente...",
            hint: "Lista dos itens do kit",
            maxChars: 300,
            priority: 10,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais",
        icon: "⭐",
        description: "Economia, benefícios",
        fields: [
          {
            key: "diferenciais",
            label: "Motivo do kit",
            type: "chips",
            group: "diferenciais",
            options: ["Combo perfeito", "Economize", "Presente ideal", "Combo profissional"],
            priority: 10,
          },
          {
            key: "descricaoLonga",
            label: "Descrição",
            type: "textarea",
            group: "diferenciais",
            placeholder: "Por que este kit é perfeito...",
            maxChars: 500,
            priority: 9,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Palavras-chave",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave",
            type: "chips",
            group: "busca",
            hint: "Ex: kit pomada, combo barba",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // ACESSÓRIO (Máquina, Tesoura, Pente, etc)
  // ============================================
  acessorio: {
    type: "acessorio",
    insights: [
      {
        title: "Profissional vs. Doméstico",
        message: "Deixe claro se é profissional — aumenta valor",
        priority: "high",
      },
    ],
    groups: [
      {
        key: "especificacoes",
        label: "📦 Especificações",
        icon: "📦",
        description: "Voltagem, material",
        fields: [
          {
            key: "material",
            label: "Material",
            type: "text",
            group: "especificacoes",
            placeholder: "Ex: Aço inoxidável, Alumínio",
            priority: 10,
          },
          {
            key: "voltagem",
            label: "Voltagem",
            type: "text",
            group: "especificacoes",
            placeholder: "Ex: 110V/220V, Manual (sem voltagem)",
            priority: 9,
          },
        ],
      },
      {
        key: "caracteristicas",
        label: "🎯 Características",
        icon: "🎯",
        description: "Tipo, uso",
        fields: [
          {
            key: "tipoFerramenta",
            label: "Tipo",
            type: "select",
            group: "caracteristicas",
            options: ["Máquina de corte", "Tesoura", "Navalha", "Pente", "Escova", "Cortador de unha"],
            priority: 10,
          },
        ],
      },
      {
        key: "identidade",
        label: "🏷️ Identidade",
        icon: "🏷️",
        description: "Marca, profissional",
        fields: [
          {
            key: "marca",
            label: "Marca",
            type: "text",
            group: "identidade",
            placeholder: "Ex: Andis, Wahl",
            priority: 10,
          },
          {
            key: "usoProfissional",
            label: "Uso",
            type: "select",
            group: "identidade",
            options: ["Profissional", "Doméstico", "Ambos"],
            hint: "Profissional vende mais e com margem maior",
            priority: 9,
          },
        ],
      },
      {
        key: "diferenciais",
        label: "⭐ Diferenciais",
        icon: "⭐",
        description: "Durabilidade, garantia",
        fields: [
          {
            key: "garantia",
            label: "Garantia",
            type: "text",
            group: "diferenciais",
            placeholder: "Ex: 2 anos, 5 anos",
            priority: 10,
          },
          {
            key: "diferenciais",
            label: "Benefícios",
            type: "chips",
            group: "diferenciais",
            options: ["Durável", "Leve", "Silencioso", "Preciso", "Fácil limpeza", "Ergonômico"],
            priority: 9,
          },
        ],
      },
      {
        key: "busca",
        label: "🔍 Busca & Vitrine",
        icon: "🔍",
        description: "Palavras-chave",
        fields: [
          {
            key: "tagsSearchInternas",
            label: "Palavras-chave",
            type: "chips",
            group: "busca",
            hint: "Ex: máquina profissional, tesoura aço",
            priority: 10,
          },
        ],
      },
    ],
  },

  // ============================================
  // Tipos Legados & Genéricos
  // ============================================
  calca: { type: "calca", groups: [] },
  blusa: { type: "blusa", groups: [] },
  moleton: { type: "moleton", groups: [] },
  camisa: { type: "camisa", groups: [] },
  camiseta: { type: "camiseta", groups: [] },
  shorts: { type: "shorts", groups: [] },
  jaqueta: { type: "jaqueta", groups: [] },
  bone: { type: "bone", groups: [] },
  acessorio_roupa: { type: "acessorio_roupa", groups: [] },
  chinelo: { type: "chinelo", groups: [] },
  bota: { type: "bota", groups: [] },
  sapato: { type: "sapato", groups: [] },
  tenis: { type: "tenis", groups: [] },
  solido: { type: "solido", groups: [] },
  spray: { type: "spray", groups: [] },
  gel: { type: "gel", groups: [] },
  gift: { type: "gift", groups: [] },
  personalizado: { type: "personalizado", groups: [] },
  assinatura: { type: "assinatura", groups: [] },
};

/**
 * Retorna o schema completo para um tipo de produto
 */
export function getAttributeSchema(type: StoreProductType): AttributeSchema {
  return ATTRIBUTE_SCHEMAS[type] || ATTRIBUTE_SCHEMAS.barbearia;
}

/**
 * Retorna todos os campos de um tipo, achatados (sem grupos)
 */
export function getAllFieldsForType(type: StoreProductType): AttributeFieldDef[] {
  const schema = getAttributeSchema(type);
  return schema.groups.flatMap((g) => g.fields);
}

/**
 * Retorna campos agrupados por grupo semântico
 */
export function getFieldsByGroup(
  type: StoreProductType,
  groupKey: "especificacoes" | "caracteristicas" | "identidade" | "diferenciais" | "busca"
): AttributeFieldDef[] {
  const schema = getAttributeSchema(type);
  const group = schema.groups.find((g) => g.key === groupKey);
  return group?.fields || [];
}

/**
 * Retorna hints/insights para um tipo de produto
 */
export function getInsightsForType(type: StoreProductType) {
  const schema = getAttributeSchema(type);
  return schema.insights || [];
}
