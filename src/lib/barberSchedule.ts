import type { AppointmentRecord } from "@/lib/appointments";

export type BarberViewMode = "today" | "week" | "list";

export interface ServiceColorConfig {
  badgeClass: string;
  borderClass: string;
  dotClass: string;
}

const SERVICE_COLORS: Array<{ test: RegExp; color: ServiceColorConfig }> = [
  {
    test: /corte\s*\+\s*barba/i,
    color: {
      badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/30",
      borderClass: "border-violet-500/40",
      dotClass: "bg-violet-400",
    },
  },
  {
    test: /barba/i,
    color: {
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      borderClass: "border-emerald-500/40",
      dotClass: "bg-emerald-400",
    },
  },
  {
    test: /corte|degrad[eê]|fade/i,
    color: {
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      borderClass: "border-sky-500/40",
      dotClass: "bg-sky-400",
    },
  },
];

const DEFAULT_COLOR: ServiceColorConfig = {
  badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  borderClass: "border-amber-500/40",
  dotClass: "bg-amber-400",
};

export function getServiceColor(service: string): ServiceColorConfig {
  const found = SERVICE_COLORS.find((item) => item.test.test(service));
  return found?.color ?? DEFAULT_COLOR;
}

export function parseAppointmentDateTime(item: Pick<AppointmentRecord, "date" | "time">): Date {
  const [day, month, year] = item.date.split("/").map(Number);
  const [hour, minute] = item.time.split(":").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
}

export function formatDateKey(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

/** Encaixe / walk-in genérico — oculto na agenda. Encaixe vindo de vaga aberta (`openSlotOrigin`) aparece na agenda. */
export function isEncaixeAppointment(item: Pick<AppointmentRecord, "client" | "service" | "openSlotOrigin">): boolean {
  if (item.openSlotOrigin) return false;
  if (item.service === "Encaixe rápido") return true;
  const c = item.client;
  return c === "Encaixe" || c === "Walk-in";
}

export function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor);
  const day = start.getDay();
  const diffToMonday = (day + 6) % 7;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return d;
  });
}

export function getVisibleAppointments(
  appointments: AppointmentRecord[],
  mode: BarberViewMode,
  selectedDate: Date,
  weekAnchor: Date,
): AppointmentRecord[] {
  const selectedKey = formatDateKey(selectedDate);
  const weekKeys = new Set(getWeekDays(weekAnchor).map(formatDateKey));
  const now = new Date();

  return appointments.filter((item) => {
    if (mode === "today") return item.date === selectedKey;
    if (mode === "week") return weekKeys.has(item.date);
    return parseAppointmentDateTime(item) >= now;
  });
}

export function getDailyStats(appointments: AppointmentRecord[], date: Date) {
  const key = formatDateKey(date);
  const list = appointments.filter((item) => item.date === key);
  const completed = list.filter((item) => item.status === "completed").length;
  const cancelled = list.filter((item) => item.status === "cancelled").length;
  const inService = list.filter((item) => item.status === "in_service").length;
  const scheduled = list.filter((item) => item.status === "scheduled" || item.status === "confirmed").length;
  const remaining = scheduled + inService;
  const estimatedRevenue = list
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + Number(item.price ?? 0), 0);

  const completedList = list.filter((item) => item.status === "completed");
  const totalDuration = completedList.reduce((sum, item) => sum + (item.durationMinutes ?? 30), 0);
  const avgDurationMinutes = completedList.length ? Math.round(totalDuration / completedList.length) : 30;
  const noShowRate = list.length ? Math.round((cancelled / list.length) * 100) : 0;
  const progressPercent = list.length ? Math.round((completed / list.length) * 100) : 0;

  return {
    total: list.length,
    completed,
    cancelled,
    remaining,
    inService,
    estimatedRevenue,
    avgDurationMinutes,
    noShowRate,
    progressPercent,
  };
}

export function getFreeSlotsForDate(
  appointments: AppointmentRecord[],
  date: Date,
  options?: { startHour?: number; endHour?: number; intervalMinutes?: number },
) {
  const startHour = options?.startHour ?? 9;
  const endHour = options?.endHour ?? 19;
  const interval = options?.intervalMinutes ?? 45;
  const dateKey = formatDateKey(date);
  const dayItems = appointments.filter((item) => item.date === dateKey && item.status !== "cancelled");
  const occupied = new Set(dayItems.map((item) => item.time.slice(0, 5)));
  const slots: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      if (!occupied.has(time)) {
        slots.push(time);
      }
    }
  }

  return slots;
}

/** Prioridade visual na agenda do barbeiro (ordem de atenção). */
export type AgendaPriorityKind = "late" | "now" | "next" | "upcoming" | "in_service" | "completed";

const LATE_AFTER_MIN = 10;
const NOW_WINDOW_MAX_MIN = 10;

/** Primeiro agendamento futuro (scheduled/confirmed) para marcar como "Próximo". */
export function getNextFutureAppointmentId(appointments: AppointmentRecord[], now: Date): number | null {
  const future = appointments
    .filter(
      (a) =>
        (a.status === "scheduled" || a.status === "confirmed") &&
        parseAppointmentDateTime(a).getTime() > now.getTime(),
    )
    .sort((a, b) => parseAppointmentDateTime(a).getTime() - parseAppointmentDateTime(b).getTime());
  return future[0]?.id ?? null;
}

export function getAgendaPriority(
  apt: AppointmentRecord,
  now: Date,
  nextFutureId: number | null,
): { kind: AgendaPriorityKind; minutesLate: number } {
  const start = parseAppointmentDateTime(apt);
  const diffMin = Math.round((now.getTime() - start.getTime()) / 60000);

  if (apt.status === "completed") return { kind: "completed", minutesLate: 0 };
  if (apt.status === "in_service") return { kind: "in_service", minutesLate: 0 };

  if (apt.status === "scheduled" || apt.status === "confirmed") {
    if (start.getTime() > now.getTime()) {
      return { kind: apt.id === nextFutureId ? "next" : "upcoming", minutesLate: 0 };
    }
    if (diffMin > LATE_AFTER_MIN) {
      return { kind: "late", minutesLate: diffMin };
    }
    if (diffMin >= 0 && diffMin <= NOW_WINDOW_MAX_MIN) {
      return { kind: "now", minutesLate: 0 };
    }
    if (diffMin > NOW_WINDOW_MAX_MIN) {
      return { kind: "late", minutesLate: diffMin };
    }
  }

  return { kind: "upcoming", minutesLate: 0 };
}

export function agendaSortPriority(kind: AgendaPriorityKind): number {
  const order: Record<AgendaPriorityKind, number> = {
    late: 0,
    in_service: 1,
    now: 2,
    next: 3,
    upcoming: 4,
    completed: 5,
  };
  return order[kind];
}

export function sortTodayAgenda(appointments: AppointmentRecord[], now: Date): AppointmentRecord[] {
  const nextFutureId = getNextFutureAppointmentId(appointments, now);
  return [...appointments].sort((a, b) => {
    const pa = getAgendaPriority(a, now, nextFutureId);
    const pb = getAgendaPriority(b, now, nextFutureId);
    const d = agendaSortPriority(pa.kind) - agendaSortPriority(pb.kind);
    if (d !== 0) return d;
    return parseAppointmentDateTime(a).getTime() - parseAppointmentDateTime(b).getTime();
  });
}
