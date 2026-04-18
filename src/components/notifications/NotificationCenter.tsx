import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Gift,
  Megaphone,
  Settings,
  Star,
  Trash2,
  ShieldAlert,
  Store,
  Filter,
  Pin,
  PinOff,
  Users,
  Waves,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  getNotificationsByUser,
  markAllAsReadByCategory,
  markAsRead,
  pinNotification,
  removeNotification,
  seedNotificationsIfEmpty,
  trackNotificationMetric,
  type NotificationCategory,
  type NotificationFilters,
  type NotificationItem,
  subscribeNotifications,
} from "@/lib/notifications";
import { acceptFriendRequest, upsertFriend } from "@/lib/friends";

type UserRole = "cliente" | "barbeiro";

interface NotificationCenterProps {
  role: UserRole;
}

const categoryUi: Record<
  NotificationCategory,
  { icon: typeof Calendar; colorClass: string; dotClass: string }
> = {
  queue: {
    icon: Waves,
    colorClass: "text-sky-400 bg-sky-500/10",
    dotClass: "bg-sky-400",
  },
  appointment: {
    icon: Calendar,
    colorClass: "text-emerald-400 bg-emerald-500/10",
    dotClass: "bg-emerald-400",
  },
  giftcard: {
    icon: Gift,
    colorClass: "text-fuchsia-400 bg-fuchsia-500/10",
    dotClass: "bg-fuchsia-400",
  },
  gift: {
    icon: Gift,
    colorClass: "text-fuchsia-400 bg-fuchsia-500/10",
    dotClass: "bg-fuchsia-400",
  },
  store: {
    icon: Store,
    colorClass: "text-orange-400 bg-orange-500/10",
    dotClass: "bg-orange-400",
  },
  social: {
    icon: Users,
    colorClass: "text-violet-400 bg-violet-500/10",
    dotClass: "bg-violet-400",
  },
  system: {
    icon: ShieldAlert,
    colorClass: "text-zinc-400 bg-zinc-500/10",
    dotClass: "bg-zinc-400",
  },
  loyalty: {
    icon: Star,
    colorClass: "text-amber-400 bg-amber-500/10",
    dotClass: "bg-amber-400",
  },
  promo: {
    icon: Megaphone,
    colorClass: "text-emerald-400 bg-emerald-500/10",
    dotClass: "bg-emerald-400",
  },
};

/** Rótulos PT por tipo de evento — nunca exibir chaves em inglês na UI. */
const typeOriginLabel: Record<NotificationCategory, string> = {
  queue: "Atendimento · fila",
  appointment: "Agenda",
  giftcard: "Vales e presentes",
  gift: "Vales e presentes",
  store: "Loja",
  social: "Relacionamento",
  system: "Sistema",
  loyalty: "Fidelidade",
  promo: "Campanhas",
};

type VintageBarberChannel = "all" | "agenda" | "atendimento" | "loja" | "sistema" | "campanhas";
type VintageClientChannel =
  | "all"
  | "agenda"
  | "fila"
  | "vales"
  | "loja"
  | "relacionamento"
  | "sistema"
  | "campanhas";

const VINTAGE_BARBER_NAV: Array<{ id: VintageBarberChannel; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "agenda", label: "Agenda" },
  { id: "atendimento", label: "Atendimento" },
  { id: "loja", label: "Loja" },
  { id: "campanhas", label: "Campanhas" },
  { id: "sistema", label: "Sistema" },
];

const VINTAGE_CLIENT_NAV: Array<{ id: VintageClientChannel; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "agenda", label: "Agenda" },
  { id: "fila", label: "Fila" },
  { id: "vales", label: "Vales e fidelidade" },
  { id: "loja", label: "Loja" },
  { id: "relacionamento", label: "Relacionamento" },
  { id: "campanhas", label: "Campanhas" },
  { id: "sistema", label: "Sistema" },
];

function barberVintageChannelCategories(ch: VintageBarberChannel): NotificationCategory[] | null {
  if (ch === "all") return null;
  const map: Record<Exclude<VintageBarberChannel, "all">, NotificationCategory[]> = {
    agenda: ["appointment"],
    atendimento: ["queue", "social"],
    loja: ["store"],
    sistema: ["system"],
    campanhas: ["promo", "loyalty", "giftcard", "gift"],
  };
  return map[ch];
}

function clientVintageChannelCategories(ch: VintageClientChannel): NotificationCategory[] | null {
  if (ch === "all") return null;
  const map: Record<Exclude<VintageClientChannel, "all">, NotificationCategory[]> = {
    agenda: ["appointment"],
    fila: ["queue"],
    vales: ["giftcard", "gift", "loyalty"],
    loja: ["store"],
    relacionamento: ["social"],
    sistema: ["system"],
    campanhas: ["promo"],
  };
  return map[ch];
}

function matchesVintageChannel(item: NotificationItem, role: UserRole, channel: string): boolean {
  const cats =
    role === "barbeiro"
      ? barberVintageChannelCategories(channel as VintageBarberChannel)
      : clientVintageChannelCategories(channel as VintageClientChannel);
  if (!cats) return true;
  const t = item.type === "gift" ? "giftcard" : item.type;
  return cats.some((c) => c === t || (c === "giftcard" && item.type === "gift"));
}

async function markVintageChannelAllRead(
  userId: string,
  role: UserRole,
  channel: string,
): Promise<void> {
  const cats =
    role === "barbeiro"
      ? barberVintageChannelCategories(channel as VintageBarberChannel)
      : clientVintageChannelCategories(channel as VintageClientChannel);
  if (!cats) {
    await markAllAsReadByCategory(userId, "all");
    return;
  }
  for (const c of cats) {
    await markAllAsReadByCategory(userId, c);
  }
}

function formatTimeShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Cartões Vintage no mesmo tom do painel escuro — sem bloco branco/creme. */
const vintageNotifySurface = {
  card: "bg-card/90 border-border/50 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.25),0_10px_32px_0_rgba(0,0,0,0.35)]",
  cardRead: "opacity-[0.88]",
  title: "text-foreground",
  body: "text-muted-foreground",
  meta: "text-muted-foreground",
  metaDot: "text-border",
  divider: "border-border/45",
  iconFrame: "border-primary/35 bg-primary/10 text-primary",
  secondaryLink:
    "text-[11px] font-medium text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors",
  destructiveLink: "text-[11px] font-medium text-destructive/85 hover:text-destructive underline-offset-2 hover:underline",
};

const NotificationCenter = ({ role }: NotificationCenterProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";

  const [allItems, setAllItems] = useState<NotificationItem[]>([]);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | NotificationCategory>("all");
  const [vintageChannel, setVintageChannel] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"all" | "unread" | "pinned" | "recent">("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setVintageChannel("all");
    setActiveTab("all");
    if (isVintage) setFilterMode((m) => (m === "recent" ? "all" : m));
  }, [isVintage]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;

    const load = async () => {
      await seedNotificationsIfEmpty(user.id, role);
      const all = await getNotificationsByUser(user.id, { category: "all" });

      const baseFilters: NotificationFilters = {
        category: isVintage ? "all" : activeTab,
        unreadOnly: filterMode === "unread",
        pinnedOnly: filterMode === "pinned",
        recentOnly: filterMode === "recent" && !isVintage,
      };

      const list = await getNotificationsByUser(user.id, {
        ...baseFilters,
        recentOnly: isVintage ? false : baseFilters.recentOnly,
      });

      if (!mounted) return;
      setAllItems(all);
      setItems(list);
    };

    void load();

    const subscription = subscribeNotifications(user.id, () => {
      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [role, user?.id, activeTab, filterMode, isVintage]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const displayItems = useMemo(() => {
    if (!isVintage) return items;
    return items.filter((item) => matchesVintageChannel(item, role, vintageChannel));
  }, [isVintage, items, role, vintageChannel]);

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    if (isVintage) {
      const result: Record<"Hoje" | "Esta semana" | "Anteriores", NotificationItem[]> = {
        Hoje: [],
        "Esta semana": [],
        Anteriores: [],
      };

      const sorted = [...displayItems].sort((a, b) => {
        const pinA = a.pinned ? 1 : 0;
        const pinB = b.pinned ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

      sorted.forEach((item) => {
        const createdAt = new Date(item.createdAt);
        if (createdAt >= todayStart) {
          result.Hoje.push(item);
        } else if (createdAt >= weekStart) {
          result["Esta semana"].push(item);
        } else {
          result.Anteriores.push(item);
        }
      });

      return result as Record<string, NotificationItem[]>;
    }

    const result: Record<"Hoje" | "Ontem" | "Esta Semana" | "Anteriores", NotificationItem[]> = {
      Hoje: [],
      Ontem: [],
      "Esta Semana": [],
      Anteriores: [],
    };

    const sorted = [...displayItems].sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return a.createdAt < b.createdAt ? 1 : -1;
    });

    sorted.forEach((item) => {
      const createdAt = new Date(item.createdAt);
      if (createdAt >= todayStart) {
        result.Hoje.push(item);
      } else if (createdAt >= yesterdayStart) {
        result.Ontem.push(item);
      } else if (createdAt >= weekStart) {
        result["Esta Semana"].push(item);
      } else {
        result.Anteriores.push(item);
      }
    });

    return result;
  }, [displayItems, isVintage]);

  const refresh = async () => {
    if (!user?.id) return;
    const all = await getNotificationsByUser(user.id, { category: "all" });
    const filters: NotificationFilters = {
      category: isVintage ? "all" : activeTab,
      unreadOnly: filterMode === "unread",
      pinnedOnly: filterMode === "pinned",
      recentOnly: filterMode === "recent" && !isVintage,
    };
    const list = await getNotificationsByUser(user.id, filters);
    setAllItems(all);
    setItems(list);
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    const target = allItems.find((item) => item.id === id);
    await removeNotification(user.id, id);
    if (target) {
      await trackNotificationMetric(user.id, role, target.type, "deleted", id);
    }
    await refresh();
  };

  const handleQuickAction = async (item: NotificationItem) => {
    if (!user?.id) return;

    if (item.actionType === "friend_accept") {
      const requestId =
        typeof item.metadata?.["requestId"] === "string" ? String(item.metadata?.["requestId"]) : "";
      const fromUserId =
        typeof item.metadata?.["fromUserId"] === "string" ? String(item.metadata?.["fromUserId"]) : "";
      const fromName =
        typeof item.metadata?.["fromName"] === "string" ? String(item.metadata?.["fromName"]) : "Novo amigo";
      const fromUsername =
        typeof item.metadata?.["fromUsername"] === "string" ? String(item.metadata?.["fromUsername"]) : undefined;
      const fromAvatarUrl =
        typeof item.metadata?.["fromAvatarUrl"] === "string" ? String(item.metadata?.["fromAvatarUrl"]) : undefined;
      const fromAvatarColor =
        typeof item.metadata?.["fromAvatarColor"] === "string" ? String(item.metadata?.["fromAvatarColor"]) : undefined;
      const fromLastBarbershop =
        typeof item.metadata?.["fromLastBarbershop"] === "string"
          ? String(item.metadata?.["fromLastBarbershop"])
          : undefined;

      if (!requestId) {
        toast({ title: "Solicitação inválida", description: "Não foi possível localizar o pedido de amizade." });
        return;
      }

      const result = acceptFriendRequest({ toUserId: user.id, requestId });
      if (!result.ok) {
        toast({ title: "Não foi possível aceitar", description: "Essa solicitação já foi processada." });
        return;
      }

      if (fromUserId) {
        upsertFriend(user.id, {
          userId: fromUserId,
          name: fromName,
          username: fromUsername,
          avatarUrl: fromAvatarUrl,
          avatarColor: fromAvatarColor,
          lastBarbershop: fromLastBarbershop,
        });
      }

      await removeNotification(user.id, item.id);
      toast({ title: "Amizade confirmada", description: "Vocês já podem se presentear com Gift Cards." });
      await refresh();
      return;
    }

    if (!item.read) {
      await markAsRead(user.id, item.id);
      await trackNotificationMetric(user.id, role, item.type, "read", item.id);
      await refresh();
    }
    if (item.actionPayload) {
      await trackNotificationMetric(user.id, role, item.type, "clicked", item.id, undefined, {
        actionPayload: item.actionPayload,
      });
      navigate(item.actionPayload);
      return;
    }
    toast({ title: "Ação indisponível", description: "Esta notificação não possui destino direto." });
  };

  const categoryTabs: Array<{ id: "all" | NotificationCategory; label: string }> = [
    { id: "all", label: "Todas" },
    { id: "queue", label: "Filas" },
    { id: "appointment", label: "Agendamentos" },
    { id: "giftcard", label: "Giftcards" },
    { id: "social", label: "Social" },
    { id: "store", label: "Loja" },
    { id: "system", label: "Sistema" },
  ];

  const vintageNavItems = useMemo(
    () => (role === "barbeiro" ? VINTAGE_BARBER_NAV : VINTAGE_CLIENT_NAV),
    [role],
  );

  const vintageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of vintageNavItems) {
      counts[row.id] = allItems.filter((item) => matchesVintageChannel(item, role, row.id)).length;
    }
    return counts;
  }, [allItems, role, vintageNavItems]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      all: allItems.length,
      queue: 0,
      appointment: 0,
      giftcard: 0,
      social: 0,
      store: 0,
      system: 0,
    };
    allItems.forEach((item) => {
      const key = item.type === "gift" ? "giftcard" : item.type;
      if (counts[key] != null) counts[key] += 1;
    });
    return counts;
  }, [allItems]);

  const unreadCount = useMemo(() => allItems.filter((item) => !item.read).length, [allItems]);

  const getActionLabel = (item: NotificationItem) => {
    if (item.actionType === "view_details") return item.actionLabel?.trim() || "Ver detalhes";
    if (item.actionType === "confirm_presence") return "Confirmar presença";
    if (item.actionType === "open_gift") return "Abrir vale";
    if (item.actionType === "open_loyalty") return "Ver fidelidade";
    if (item.actionType === "open_promo") return "Ver campanha";
    if (item.actionType === "open_queue") return "Abrir fila";
    if (item.actionType === "open_store") return "Abrir loja";
    if (item.actionType === "open_system") return "Abrir ajustes";
    return item.actionLabel || "Ver detalhes";
  };

  const settingPath = role === "barbeiro" ? "/barbeiro/perfil" : "/cliente/perfil";

  const sectionOrder = isVintage
    ? (["Hoje", "Esta semana", "Anteriores"] as const)
    : (["Hoje", "Ontem", "Esta Semana", "Anteriores"] as const);

  const handleMarkAllRead = () => {
    if (!user?.id) return;
    if (isVintage) {
      void markVintageChannelAllRead(user.id, role, vintageChannel).then(() => refresh());
    } else {
      void markAllAsReadByCategory(user.id, activeTab).then(() => refresh());
    }
  };

  return (
    <div
      className={cn("space-y-6", isVintage && "pb-2")}
      data-notification-ui={isVintage ? "vintage" : "modern"}
    >
      {isVintage ? (
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-vintage-display text-2xl sm:text-[2rem] font-semibold text-primary tracking-tight">
                Notificações
              </h1>
              {unreadCount > 0 ? (
                <span className="text-xs font-body text-primary/85 tabular-nums">
                  {unreadCount} {unreadCount === 1 ? "pendente" : "pendentes"}
                </span>
              ) : (
                <span className="text-xs font-body text-muted-foreground/80">Em dia</span>
              )}
            </div>
            <p className="text-sm leading-relaxed font-body text-muted-foreground max-w-xl">
              Acompanhe alertas, confirmações e movimentos importantes da operação — agenda, loja e atendimento em tempo
              real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outlineGold" size="sm" className="font-medium rounded-full px-4" onClick={handleMarkAllRead}>
              Marcar tudo como lido
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary/70 hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={() => navigate(settingPath)}
              aria-label="Preferências de notificação"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold">Notificações</h1>
              <p className="text-muted-foreground text-sm">Acompanhe alertas importantes em tempo real</p>
            </div>
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2"
            >
              {unreadCount}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Marcar tudo como lido
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(settingPath)}
              aria-label="Abrir configurações de notificação"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isVintage ? (
        <div className="border-y border-border/40 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <nav aria-label="Áreas da operação" className="flex flex-wrap items-baseline gap-x-1 gap-y-2">
              {vintageNavItems.map((row) => {
                const active = vintageChannel === row.id;
                const count = vintageCounts[row.id] ?? 0;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setVintageChannel(row.id)}
                    className={cn(
                      "group inline-flex items-baseline gap-0.5 px-2 py-1 rounded-md font-body text-sm transition-colors",
                      active
                        ? "bg-primary/16 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    <span>{row.label}</span>
                    {count > 0 ? (
                      <sup className="text-[9px] font-normal tabular-nums opacity-70 translate-y-px">{count}</sup>
                    ) : null}
                  </button>
                );
              })}
            </nav>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-body text-muted-foreground lg:pb-0.5">
              <span className="inline-flex items-center gap-1 opacity-90 shrink-0">
                <Filter className="h-3 w-3" aria-hidden />
                Refinar
              </span>
              <span className="text-border/80 hidden sm:inline" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={cn(
                  "transition-colors",
                  filterMode === "all" ? "text-primary font-medium" : "hover:text-foreground",
                )}
              >
                Todas
              </button>
              <span className="text-border/60">·</span>
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === "unread" ? "all" : "unread")}
                className={cn(
                  "transition-colors",
                  filterMode === "unread" ? "text-primary font-medium" : "hover:text-foreground",
                )}
              >
                Só não lidas
              </button>
              <span className="text-border/60">·</span>
              <button
                type="button"
                onClick={() => setFilterMode(filterMode === "pinned" ? "all" : "pinned")}
                className={cn(
                  "transition-colors",
                  filterMode === "pinned" ? "text-primary font-medium" : "hover:text-foreground",
                )}
              >
                Fixadas
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {categoryTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "gold" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="h-8"
              >
                {tab.label} <span className="ml-1 text-xs">({countsByCategory[tab.id] ?? 0})</span>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <Filter className="h-3.5 w-3.5" /> Filtros:
            </span>
            <Button size="sm" variant={filterMode === "all" ? "gold-outline" : "outline"} onClick={() => setFilterMode("all")}>
              Todas
            </Button>
            <Button size="sm" variant={filterMode === "unread" ? "gold-outline" : "outline"} onClick={() => setFilterMode("unread")}>
              Não lidas
            </Button>
            <Button size="sm" variant={filterMode === "pinned" ? "gold-outline" : "outline"} onClick={() => setFilterMode("pinned")}>
              Fixadas
            </Button>
            <Button size="sm" variant={filterMode === "recent" ? "gold-outline" : "outline"} onClick={() => setFilterMode("recent")}> 
              Recentes
            </Button>
          </div>
        </>
      )}

      {displayItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-10 text-center border shadow-card",
            isVintage
              ? cn("font-body rounded-xl border", vintageNotifySurface.card, "max-w-lg mx-auto")
              : "glass-card border-border/50",
          )}
        >
          <Bell className={cn("h-10 w-10 mx-auto mb-3", isVintage ? "text-primary/50" : "text-muted-foreground/40")} />
          <p
            className={cn(
              "text-sm leading-relaxed max-w-md mx-auto",
              isVintage ? vintageNotifySurface.body : "text-muted-foreground",
            )}
          >
            {isVintage
              ? "Nada a exibir por aqui neste momento. Quando houver movimento na agenda, na loja ou no atendimento, avisaremos com calma."
              : "Tudo limpo por aqui. Que tal agendar seu próximo corte?"}
          </p>
          <Button
            variant={isVintage ? "outlineGold" : "gold"}
            className="mt-4"
            onClick={() => navigate(role === "barbeiro" ? "/barbeiro" : "/cliente/novo-agendamento")}
          >
            {role === "barbeiro" ? (isVintage ? "Ir à agenda" : "Ir para dashboard") : "Agendar agora"}
          </Button>
        </motion.div>
      ) : (
        <div className={cn(isVintage ? "space-y-6" : "space-y-8")}>
          {sectionOrder.map((label) => {
            const list = grouped[label];
            if (!list?.length) return null;
            return (
              <section key={label} className={cn("space-y-4", isVintage && "scroll-mt-4")}>
                <h2
                  className={cn(
                    "text-foreground",
                    isVintage
                      ? "font-vintage-display text-base font-semibold tracking-wide text-primary/75 uppercase text-[11px]"
                      : "font-display text-lg font-semibold",
                  )}
                  style={isVintage ? { letterSpacing: "0.12em" } : undefined}
                >
                  {label}
                </h2>
                <div className={cn("space-y-3", isVintage && "space-y-3.5")}>
                  <AnimatePresence mode="popLayout">
                    {list.map((item, index) => {
                      const cfg = categoryUi[item.type] ?? categoryUi.system;
                      const Icon = cfg.icon;
                      const showCritical = item.priority === "high" || item.priority === "critical";
                      const messageText = item.message?.trim() ?? "";

                      if (isVintage) {
                        const secondaryCol = (
                          <div className="hidden sm:flex flex-col items-end gap-1.5 text-right shrink-0 max-w-[9.5rem]">
                            {!item.read ? (
                              <button
                                type="button"
                                className={vintageNotifySurface.secondaryLink}
                                onClick={async () => {
                                  if (!user?.id) return;
                                  await markAsRead(user.id, item.id);
                                  await trackNotificationMetric(user.id, role, item.type, "read", item.id);
                                  await refresh();
                                }}
                              >
                                Marcar como lida
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={vintageNotifySurface.secondaryLink}
                              onClick={async () => {
                                if (!user?.id) return;
                                await pinNotification(user.id, item.id, !item.pinned);
                                await refresh();
                              }}
                            >
                              {item.pinned ? "Desfixar" : "Fixar"}
                            </button>
                            <button type="button" className={vintageNotifySurface.destructiveLink} onClick={() => void handleDelete(item.id)}>
                              Excluir
                            </button>
                          </div>
                        );

                        return (
                          <motion.article
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ delay: index * 0.025 }}
                            drag={isMobile ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => {
                              if (isMobile && Math.abs(info.offset.x) > 110) {
                                handleDelete(item.id);
                              }
                            }}
                            className={cn(
                              "relative rounded-xl border p-4 sm:p-4 font-body transition-shadow duration-200 isolate",
                              vintageNotifySurface.card,
                              item.read && vintageNotifySurface.cardRead,
                            )}
                          >
                            {!item.read ? (
                              <span
                                className="pointer-events-none absolute left-3 top-4 bottom-4 w-0.5 rounded-full bg-primary"
                                aria-hidden
                              />
                            ) : null}
                            <div className={cn("flex gap-3 sm:gap-4", !item.read && "pl-1.5")}>
                              <div
                                className={cn(
                                  "mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center shrink-0 border",
                                  vintageNotifySurface.iconFrame,
                                  item.read && "opacity-90",
                                )}
                              >
                                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.65} />
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                                <div className="flex gap-2 justify-between items-start">
                                  <h3
                                    className={cn(
                                      "font-vintage-display text-base sm:text-[1.05rem] font-semibold leading-snug pr-2",
                                      vintageNotifySurface.title,
                                    )}
                                  >
                                    {!item.read ? (
                                      <span className="text-primary mr-1.5 text-[10px] align-middle" aria-hidden>
                                        ◆
                                      </span>
                                    ) : showCritical ? (
                                      <span className="text-primary mr-1.5 text-[10px] align-middle" aria-hidden>
                                        ◆
                                      </span>
                                    ) : null}
                                    {item.title}
                                  </h3>
                                  {secondaryCol}
                                  <div className="sm:hidden shrink-0 -mr-1">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5"
                                          aria-label="Opções da notificação"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="min-w-[10.5rem]">
                                        {!item.read ? (
                                          <DropdownMenuItem
                                            onSelect={async () => {
                                              if (!user?.id) return;
                                              await markAsRead(user.id, item.id);
                                              await trackNotificationMetric(user.id, role, item.type, "read", item.id);
                                              await refresh();
                                            }}
                                          >
                                            Marcar como lida
                                          </DropdownMenuItem>
                                        ) : null}
                                        <DropdownMenuItem
                                          onSelect={async () => {
                                            if (!user?.id) return;
                                            await pinNotification(user.id, item.id, !item.pinned);
                                            await refresh();
                                          }}
                                        >
                                          {item.pinned ? "Desfixar" : "Fixar"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void handleDelete(item.id)}>
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                {messageText ? (
                                  <p className={cn("text-[13px] sm:text-sm leading-relaxed line-clamp-3", vintageNotifySurface.body)}>
                                    {messageText}
                                  </p>
                                ) : null}

                                <div
                                  className={cn(
                                    "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2.5 border-t",
                                    vintageNotifySurface.divider,
                                  )}
                                >
                                  <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]", vintageNotifySurface.meta)}>
                                    <span className="tabular-nums">{formatTimeShort(item.createdAt)}</span>
                                    <span className={vintageNotifySurface.metaDot}>·</span>
                                    <span>{typeOriginLabel[item.type] ?? typeOriginLabel.system}</span>
                                    {item.pinned ? (
                                      <>
                                        <span className={vintageNotifySurface.metaDot}>·</span>
                                        <span title="Fixada no topo" className="inline-flex" aria-label="Fixada">
                                          <Pin className="h-3 w-3 text-primary/80" />
                                        </span>
                                      </>
                                    ) : null}
                                  </div>
                                  {item.actionType ? (
                                    <Button
                                      variant="outlineGold"
                                      size="sm"
                                      className="h-8 px-4 text-xs font-medium rounded-full shrink-0 self-start sm:self-auto"
                                      onClick={() => void handleQuickAction(item)}
                                    >
                                      {getActionLabel(item)}
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </motion.article>
                        );
                      }

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -18 }}
                          transition={{ delay: index * 0.04 }}
                          drag={isMobile ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          onDragEnd={(_, info) => {
                            if (isMobile && Math.abs(info.offset.x) > 110) {
                              handleDelete(item.id);
                            }
                          }}
                          className={`relative glass-card rounded-2xl border shadow-card p-4 ${
                            item.read
                              ? "bg-card/80 border-border/50"
                              : "bg-primary/5 border-primary/20"
                          }`}
                        >
                          {item.pinned && (
                            <span className="absolute top-2 right-2 md:right-14 inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                              <Pin className="h-3 w-3" />
                              Fixa
                            </span>
                          )}
                          {!item.read && (
                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.dotClass}`} />
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                {item.actionLabel && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => void handleQuickAction(item)}
                                  >
                                    {item.actionLabel}
                                  </Button>
                                )}
                                {!item.read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() => void (async () => {
                                      if (!user?.id) return;
                                      await markAsRead(user.id, item.id);
                                    await trackNotificationMetric(user.id, role, item.type, "read", item.id);
                                      await refresh();
                                    })()}
                                  >
                                    Marcar como lida
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs"
                                  onClick={() => void (async () => {
                                    if (!user?.id) return;
                                    await pinNotification(user.id, item.id, !item.pinned);
                                    await refresh();
                                  })()}
                                >
                                  {item.pinned ? <PinOff className="h-3.5 w-3.5 mr-1" /> : <Pin className="h-3.5 w-3.5 mr-1" />}
                                  {item.pinned ? "Desfixar" : "Fixar"}
                                </Button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              className="hidden md:inline-flex p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label="Excluir notificação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
