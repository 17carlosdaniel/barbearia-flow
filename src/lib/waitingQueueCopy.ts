import type { Identity } from "@/contexts/ThemeContext";

export interface WaitingQueueCopy {
  pageTitle: string;
  pageSubtitle: string;
  topAlertOn: string;
  /** Quando alertas já estão ligados */
  topAlertActive: string;
  topAlertOff: string;
  /** Título da seção (sempre visível acima do card) */
  statusBlockHeading: string;
  /** Bloco 1 — status */
  statusSectionSubtitle: string;
  statusEmptyTitle: string;
  statusEmptyBody: string;
  statusEmptyCtaPrimary: string;
  statusEmptyCtaSecondary: string;
  statusActiveSectionTitle: string;
  statusActiveLabelPosition: string;
  statusActiveLabelWait: string;
  statusActiveLabelBarbershop: string;
  statusActiveLabelService: string;
  alertAhead: string;
  alertTurn: string;
  actionReceiveAlerts: string;
  actionSwitchQueue: string;
  actionCancelEntry: string;
  actionOtherHouses: string;
  actionLeaveQueue: string;
  loadingQueue: string;
  /** Bloco 2 — oportunidades */
  opportunitiesTitle: string;
  opportunitiesSubtitle: string;
  slotsEmptyTitle: string;
  slotsEmptyBody: string;
  slotsCtaActivateAlerts: string;
  conciergeLabel: string;
  shopNextSlot: string;
  shopQueue: string;
  shopDistance: string;
  shopWaitAvg: string;
  ctaEnterQueue: string;
  ctaGuaranteeSlot: string;
  slotListExpires: string;
  /** Bloco 3 — engajamento */
  engagementTitle: string;
  engagementSubtitle: string;
  referTitle: string;
  referBody: string;
  referCta: string;
  rewardsRecent: string;
  missionCtaDo: string;
  /** Bloco 4 — personalização */
  personalizationTitle: string;
  personalizationSubtitle: string;
  personalizationSurveyCta: string;
  personalizationSurveyDone: string;
  /** Rodapé */
  footerShowcaseTitle: string;
  footerShowcaseSubtitle: string;
  footerBenefitsTitle: string;
  footerBenefitsSubtitle: string;
  footerCtaDetails: string;
  /** Layout */
  containerClass: string;
}

const modern: WaitingQueueCopy = {
  pageTitle: "Fila de espera",
  pageSubtitle: "Acompanhe sua posição e entre no próximo horário disponível com mais rapidez.",
  topAlertOn: "Ativar alertas",
  topAlertActive: "Alertas ativos",
  topAlertOff: "Alertas desativados",
  statusBlockHeading: "Seu status agora",
  statusSectionSubtitle: "Situação atual da sua fila e o que fazer em seguida.",
  statusEmptyTitle: "Você não está em nenhuma fila",
  statusEmptyBody:
    "No momento, você ainda não entrou em uma fila de espera. Quando entrar, sua posição e as atualizações aparecerão aqui.",
  statusEmptyCtaPrimary: "Ver horários disponíveis",
  statusEmptyCtaSecondary: "Explorar barbearias próximas",
  statusActiveSectionTitle: "Sua posição na fila",
  statusActiveLabelPosition: "Posição atual",
  statusActiveLabelWait: "Tempo estimado",
  statusActiveLabelBarbershop: "Barbearia",
  statusActiveLabelService: "Serviço escolhido",
  alertAhead: "Aviso: falta 1",
  alertTurn: "Aviso: minha vez",
  actionReceiveAlerts: "Receber aviso de vaga",
  actionSwitchQueue: "Trocar de fila",
  actionCancelEntry: "Cancelar entrada",
  actionOtherHouses: "Ver outras casas",
  actionLeaveQueue: "Sair da fila",
  loadingQueue: "Carregando sua posição…",
  opportunitiesTitle: "Oportunidades disponíveis",
  opportunitiesSubtitle: "Estas barbearias têm maior chance de liberar um horário em breve.",
  slotsEmptyTitle: "Nenhuma vaga aberta neste momento",
  slotsEmptyBody: "Ative alertas para ser avisado quando surgir um horário.",
  slotsCtaActivateAlerts: "Ativar alertas",
  conciergeLabel: "Sugestão prioritária",
  shopNextSlot: "Próxima vaga estimada",
  shopQueue: "Na fila",
  shopDistance: "Distância",
  shopWaitAvg: "Espera média",
  ctaEnterQueue: "Entrar na fila",
  ctaGuaranteeSlot: "Garantir horário",
  slotListExpires: "Lista expira em",
  engagementTitle: "Aproveite a espera",
  engagementSubtitle: "Faça ações rápidas e acumule benefícios enquanto aguarda.",
  referTitle: "Indique um amigo",
  referBody: "Ganhe pontos quando o convidado concluir o primeiro serviço.",
  referCta: "Abrir indicação",
  rewardsRecent: "Benefícios recentes",
  missionCtaDo: "Fazer agora",
  personalizationTitle: "Personalize sua experiência",
  personalizationSubtitle:
    "Responda rapidamente para receber sugestões mais alinhadas ao seu perfil.",
  personalizationSurveyCta: "Continuar",
  personalizationSurveyDone: "Resposta registrada",
  footerShowcaseTitle: "Casas em destaque",
  footerShowcaseSubtitle: "Seleção curta para decidir com rapidez.",
  footerBenefitsTitle: "Benefícios disponíveis",
  footerBenefitsSubtitle: "Promoções e vantagens ativas para você.",
  footerCtaDetails: "Ver detalhes",
  containerClass: "max-w-5xl mx-auto space-y-10 pb-8",
};

const vintage: WaitingQueueCopy = {
  pageTitle: "Sua vez está chegando",
  pageSubtitle: "Acompanhe sua espera e descubra as melhores opções para ser atendido no momento certo.",
  topAlertOn: "Avisar quando abrir horário",
  topAlertActive: "Avisos ativos",
  topAlertOff: "Avisos desligados",
  statusBlockHeading: "Sua espera",
  statusSectionSubtitle: "O essencial da sua espera, em linguagem clara.",
  statusEmptyTitle: "Nenhuma espera ativa no momento",
  statusEmptyBody:
    "Você ainda não entrou em uma fila. Assim que escolher uma casa, acompanharemos tudo por aqui para você.",
  statusEmptyCtaPrimary: "Ver casas com agenda próxima",
  statusEmptyCtaSecondary: "Explorar atendimento agora",
  statusActiveSectionTitle: "Sua espera nesta casa",
  statusActiveLabelPosition: "Posição",
  statusActiveLabelWait: "Horário estimado",
  statusActiveLabelBarbershop: "Casa selecionada",
  statusActiveLabelService: "Serviço escolhido",
  alertAhead: "Avisar: falta uma vez",
  alertTurn: "Avisar: sua vez",
  actionReceiveAlerts: "Receber aviso",
  actionSwitchQueue: "Ver outras casas",
  actionCancelEntry: "Sair da fila",
  actionOtherHouses: "Ver outras casas",
  actionLeaveQueue: "Sair da fila",
  loadingQueue: "Atualizando sua espera…",
  opportunitiesTitle: "Casas com atendimento mais próximo",
  opportunitiesSubtitle: "Selecionamos opções com maior chance de encaixe para você neste momento.",
  slotsEmptyTitle: "Ainda não há horários livres neste instante",
  slotsEmptyBody: "Podemos avisar você assim que uma nova vaga surgir.",
  slotsCtaActivateAlerts: "Avisar quando abrir horário",
  conciergeLabel: "Sugestão concierge",
  shopNextSlot: "Próximo encaixe",
  shopQueue: "Na fila",
  shopDistance: "Distância",
  shopWaitAvg: "Tempo de espera",
  ctaEnterQueue: "Entrar nesta fila",
  ctaGuaranteeSlot: "Garantir horário",
  slotListExpires: "Oferta expira em",
  engagementTitle: "Enquanto você aguarda",
  engagementSubtitle:
    "Aproveite este tempo para desbloquear vantagens e melhorar sua experiência no BarberFlow.",
  referTitle: "Indique um amigo",
  referBody: "Compartilhe o BarberFlow e ganhe vantagens quando o convidado for atendido.",
  referCta: "Participar",
  rewardsRecent: "Vantagens recentes",
  missionCtaDo: "Participar",
  personalizationTitle: "Seu perfil de estilo",
  personalizationSubtitle:
    "Descubra preferências que ajudam a recomendar serviços e experiências mais alinhadas com você.",
  personalizationSurveyCta: "Avançar",
  personalizationSurveyDone: "Preferência salva",
  footerShowcaseTitle: "Casas em destaque",
  footerShowcaseSubtitle: "Marcas e experiências em destaque para você.",
  footerBenefitsTitle: "Vantagens para hoje",
  footerBenefitsSubtitle: "Promoções, condições especiais e benefícios da casa ou do app.",
  footerCtaDetails: "Ver detalhes",
  containerClass: "max-w-4xl mx-auto space-y-14 pb-10",
};

export function getWaitingQueueCopy(identity: Identity): WaitingQueueCopy {
  return identity === "vintage" ? vintage : modern;
}
