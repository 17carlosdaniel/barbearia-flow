import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLogoutFlow } from "@/contexts/LogoutFlowContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Scissors,
  Gift,
  User,
  UserCircle,
  Users,
  UsersRound,
  History,
  CreditCard,
  WalletCards,
  HelpCircle,
  CircleHelp,
  Menu,
  X,
  Search,
  Home,
  Star,
  Sparkles,
  BookOpen,
  BookMarked,
  Store,
  LayoutGrid,
  LogOut,
  ChevronLeft,
  Camera,
  Trophy,
  Award,
  ShoppingBag,
  ShoppingCart,
  Bell,
  BellRing,
  Shield,
  SearchCheck,
  Command,
  BadgeCheck,
  Activity,
  Radio,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  comboFromKeyboardEvent,
  isBrowserReservedShortcut,
  quickActionsStorageKey,
  SHORTCUT_ACTIONS_BARBER,
  shortcutsEnabledStorageKey,
  shortcutStorageKey,
  type UserShortcut,
} from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { getBarbershopProfile, setBarbershopProfile } from "@/lib/barbershopProfile";
import { isPlatformOwnerEmail } from "@/lib/platformOwner";
import BarberOperacaoSubnav from "@/components/barber/BarberOperacaoSubnav";
import {
  BARBER_OPERACAO_ENTRY,
  isBarberOperacaoZone,
  operacaoPageTitle,
} from "@/lib/barberOperacaoNav";
import { BARBER_NAV_GROUPS, CLIENT_NAV_GROUPS } from "@/lib/dashboardNavGroups";

/** Peso visual dos ícones no menu Modern (varia por rota). */
type ModernNavIconWeight = "light" | "default" | "strong";

function modernNavIconWeightForPath(path: string): ModernNavIconWeight {
  if (path === "/barbeiro" || path === "/cliente") return "light";
  if (path === BARBER_OPERACAO_ENTRY || path.includes("/assinatura")) return "strong";
  return "default";
}

function modernNavStroke(weight: ModernNavIconWeight, active: boolean): number {
  if (active) {
    if (weight === "strong") return 2.5;
    if (weight === "light") return 2.05;
    return 2.3;
  }
  if (weight === "strong") return 2.05;
  if (weight === "light") return 1.65;
  return 1.9;
}

interface NavItem {
  label: string;
  /** Rótulo alternativo no tema Vintage (ex.: macroárea Operação). */
  labelVintage?: string;
  path: string;
  iconVintage: LucideIcon;
  iconModern: LucideIcon;
}

const barberNav: NavItem[] = [
  { label: "Agenda", path: "/barbeiro", iconVintage: Calendar, iconModern: CalendarCheck },
  /* Vagas livres: só pelo modal “Preencher vagas” na agenda — rota /barbeiro/vagas redireciona para /barbeiro */
  { label: "Minha Barbearia", path: "/barbeiro/minha-barbearia", iconVintage: Store, iconModern: LayoutGrid },
  /* Menu CRM / Clientes: oculto até próxima atualização. Rotas em App.tsx mantidas.
     Reativar: descomente a linha abaixo. */
  // { label: "Clientes", path: "/barbeiro/clientes", iconVintage: Users, iconModern: UsersRound },
  { label: "Equipe", path: "/barbeiro/equipe", iconVintage: Users, iconModern: UsersRound },
  { label: "Serviços", path: "/barbeiro/servicos", iconVintage: Scissors, iconModern: Sparkles },
  {
    label: "Operação",
    labelVintage: "Movimento da casa",
    path: BARBER_OPERACAO_ENTRY,
    iconVintage: Radio,
    iconModern: Activity,
  },
  { label: "Notificações", path: "/barbeiro/notificacoes", iconVintage: Bell, iconModern: BellRing },
  { label: "Avaliações", path: "/barbeiro/avaliacoes", iconVintage: Star, iconModern: Award },
  { label: "Guia", path: "/guia", iconVintage: BookOpen, iconModern: BookMarked },
  { label: "Assinatura", path: "/barbeiro/assinatura", iconVintage: CreditCard, iconModern: WalletCards },
  { label: "Perfil", path: "/barbeiro/perfil", iconVintage: User, iconModern: UserCircle },
  { label: "Privacidade", path: "/privacidade", iconVintage: Shield, iconModern: Shield },
  { label: "Suporte", path: "/suporte", iconVintage: HelpCircle, iconModern: CircleHelp },
];

const clientNav: NavItem[] = [
  { label: "Início", path: "/cliente", iconVintage: Home, iconModern: Home },
  { label: "Buscar", path: "/cliente/buscar", iconVintage: Search, iconModern: Search },
  { label: "Agendamentos", path: "/cliente/agendamentos", iconVintage: Calendar, iconModern: CalendarCheck },
  { label: "Histórico", path: "/cliente/historico", iconVintage: History, iconModern: History },
  { label: "Fidelidade", path: "/cliente/fidelidade", iconVintage: Trophy, iconModern: Award },
  { label: "Gift Cards", path: "/cliente/gift-cards", iconVintage: Gift, iconModern: Gift },
  { label: "Loja", path: "/cliente/loja", iconVintage: ShoppingBag, iconModern: ShoppingCart },
  { label: "Notificações", path: "/cliente/notificacoes", iconVintage: Bell, iconModern: BellRing },
  { label: "Guia", path: "/guia", iconVintage: BookOpen, iconModern: BookMarked },
  { label: "Perfil", path: "/cliente/perfil", iconVintage: User, iconModern: UserCircle },
  { label: "Privacidade", path: "/privacidade", iconVintage: Shield, iconModern: Shield },
  { label: "Suporte", path: "/suporte", iconVintage: HelpCircle, iconModern: CircleHelp },
];

const BARBER_LOGIN_INTRO_KEY = "barberflow_barber_login_intro";
const BARBER_ONBOARDING_SEEN_PREFIX = "barberflow_barber_onboarding_seen";

interface DashboardLayoutProps {
  children: ReactNode;
  userType?: "barbeiro" | "cliente";
  role?: "barbeiro" | "cliente";
  /** Esconde a sidebar no desktop e oferece menu via botão (fluxos que precisam de mais foco). */
  immersive?: boolean;
}

const DashboardLayout = ({ children, userType, role, immersive = false }: DashboardLayoutProps) => {
  const resolvedRole = role ?? userType ?? "cliente";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutUsage, setShortcutUsage] = useState<Record<string, number>>({});
  const [customShortcuts, setCustomShortcuts] = useState<UserShortcut[]>([]);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const [barbershopProfileTick, setBarbershopProfileTick] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { beginLogout } = useLogoutFlow();
  const { identity, setIdentity } = useTheme();
  const links = resolvedRole === "barbeiro" ? barberNav : clientNav;
  const navGroupsResolved = useMemo(() => {
    const defs = resolvedRole === "barbeiro" ? BARBER_NAV_GROUPS : CLIENT_NAV_GROUPS;
    return defs.map((g) => ({
      ...g,
      items: g.paths.map((p) => links.find((l) => l.path === p)).filter((x): x is NavItem => !!x),
    }));
  }, [resolvedRole, links]);
  const barbershopOwnerVerified = useMemo(() => {
    if (resolvedRole !== "barbeiro" || user?.barbershopId == null) return false;
    return !!getBarbershopProfile(user.barbershopId).ownerVerified;
  }, [resolvedRole, user?.barbershopId, barbershopProfileTick]);
  const showOwnerVerifiedControl =
    resolvedRole === "barbeiro" && user?.barbershopId != null && isPlatformOwnerEmail(user.email);
  const pageTitle = useMemo(() => {
    /* Rota ainda existe; item do menu pode estar oculto — título neutro no topo. */
    if (resolvedRole === "barbeiro" && location.pathname.startsWith("/barbeiro/clientes")) {
      return "CRM";
    }
    if (resolvedRole === "barbeiro" && location.pathname === "/barbeiro/minha-barbearia") {
      return identity === "modern" ? "Minha Barbearia" : "Gestão da barbearia";
    }
    if (resolvedRole === "barbeiro" && isBarberOperacaoZone(location.pathname)) {
      return operacaoPageTitle(location.pathname, identity === "modern");
    }
    const current = links.find((item) => item.path === location.pathname);
    const navLabel =
      current?.labelVintage && identity === "vintage" ? current.labelVintage : current?.label;
    return navLabel ?? "Painel";
  }, [links, location.pathname, resolvedRole, identity]);
  const barberHeaderKicker = useMemo(() => {
    if (resolvedRole !== "barbeiro") return "BarberFlow Control";
    if (isBarberOperacaoZone(location.pathname)) {
      return identity === "modern" ? "Operação" : "Movimento da casa";
    }
    if (location.pathname === "/barbeiro/minha-barbearia") {
      return identity === "modern" ? "Painel de gestão" : "Seu painel";
    }
    return "BarberFlow Control";
  }, [resolvedRole, location.pathname, identity]);

  /** Notificações Vintage: o `NotificationCenter` traz cabeçalho editorial; evita duplicar título e chips de “painel”. */
  const hideBarberSurfaceHeader =
    resolvedRole === "barbeiro" &&
    identity === "vintage" &&
    location.pathname === "/barbeiro/notificacoes";

  const isPrimaryActionPath = (path: string) => {
    if (resolvedRole === "cliente") return path === "/cliente/buscar" || path === "/cliente/agendamentos";
    return path === "/barbeiro" || path === "/barbeiro/servicos";
  };
  const shortcutGroups = useMemo(() => {
    if (resolvedRole === "barbeiro") {
      return [
        {
          heading: "Operação",
          items: [
            { id: "operacao-entrada", label: "Abrir operação", hint: "Panorama e seções da operação", path: BARBER_OPERACAO_ENTRY, keywords: "operacao movimento casa painel" },
            { id: "novo-produto", label: "Novo produto", hint: "Cadastrar item na vitrine", path: "/barbeiro/loja", keywords: "produto criar cadastrar loja item" },
            { id: "pedidos", label: "Pedidos / balcão", hint: "Vendas e PDV", path: "/barbeiro/loja/pedidos", keywords: "pedido pedidos venda loja" },
            { id: "cupons", label: "Cupons", hint: "Criar e gerenciar cupons", path: "/barbeiro/loja", keywords: "cupom cupons desconto" },
            { id: "caixa", label: "Abrir caixa", hint: "Fluxo rápido de venda", path: "/barbeiro/loja/pedidos", keywords: "caixa pdv vender finalizar" },
            { id: "dashboard-loja", label: "Visão geral", hint: "Indicadores do período", path: "/barbeiro/loja/dashboard", keywords: "dashboard metricas relatorio loja" },
            { id: "historico-barbeiro", label: "Atendimentos", hint: "Registros na cadeira", path: "/barbeiro/historico", keywords: "historico atendimento cadeira" },
            { id: "financeiro", label: "Recebimentos", hint: "Entradas e indicadores", path: "/barbeiro/financeiro", keywords: "financeiro receita lucro caixa" },
          ],
        },
        {
          heading: "Sistema",
          items: [
            { id: "perfil", label: "Perfil", hint: "Dados da conta", path: "/barbeiro/perfil", keywords: "perfil conta usuario" },
            { id: "suporte", label: "Suporte", hint: "Ajuda e contato", path: "/suporte", keywords: "ajuda suporte contato" },
          ],
        },
      ];
    }
    return [
      {
        heading: "Atalhos",
        items: [
          { id: "buscar", label: "Buscar barbearias", hint: "Encontrar serviços e horários", path: "/cliente/buscar", keywords: "buscar barbearia servico" },
          { id: "agendamentos", label: "Meus agendamentos", hint: "Ver agenda", path: "/cliente/agendamentos", keywords: "agenda agendamento horario" },
          { id: "loja", label: "Ir para loja", hint: "Produtos e ofertas", path: "/cliente/loja", keywords: "loja produto comprar" },
        ],
      },
    ];
  }, [resolvedRole]);

  const sortedShortcutGroups = useMemo(
    () =>
      shortcutGroups.map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => (shortcutUsage[b.id] ?? 0) - (shortcutUsage[a.id] ?? 0)),
      })),
    [shortcutGroups, shortcutUsage],
  );

  useEffect(() => {
    if (resolvedRole !== "barbeiro") return;
    try {
      const shouldShow = sessionStorage.getItem(BARBER_LOGIN_INTRO_KEY) === "1";
      if (!shouldShow) return;
      sessionStorage.removeItem(BARBER_LOGIN_INTRO_KEY);
      const seenKey = `${BARBER_ONBOARDING_SEEN_PREFIX}_${user?.id ?? "default"}`;
      const hasSeen = localStorage.getItem(seenKey) === "1";
      if (hasSeen) return;
      setShowOnboarding(true);
      setOnboardingStep(0);
    } catch {
      // noop
    }
  }, [resolvedRole, user?.id]);

  useEffect(() => {
    try {
      const key = `barberflow_shortcuts_usage_${resolvedRole}`;
      const raw = localStorage.getItem(key);
      if (raw) setShortcutUsage(JSON.parse(raw) as Record<string, number>);
    } catch {
      // noop
    }
  }, [resolvedRole]);

  useEffect(() => {
    try {
      const key = shortcutStorageKey(resolvedRole, user?.id);
      const raw = localStorage.getItem(key);
      if (raw) setCustomShortcuts(JSON.parse(raw) as UserShortcut[]);
      else setCustomShortcuts([]);
    } catch {
      setCustomShortcuts([]);
    }
  }, [resolvedRole, user?.id]);

  useEffect(() => {
    try {
      const key = quickActionsStorageKey(resolvedRole, user?.id);
      const raw = localStorage.getItem(key);
      if (raw) setQuickActions(JSON.parse(raw) as string[]);
      else setQuickActions([]);
    } catch {
      setQuickActions([]);
    }
  }, [resolvedRole, user?.id]);

  useEffect(() => {
    try {
      const key = shortcutsEnabledStorageKey(resolvedRole, user?.id);
      const raw = localStorage.getItem(key);
      if (raw === null) {
        setShortcutsEnabled(true);
        return;
      }
      setShortcutsEnabled(raw === "1");
    } catch {
      setShortcutsEnabled(true);
    }
  }, [resolvedRole, user?.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (!isTyping && shortcutsEnabled) {
        const combo = comboFromKeyboardEvent(event);
        if (combo && !isBrowserReservedShortcut(combo)) {
          const custom = customShortcuts.find((s) => s.key === combo);
          if (custom) {
            const action = SHORTCUT_ACTIONS_BARBER.find((a) => a.id === custom.action);
            if (action) {
              event.preventDefault();
              try {
                const key = shortcutStorageKey(resolvedRole, user?.id);
                const next = customShortcuts.map((s) =>
                  s.key === combo
                    ? {
                        ...s,
                        useCount: (s.useCount ?? 0) + 1,
                        lastUsedAt: new Date().toISOString(),
                      }
                    : s,
                );
                localStorage.setItem(key, JSON.stringify(next));
                setCustomShortcuts(next);
              } catch {
                // noop
              }
              navigate(action.path);
              return;
            }
          }
        }
      }
      const isCtrlK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (!(isCtrlK || isSlash)) return;
      if (isTyping) return;
      event.preventDefault();
      setShortcutsOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [customShortcuts, navigate, shortcutsEnabled]);

  const registerShortcutUsage = (id: string) => {
    setShortcutUsage((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      try {
        localStorage.setItem(`barberflow_shortcuts_usage_${resolvedRole}`, JSON.stringify(next));
      } catch {
        // noop
      }
      return next;
    });
  };

  const onboardingScreens = [
    {
      title: "Bem-vindo ao BarberFlow",
      description: "Gerencie sua agenda, aumente seus clientes e venda mais com sua barbearia.",
      icon: Scissors,
      primaryLabel: "Comecar",
      primaryAction: () => setOnboardingStep(1),
    },
    {
      title: "Tudo em um so lugar",
      description: "Agenda inteligente, pagamento via Pix, gestao de clientes e venda de produtos.",
      icon: Sparkles,
      benefits: ["Agenda inteligente", "Pagamento via Pix", "Gestao de clientes", "Venda de produtos"],
      primaryLabel: "Proximo",
      primaryAction: () => setOnboardingStep(2),
    },
    {
      title: "Vamos comecar pela sua agenda",
      description: "Adicione seus servicos e horarios para comecar a receber agendamentos.",
      icon: CalendarCheck,
      primaryLabel: "Configurar servicos",
      primaryAction: () => {
        setShowOnboarding(false);
        try {
          const seenKey = `${BARBER_ONBOARDING_SEEN_PREFIX}_${user?.id ?? "default"}`;
          localStorage.setItem(seenKey, "1");
        } catch {
          // noop
        }
        navigate("/barbeiro/servicos");
      },
    },
    {
      title: "Pronto",
      description: "Sua barbearia esta quase pronta. Agora e so comecar a usar.",
      icon: Award,
      primaryLabel: "Ir para o painel",
      primaryAction: () => {
        setShowOnboarding(false);
        try {
          const seenKey = `${BARBER_ONBOARDING_SEEN_PREFIX}_${user?.id ?? "default"}`;
          localStorage.setItem(seenKey, "1");
        } catch {
          // noop
        }
      },
    },
  ] as const;

  const finishOnboarding = () => {
    setShowOnboarding(false);
    try {
      const seenKey = `${BARBER_ONBOARDING_SEEN_PREFIX}_${user?.id ?? "default"}`;
      localStorage.setItem(seenKey, "1");
    } catch {
      // noop
    }
  };

  const handleLogout = () => {
    setMobileOpen(false);
    beginLogout();
  };

  const renderNavLink = (link: NavItem) => {
    const navLabel = link.labelVintage && identity === "vintage" ? link.labelVintage : link.label;
    const active =
      link.path === BARBER_OPERACAO_ENTRY
        ? isBarberOperacaoZone(location.pathname)
        : location.pathname === link.path;
    const NavIcon = identity === "modern" ? link.iconModern : link.iconVintage;
    const primaryAction = isPrimaryActionPath(link.path);
    const iconWeight = modernNavIconWeightForPath(link.path);

    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "dashboard-nav-item group relative flex w-full items-center overflow-hidden font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          collapsed ? "justify-center px-2" : "gap-3",
          identity === "modern" ? "rounded-md py-1.5" : "rounded-xl py-2.5",
          !collapsed && "px-3",
          identity === "modern" && !active && !collapsed && "hover:scale-[1.01]",
          active
            ? identity === "modern"
              ? "dashboard-nav-item-active bg-primary/[0.14] text-primary font-semibold"
              : cn(
                  "z-[1] border border-primary/20 bg-primary/[0.07] font-semibold text-primary",
                  "shadow-none",
                )
            : primaryAction
              ? cn(
                  "border border-primary/25 bg-primary/5 text-sidebar-foreground hover:border-primary/40 hover:bg-primary/10",
                  !collapsed && "hover:translate-x-0.5",
                  identity === "modern" &&
                    "rounded-md border-primary/30 hover:shadow-[0_0_28px_-14px_hsl(var(--primary)/0.28)]",
                  identity === "vintage" && "hover:shadow-none",
                )
              : cn(
                  "text-sidebar-foreground hover:bg-sidebar-accent",
                  !collapsed && "hover:translate-x-0.5",
                  identity === "modern" &&
                    "hover:bg-primary/[0.07] hover:text-primary hover:shadow-[0_0_26px_-16px_hsl(var(--primary)/0.24)]",
                  identity === "vintage" && "hover:bg-primary/[0.05]",
                ),
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200",
            identity === "vintage" && active
              ? "h-9 w-0 opacity-0"
              : active
                ? "w-1 opacity-100"
                : "w-0 opacity-0 group-hover:w-0.5 group-hover:opacity-70",
            identity === "modern" && active && "shadow-[0_0_12px_2px_hsl(var(--primary)/0.35)]",
          )}
        />
        {identity === "modern" ? (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md transition-all duration-200 ease-out",
              active
                ? "bg-primary/[0.22] shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.28),0_0_20px_-6px_hsl(var(--primary)/0.45)]"
                : "group-hover:bg-primary/[0.1] group-hover:shadow-[0_0_16px_-8px_hsl(var(--primary)/0.28)]",
            )}
          >
            <NavIcon
              className={cn(
                "h-5 w-5 shrink-0 transition-all duration-200 ease-out group-hover:scale-105",
                active
                  ? "text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
                  : "text-sidebar-foreground group-hover:text-primary",
              )}
              strokeWidth={modernNavStroke(iconWeight, active)}
            />
          </span>
        ) : (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
              active
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-transparent bg-primary/[0.04] text-primary/75 group-hover:border-primary/15 group-hover:bg-primary/[0.08] group-hover:text-primary",
            )}
          >
            <NavIcon className="h-[1.15rem] w-[1.15rem] shrink-0 transition-transform duration-200 ease-out group-hover:scale-105" />
          </span>
        )}
        {!collapsed && (
          <span
            className={cn(
              "min-w-0 truncate",
              identity === "modern" && "text-xs",
              identity === "modern" && active && "tracking-tight",
              identity === "vintage" && "text-[13px] font-medium tracking-normal text-sidebar-foreground/95",
              identity === "vintage" && active && "text-primary",
            )}
          >
            {navLabel}
          </span>
        )}
      </Link>
    );
  };

  const LogoIcon = identity === "vintage" ? Scissors : Sparkles;
  const onOwnerVerifiedChange = (checked: boolean) => {
    if (!user?.barbershopId || !isPlatformOwnerEmail(user.email)) return;
    setBarbershopProfile(user.barbershopId, { ownerVerified: checked });
    setBarbershopProfileTick((t) => t + 1);
  };
  const SidebarContent = () => (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      {identity === "vintage" ? (
        collapsed ? (
          <div className="relative flex h-[4.5rem] shrink-0 items-center justify-center border-b border-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
              <LogoIcon className="h-5 w-5 text-primary" />
            </div>
            {barbershopOwnerVerified && (
              <span className="absolute right-1.5 top-2" title="Barbearia verificada pela BarberFlow">
                <BadgeCheck className="h-3.5 w-3.5 text-primary/90" />
              </span>
            )}
          </div>
        ) : (
          <div className="relative shrink-0 border-b border-primary/10 px-4 pb-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06]">
                <LogoIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="dashboard-brand-text theme-heading block text-lg font-bold leading-tight text-gradient-gold">
                  BarberFlow
                </span>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  {resolvedRole === "cliente" ? "Sua jornada" : "Sua casa"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/55">Classic</p>
              </div>
            </div>
            {barbershopOwnerVerified && (
              <span
                className="mt-3 inline-flex items-center gap-0.5 rounded-full border border-primary/25 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-medium text-primary/90"
                title="Barbearia verificada pela BarberFlow"
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Verificada
              </span>
            )}
          </div>
        )
      ) : (
        <div className="relative flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
          <LogoIcon className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="dashboard-brand-text theme-heading block truncate text-lg font-bold text-gradient-gold">
                BarberFlow
              </span>
              <p className="truncate text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                {resolvedRole === "cliente" ? "Área do cliente" : "Controle"}
              </p>
            </div>
          )}
          {!collapsed && barbershopOwnerVerified && (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-primary/45 bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
              title="Barbearia verificada pela BarberFlow"
            >
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Verificada
            </span>
          )}
          {collapsed && barbershopOwnerVerified && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2" title="Barbearia verificada pela BarberFlow">
              <BadgeCheck className="h-4 w-4 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]" />
            </span>
          )}
        </div>
      )}

      <nav
        className={cn(
          "hide-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain",
          identity === "vintage" ? "space-y-1 px-3 py-5" : "space-y-1 px-3 py-4",
        )}
      >
        {collapsed ? (
          <div className="space-y-1">{links.map(renderNavLink)}</div>
        ) : (
          <div className="space-y-0">
            {navGroupsResolved.map((group, gi) => (
              <div key={group.id} className={cn(gi > 0 && (identity === "vintage" ? "mt-6" : "mt-5"))}>
                <p
                  className={cn(
                    "mb-2 px-3",
                    identity === "vintage"
                      ? "text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/50"
                      : "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/45",
                  )}
                >
                  {identity === "vintage" ? group.titleVintage : group.titleModern}
                </p>
                <div className={cn("flex flex-col", identity === "vintage" ? "gap-1.5" : "gap-0.5")}>
                  {group.items.map(renderNavLink)}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {identity === "vintage" ? (
        <div className="mt-auto shrink-0 space-y-3 border-t border-primary/10 bg-sidebar/30 px-3 pb-4 pt-4">
          {showOwnerVerifiedControl && !collapsed && (
            <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/[0.05] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/80">Plataforma</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs leading-tight text-foreground">Selo verificado na BarberFlow</span>
                <Switch
                  checked={barbershopOwnerVerified}
                  onCheckedChange={onOwnerVerifiedChange}
                  aria-label="Conceder selo verificado a esta barbearia"
                />
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Só quem administra o site pode ativar. Clientes veem o selo no perfil público.
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="rounded-xl border border-primary/12 bg-card/30 px-3 py-3">
              <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                Tema
              </p>
              <div className="flex gap-1 rounded-lg border border-primary/10 bg-background/20 p-1">
                <button
                  type="button"
                  onClick={() => setIdentity("vintage")}
                  className="flex-1 rounded-md px-2 py-2 text-[11px] font-medium tracking-wide transition-colors bg-primary text-primary-foreground"
                >
                  Vintage
                </button>
                <button
                  type="button"
                  onClick={() => setIdentity("modern")}
                  className="flex-1 rounded-md px-2 py-2 text-[11px] font-medium tracking-wide transition-colors text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground"
                >
                  Moderno
                </button>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex flex-col gap-1 px-0.5">
              <button
                type="button"
                onClick={() => setIdentity("vintage")}
                className="rounded-lg py-2 text-[10px] font-semibold transition-colors bg-primary text-primary-foreground"
                title="Vintage"
              >
                V
              </button>
              <button
                type="button"
                onClick={() => setIdentity("modern")}
                className="rounded-lg py-2 text-[10px] font-semibold transition-colors text-muted-foreground hover:bg-sidebar-accent"
                title="Moderno"
              >
                M
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border border-border/60 bg-transparent px-3 py-2.5 text-left text-sm text-muted-foreground transition-all duration-200",
              "hover:border-primary/25 hover:bg-primary/[0.05] hover:text-foreground",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" />
            {!collapsed && <span className="text-[13px] font-medium">Sair</span>}
          </button>
        </div>
      ) : (
        <div className="mt-auto shrink-0 space-y-2 border-t border-sidebar-border bg-sidebar px-3 pb-4 pt-3">
          {showOwnerVerifiedControl && !collapsed && (
            <div className="space-y-1.5 rounded-lg border border-primary/35 bg-primary/[0.07] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Plataforma</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs leading-tight text-foreground">Selo verificado na BarberFlow</span>
                <Switch
                  checked={barbershopOwnerVerified}
                  onCheckedChange={onOwnerVerifiedChange}
                  aria-label="Conceder selo verificado a esta barbearia"
                />
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Só quem administra o site pode ativar. Clientes veem o selo no perfil público.
              </p>
            </div>
          )}
          {!collapsed && (
            <div>
              <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Tema</p>
              <div className="flex gap-1 rounded-md bg-sidebar-accent/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setIdentity("vintage")}
                  className="theme-chip flex-1 rounded-[var(--theme-radius-sm)] px-2 py-1.5 text-xs font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  Vintage
                </button>
                <button
                  type="button"
                  onClick={() => setIdentity("modern")}
                  className="theme-chip-active flex-1 rounded-[var(--theme-radius-sm)] px-2 py-1.5 text-xs font-medium transition-colors bg-primary text-primary-foreground"
                >
                  Moderno
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground transition-all duration-200 hover:scale-[1.01] hover:bg-sidebar-accent hover:text-primary"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.9} />
            {!collapsed && <span className="font-medium">Encerrar sessão</span>}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100vh] bg-background text-foreground flex w-full">
      <aside
        className={cn(
          // Precisa permitir o botao de recolher/expandir "vazar" para fora do aside (posicionado com -right-4).
          "flex-col relative border-r transition-[width,background-color,border-color] duration-300 shrink-0 self-start sticky top-0 h-[100dvh] max-h-[100dvh] overflow-visible z-20",
          immersive ? "hidden" : "hidden md:flex",
          resolvedRole === "barbeiro"
            ? `${identity === "modern" ? "bg-sidebar border-sidebar-border" : "bg-sidebar/95 backdrop-blur-xl border-sidebar-border/80"} ${collapsed ? "w-[74px]" : "w-[272px]"}`
            : `${identity === "vintage" ? "border-sidebar-border/80 bg-sidebar/95 backdrop-blur-xl" : "border-sidebar-border bg-sidebar"} ${collapsed ? "w-16" : "w-60"}`,
        )}
      >
        <SidebarContent />
        {!immersive && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute top-6 -right-4 w-8 h-8 rounded-full border flex items-center justify-center z-30 hidden md:flex transition-all duration-300 shadow-md hover:shadow-lg group",
              identity === "vintage" 
                ? "bg-background border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                : "bg-background border-border text-muted-foreground hover:text-primary hover:border-primary/50"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-all duration-300 group-hover:scale-110",
              collapsed ? "rotate-180" : ""
            )} />
          </button>
        )}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-2 min-w-0">
        <button type="button" onClick={() => setMobileOpen(true)} className="shrink-0">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        <LogoIcon className="h-5 w-5 text-primary shrink-0" />
        <span className="dashboard-brand-text theme-heading text-lg font-bold text-gradient-gold truncate min-w-0">
          BarberFlow
        </span>
        {resolvedRole === "barbeiro" && barbershopOwnerVerified && (
          <BadgeCheck
            className="w-4 h-4 text-primary shrink-0 drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
            aria-label="Barbearia verificada"
          />
        )}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("fixed inset-0 bg-background/80 z-50", !immersive && "md:hidden")}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className={cn(
                "fixed left-0 top-0 bottom-0 w-[min(18rem,92vw)] max-w-[288px] bg-sidebar z-50 flex flex-col overflow-hidden",
                !immersive && "md:hidden",
              )}
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && resolvedRole === "barbeiro" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-background/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-card rounded-2xl px-6 py-5 min-w-[320px] max-w-[560px] w-[92vw]"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  Etapa {onboardingStep + 1} de {onboardingScreens.length}
                </p>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={finishOnboarding}
                >
                  Pular
                </button>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-5">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((onboardingStep + 1) / onboardingScreens.length) * 100}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={onboardingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      {(() => {
                        const Icon = onboardingScreens[onboardingStep].icon;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-xl font-display font-semibold text-foreground">
                        {onboardingScreens[onboardingStep].title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {onboardingScreens[onboardingStep].description}
                      </p>
                    </div>
                  </div>
                  {"benefits" in onboardingScreens[onboardingStep] && onboardingScreens[onboardingStep].benefits ? (
                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {onboardingScreens[onboardingStep].benefits.map((benefit) => (
                        <li key={benefit} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-foreground">
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              </AnimatePresence>
              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  disabled={onboardingStep === 0}
                  onClick={() => setOnboardingStep((prev) => Math.max(0, prev - 1))}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-95"
                  onClick={onboardingScreens[onboardingStep].primaryAction}
                >
                  {onboardingScreens[onboardingStep].primaryLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={`flex-1 md:ml-0 mt-14 md:mt-0 relative min-h-[calc(100vh-3.5rem)] md:min-h-screen min-w-0 ${
          resolvedRole === "barbeiro" ? "dashboard-hero-bg" : ""
        }`}
        data-dashboard={resolvedRole}
      >
        {/* Barbeiro: sem overlay radial (evita “névoa” clara no fundo). Cliente mantém leve glow no topo. */}
        <div
          className={
            resolvedRole === "barbeiro"
              ? identity === "modern"
                ? "absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,hsl(var(--primary)/0.14),transparent_55%)]"
                : "absolute inset-0 pointer-events-none"
              : "absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_0%,hsl(var(--primary)/0.1),transparent_50%)]"
          }
          aria-hidden
        />
        <div
          className={cn(
            "relative p-4 sm:p-6 lg:p-8 mx-auto z-10",
            immersive && resolvedRole === "cliente" ? "max-w-4xl" : "max-w-6xl",
          )}
        >
          {immersive && resolvedRole === "cliente" && (
            <div className="hidden md:flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground hover:bg-secondary/80 transition-colors",
                    identity === "modern" && "rounded-md",
                  )}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <Link
                  to="/cliente"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground truncate"
                >
                  ← Início
                </Link>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground truncate max-w-[40%] text-right">
                {pageTitle}
              </span>
            </div>
          )}
          {resolvedRole === "barbeiro" && !hideBarberSurfaceHeader && (
            <div
              className={
                identity === "modern" && location.pathname === "/barbeiro/minha-barbearia"
                  ? "theme-surface mb-6 rounded-[var(--theme-radius-lg)] bg-card px-4 py-3 sm:px-5 sm:py-4"
                  : "theme-surface mb-6 rounded-[var(--theme-radius-lg)] bg-card/70 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-4"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{barberHeaderKicker}</p>
                  <h2
                    className={
                      identity === "modern"
                        ? "theme-heading text-lg sm:text-xl font-semibold text-foreground tracking-tight"
                        : "theme-heading text-lg sm:text-xl font-semibold text-foreground"
                    }
                  >
                    {pageTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="theme-chip hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <SearchCheck className="w-3.5 h-3.5" />
                    Painel premium
                  </span>
                  <button
                    type="button"
                    onClick={() => setShortcutsOpen(true)}
                    className="theme-chip inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border/80 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  >
                    <Command className="w-3.5 h-3.5" />
                    Atalhos
                  </button>
                </div>
              </div>
            </div>
          )}
          {resolvedRole === "barbeiro" && <BarberOperacaoSubnav />}
          {resolvedRole === "barbeiro" && shortcutsEnabled && quickActions.length > 0 ? (
            <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
              {quickActions
                .map((id) => SHORTCUT_ACTIONS_BARBER.find((a) => a.id === id))
                .filter(Boolean)
                .slice(0, 5)
                .map((action) => (
                  <button
                    key={action!.id}
                    type="button"
                    onClick={() => navigate(action!.path)}
                    className="shrink-0 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs text-primary"
                  >
                    {action!.label}
                  </button>
                ))}
            </div>
          ) : null}
          {children}
        </div>
      </main>
      <CommandDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <CommandInput placeholder="Buscar ação..." />
        <CommandList>
          <CommandEmpty>
            <div className="py-2 text-sm text-muted-foreground">
              Nenhuma ação encontrada.
              <div className="text-[11px] mt-1">Tente: “produto”, “pedido”, “cupom”.</div>
            </div>
          </CommandEmpty>
          {sortedShortcutGroups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.hint} ${item.keywords}`}
                  onSelect={() => {
                    registerShortcutUsage(item.id);
                    setShortcutsOpen(false);
                    navigate(item.path);
                  }}
                  className="group border-l-2 border-transparent data-[selected=true]:border-primary data-[selected=true]:shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.55)]"
                >
                  <span className="flex flex-col gap-0.5 py-0.5">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground">{item.hint}</span>
                  </span>
                  <CommandShortcut className="opacity-0 transition-opacity group-data-[selected=true]:opacity-100">↵ Executar</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Atalhos de teclado">
            <CommandItem disabled>
              Abrir paleta
              <CommandShortcut>Ctrl + K</CommandShortcut>
            </CommandItem>
            <CommandItem disabled>
              Abrir paleta
              <CommandShortcut>/</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default DashboardLayout;
