import type { Identity } from "@/contexts/ThemeContext";

export type ClientGiftCardsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  redeemTopAction: string;
  redeemDialogTitle: string;
  redeemDialogLead: string;
  redeemInputLabel: string;
  redeemWalletPrefix: string;
  redeemPlaceholder: string;
  redeemButton: string;
  redeemButtonLoading: string;
  redeemSuccessTitle: string;
  redeemSuccessLead: string;
  redeemParallelHint: string;
  step1Title: string;
  step1Lead: string;
  step2Title: string;
  step2Lead: string;
  step3Title: string;
  step3Lead: string;
  step4Title: string;
  step4Lead: string;
  giftSummaryTitle: string;
  giftSummaryServiceLabel: string;
  giftSummaryValueLabel: string;
  giftSummaryVintageTagline: string;
  giftSummaryVintageTaglineCredit: string;
  packageDetailsLabel: string;
  customValueLabel: string;
  friendSectionEyebrow: string;
  friendSectionSearchPlaceholder: string;
  friendAddAction: string;
  recipientNameLabel: string;
  recipientNamePlaceholder: string;
  messageFieldLabel: string;
  messagePlaceholder: string;
  friendsEmptyTitle: string;
  friendsEmptyHint: string;
  reviewSignature: string;
  reviewRowGift: string;
  reviewRowValue: string;
  reviewRowRecipient: string;
  reviewRowMessage: string;
  reviewNoMessage: string;
  reviewStatusLabel: string;
  reviewStatusReady: string;
  previewEmpty: string;
  previewGuestFallback: string;
  generateCta: string;
  secondaryCtaEdit: string;
  copyCodeButton: string;
  useNowButton: string;
  processingEyebrow: string;
  processingLead: string;
  processingSub: string;
  doneTitle: string;
  doneDeliveryPreview: string;
  doneCreateAnother: string;
  quickMessages: string[];
  /** Toasts — use {amount} onde for valor monetário */
  toastSelectGiftTitle: string;
  toastRecipientRequiredTitle: string;
  toastCreatedTitle: string;
  toastCreatedDesc: string;
  toastBonusTitle: string;
  toastBonusDesc: string;
  toastRedeemMissingTitle: string;
  toastRedeemMissingDesc: string;
  toastRedeemUsedTitle: string;
  toastRedeemUsedDesc: string;
  toastRedeemInvalidTitle: string;
  toastRedeemInvalidDesc: string;
  toastRedeemOkTitle: string;
  toastRedeemOkDesc: string;
  toastCopiedTitle: string;
  toastCopiedDesc: string;
  toastCopiedRedeemDesc: string;
  toastAddFriendNameTitle: string;
  toastAddFriendOkTitle: string;
  toastAddFriendOkDesc: string;
  toastDiscoverUserUnavailableTitle: string;
  toastDiscoverUserUnavailableDesc: string;
  toastDiscoverRequestPendingTitle: string;
  toastDiscoverRequestPendingDesc: string;
  toastDiscoverSentTitle: string;
  toastDiscoverSentDesc: string;
};

const modern: ClientGiftCardsCopy = {
  pageTitle: "Criar gift card",
  pageSubtitle:
    "Crie um presente em poucos passos e compartilhe serviços ou crédito com quem você quiser.",
  redeemTopAction: "Resgatar código",
  redeemDialogTitle: "Recebeu um gift card?",
  redeemDialogLead: "Informe o código para liberar o saldo ou serviço vinculado.",
  redeemInputLabel: "Código do gift card",
  redeemWalletPrefix: "Saldo atual:",
  redeemPlaceholder: "Ex.: BF-2048-AX91",
  redeemButton: "Resgatar código",
  redeemButtonLoading: "Validando…",
  redeemSuccessTitle: "Saldo liberado",
  redeemSuccessLead: "adicionados ao seu saldo Barbeflow.",
  redeemParallelHint: "Tem um código? Resgatar gift card",
  step1Title: "Escolha o formato",
  step1Lead: "Selecione o presente ideal.",
  step2Title: "Defina o destinatário",
  step2Lead: "Escolha um cliente ou informe o nome de quem vai receber.",
  step3Title: "Adicione uma mensagem",
  step3Lead: "Inclua uma mensagem opcional.",
  step4Title: "Revisar envio",
  step4Lead: "Revise os dados antes de gerar o gift card.",
  giftSummaryTitle: "Resumo do gift",
  giftSummaryServiceLabel: "Serviço selecionado",
  giftSummaryValueLabel: "Valor",
  giftSummaryVintageTagline: "",
  giftSummaryVintageTaglineCredit: "",
  packageDetailsLabel: "Inclusões",
  customValueLabel: "Valor do crédito",
  friendSectionEyebrow: "Contatos recentes, favoritos e busca manual",
  friendSectionSearchPlaceholder: "Buscar por nome ou @username",
  friendAddAction: "Adicionar aos contatos",
  recipientNameLabel: "Nome do presenteado",
  recipientNamePlaceholder: "Nome do presenteado",
  messageFieldLabel: "Mensagem",
  messagePlaceholder: "Escreva uma mensagem para acompanhar o presente",
  friendsEmptyTitle: "Nenhum contato recente encontrado",
  friendsEmptyHint: "Busque um nome ou preencha manualmente os dados do presenteado.",
  reviewSignature: "Gift card BarberFlow",
  reviewRowGift: "Gift",
  reviewRowValue: "Valor",
  reviewRowRecipient: "Para",
  reviewRowMessage: "Mensagem",
  reviewNoMessage: "—",
  reviewStatusLabel: "Status do envio",
  reviewStatusReady: "Pronto para gerar",
  previewEmpty: "Escolha um gift acima",
  previewGuestFallback: "Presenteado",
  generateCta: "Gerar gift card",
  secondaryCtaEdit: "Voltar e editar",
  copyCodeButton: "Copiar código",
  useNowButton: "Usar agora",
  processingEyebrow: "Gerando",
  processingLead: "Preparando o gift card para",
  processingSub: "Validando dados e gerando seu código…",
  doneTitle: "Gift card pronto",
  doneDeliveryPreview: "Resumo do envio",
  doneCreateAnother: "Criar outro gift card",
  quickMessages: [
    "Parabéns pelo seu dia",
    "Aproveite seu presente",
    "Um cuidado por sua conta",
    "Feito para você",
  ],
  toastSelectGiftTitle: "Escolha um gift",
  toastRecipientRequiredTitle: "Informe o presenteado",
  toastCreatedTitle: "Gift card criado",
  toastCreatedDesc: "Compartilhe o código com quem vai usar o crédito.",
  toastBonusTitle: "Pontos extras",
  toastBonusDesc: "Você ganhou +5 pontos por presentear. Em breve isso entra automaticamente na sua conta.",
  toastRedeemMissingTitle: "Informe o código",
  toastRedeemMissingDesc: "Digite o código do gift card para liberar o crédito.",
  toastRedeemUsedTitle: "Código já utilizado",
  toastRedeemUsedDesc: "Esse código já foi resgatado.",
  toastRedeemInvalidTitle: "Código não encontrado",
  toastRedeemInvalidDesc: "Confira o código e tente de novo.",
  toastRedeemOkTitle: "Crédito liberado",
  toastRedeemOkDesc: "R$ {amount} adicionados ao seu saldo Barbeflow.",
  toastCopiedTitle: "Código copiado",
  toastCopiedDesc: "Cole onde quiser compartilhar o gift card.",
  toastCopiedRedeemDesc: "Se quiser, envie para alguém ou guarde para uso próprio.",
  toastAddFriendNameTitle: "Informe o nome",
  toastAddFriendOkTitle: "Contato salvo",
  toastAddFriendOkDesc: "Você pode presentear essa pessoa nas próximas vezes.",
  toastDiscoverUserUnavailableTitle: "Perfil indisponível",
  toastDiscoverUserUnavailableDesc: "Não foi possível identificar essa pessoa para o pedido.",
  toastDiscoverRequestPendingTitle: "Pedido já enviado",
  toastDiscoverRequestPendingDesc: "Aguarde a resposta nas notificações.",
  toastDiscoverSentTitle: "Pedido enviado",
  toastDiscoverSentDesc: "A pessoa receberá o convite nas notificações.",
};

const vintage: ClientGiftCardsCopy = {
  pageTitle: "Presenteie com BarberFlow",
  pageSubtitle: "Ofereça um cuidado especial com um presente pronto para enviar.",
  redeemTopAction: "Tenho um código",
  redeemDialogTitle: "Recebeu um presente especial?",
  redeemDialogLead: "Insira o código para liberar seu gift card e aproveitar a experiência.",
  redeemInputLabel: "Código do presente",
  redeemWalletPrefix: "Seu saldo:",
  redeemPlaceholder: "Ex.: BF-2048-AX91",
  redeemButton: "Liberar presente",
  redeemButtonLoading: "Desbloqueando…",
  redeemSuccessTitle: "Presente liberado",
  redeemSuccessLead: "já estão no seu saldo para usar quando quiser.",
  redeemParallelHint: "Recebeu um presente? Toque aqui",
  step1Title: "Escolha a experiência",
  step1Lead: "Selecione o presente que melhor combina com a ocasião.",
  step2Title: "Para quem vai este presente",
  step2Lead: "Escolha quem vai receber esta experiência.",
  step3Title: "Sua dedicatória",
  step3Lead: "Adicione uma mensagem para tornar o presente ainda mais especial.",
  step4Title: "Cartão pronto para entregar",
  step4Lead: "Veja como o cartão será apresentado antes de gerar o gift card.",
  giftSummaryTitle: "Presente escolhido",
  giftSummaryServiceLabel: "Experiência",
  giftSummaryValueLabel: "Valor",
  giftSummaryVintageTagline: "Para um cuidado completo",
  giftSummaryVintageTaglineCredit: "Crédito para ele escolher como usar.",
  packageDetailsLabel: "O que torna esse presente especial",
  customValueLabel: "Valor do presente",
  friendSectionEyebrow: "Pessoas frequentes e busca",
  friendSectionSearchPlaceholder: "Buscar pessoa por nome ou @username",
  friendAddAction: "Lembrar deste contato",
  recipientNameLabel: "Nome de quem vai receber",
  recipientNamePlaceholder: "Nome de quem vai receber",
  messageFieldLabel: "Sua mensagem",
  messagePlaceholder: "Escreva sua dedicatória",
  friendsEmptyTitle: "Nenhum contato sugerido por enquanto",
  friendsEmptyHint: "Busque alguém pelo nome ou preencha os dados do presenteado manualmente.",
  reviewSignature: "BarberFlow — presente com cuidado",
  reviewRowGift: "Experiência",
  reviewRowValue: "Valor",
  reviewRowRecipient: "Para",
  reviewRowMessage: "Mensagem",
  reviewNoMessage: "Sem dedicatória",
  reviewStatusLabel: "Seu presente",
  reviewStatusReady: "Pronto para enviar",
  previewEmpty: "Escolha uma experiência",
  previewGuestFallback: "Seu convidado",
  generateCta: "Gerar presente",
  secondaryCtaEdit: "Ajustar detalhes",
  copyCodeButton: "Copiar código",
  useNowButton: "Usar agora",
  processingEyebrow: "Preparando",
  processingLead: "Montando o cartão para",
  processingSub: "Quase lá — selando seu presente…",
  doneTitle: "Presente pronto",
  doneDeliveryPreview: "Como vai chegar",
  doneCreateAnother: "Montar outro presente",
  quickMessages: [
    "Parabéns pelo seu dia",
    "Aproveite seu presente",
    "Um cuidado por sua conta",
    "Presente para você relaxar",
    "Feito para você",
  ],
  toastSelectGiftTitle: "Escolha uma experiência primeiro",
  toastRecipientRequiredTitle: "Diga para quem é o presente",
  toastCreatedTitle: "Seu presente está pronto",
  toastCreatedDesc: "Envie o código para quem você quer mimar.",
  toastBonusTitle: "Obrigado por presentear",
  toastBonusDesc: "Você ganhou +5 pontos — em breve somamos tudo automaticamente na sua jornada.",
  toastRedeemMissingTitle: "Falta o código",
  toastRedeemMissingDesc: "Cole o código do presente para liberar o valor.",
  toastRedeemUsedTitle: "Esse presente já foi aberto",
  toastRedeemUsedDesc: "O código já foi usado. Se tiver dúvida, fale com quem te enviou.",
  toastRedeemInvalidTitle: "Código não bateu",
  toastRedeemInvalidDesc: "Confira com calma e tente outra vez.",
  toastRedeemOkTitle: "Presente recebido",
  toastRedeemOkDesc: "R$ {amount} já estão no seu saldo para usar quando quiser.",
  toastCopiedTitle: "Código copiado",
  toastCopiedDesc: "Cole na mensagem ou no app para compartilhar o gesto.",
  toastCopiedRedeemDesc: "Guarde ou compartilhe — o valor já é seu.",
  toastAddFriendNameTitle: "Como essa pessoa se chama?",
  toastAddFriendOkTitle: "Pessoa anotada",
  toastAddFriendOkDesc: "Ficará na sua lista para os próximos presentes.",
  toastDiscoverUserUnavailableTitle: "Não deu para convidar",
  toastDiscoverUserUnavailableDesc: "Essa sugestão ainda não tem perfil completo para pedido de amizade.",
  toastDiscoverRequestPendingTitle: "Convite já na estrada",
  toastDiscoverRequestPendingDesc: "Espere a pessoa aceitar nas notificações.",
  toastDiscoverSentTitle: "Convite enviado",
  toastDiscoverSentDesc: "Quando aceitar, vocês podem trocar presentes com mais facilidade.",
};

export function getClientGiftCardsCopy(identity: Identity): ClientGiftCardsCopy {
  return identity === "vintage" ? vintage : modern;
}
