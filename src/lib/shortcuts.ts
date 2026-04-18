export type ShortcutActionId =
  | "new_product"
  | "orders"
  | "dashboard"
  | "open_cash"
  | "coupons"
  | "finance"
  | "profile"
  | "support";

export type UserShortcut = {
  key: string;
  action: ShortcutActionId;
  useCount?: number;
  createdAt?: string;
  lastUsedAt?: string;
};

export type ShortcutAction = {
  id: ShortcutActionId;
  label: string;
  description: string;
  path: string;
  keywords: string;
};

export const SHORTCUT_ACTIONS_BARBER: ShortcutAction[] = [
  { id: "new_product", label: "Novo produto", description: "Criar item na loja", path: "/barbeiro/loja", keywords: "produto criar cadastrar" },
  { id: "orders", label: "Ver pedidos", description: "Abrir pedidos da loja", path: "/barbeiro/loja/pedidos", keywords: "pedido pedidos vendas" },
  { id: "dashboard", label: "Visão geral", description: "Panorama da operação", path: "/barbeiro/loja/dashboard", keywords: "dashboard metricas relatorio operacao" },
  { id: "open_cash", label: "Abrir caixa", description: "Fluxo de venda rápida", path: "/barbeiro/loja/pedidos", keywords: "caixa pdv finalizar" },
  { id: "coupons", label: "Cupons", description: "Gerenciar descontos", path: "/barbeiro/loja", keywords: "cupom desconto promocao" },
  { id: "finance", label: "Recebimentos", description: "Entradas e indicadores", path: "/barbeiro/financeiro", keywords: "financeiro recebimentos lucro receita" },
  { id: "profile", label: "Perfil", description: "Configurações da conta", path: "/barbeiro/perfil", keywords: "perfil conta configuracao" },
  { id: "support", label: "Suporte", description: "Ajuda e contato", path: "/suporte", keywords: "suporte ajuda contato" },
];

export const BLOCKED_SHORTCUTS = new Set([
  // Navegação / abas
  "CTRL+W",
  "CTRL+SHIFT+W",
  "CTRL+F4",
  "CTRL+T",
  "CTRL+SHIFT+T",
  "CTRL+N",
  "CTRL+SHIFT+N",
  "CTRL+L",
  "CTRL+TAB",
  "CTRL+SHIFTTAB",
  "CTRL+PAGEDOWN",
  "CTRL+PAGEUP",
  "CTRL+SHIFT+PAGEDOWN",
  "CTRL+SHIFT+PAGEUP",
  // Browser actions
  "CTRL+R",
  "CTRL+SHIFT+R",
  "CTRL+F5",
  "CTRL+F",
  "CTRL+H",
  "CTRL+J",
  "CTRL+D",
  "CTRL+S",
  "CTRL+P",
  "CTRL+U",
  "CTRL+O",
  "CTRL+SHIFT+O",
  "CTRL+SHIFT+B",
  "CTRL+SHIFT+M",
  "CTRL+SHIFT+J",
  "CTRL+G",
  "CTRL+SHIFT+G",
  "CTRL+SHIFT+D",
  // DevTools / fullscreen
  "F5",
  "F1",
  "F3",
  "F11",
  "F12",
  "F10",
  "F7",
  "F6",
  "CTRL+SHIFT+I",
  "CTRL+SHIFT+J",
  "CTRL+SHIFT+C",
  // Navegação/back/forward
  "ALT+HOME",
  "ALT+LEFT",
  "ALT+RIGHT",
  // Painel/foco Chrome
  "ALT+F",
  "ALT+E",
  "SHIFT+ESC",
  "SHIFT+ALT+T",
  "SHIFT+ALT+N",
  // Inputs/ações
  "CTRL+SHIFT+DELETE",
  // Zoom
  "CTRL+PLUS",
  "CTRL+MINUS",
  "CTRL+0",
  // Cursor/edição
  "CTRL+LEFT",
  "CTRL+RIGHT",
  "CTRL+BACKSPACE",
  // Split view / carets / etc.
  "CTRL+F6",
  "ALT+SHIFT+I",
  "ALT+SHIFT+A",
  // Supressão de overflow do Chrome (escape/cancelar)
  "ESCAPE",
  // Fechar janela/aba com modificador
  "ALT+F4",
  // Print/refresh variation
  "SHIFT+F5",
  // Seleções de múltiplas guias (2-step no Chrome; bloq do chord final)
  "CTRL+SHIFT+H",
]);

export const shortcutStorageKey = (role: "barbeiro" | "cliente", userId?: string) =>
  `barberflow_user_shortcuts_${role}_${userId ?? "default"}`;

export const quickActionsStorageKey = (role: "barbeiro" | "cliente", userId?: string) =>
  `barberflow_quick_actions_${role}_${userId ?? "default"}`;

export const shortcutsEnabledStorageKey = (role: "barbeiro" | "cliente", userId?: string) =>
  `barberflow_shortcuts_enabled_${role}_${userId ?? "default"}`;

export function normalizeShortcut(combo: string): string {
  return combo
    .toUpperCase()
    .replace(/\s+/g, "")
    .split("+")
    .filter(Boolean)
    .join("+");
}

export function comboFromKeyboardEvent(event: KeyboardEvent): string | null {
  let key = event.key?.toUpperCase();
  if (!key || key === "CONTROL" || key === "SHIFT" || key === "ALT" || key === "META") return null;

  // Chrome/OS often report zoom keys as "+" / "-" which would break our "+"-delimited normalization.
  if (key === "+") key = "PLUS";
  if (key === "-") key = "MINUS";

  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("CTRL");
  if (event.shiftKey) parts.push("SHIFT");
  if (event.altKey) parts.push("ALT");
  parts.push(key.length === 1 ? key : key.replace(/^ARROW/, ""));
  return normalizeShortcut(parts.join("+"));
}

export function isBrowserReservedShortcut(combo: string): boolean {
  const normalized = normalizeShortcut(combo);
  if (BLOCKED_SHORTCUTS.has(normalized)) return true;
  // Evita sobrepor combinações comuns Ctrl+1..9 de troca de abas
  if (/^CTRL\+[1-9]$/.test(normalized)) return true;
  return false;
}

