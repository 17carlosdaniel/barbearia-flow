import { supabase } from "@/lib/supabaseClient";

const STORAGE_KEY = "barbeflow_notifications";
const CENTER_STORAGE_KEY = "barberflow_notification_center";

export interface NotificationPrefs {
  lembretesAgendamento: boolean;
  novasAvaliacoes: boolean;
  promocoes: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

export type NotificationCategory =
  | "queue"
  | "appointment"
  | "giftcard"
  | "store"
  | "system"
  | "social"
  | "loyalty"
  | "promo"
  | "gift";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type NotificationActionType =
  | "view_details"
  | "confirm_presence"
  | "open_gift"
  | "open_loyalty"
  | "open_promo"
  | "open_queue"
  | "open_store"
  | "open_system"
  | "friend_accept";

export interface NotificationItem {
  id: string;
  type: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  pinned?: boolean;
  priority?: NotificationPriority;
  actionType?: NotificationActionType;
  actionLabel?: string;
  actionPayload?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationDbRow {
  id: string;
  user_id: string;
  role: "cliente" | "barbeiro";
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  pinned: boolean;
  action_type: NotificationActionType | null;
  action_label: string | null;
  action_payload: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface NotificationPrefsDbRow {
  user_id: string;
  lembretes_agendamento: boolean;
  novas_avaliacoes: boolean;
  promocoes: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  updated_at: string;
}

export interface NotificationFilters {
  category?: "all" | NotificationCategory;
  unreadOnly?: boolean;
  pinnedOnly?: boolean;
  recentOnly?: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  lembretesAgendamento: true,
  novasAvaliacoes: true,
  promocoes: false,
  quietHoursStart: null,
  quietHoursEnd: null,
};

const prefsHydrationByUser = new Set<string>();

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCategory(category: NotificationCategory): NotificationCategory {
  return category === "gift" ? "giftcard" : category;
}

function toItem(row: NotificationDbRow): NotificationItem {
  return {
    id: row.id,
    type: normalizeCategory(row.category),
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    read: row.read,
    pinned: row.pinned,
    priority: row.priority,
    actionType: row.action_type ?? undefined,
    actionLabel: row.action_label ?? undefined,
    actionPayload: row.action_payload ?? undefined,
    metadata: row.metadata ?? {},
  };
}

function toDbCategory(category: NotificationCategory): NotificationCategory {
  return normalizeCategory(category);
}

export function getNotificationPrefs(userId: string): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const all = JSON.parse(raw) as Record<string, NotificationPrefs>;
    return { ...DEFAULT_PREFS, ...all[userId] };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function mapPrefsDbToUi(row?: Partial<NotificationPrefsDbRow> | null): NotificationPrefs {
  return {
    lembretesAgendamento: row?.lembretes_agendamento ?? DEFAULT_PREFS.lembretesAgendamento,
    novasAvaliacoes: row?.novas_avaliacoes ?? DEFAULT_PREFS.novasAvaliacoes,
    promocoes: row?.promocoes ?? DEFAULT_PREFS.promocoes,
    quietHoursStart: row?.quiet_hours_start ?? DEFAULT_PREFS.quietHoursStart,
    quietHoursEnd: row?.quiet_hours_end ?? DEFAULT_PREFS.quietHoursEnd,
  };
}

function saveNotificationPrefsLocal(userId: string, prefs: NotificationPrefs): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, NotificationPrefs> = raw ? JSON.parse(raw) : {};
    all[userId] = { ...DEFAULT_PREFS, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export async function loadNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const local = getNotificationPrefs(userId);
  if (!isUuid(userId)) return local;

  try {
    const { data, error } = await supabase
      .rpc("get_notification_preferences", { p_user_id: userId })
      .single();
    if (error) throw error;
    const mapped = mapPrefsDbToUi(data as NotificationPrefsDbRow);
    saveNotificationPrefsLocal(userId, mapped);
    return mapped;
  } catch {
    return local;
  }
}

export function setNotificationPrefs(userId: string, prefs: Partial<NotificationPrefs>): void {
  const merged = { ...getNotificationPrefs(userId), ...prefs };
  saveNotificationPrefsLocal(userId, merged);
  if (!isUuid(userId)) return;
  void supabase.rpc("upsert_notification_preferences", {
    p_user_id: userId,
    p_lembretes_agendamento: merged.lembretesAgendamento,
    p_novas_avaliacoes: merged.novasAvaliacoes,
    p_promocoes: merged.promocoes,
    p_quiet_hours_start: merged.quietHoursStart,
    p_quiet_hours_end: merged.quietHoursEnd,
  });
}

function daysAgoIso(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function seedClientNotifications(): NotificationItem[] {
  return [
    {
      id: "client-n1",
      type: "appointment",
      title: "Lembrete de agendamento",
      message: "Horário marcado para hoje às 16:00.",
      createdAt: daysAgoIso(0),
      read: false,
      priority: "high",
      pinned: true,
      actionType: "confirm_presence",
      actionLabel: "Confirmar presença",
      actionPayload: "/cliente/agendamentos",
    },
    {
      id: "client-n2",
      type: "giftcard",
      title: "Gift Card recebido",
      message: "Gift Card de Corte + Barba entregue.",
      createdAt: daysAgoIso(0),
      read: false,
      priority: "normal",
      actionType: "open_gift",
      actionLabel: "Abrir gift card",
      actionPayload: "/cliente/gift-cards",
    },
    {
      id: "client-n3",
      type: "loyalty",
      title: "Pontos atualizados",
      message: "Você acumulou novos pontos no programa de fidelidade.",
      createdAt: daysAgoIso(1),
      read: true,
      priority: "normal",
      actionType: "open_loyalty",
      actionLabel: "Ver fidelidade",
      actionPayload: "/cliente/fidelidade",
    },
    {
      id: "client-n4",
      type: "store",
      title: "Oferta da semana",
      message: "Promoção ativa para serviços selecionados nesta semana.",
      createdAt: daysAgoIso(4),
      read: true,
      priority: "low",
      actionType: "open_store",
      actionLabel: "Ver loja",
      actionPayload: "/cliente/loja",
    },
  ];
}

function seedBarberNotifications(): NotificationItem[] {
  return [
    {
      id: "barber-n1",
      type: "appointment",
      title: "Agendamento confirmado",
      message: "Um cliente confirmou o horário de hoje às 15h30.",
      createdAt: daysAgoIso(0),
      read: false,
      priority: "high",
      pinned: true,
      actionType: "view_details",
      actionLabel: "Ver agenda",
      actionPayload: "/barbeiro",
    },
    {
      id: "barber-n2",
      type: "giftcard",
      title: "Vale resgatado na casa",
      message: "Um cliente utilizou um vale-presente no atendimento.",
      createdAt: daysAgoIso(1),
      read: false,
      priority: "normal",
      actionType: "view_details",
      actionLabel: "Ver histórico",
      actionPayload: "/barbeiro/historico",
    },
    {
      id: "barber-n3",
      type: "loyalty",
      title: "Pontos concedidos",
      message: "Pontos de fidelidade foram creditados para um cliente.",
      createdAt: daysAgoIso(2),
      read: true,
      priority: "normal",
      actionType: "view_details",
      actionLabel: "Abrir detalhes",
      actionPayload: "/barbeiro/perfil",
    },
    {
      id: "barber-n4",
      type: "promo",
      title: "Campanha disponível",
      message: "Uma nova campanha promocional está disponível para ativação.",
      createdAt: daysAgoIso(5),
      read: true,
      priority: "low",
      actionType: "open_promo",
      actionLabel: "Ver campanha",
      actionPayload: "/barbeiro/financeiro",
    },
  ];
}

function getAllNotificationsMap(): Record<string, NotificationItem[]> {
  try {
    const raw = localStorage.getItem(CENTER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NotificationItem[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllNotificationsMap(all: Record<string, NotificationItem[]>) {
  try {
    localStorage.setItem(CENTER_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function getNotificationsLocal(userId: string): NotificationItem[] {
  const all = getAllNotificationsMap();
  const list = all[userId] ?? [];
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function saveNotificationsLocal(userId: string, list: NotificationItem[]) {
  const all = getAllNotificationsMap();
  all[userId] = list;
  saveAllNotificationsMap(all);
}

export async function seedNotificationsIfEmpty(
  userId: string,
  role: "cliente" | "barbeiro",
): Promise<NotificationItem[]> {
  const local = getNotificationsLocal(userId);
  if (local.length > 0) return local;

  if (!isUuid(userId)) {
    const seed = role === "barbeiro" ? seedBarberNotifications() : seedClientNotifications();
    saveNotificationsLocal(userId, seed);
    return seed;
  }

  try {
    const list = await getNotificationsByUser(userId, { category: "all" });
    saveNotificationsLocal(userId, list);
    return list;
  } catch {
    return [];
  }
}

export async function getNotificationsByUser(
  userId: string,
  filters: NotificationFilters = {},
): Promise<NotificationItem[]> {
  if (!prefsHydrationByUser.has(userId)) {
    prefsHydrationByUser.add(userId);
    void loadNotificationPrefs(userId);
  }
  if (!isUuid(userId)) {
    return filterNotifications(getNotificationsLocal(userId), filters);
  }

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.category && filters.category !== "all") {
      query = query.eq("category", toDbCategory(filters.category));
    }
    if (filters.unreadOnly) query = query.eq("read", false);
    if (filters.pinnedOnly) query = query.eq("pinned", true);
    if (filters.recentOnly) {
      const recentBoundary = new Date();
      recentBoundary.setDate(recentBoundary.getDate() - 7);
      query = query.gte("created_at", recentBoundary.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    const list = (data ?? []).map((row) => toItem(row as NotificationDbRow));
    saveNotificationsLocal(userId, list);
    return list;
  } catch {
    return filterNotifications(getNotificationsLocal(userId), filters);
  }
}

function filterNotifications(list: NotificationItem[], filters: NotificationFilters): NotificationItem[] {
  let next = [...list];
  if (filters.category && filters.category !== "all") {
    next = next.filter((item) => normalizeCategory(item.type) === normalizeCategory(filters.category as NotificationCategory));
  }
  if (filters.unreadOnly) next = next.filter((item) => !item.read);
  if (filters.pinnedOnly) next = next.filter((item) => item.pinned);
  if (filters.recentOnly) {
    const recentBoundary = new Date();
    recentBoundary.setDate(recentBoundary.getDate() - 7);
    next = next.filter((item) => new Date(item.createdAt).getTime() >= recentBoundary.getTime());
  }
  return next.sort((a, b) => {
    const pinA = a.pinned ? 1 : 0;
    const pinB = b.pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function isDebouncedEvent(list: NotificationItem[], candidate: NotificationItem): boolean {
  const last = list[0];
  if (!last) return false;
  const sameType = normalizeCategory(last.type) === normalizeCategory(candidate.type);
  const sameTitle = last.title === candidate.title;
  const samePayload = (last.actionPayload ?? "") === (candidate.actionPayload ?? "");
  if (!sameType || !sameTitle || !samePayload) return false;
  const diffMs = Math.abs(new Date(candidate.createdAt).getTime() - new Date(last.createdAt).getTime());
  return diffMs <= 30000;
}

export async function trackNotificationMetric(
  userId: string,
  role: "cliente" | "barbeiro" = "cliente",
  category: NotificationCategory,
  eventName: "sent" | "suppressed" | "read" | "clicked" | "deleted",
  notificationId?: string,
  reason?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!isUuid(userId)) return;
  try {
    await supabase.from("notification_delivery_metrics").insert({
      notification_id: notificationId ?? null,
      user_id: userId,
      role,
      category: toDbCategory(category),
      event_name: eventName,
      reason: reason ?? null,
      metadata: metadata ?? {},
    });
  } catch {
    // ignore
  }
}

export async function markAsRead(userId: string, notificationId: string): Promise<NotificationItem[]> {
  const local = getNotificationsLocal(userId).map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );
  saveNotificationsLocal(userId, local);

  if (isUuid(userId)) {
    try {
      await supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", notificationId);
    } catch {
      // fallback local already applied
    }
  }
  return getNotificationsByUser(userId);
}

export async function markAllAsReadByCategory(
  userId: string,
  category: "all" | NotificationCategory,
): Promise<NotificationItem[]> {
  const local = getNotificationsLocal(userId).map((item) => {
    if (category === "all") return { ...item, read: true };
    return normalizeCategory(item.type) === normalizeCategory(category)
      ? { ...item, read: true }
      : item;
  });
  saveNotificationsLocal(userId, local);

  if (isUuid(userId)) {
    try {
      let query = supabase
        .from("notifications")
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (category !== "all") {
        query = query.eq("category", toDbCategory(category));
      }
      await query;
    } catch {
      // fallback local already applied
    }
  }
  return getNotificationsByUser(userId);
}

export async function removeNotification(userId: string, notificationId: string): Promise<NotificationItem[]> {
  const existing = getNotificationsLocal(userId);
  const removed = existing.find((item) => item.id === notificationId);
  const local = existing.filter((item) => item.id !== notificationId);
  saveNotificationsLocal(userId, local);

  if (isUuid(userId)) {
    try {
      await supabase.from("notifications").delete().eq("user_id", userId).eq("id", notificationId);
      if (removed) {
        await trackNotificationMetric(userId, "cliente", removed.type, "deleted", removed.id);
      }
    } catch {
      // fallback local already applied
    }
  }
  return getNotificationsByUser(userId);
}

export async function pinNotification(
  userId: string,
  notificationId: string,
  pinned: boolean,
): Promise<NotificationItem[]> {
  const local = getNotificationsLocal(userId).map((item) =>
    item.id === notificationId ? { ...item, pinned } : item,
  );
  saveNotificationsLocal(userId, local);

  if (isUuid(userId)) {
    try {
      await supabase
        .from("notifications")
        .update({ pinned, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", notificationId);
    } catch {
      // fallback local already applied
    }
  }
  return getNotificationsByUser(userId);
}

export async function createNotification(
  userId: string,
  role: "cliente" | "barbeiro",
  payload: Omit<NotificationItem, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): Promise<NotificationItem[]> {
  if (isUuid(userId)) {
    try {
      const dedupeKey =
        typeof payload.metadata?.["dedupe_key"] === "string"
          ? String(payload.metadata?.["dedupe_key"])
          : `${normalizeCategory(payload.type)}:${payload.title}:${payload.actionPayload ?? ""}`;
      const { data, error } = await supabase.rpc("emit_notification", {
        p_user_id: userId,
        p_role: role,
        p_category: toDbCategory(payload.type),
        p_title: payload.title,
        p_message: payload.message,
        p_priority: payload.priority ?? "normal",
        p_action_type: payload.actionType ?? null,
        p_action_label: payload.actionLabel ?? null,
        p_action_payload: payload.actionPayload ?? null,
        p_metadata: payload.metadata ?? {},
        p_dedupe_key: dedupeKey,
        p_cooldown_seconds: 30,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : undefined;
      if (result?.inserted) {
        await trackNotificationMetric(userId, role, payload.type, "sent", result.notification_id, undefined, payload.metadata);
      } else if (result?.reason) {
        await trackNotificationMetric(userId, role, payload.type, "suppressed", undefined, result.reason, payload.metadata);
      }
      return getNotificationsByUser(userId);
    } catch {
      // fallback local mode below
    }
  }

  const item: NotificationItem = {
    id: payload.id ?? `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    read: payload.read ?? false,
    type: normalizeCategory(payload.type),
    title: payload.title,
    message: payload.message,
    pinned: payload.pinned ?? payload.priority === "critical",
    priority: payload.priority ?? "normal",
    actionType: payload.actionType,
    actionLabel: payload.actionLabel,
    actionPayload: payload.actionPayload,
    metadata: payload.metadata ?? {},
  };

  const current = getNotificationsLocal(userId);
  if (isDebouncedEvent(current, item)) {
    return filterNotifications(current, { category: "all" });
  }
  const local = [item, ...current];
  saveNotificationsLocal(userId, local);

  return getNotificationsByUser(userId);
}

export async function pushNotification(
  userId: string,
  role: "cliente" | "barbeiro",
  payload: Omit<NotificationItem, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): Promise<NotificationItem[]> {
  return createNotification(userId, role, payload);
}

export function subscribeNotifications(
  userId: string,
  onChanged: () => void,
): { unsubscribe: () => void } {
  if (!isUuid(userId)) {
    return { unsubscribe: () => undefined };
  }
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => onChanged(),
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

