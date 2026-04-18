export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: "tendencias" | "cuidados" | "negocio";
  readTime: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "corte-masculino-2026-tendencias",
    title: "Corte masculino 2026: tendências para pedir no salão",
    excerpt: "Os estilos que vão dominar 2026 e como escolher o corte ideal para seu perfil.",
    category: "tendencias",
    readTime: "6 min",
    publishedAt: "2026-04-01",
    seoTitle: "Tendências de corte masculino 2026 | BarberFlow",
    seoDescription: "Descubra os cortes masculinos em alta e como acertar no próximo agendamento.",
    content: [
      "As tendências de 2026 combinam praticidade com acabamento refinado. O degradê continua forte, mas com variações mais naturais e personalizadas.",
      "Antes de decidir, considere formato do rosto, rotina de manutenção e tipo de fio. Uma boa barbearia avalia esses fatores antes da tesoura.",
      "Leve referências visuais e converse sobre frequência de manutenção. Isso evita frustração e melhora o resultado no dia a dia.",
    ],
  },
  {
    slug: "como-cuidar-da-barba-sem-irritacao",
    title: "Como cuidar da barba sem irritação: guia rápido",
    excerpt: "Passo a passo prático para manter a barba alinhada, saudável e sem coceira.",
    category: "cuidados",
    readTime: "5 min",
    publishedAt: "2026-04-03",
    seoTitle: "Como cuidar da barba sem irritação | BarberFlow",
    seoDescription: "Aprenda rotina simples de cuidados com a barba para evitar irritação e falhas.",
    content: [
      "A base de uma barba saudável começa na limpeza certa. Use produtos adequados para não remover toda a barreira natural da pele.",
      "Hidrate após o banho e use óleo ou balm com moderação. Isso reduz frizz, melhora o brilho e ajuda no alinhamento.",
      "Na manutenção, prefira aparar gradualmente e sempre com lâmina limpa. Pequenos ajustes constantes funcionam melhor que correções drásticas.",
    ],
  },
  {
    slug: "como-aumentar-agendamentos-barbearia",
    title: "Como aumentar agendamentos na barbearia em 30 dias",
    excerpt: "Estratégias práticas de operação, atendimento e marketing local para crescer rápido.",
    category: "negocio",
    readTime: "7 min",
    publishedAt: "2026-04-05",
    seoTitle: "Como aumentar agendamentos da barbearia | BarberFlow",
    seoDescription: "Táticas diretas para elevar volume de agendamentos e fidelização de clientes.",
    content: [
      "Comece organizando agenda e janelas ociosas. Uma grade clara com horários bem distribuídos reduz perdas e melhora a conversão.",
      "Use confirmações automáticas e follow-up pós-serviço. Esse cuidado aumenta retorno e reduz no-show.",
      "Invista em conteúdo local e prova social: avaliações, antes/depois e campanhas sazonais com CTA direto para agendamento.",
    ],
  },
];

export const BLOG_CATEGORIES = [
  { id: "tendencias", label: "Tendências" },
  { id: "cuidados", label: "Cuidados" },
  { id: "negocio", label: "Negócio" },
] as const;

