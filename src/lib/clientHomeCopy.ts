import type { Identity } from "@/contexts/ThemeContext";

export type ClientHomeCopy = {
  hero: {
    titleLead: (firstName: string) => string;
    titleAccent: string;
    subtitle: (city: string) => string;
    cta: string;
    pill: (city: string, slots: number) => string;
  };
  act1: { aria: string; ribbon?: string };
  act2: {
    aria: string;
    /** Vintage: uma linha que introduz atalhos + vagas no mesmo fôlego */
    leadVintage: string;
    /** Modern: rótulo curto acima dos atalhos (disponibilidade vem antes no layout) */
    quickLabelModern: string;
  };
  momentSection: string;
  availabilityTitle: string;
  slotHint: string;
  agendaLink: string;
  exploreEyebrow: string;
  exploreTitle: string;
  continuity: {
    aria: string;
    title: string;
    subtitle: string;
    historyLabel: string;
    favoritesLabel: string;
    affinityLabel: string;
    affinityHint: string;
    historyCta: string;
    /** Vintage: linha curta antes dos favoritos (sem parecer novo bloco) */
    favoritesBridge: string;
  };
  discovery: {
    aria: string;
    title: string;
    subtitle: string;
    opportunitiesLabel: string;
    opportunitiesAside: string;
    opportunitiesStripTitle: string;
    stylesEyebrow: string;
    stylesTitle: string;
    stylesSubtitle: string;
    stylesCta: string;
    featuredLabel: string;
    exploreHint: string;
  };
};

const cityPlaceholder = "São Paulo";

export function getClientHomeCopy(identity: Identity): ClientHomeCopy {
  if (identity === "vintage") {
    return {
      hero: {
        titleLead: (firstName) => `${firstName}, `,
        titleAccent: "bora ficar no estilo hoje?",
        subtitle: (_city: string) =>
          "Encontre um horário nas melhores barbearias da sua região e resolva seu visual em poucos toques.",
        cta: "Ver horários disponíveis",
        pill: (city, slots) => `${city} · ${slots} horários livres hoje`,
      },
      act1: { aria: "Agir agora", ribbon: "Agir agora" },
      act2: {
        aria: "Ação rápida — explorar e reservar",
        leadVintage: "Para explorar agora — caminhos rápidos e horários disponíveis no mesmo lugar.",
        quickLabelModern: "Acessos rápidos",
      },
      momentSection: "Seu momento agora",
      availabilityTitle: "Horários disponíveis agora",
      slotHint: "Próxima vaga",
      agendaLink: "Ver agenda completa",
      exploreEyebrow: "Explorar agora",
      exploreTitle: "Para explorar agora",
      continuity: {
        aria: "Continuar sua jornada",
        title: "Continue de onde parou",
        subtitle: "Onde você já esteve, o que guardou e o que combina com seu estilo — em sequência.",
        historyLabel: "Com base no seu histórico",
        favoritesLabel: "Seus favoritos",
        affinityLabel: "O que combina com você",
        affinityHint: "Toque para refinar seu próximo visual na busca.",
        historyCta: "Voltar",
        favoritesBridge: "Também por perto",
      },
      discovery: {
        aria: "Descoberta e inspiração",
        title: "Sugestões pra você",
        subtitle: "Inspiração primeiro, ofertas na sequência — para fechar o dia com estilo.",
        opportunitiesLabel: "Oportunidades de hoje",
        opportunitiesAside: "Últimas oportunidades",
        opportunitiesStripTitle: "O que vale aproveitar hoje",
        stylesEyebrow: "Sugestões pra você",
        stylesTitle: "Estilos em destaque",
        stylesSubtitle: "Estilos em destaque — curadoria para quando quiser mudar o jogo.",
        stylesCta: "Ver mais estilos",
        featuredLabel: "Em destaque",
        exploreHint: "Para explorar agora na busca.",
      },
    };
  }

  return {
    hero: {
      titleLead: () => "",
      titleAccent: "Encontre um horário para hoje",
      subtitle: (_city: string) =>
        "Veja disponibilidade perto de você e agende em poucos passos.",
      cta: "Ver horários de hoje",
      pill: (city, slots) => `${city} · ${slots} vagas hoje`,
    },
    act1: { aria: "Próxima ação" },
    act2: {
      aria: "Disponibilidade e acessos rápidos",
      leadVintage: "",
      quickLabelModern: "Acessos rápidos",
    },
    momentSection: "Próxima ação",
    availabilityTitle: "Disponibilidade de hoje",
    slotHint: "Próximas vagas",
    agendaLink: "Agenda completa",
    exploreEyebrow: "Acessos rápidos",
    exploreTitle: "Mais procurados",
    continuity: {
      aria: "Continuidade",
      title: "Continue de onde parou",
      subtitle: "Histórico, favoritos e recomendações no mesmo fluxo.",
      historyLabel: "Histórico recente",
      favoritesLabel: "Favoritos",
      affinityLabel: "Recomendados para você",
      affinityHint: "Com base no que você costuma buscar.",
      historyCta: "Continuar",
      favoritesBridge: "Salvos",
    },
    discovery: {
      aria: "Ofertas e serviços em alta",
      title: "Para agendar agora",
      subtitle: "Promoções ativas e cortes em alta — ir direto à busca.",
      opportunitiesLabel: "Oportunidades do dia",
      opportunitiesAside: "Válido hoje",
      opportunitiesStripTitle: "Ofertas rápidas",
      stylesEyebrow: "Serviços em alta",
      stylesTitle: "Estilos em destaque",
      stylesSubtitle: "Toque para ir à busca com filtro sugerido.",
      stylesCta: "Ver busca",
      featuredLabel: "Em alta",
      exploreHint: "Disponível na busca.",
    },
  };
}

export { cityPlaceholder };
