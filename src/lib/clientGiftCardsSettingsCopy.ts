import type { Identity } from "@/contexts/ThemeContext";

export type GiftCardSettingsModalCopy = {
  openButtonLabel: string;
  title: string;
  subtitle: string;
  sectionAppearance: string;
  sectionDisplay: string;
  sectionInteraction: string;
  sectionPrivacy: string;
  visualThemeLabel: string;
  visualThemeVintage: string;
  visualThemeModern: string;
  visualThemeTooltip: string;
  accentLabel: string;
  accentTooltip: string;
  accentChipHint: string;
  friendsDisplayLabel: string;
  friendsDisplayLeadLista: string;
  friendsDisplayLeadCards: string;
  friendsLista: string;
  friendsCards: string;
  soundLabel: string;
  soundDesc: string;
  quickSuggestionsLabel: string;
  quickSuggestionsDesc: string;
  prefillNameLabel: string;
  prefillNameDesc: string;
  privacyLabel: string;
  privacyDesc: string;
  footerHint: string;
  closeButton: string;
  chipsDisabledHint: string;
};

const modern: GiftCardSettingsModalCopy = {
  openButtonLabel: "Preferências",
  title: "Preferências",
  subtitle: "Ajuste como você monta e visualiza seus gift cards nesta tela. Tudo salva automaticamente.",
  sectionAppearance: "Aparência",
  sectionDisplay: "Exibição",
  sectionInteraction: "Interações",
  sectionPrivacy: "Privacidade",
  visualThemeLabel: "Tema visual",
  visualThemeVintage: "Vintage",
  visualThemeModern: "Moderno",
  visualThemeTooltip: "Define o estilo editorial do app (tipografia e clima). Vale para o BarberFlow inteiro.",
  accentLabel: "Cor de destaque",
  accentTooltip: "Cor dos botões e destaques só nesta experiência de gift card.",
  accentChipHint: "Ativa",
  friendsDisplayLabel: "Exibição de contatos",
  friendsDisplayLeadLista: "Lista horizontal — rápida para escolher.",
  friendsDisplayLeadCards: "Cards — mais detalhe por pessoa.",
  friendsLista: "Lista",
  friendsCards: "Cards",
  soundLabel: "Sons ao usar o fluxo",
  soundDesc: "Feedback sonoro ao tocar em opções e ao gerar o gift card.",
  quickSuggestionsLabel: "Sugestões de mensagem",
  quickSuggestionsDesc: "Mostra atalhos de frases na etapa de dedicatória.",
  prefillNameLabel: "Nome com o contato",
  prefillNameDesc: "Ao escolher alguém na lista, preenche o nome do presenteado se estiver vazio.",
  privacyLabel: "Ocultar meu perfil",
  privacyDesc: "Não aparece nas sugestões de amigos desta tela.",
  footerHint: "Alterações aplicadas na hora — não precisa salvar.",
  closeButton: "Fechar",
  chipsDisabledHint: "Ative ‘Sugestões de mensagem’ em Preferências para ver atalhos de frase aqui.",
};

const vintage: GiftCardSettingsModalCopy = {
  openButtonLabel: "Ajustes",
  title: "Ajustes da experiência",
  subtitle: "Personalize como seus presentes e contatos aparecem ao criar um gift card. Cada mudança vale na hora.",
  sectionAppearance: "Estilo visual",
  sectionDisplay: "Exibição",
  sectionInteraction: "Toques da experiência",
  sectionPrivacy: "Privacidade",
  visualThemeLabel: "Ambiente visual",
  visualThemeVintage: "Vintage",
  visualThemeModern: "Moderno",
  visualThemeTooltip: "Muda o clima geral do BarberFlow (tipos e detalhes visuais), não só desta página.",
  accentLabel: "Destaque principal",
  accentTooltip: "Tom de ouro, azul, roxo ou verde nos botões e realces deste presente.",
  accentChipHint: "Tom",
  friendsDisplayLabel: "Forma de exibir amigos",
  friendsDisplayLeadLista: "Carrossel compacto — ideal para escolher rápido.",
  friendsDisplayLeadCards: "Cartões — mais contexto e presença.",
  friendsLista: "Lista",
  friendsCards: "Cards",
  soundLabel: "Sons sutis",
  soundDesc: "Ao escolher opções e ao concluir o presente.",
  quickSuggestionsLabel: "Sugestões de dedicatória",
  quickSuggestionsDesc: "Frases prontas para acelerar sem perder o carinho.",
  prefillNameLabel: "Nome ao tocar no contato",
  prefillNameDesc: "Preenche o nome do presenteado quando você escolhe alguém na lista (se o campo estiver vazio).",
  privacyLabel: "Não mostrar meu perfil",
  privacyDesc: "Sai das sugestões de amigos neste fluxo.",
  footerHint: "",
  closeButton: "Fechar",
  chipsDisabledHint: "Ative ‘Sugestões de dedicatória’ nos ajustes da experiência para ver frases prontas.",
};

export function getGiftCardSettingsModalCopy(identity: Identity): GiftCardSettingsModalCopy {
  return identity === "vintage" ? vintage : modern;
}
