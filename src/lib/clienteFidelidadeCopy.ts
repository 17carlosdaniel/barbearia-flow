import type { Identity } from "@/contexts/ThemeContext";

export interface ClienteFidelidadeCopy {
  flowTitle: string;
  flowSubtitle: string;
  tabSummary: string;
  tabAchievements: string;
  tabEarn: string;
  /** Aba 1 — progresso */
  blockProgressTitle: string;
  blockProgressLead: string;
  levelLine: (level: string) => string;
  pointsBalance: string;
  pointsToNextLevel: (missing: number, nextLevel: string) => string;
  progressHint: string;
  currentLevelBenefit: (level: string) => string;
  nextUnlockHint: (rewardTitle: string, missing: number) => string;
  nextUnlockTop: string;
  ctaSeeHowToEarn: string;
  /** Próximas ações */
  blockActionsTitle: string;
  blockActionsLead: string;
  actionDoNow: string;
  actionInProgress: string;
  actionAvailable: string;
  staticActionBook: string;
  staticActionBookPts: string;
  staticActionReview: string;
  staticActionReviewPts: string;
  staticActionRefer: string;
  staticActionReferPts: string;
  staticActionWeekly: string;
  staticActionWeeklyPts: string;
  /** Recompensas */
  blockRewardsTitle: string;
  blockRewardsLead: string;
  rewardsEmpty: string;
  redeemNow: string;
  redeeming: string;
  ptsCost: (n: number) => string;
  nearUnlock: (title: string, missing: number) => string;
  /** Indicação */
  blockReferTitle: string;
  blockReferLead: string;
  yourCode: string;
  copyCode: string;
  useFriendCode: string;
  codePlaceholder: string;
  applyCode: string;
  metricRegistered: string;
  metricQualified: string;
  metricRewarded: string;
  metricRewardsPaid: string;
  /** Movimentações */
  blockLedgerTitle: string;
  blockLedgerLead: string;
  ledgerEmpty: string;
  ptsSigned: (n: number) => string;
  /** Vintage: loja */
  blockShopTitle: string;
  blockShopLead: string;
  shopEmpty: string;
  lastRedemptions: string;
  /** Vintage: social */
  blockSocialTitle: string;
  blockSocialLead: string;
  socialProgressLabel: string;
  socialConnections: (n: number, max: number) => string;
  socialStreak: (n: number) => string;
  friendCodeLabel: string;
  friendCodePlaceholder: string;
  aliasOptional: string;
  connectFriend: string;
  connectSuccess: string;
  connectError: string;
  suggestedPeople: string;
  searchPeoplePlaceholder: string;
  suggestedEmpty: string;
  rankingTitle: string;
  you: string;
  /** Modern: ranking compacto */
  compactRankingTitle: string;
  compactRankingLead: string;
  /** Conquistas aba 2 */
  achHeroTitle: string;
  achHeroLead: string;
  achStatUnlocked: string;
  achStatOpen: string;
  achStatClose: string;
  achStatRare: string;
  achNearTitle: string;
  achNearLead: string;
  achNearEmpty: string;
  achContinue: string;
  achUnlockedTitle: string;
  achUnlockedLead: string;
  achUnlockedEmpty: string;
  achUnlockedEmptyLead: string;
  achLockedTitle: string;
  achLockedLead: string;
  badgeMeta: (n: number) => string;
  badgeEarned: string;
  missionsTitle: string;
  missionsLead: string;
  missionsEmpty: string;
  missionProgress: (cur: number, tgt: number) => string;
  missionClaim: string;
  missionProcessing: string;
  missionPending: string;
  viewAllMissions: string;
  missionRewardsRecent: string;
  /** Ganhar pontos aba 3 */
  earnHowTitle: string;
  earnHowLead: string;
  earnCategoriesTitle: string;
  catAppointments: string;
  catParticipation: string;
  catRelationship: string;
  catMissions: string;
  catSocial: string;
  vintageCatAttendance: string;
  vintageCatChallenges: string;
  vintageCatPresence: string;
  earnTipsTitle: string;
  earnTipsLead: string;
  earnTip1: string;
  earnTip2: string;
  earnTip3: string;
  earnTip4: string;
  vintageTipsTitle: string;
  vintageTipsLead: string;
  vintageTip1: string;
  vintageTip2: string;
  vintageTip3: string;
  vintageTip4: string;
  historyFullTitle: string;
  historyFullLead: string;
  historyEmpty: string;
}

const modern: ClienteFidelidadeCopy = {
  flowTitle: "Fidelidade",
  flowSubtitle:
    "Acompanhe sua evolução, acumule pontos e desbloqueie vantagens no BarberFlow.",
  tabSummary: "Resumo",
  tabAchievements: "Conquistas",
  tabEarn: "Ganhar pontos",
  blockProgressTitle: "Seu progresso",
  blockProgressLead:
    "Veja seu saldo atual, o próximo nível e as vantagens já disponíveis.",
  levelLine: (level) => `Nível ${level}`,
  pointsBalance: "Pontos acumulados",
  pointsToNextLevel: (missing, nextLevel) =>
    `Faltam ${missing} pontos para chegar ao nível ${nextLevel}`,
  progressHint: "Complete ações para avançar no programa",
  currentLevelBenefit: (level) =>
    `Benefício do nível ${level}: prioridade em ofertas e acúmulo acelerado de pontos.`,
  nextUnlockHint: (title, missing) =>
    `Próximo benefício: ${title} — faltam ${missing} pontos.`,
  nextUnlockTop: "Você já está no topo do programa no momento.",
  ctaSeeHowToEarn: "Ver formas de pontuar",
  blockActionsTitle: "Próximas ações",
  blockActionsLead: "Estas ações ajudam você a subir de nível mais rápido.",
  actionDoNow: "Fazer agora",
  actionInProgress: "Em andamento",
  actionAvailable: "Disponível",
  staticActionBook: "Concluir um agendamento",
  staticActionBookPts: "+10 pts",
  staticActionReview: "Avaliar atendimento",
  staticActionReviewPts: "+5 pts",
  staticActionRefer: "Indicar um amigo",
  staticActionReferPts: "+20 pts",
  staticActionWeekly: "Completar missão semanal",
  staticActionWeeklyPts: "+40 a +80 pts",
  blockRewardsTitle: "Recompensas disponíveis",
  blockRewardsLead:
    "Benefícios que você já pode usar ou está perto de desbloquear.",
  rewardsEmpty:
    "Você ainda não liberou recompensas. Continue pontuando para desbloquear vantagens.",
  redeemNow: "Resgatar",
  redeeming: "Resgatando...",
  ptsCost: (n) => `${n} pts`,
  nearUnlock: (title, missing) => `${title} — faltam ${missing} pts`,
  blockReferTitle: "Indique e ganhe",
  blockReferLead:
    "Convide amigos e receba pontos quando eles concluírem o primeiro agendamento.",
  yourCode: "Seu código",
  copyCode: "Copiar",
  useFriendCode: "Usar código de um amigo",
  codePlaceholder: "Digite o código",
  applyCode: "Aplicar",
  metricRegistered: "Convidados cadastrados",
  metricQualified: "Convidados qualificados",
  metricRewarded: "Recompensas geradas",
  metricRewardsPaid: "Recompensas pagas",
  blockLedgerTitle: "Últimas movimentações",
  blockLedgerLead: "Acompanhe como seus pontos foram acumulados.",
  ledgerEmpty:
    "Você ainda não tem movimentações. Conclua ações para começar a acumular pontos.",
  ptsSigned: (n) => (n >= 0 ? `+${n} pts` : `${n} pts`),
  blockShopTitle: "Loja de recompensas",
  blockShopLead: "Troque pontos por vantagens.",
  shopEmpty: "A loja ficará disponível quando você acumular pontos suficientes.",
  lastRedemptions: "Últimos resgates",
  blockSocialTitle: "Entre amigos",
  blockSocialLead: "Ranking e conexões.",
  socialProgressLabel: "Progresso social",
  socialConnections: (n, max) => `${n}/${max} conexões`,
  socialStreak: (n) => `Streak social: ${n} dia(s)`,
  friendCodeLabel: "Código do amigo",
  friendCodePlaceholder: "Código do amigo",
  aliasOptional: "Apelido (opcional)",
  connectFriend: "Conectar amigo",
  connectSuccess: "Conexão criada com sucesso.",
  connectError: "Verifique o código e tente novamente.",
  suggestedPeople: "Sugestões",
  searchPeoplePlaceholder: "Buscar por nome ou interesse",
  suggestedEmpty: "Nenhum resultado. Tente outro termo ou use o código.",
  rankingTitle: "Ranking entre amigos",
  you: "Você",
  compactRankingTitle: "Ranking rápido",
  compactRankingLead: "Sua posição entre conexões.",
  achHeroTitle: "Suas conquistas",
  achHeroLead:
    "Acompanhe os marcos que você já alcançou e os próximos objetivos do seu perfil.",
  achStatUnlocked: "Conquistadas",
  achStatOpen: "Em aberto",
  achStatClose: "Próximas",
  achStatRare: "Raras",
  achNearTitle: "Mais próximas de desbloquear",
  achNearLead: "Continue nessas ações para liberar novas conquistas.",
  achNearEmpty: "Todas as conquistas visíveis já foram desbloqueadas ou não há metas ativas.",
  achContinue: "Continuar progresso",
  achUnlockedTitle: "Já desbloqueadas",
  achUnlockedLead: "Marcos já concluídos na sua trajetória no BarberFlow.",
  achUnlockedEmpty: "Nenhuma conquista liberada ainda",
  achUnlockedEmptyLead:
    "Complete ações e atendimentos para começar sua coleção.",
  achLockedTitle: "Próximas conquistas",
  achLockedLead: "Descubra o que falta para liberar novos marcos.",
  badgeMeta: (n) => `Meta: ${n}`,
  badgeEarned: "Conquistado",
  missionsTitle: "Missões ativas",
  missionsLead:
    "Tarefas com prazo que ajudam você a acumular pontos mais rápido.",
  missionsEmpty: "Nenhuma missão ativa no momento. Volte em breve.",
  missionProgress: (cur, tgt) => `Progresso: ${cur}/${tgt}`,
  missionClaim: "Resgatar",
  missionProcessing: "Processando...",
  missionPending: "Em progresso",
  viewAllMissions: "Ver todas as missões",
  missionRewardsRecent: "Recompensas recentes de missões",
  earnHowTitle: "Como pontuar",
  earnHowLead:
    "Estas ações geram pontos e ajudam você a subir de nível no programa.",
  earnCategoriesTitle: "Ações que geram pontos",
  catAppointments: "Atendimentos",
  catParticipation: "Participação",
  catRelationship: "Relacionamento",
  catMissions: "Missões",
  catSocial: "Social",
  vintageCatAttendance: "Atendimentos",
  vintageCatChallenges: "Desafios",
  vintageCatPresence: "Presença no clube",
  earnTipsTitle: "Como avançar mais rápido",
  earnTipsLead:
    "Algumas ações ajudam você a pontuar melhor no curto prazo.",
  earnTip1: "Conclua missões semanais",
  earnTip2: "Avalie seus atendimentos",
  earnTip3: "Use o programa de indicação",
  earnTip4: "Mantenha frequência nas visitas",
  vintageTipsTitle: "Caminhos para subir de nível",
  vintageTipsLead:
    "Algumas ações aceleram sua evolução e abrem vantagens mais cedo.",
  vintageTip1: "Mantenha frequência de visitas",
  vintageTip2: "Conclua desafios semanais",
  vintageTip3: "Convide amigos",
  vintageTip4: "Registre avaliações após cada atendimento",
  historyFullTitle: "Histórico de pontos",
  historyFullLead:
    "Veja quando seus pontos foram creditados e por quais ações.",
  historyEmpty:
    "Você ainda não acumulou pontos. Conclua uma ação elegível para iniciar seu histórico.",
};

const vintage: ClienteFidelidadeCopy = {
  flowTitle: "Clube BarberFlow",
  flowSubtitle:
    "Sua trajetória no clube, seus marcos e as vantagens que acompanham seu cuidado.",
  tabSummary: "Seu Clube",
  tabAchievements: "Conquistas",
  tabEarn: "Como evoluir",
  blockProgressTitle: "Sua trajetória no clube",
  blockProgressLead:
    "Veja seu nível atual, acompanhe sua evolução e descubra o que espera por você no próximo marco.",
  levelLine: (level) => `Você está no nível ${level}`,
  pointsBalance: "Pontos no clube",
  pointsToNextLevel: (missing, nextLevel) =>
    `Faltam ${missing} pontos para alcançar o nível ${nextLevel}`,
  progressHint: "Seu próximo marco libera novas vantagens dentro do clube",
  currentLevelBenefit: (level) =>
    `Vantagens do nível ${level}: experiências e acúmulo com assinatura do clube.`,
  nextUnlockHint: (title, missing) =>
    `Próxima vantagem: ${title} — faltam ${missing} pontos.`,
  nextUnlockTop: "Você já brilha no topo do clube, por enquanto.",
  ctaSeeHowToEarn: "Descobrir próximas vantagens",
  blockActionsTitle: "Próximos passos no clube",
  blockActionsLead: "Ações que aceleram sua evolução e fortalecem sua presença.",
  actionDoNow: "Participar agora",
  actionInProgress: "Em ritmo",
  actionAvailable: "Disponível",
  staticActionBook: "Concluir um atendimento",
  staticActionBookPts: "+10 pts",
  staticActionReview: "Deixar avaliação",
  staticActionReviewPts: "+5 pts",
  staticActionRefer: "Convidar um amigo",
  staticActionReferPts: "+20 pts",
  staticActionWeekly: "Fechar o desafio da semana",
  staticActionWeeklyPts: "+40 a +80 pts",
  blockRewardsTitle: "Vantagens do seu momento",
  blockRewardsLead:
    "Benefícios já disponíveis para você e vantagens que estão logo adiante.",
  rewardsEmpty:
    "Suas vantagens ainda estão por vir. Continue acumulando pontos para abrir novos benefícios.",
  redeemNow: "Resgatar",
  redeeming: "Resgatando...",
  ptsCost: (n) => `${n} pts`,
  nearUnlock: (title, missing) => `${title} — faltam ${missing} pts`,
  blockReferTitle: "Convide sua tribo",
  blockReferLead:
    "Traga amigos para o clube e acumule pontos quando eles começarem a usar o BarberFlow.",
  yourCode: "Seu código de convite",
  copyCode: "Copiar",
  useFriendCode: "Usar código de um amigo",
  codePlaceholder: "Código",
  applyCode: "Aplicar",
  metricRegistered: "Amigos convidados",
  metricQualified: "Amigos qualificados",
  metricRewarded: "Recompensas geradas",
  metricRewardsPaid: "Recompensas pagas",
  blockLedgerTitle: "Últimas movimentações",
  blockLedgerLead: "Como seus pontos entraram na sua trajetória.",
  ledgerEmpty:
    "Ainda não há movimentações. Complete uma ação do clube para começar.",
  ptsSigned: (n) => (n >= 0 ? `+${n} pts` : `${n} pts`),
  blockShopTitle: "Loja de recompensas",
  blockShopLead:
    "Troque seus pontos por vantagens, experiências e condições especiais.",
  shopEmpty:
    "A loja ficará disponível quando você acumular pontos suficientes para resgates.",
  lastRedemptions: "Últimos resgates",
  blockSocialTitle: "Entre amigos",
  blockSocialLead:
    "Acompanhe sua posição, conecte pessoas e fortaleça sua presença no clube.",
  socialProgressLabel: "Sua presença social",
  socialConnections: (n, max) => `${n}/${max} conexões`,
  socialStreak: (n) => `Ritmo social: ${n} dia(s)`,
  friendCodeLabel: "Código do amigo",
  friendCodePlaceholder: "Código do amigo",
  aliasOptional: "Apelido (opcional)",
  connectFriend: "Conectar amigo",
  connectSuccess: "Conexão criada com sucesso.",
  connectError: "Verifique o código e tente novamente.",
  suggestedPeople: "Pessoas que você pode conhecer",
  searchPeoplePlaceholder: "Buscar por nome ou interesse",
  suggestedEmpty:
    "Nenhum resultado. Tente outro termo ou conecte pelo código.",
  rankingTitle: "Ranking no clube",
  you: "Você",
  compactRankingTitle: "Seu lugar no ranking",
  compactRankingLead: "Entre as suas conexões.",
  achHeroTitle: "Suas conquistas",
  achHeroLead:
    "Cada marco registra sua evolução dentro do clube e destaca como você vive a experiência BarberFlow.",
  achStatUnlocked: "Marcos conquistados",
  achStatOpen: "Em aberto",
  achStatClose: "Quase lá",
  achStatRare: "Distinções raras",
  achNearTitle: "Mais próximas de conquistar",
  achNearLead: "Falta pouco para desbloquear estes marcos.",
  achNearEmpty: "Não há marcos pendentes nesta faixa.",
  achContinue: "Participar agora",
  achUnlockedTitle: "Marcos já conquistados",
  achUnlockedLead: "Conquistas que já fazem parte da sua trajetória.",
  achUnlockedEmpty: "Sua coleção ainda está começando",
  achUnlockedEmptyLead:
    "Complete atendimentos e ações no clube para liberar seus primeiros marcos.",
  achLockedTitle: "Próximos marcos",
  achLockedLead: "Continue no ritmo para liberar novas distinções dentro do clube.",
  badgeMeta: (n) => `Meta: ${n}`,
  badgeEarned: "Conquistado",
  missionsTitle: "Desafios do momento",
  missionsLead: "Ações em destaque para ganhar pontos extras nesta semana.",
  missionsEmpty: "Nenhum desafio ativo agora. Volte em breve.",
  missionProgress: (cur, tgt) => `Progresso: ${cur}/${tgt}`,
  missionClaim: "Resgatar",
  missionProcessing: "Processando...",
  missionPending: "Em andamento",
  viewAllMissions: "Participar agora",
  missionRewardsRecent: "Bônus recentes dos desafios",
  earnHowTitle: "Como ganhar pontos",
  earnHowLead:
    "Descubra as ações que fortalecem sua trajetória no clube.",
  earnCategoriesTitle: "Formas de pontuar",
  catAppointments: "Atendimentos",
  catParticipation: "Participação",
  catRelationship: "Indicação",
  catMissions: "Desafios",
  catSocial: "Presença",
  vintageCatAttendance: "Atendimentos",
  vintageCatChallenges: "Desafios",
  vintageCatPresence: "Presença no clube",
  earnTipsTitle: "Caminhos para subir de nível",
  earnTipsLead:
    "Algumas ações aceleram sua evolução e abrem vantagens mais cedo.",
  earnTip1: "Mantenha frequência de visitas",
  earnTip2: "Conclua desafios semanais",
  earnTip3: "Convide amigos",
  earnTip4: "Registre avaliações após cada atendimento",
  vintageTipsTitle: "Caminhos para subir de nível",
  vintageTipsLead:
    "Algumas ações aceleram sua evolução e abrem vantagens mais cedo.",
  vintageTip1: "Mantenha frequência de visitas",
  vintageTip2: "Conclua desafios semanais",
  vintageTip3: "Convide amigos",
  vintageTip4: "Registre avaliações após cada atendimento",
  historyFullTitle: "Histórico de pontos",
  historyFullLead:
    "Seus créditos e bônus aparecerão aqui conforme sua trajetória avança.",
  historyEmpty:
    "Sua jornada de pontos ainda não começou. Complete uma ação do clube para iniciar seu histórico.",
};

export function getClienteFidelidadeCopy(identity: Identity): ClienteFidelidadeCopy {
  return identity === "vintage" ? vintage : modern;
}
