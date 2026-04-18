import { 
  LayoutDashboard, 
  Monitor, 
  Store, 
  Wallet, 
  ShoppingBag, 
  type LucideIcon 
} from "lucide-react";

/**
 * Macroárea única: Operação (Modern) / Movimento da casa (Vintage).
 * Agrupa vitrine, balcão, recebimentos, atendimentos e panorama sem inflar o menu lateral.
 */

export const BARBER_OPERACAO_ENTRY = "/barbeiro/operacao";

/** Rotas que pertencem à zona Operação (menu único + subnave). */
export function isBarberOperacaoZone(pathname: string): boolean {
  if (pathname.startsWith("/barbeiro/financeiro")) return true;
  if (pathname.startsWith("/barbeiro/historico")) return true;
  if (pathname.startsWith("/barbeiro/loja")) return true;
  if (pathname.startsWith(BARBER_OPERACAO_ENTRY)) return true;
  return false;
}

export type OperacaoTab = {
  path: string;
  labelModern: string;
  labelVintage: string;
  icon: LucideIcon;
  /** Corresponde pathname atual (prefixo para financeiro). */
  isActive: (pathname: string) => boolean;
};

export const BARBER_OPERACAO_TABS: OperacaoTab[] = [
  {
    path: "/barbeiro/loja/dashboard",
    labelModern: "Visão geral",
    labelVintage: "Panorama",
    icon: LayoutDashboard,
    isActive: (p) => p === "/barbeiro/loja/dashboard",
  },
  {
    path: "/barbeiro/historico",
    labelModern: "Cadeira",
    labelVintage: "Cadeira",
    icon: Monitor,
    isActive: (p) => p.startsWith("/barbeiro/historico"),
  },
  {
    path: "/barbeiro/loja",
    labelModern: "Loja",
    labelVintage: "Vitrine",
    icon: Store,
    isActive: (p) => p === "/barbeiro/loja" || (p.startsWith("/barbeiro/loja/") && !p.startsWith("/barbeiro/loja/pedidos") && !p.startsWith("/barbeiro/loja/dashboard")),
  },
  {
    path: "/barbeiro/financeiro",
    labelModern: "Recebimentos",
    labelVintage: "Recebimentos",
    icon: Wallet,
    isActive: (p) => p.startsWith("/barbeiro/financeiro"),
  },
  {
    path: "/barbeiro/loja/pedidos",
    labelModern: "Balcão",
    labelVintage: "Balcão",
    icon: ShoppingBag,
    isActive: (p) => p.startsWith("/barbeiro/loja/pedidos"),
  },
];

export function operacaoPageTitle(pathname: string, isModern: boolean): string {
  const tab = BARBER_OPERACAO_TABS.find((t) => t.isActive(pathname));
  if (tab) return isModern ? tab.labelModern : tab.labelVintage;
  if (pathname.startsWith("/barbeiro/financeiro")) return isModern ? "Recebimentos" : "Recebimentos";
  return isModern ? "Operação" : "Movimento da casa";
}
