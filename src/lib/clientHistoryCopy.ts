import type { Identity } from "@/contexts/ThemeContext";

export interface ClientHistoryCopy {
  pageTitle: string;
  pageSubtitle: string;
  statsTitle: string;
  statsCutsYear: (year: number) => string;
  statsLoyalty: string;
  statsAvgTicket: string;
  statsAvgInterval: string;
  statsFavoriteStyle: string;
  statsNoInterval: string;
  searchPlaceholder: string;
  filtersButton: string;
  filtersTitle: string;
  filterPeriodLabel: string;
  filterPeriodAll: string;
  filterPeriodYear: string;
  filterPeriod90d: string;
  filterUnit: string;
  filterUnitAll: string;
  filterProfessional: string;
  filterProfessionalAll: string;
  filterServiceType: string;
  filterServiceAll: string;
  filterWithPhoto: string;
  filterWithRating: string;
  filterClear: string;
  sectionFeatured: string;
  sectionFeaturedSearchSingle: string;
  featuredHeroBadge: string;
  featuredSecondaryBadge: string;
  sectionRest: string;
  sectionRecommendations: string;
  recCta: string;
  emptySearch: string;
  emptyFullTitle: string;
  emptyFullBody: string;
  emptyFullCtaBook: string;
  emptyFullCtaExplore: string;
  labelWhere: string;
  labelWhen: string;
  labelService: string;
  labelValue: string;
  labelProfessional: string;
  withProfessional: (name: string) => string;
  daysAgo: (n: number) => string;
  ratingLabel: (stars: number) => string;
  insightRepeatWeeks: (weeks: number) => string;
  insightRepeatServiceFallback: (days: number) => string;
  insightDaysSinceLast: (days: number) => string;
  recLineLastStyle: (service: string, days: number) => string;
  recLineRhythmWeeks: (weeks: number) => string;
  recLineTopShop: (shop: string, months: number) => string;
  recLinePriceBand: (min: number, max: number) => string;
  recLineReturnSoon: (days: number) => string;
  ctaBookAgain: string;
  ctaDetails: string;
  ctaRatePhoto: string;
  ctaAddPhoto: string;
  compactRebook: string;
  compactRated: string;
  compactNoRating: string;
  compactHasPhoto: string;
}

const modern: ClientHistoryCopy = {
  pageTitle: "Histórico de serviços",
  pageSubtitle:
    "Acompanhe seus últimos atendimentos, valores e frequência de manutenção.",
  statsTitle: "Resumo do período",
  statsCutsYear: (y) => `Serviços em ${y}`,
  statsLoyalty: "Economia fidelidade",
  statsAvgTicket: "Ticket médio",
  statsAvgInterval: "Intervalo médio entre visitas",
  statsFavoriteStyle: "Estilo mais frequente",
  statsNoInterval: "—",
  searchPlaceholder: "Buscar por serviço, barbearia ou profissional",
  filtersButton: "Filtros",
  filtersTitle: "Refinar histórico",
  filterPeriodLabel: "Período",
  filterPeriodAll: "Todo o período",
  filterPeriodYear: "Ano atual",
  filterPeriod90d: "Últimos 90 dias",
  filterUnit: "Unidade",
  filterUnitAll: "Todas",
  filterProfessional: "Profissional",
  filterProfessionalAll: "Todos",
  filterServiceType: "Tipo de serviço",
  filterServiceAll: "Todos",
  filterWithPhoto: "Somente com foto",
  filterWithRating: "Somente com avaliação",
  filterClear: "Limpar filtros",
  sectionFeatured: "Atendimentos recentes",
  sectionFeaturedSearchSingle: "Resultado da busca",
  featuredHeroBadge: "Mais recente",
  featuredSecondaryBadge: "Anterior",
  sectionRest: "Histórico anterior",
  sectionRecommendations: "Sugestões para manter seu estilo",
  recCta: "Agendar próxima visita",
  emptySearch: "Nenhum atendimento encontrado para sua busca.",
  emptyFullTitle: "Nenhum atendimento registrado",
  emptyFullBody:
    "Seus serviços concluídos aparecerão aqui com valores, datas e recomendações para reagendamento.",
  emptyFullCtaBook: "Agendar primeiro serviço",
  emptyFullCtaExplore: "Explorar barbearias",
  labelWhere: "Unidade",
  labelWhen: "Data",
  labelService: "Serviço",
  labelValue: "Valor",
  labelProfessional: "Profissional",
  withProfessional: (name) => `com ${name}`,
  daysAgo: (n) => `Há ${n} dia${n === 1 ? "" : "s"}`,
  ratingLabel: (stars) => `Nota ${stars.toFixed(1)}`,
  insightRepeatWeeks: (weeks) =>
    `Você costuma repetir este serviço a cada cerca de ${weeks} semana${weeks === 1 ? "" : "s"}.`,
  insightRepeatServiceFallback: (days) =>
    `Seu ritmo médio entre visitas com este serviço é de cerca de ${days} dias.`,
  insightDaysSinceLast: (days) =>
    `Já faz ${days} dias desde o último atendimento nesta linha.`,
  recLineLastStyle: (service, days) =>
    `Seu último ${service.toLowerCase()} foi há ${days} dias. Pode ser um bom momento para reagendar.`,
  recLineRhythmWeeks: (weeks) =>
    `Você costuma renovar o estilo a cada cerca de ${weeks} semana${weeks === 1 ? "" : "s"}.`,
  recLineTopShop: (shop, months) =>
    `${shop} foi sua escolha mais frequente nos últimos ${months} meses.`,
  recLinePriceBand: (min, max) =>
    `Sua faixa de preço mais comum fica entre R$ ${min.toFixed(0)} e R$ ${max.toFixed(0)}.`,
  recLineReturnSoon: (days) =>
    `Há ${days} dias desde o seu último atendimento — considere agendar a continuidade do cuidado.`,
  ctaBookAgain: "Agendar de novo",
  ctaDetails: "Ver detalhes",
  ctaRatePhoto: "Avaliar com foto",
  ctaAddPhoto: "Adicionar foto",
  compactRebook: "Repetir serviço",
  compactRated: "Avaliado",
  compactNoRating: "Sem avaliação",
  compactHasPhoto: "Com foto",
};

const vintage: ClientHistoryCopy = {
  pageTitle: "Memória de estilo",
  pageSubtitle:
    "Reviva seus últimos cuidados e retome o atendimento no momento certo.",
  statsTitle: "Seu percurso até aqui",
  statsCutsYear: (_y: number) => "Cortes no ano",
  statsLoyalty: "Economia com fidelidade",
  statsAvgTicket: "Investimento médio",
  statsAvgInterval: "Ritmo entre visitas",
  statsFavoriteStyle: "Estilo mais recorrente",
  statsNoInterval: "Ainda poucas visitas para medir",
  searchPlaceholder: "Buscar por casa, estilo ou atendimento",
  filtersButton: "Filtros",
  filtersTitle: "Refinar memória",
  filterPeriodLabel: "Período",
  filterPeriodAll: "Todo o tempo",
  filterPeriodYear: "Neste ano",
  filterPeriod90d: "Últimos 90 dias",
  filterUnit: "Casa",
  filterUnitAll: "Todas",
  filterProfessional: "Profissional",
  filterProfessionalAll: "Todos",
  filterServiceType: "Estilo / serviço",
  filterServiceAll: "Todos",
  filterWithPhoto: "Com foto registrada",
  filterWithRating: "Com avaliação",
  filterClear: "Limpar",
  sectionFeatured: "Seus últimos cuidados",
  sectionFeaturedSearchSingle: "O que a busca trouxe",
  featuredHeroBadge: "Seu último cuidado",
  featuredSecondaryBadge: "Cuidado anterior",
  sectionRest: "Registros anteriores",
  sectionRecommendations: "Seu padrão de cuidado",
  recCta: "Planejar próximo atendimento",
  emptySearch: "Nada encontrado com esses termos.",
  emptyFullTitle: "Sua memória de estilo começa aqui",
  emptyFullBody:
    "Quando seus primeiros atendimentos forem concluídos, este espaço vai reunir datas, valores, preferências e registros do seu estilo ao longo do tempo.",
  emptyFullCtaBook: "Agendar atendimento",
  emptyFullCtaExplore: "Descobrir casas",
  labelWhere: "Casa",
  labelWhen: "Quando",
  labelService: "Estilo",
  labelValue: "Valor",
  labelProfessional: "Profissional",
  withProfessional: (name) => `com ${name}`,
  daysAgo: (n) =>
    n === 0 ? "Hoje" : n === 1 ? "Ontem" : `Há ${n} dias`,
  ratingLabel: (stars) => `Avaliação ${stars.toFixed(1)}`,
  insightRepeatWeeks: (weeks) =>
    `Você costuma renovar este estilo a cada cerca de ${weeks} semana${weeks === 1 ? "" : "s"}.`,
  insightRepeatServiceFallback: (days) =>
    `Seu intervalo mais comum com este cuidado é de cerca de ${days} dias.`,
  insightDaysSinceLast: (days) =>
    `Seu último registro nesta linha foi há ${days} dias.`,
  recLineLastStyle: (service, days) =>
    `Seu último ${service.toLowerCase()} foi há ${days} dias. Talvez seja um bom momento para renovar o estilo.`,
  recLineRhythmWeeks: (weeks) =>
    `Você costuma renovar este estilo a cada cerca de ${weeks} semana${weeks === 1 ? "" : "s"}.`,
  recLineTopShop: (shop, months) =>
    `${shop} aparece como sua escolha mais frequente nos últimos ${months} meses.`,
  recLinePriceBand: (min, max) =>
    `Seus registros costumam concentrar-se entre R$ ${min.toFixed(0)} e R$ ${max.toFixed(0)}.`,
  recLineReturnSoon: (days) =>
    `Há ${days} dias desde o seu último cuidado — um bom momento para planejar o retorno.`,
  ctaBookAgain: "Voltar a esta casa",
  ctaDetails: "Ver detalhes",
  ctaRatePhoto: "Registrar nova foto",
  ctaAddPhoto: "Registrar nova foto",
  compactRebook: "Repetir atendimento",
  compactRated: "Avaliado",
  compactNoRating: "Sem nota",
  compactHasPhoto: "Com foto",
};

export function getClientHistoryCopy(identity: Identity): ClientHistoryCopy {
  return identity === "vintage" ? vintage : modern;
}
