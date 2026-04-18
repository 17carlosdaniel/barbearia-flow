export type SeoCalendarItem = {
  week: number;
  cluster: "tendencias" | "cuidados" | "negocio-local";
  keywordFocus: string;
  format: "artigo" | "guia" | "checklist";
  cta: string;
};

export const SEO_CALENDAR_90_DAYS: SeoCalendarItem[] = [
  { week: 1, cluster: "tendencias", keywordFocus: "corte masculino 2026", format: "artigo", cta: "Agendar corte" },
  { week: 2, cluster: "cuidados", keywordFocus: "como cuidar da barba", format: "guia", cta: "Ver produtos" },
  { week: 3, cluster: "negocio-local", keywordFocus: "barbearia perto de mim", format: "checklist", cta: "Buscar barbearias" },
  { week: 4, cluster: "cuidados", keywordFocus: "rotina capilar masculina", format: "artigo", cta: "Fazer diagnóstico" },
  { week: 5, cluster: "tendencias", keywordFocus: "degradê low fade", format: "guia", cta: "Agendar atendimento" },
  { week: 6, cluster: "negocio-local", keywordFocus: "como lotar agenda da barbearia", format: "artigo", cta: "Conhecer planos" },
  { week: 7, cluster: "cuidados", keywordFocus: "produtos para barba", format: "checklist", cta: "Acessar loja" },
  { week: 8, cluster: "tendencias", keywordFocus: "cortes para rosto redondo", format: "guia", cta: "Encontrar especialista" },
  { week: 9, cluster: "negocio-local", keywordFocus: "marketing para barbearia", format: "artigo", cta: "Abrir suporte" },
  { week: 10, cluster: "cuidados", keywordFocus: "barba sem irritação", format: "guia", cta: "Ver guia" },
  { week: 11, cluster: "tendencias", keywordFocus: "corte social moderno", format: "artigo", cta: "Agendar agora" },
  { week: 12, cluster: "negocio-local", keywordFocus: "fidelização em barbearia", format: "checklist", cta: "Configurar fidelidade" },
];

