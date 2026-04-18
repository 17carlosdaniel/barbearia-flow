import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Star,
  Zap,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import OpenSlotAgendaRow from "@/components/barber/OpenSlotAgendaRow";
import VagasLivresPanel from "@/components/barber/VagasLivresPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getCancelledByClient } from "@/lib/cancelledByClient";
import {
  canAddAppointment,
  ensureDemoAppointmentsForBarbershop,
  getCanonicalAppointmentsForBarbershop,
  LIMITE_PLANO_BASICO,
  rescheduleAppointmentForBarber,
  updateAppointmentStatus,
  type AppointmentRecord,
} from "@/lib/appointments";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import {
  completeOpenSlotAttendance,
  getOpenSlotsForDate,
  reopenOpenSlotFromAppointment,
  type OpenSlotRecord,
} from "@/lib/openSlots";
import { pushNotification } from "@/lib/notifications";
import {
  formatDateKey,
  getAgendaPriority,
  getFreeSlotsForDate,
  getNextFutureAppointmentId,
  isEncaixeAppointment,
  parseAppointmentDateTime,
  sortTodayAgenda,
  type AgendaPriorityKind,
} from "@/lib/barberSchedule";

const formatMoney = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function agendaPriorityAccent(kind: AgendaPriorityKind, calmVintage: boolean): { border: string; bar: string } {
  if (calmVintage) {
    switch (kind) {
      case "late":
        return { border: "border-red-500/40", bar: "bg-red-500/75" };
      case "now":
        return { border: "border-primary/40", bar: "bg-primary/85" };
      case "next":
        return { border: "border-primary/28", bar: "bg-primary/55" };
      case "in_service":
        return { border: "border-primary/35", bar: "bg-primary" };
      case "completed":
        return { border: "border-border/50", bar: "bg-muted-foreground/35" };
      case "upcoming":
      default:
        return { border: "border-border/60", bar: "bg-muted-foreground/45" };
    }
  }
  switch (kind) {
    case "late":
      return { border: "border-red-500/45", bar: "bg-red-500" };
    case "now":
      return { border: "border-amber-500/50", bar: "bg-amber-400" };
    case "next":
      return { border: "border-sky-500/50", bar: "bg-sky-400" };
    case "upcoming":
      return { border: "border-border/60", bar: "bg-muted-foreground/45" };
    case "in_service":
      return { border: "border-emerald-500/60", bar: "bg-emerald-400" };
    case "completed":
      return { border: "border-border/50", bar: "bg-muted-foreground/35" };
    default:
      return { border: "border-border/60", bar: "bg-muted-foreground/45" };
  }
}

function urgencyLabel(apt: AppointmentRecord, kind: AgendaPriorityKind, minutesLate: number, nowMs: number): string {
  if (kind === "late") return `Atrasado ${minutesLate} min`;
  if (kind === "now") return "Agora";
  if (kind === "next") return "Próximo";
  if (kind === "in_service") return "Em atendimento";
  if (kind === "completed") return "Concluído";
  if (kind === "upcoming") {
    const start = parseAppointmentDateTime(apt).getTime();
    const diff = Math.round((start - nowMs) / 60000);
    if (diff > 0) return `Em ${diff} min`;
    return "Aguardando";
  }
  return "Aguardando";
}

function useCountUp(target: number, durationMs: number, run: boolean, reducedMotion: boolean | null) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run || target <= 0) {
      setValue(target);
      return;
    }
    if (reducedMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, run, reducedMotion]);
  return value;
}

const kpiContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const kpiItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

const BarberDashboard = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const isVintage = identity === "vintage";
  const reducedMotion = useReducedMotion();
  const barbershopId = user?.barbershopId ?? 1;

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [cancelados, setCancelados] = useState(getCancelledByClient(barbershopId));
  const [detailApt, setDetailApt] = useState<AppointmentRecord | null>(null);
  const [successAppointmentId, setSuccessAppointmentId] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const [editTarget, setEditTarget] = useState<AppointmentRecord | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [clientProfile, setClientProfile] = useState<AppointmentRecord | null>(null);
  const [messageTarget, setMessageTarget] = useState<AppointmentRecord | null>(null);
  const [messageText, setMessageText] = useState("Seu horário está chegando. Já estou pronto para te atender.");
  const [vagasLivresOpen, setVagasLivresOpen] = useState(false);

  const sentAlertKeysRef = useRef<Set<string>>(new Set());
  const profile = getBarbershopProfile(barbershopId);
  const { count: countMes, limit } = canAddAppointment(barbershopId, profile.plano);
  const limiteAtingido = limit !== null && countMes >= limit;

  const refresh = () => {
    setCancelados(getCancelledByClient(barbershopId));
    setAppointments(getCanonicalAppointmentsForBarbershop(barbershopId));
  };

  useEffect(() => {
    ensureDemoAppointmentsForBarbershop(barbershopId);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershopId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const notifyClient = async (apt: AppointmentRecord, title: string, message: string) => {
    if (!apt.clientId) return;
    await pushNotification(apt.clientId, "cliente", {
      type: "appointment",
      title,
      message,
      priority: "normal",
      actionType: "view_details",
      actionLabel: "Ver agendamento",
      actionPayload: "/cliente/agendamentos",
      metadata: { dedupe_key: `barber_apt:${apt.id}:${title}` },
    });
  };

  useEffect(() => {
    const now = new Date(nowTick);
    const todayKey = formatDateKey(now);
    const candidates = appointments.filter(
      (apt) => apt.date === todayKey && (apt.status === "scheduled" || apt.status === "confirmed"),
    );
    candidates.forEach((apt) => {
      const diffMinutes = Math.round((parseAppointmentDateTime(apt).getTime() - now.getTime()) / 60000);
      if (diffMinutes <= 15 && diffMinutes >= 0) {
        const key = `arrive:${apt.id}`;
        if (!sentAlertKeysRef.current.has(key)) {
          sentAlertKeysRef.current.add(key);
          void notifyClient(apt, "Seu horário está chegando", `Faltam ${diffMinutes} min para ${apt.service}.`);
        }
      }
      if (diffMinutes < -10) {
        const key = `late:${apt.id}`;
        if (!sentAlertKeysRef.current.has(key)) {
          sentAlertKeysRef.current.add(key);
          void notifyClient(apt, "Você está atrasado", `Seu horário de ${apt.service} já passou ${Math.abs(diffMinutes)} min.`);
        }
      }
    });
  }, [nowTick, appointments]);

  const now = new Date(nowTick);

  const todayKey = formatDateKey(new Date(nowTick));
  const todayAppointments = useMemo(
    () =>
      appointments
        .filter(
          (apt) =>
            apt.date === todayKey && apt.status !== "cancelled" && !isEncaixeAppointment(apt),
        )
        .sort((a, b) => parseAppointmentDateTime(a).getTime() - parseAppointmentDateTime(b).getTime()),
    [appointments, todayKey],
  );
  const completedTodayCount = useMemo(
    () => todayAppointments.filter((a) => a.status === "completed").length,
    [todayAppointments],
  );

  const todayActiveNonCompleted = useMemo(
    () => todayAppointments.filter((a) => a.status !== "completed"),
    [todayAppointments],
  );

  const nextFutureId = useMemo(
    () => getNextFutureAppointmentId(todayAppointments, new Date(nowTick)),
    [todayAppointments, nowTick],
  );

  const sortedTodayActive = useMemo(
    () => sortTodayAgenda(todayActiveNonCompleted, new Date(nowTick)),
    [todayActiveNonCompleted, nowTick],
  );

  const completedTodayList = useMemo(
    () =>
      todayAppointments
        .filter((a) => a.status === "completed")
        .sort((a, b) => parseAppointmentDateTime(a).getTime() - parseAppointmentDateTime(b).getTime()),
    [todayAppointments],
  );

  const lateTodayCount = useMemo(() => {
    const t = new Date(nowTick);
    return sortedTodayActive.filter((apt) => getAgendaPriority(apt, t, nextFutureId).kind === "late").length;
  }, [sortedTodayActive, nowTick, nextFutureId]);

  const inServiceTodayCount = useMemo(
    () => todayAppointments.filter((a) => a.status === "in_service").length,
    [todayAppointments],
  );

  /** Soma dos valores ainda não realizados (pendentes + em atendimento). */
  const faturamentoPrevistoRestante = useMemo(
    () =>
      todayAppointments
        .filter((a) => a.status === "scheduled" || a.status === "confirmed" || a.status === "in_service")
        .reduce((sum, a) => sum + Number(a.price ?? 0), 0),
    [todayAppointments],
  );

  const todayFreeSlots = useMemo(
    () => getFreeSlotsForDate(appointments, new Date(), { startHour: 9, endHour: 19, intervalMinutes: 45 }),
    [appointments],
  );

  const avgPriceToday = useMemo(() => {
    const vals = todayAppointments.map((a) => Number(a.price ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
    return vals.length ? vals.reduce((acc, v) => acc + v, 0) / vals.length : 45;
  }, [todayAppointments]);

  const potentialVagasRevenue = Math.round(todayFreeSlots.length * avgPriceToday);

  const animatedPotentialRevenue = useCountUp(
    potentialVagasRevenue,
    720,
    isModern && todayFreeSlots.length > 0 && potentialVagasRevenue > 0,
    reducedMotion,
  );

  const todayOpenWaitingSlots = useMemo(
    () => getOpenSlotsForDate(barbershopId, todayKey).filter((s) => s.status === "open"),
    [barbershopId, todayKey, appointments],
  );

  type AgendaMergeItem = { kind: "appointment"; apt: AppointmentRecord } | { kind: "open_slot"; slot: OpenSlotRecord };

  const mergedAgendaByTime = useMemo(() => {
    const items: AgendaMergeItem[] = sortedTodayActive.map((apt) => ({ kind: "appointment", apt }));
    todayOpenWaitingSlots.forEach((slot) => items.push({ kind: "open_slot", slot }));
    items.sort((a, b) => {
      const ta = a.kind === "appointment" ? a.apt.time : a.slot.time;
      const tb = b.kind === "appointment" ? b.apt.time : b.slot.time;
      return ta.localeCompare(tb);
    });
    const timeKeys: string[] = [];
    const seen = new Set<string>();
    items.forEach((it) => {
      const t = it.kind === "appointment" ? it.apt.time.slice(0, 5) : it.slot.time.slice(0, 5);
      if (!seen.has(t)) {
        seen.add(t);
        timeKeys.push(t);
      }
    });
    return { items, timeKeys };
  }, [sortedTodayActive, todayOpenWaitingSlots]);

  const QUICK_MESSAGES = [
    { label: "Estou te aguardando", text: "Olá! Estou te aguardando aqui. Pode vir quando quiser." },
    { label: "Pode vir mais cedo", text: "Olá! Se der, pode vir um pouco mais cedo que já te atendo." },
    { label: "Estou atrasado 5 min", text: "Olá! Pequeno atraso de uns 5 min. Te aviso quando estiver pronto." },
    { label: "Seu horário está chegando", text: "Seu horário está chegando. Já estou pronto para te atender." },
  ];
  const [completeWithProduct, setCompleteWithProduct] = useState<AppointmentRecord | null>(null);
  const [clientNote, setClientNote] = useState("");

  const openWhatsApp = (apt: AppointmentRecord, customText?: string) => {
    const digits = (apt.whatsAppPhone || "").replace(/\D/g, "");
    if (!digits) {
      toast({ title: "WhatsApp indisponível", description: "Cliente sem telefone cadastrado.", variant: "destructive" });
      return;
    }
    const phone = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(
      customText ||
        `Olá, ${apt.client}. Seu atendimento de ${apt.service} na ${apt.barbershopName || "barbearia"} está próximo.`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const handleReminderAndWhatsApp = (apt: AppointmentRecord) => {
    const reminderText = `Olá, ${apt.client}! Lembrete do seu atendimento de ${apt.service} hoje às ${apt.time}. Qualquer imprevisto, avise por aqui.`;
    openWhatsApp(apt, reminderText);
    void notifyClient(apt, "Lembrete de agendamento", `Lembrete: ${apt.service} hoje às ${apt.time}.`);
    toast({ title: "Lembrete enviado", description: "Lembrete por WhatsApp enviado em 1 clique." });
  };

  const handleComplete = (apt: AppointmentRecord) => {
    setCompleteWithProduct(apt);
  };

  const doComplete = (apt: AppointmentRecord) => {
    if (apt.openSlotId) {
      const ok = completeOpenSlotAttendance(barbershopId, apt.openSlotId);
      if (!ok) updateAppointmentStatus(barbershopId, apt.id, "completed");
    } else {
      updateAppointmentStatus(barbershopId, apt.id, "completed");
    }
    setSuccessAppointmentId(apt.id);
    setCompleteWithProduct(null);
    window.setTimeout(() => setSuccessAppointmentId(null), 1200);
    refresh();
    void notifyClient(
      apt,
      "Atendimento concluído",
      `Seu atendimento de ${apt.service} foi finalizado. Obrigado!`,
    );
    toast({ title: "Atendimento concluído", description: "Status atualizado com sucesso." });
  };

  const handleCancel = (apt: AppointmentRecord) => {
    if (apt.openSlotOrigin) {
      reopenOpenSlotFromAppointment(barbershopId, apt);
    }
    updateAppointmentStatus(barbershopId, apt.id, "cancelled");
    setDetailApt((d) => (d?.id === apt.id ? null : d));
    refresh();
    void notifyClient(
      apt,
      "Agendamento cancelado",
      `Seu horário de ${apt.service} foi cancelado pela barbearia.`,
    );
    toast({ title: "Agendamento cancelado" });
  };

  const handleSaveEdit = () => {
    if (!editTarget || !editDate || !editTime) return;
    rescheduleAppointmentForBarber(barbershopId, editTarget.id, editDate, editTime);
    refresh();
    void notifyClient(
      editTarget,
      "Horário alterado",
      `Seu atendimento foi reagendado para ${editDate.split("-").reverse().join("/")} às ${editTime}.`,
    );
    setEditTarget(null);
    setEditDate("");
    setEditTime("");
    toast({ title: "Horário atualizado" });
  };

  const openEditDialog = (apt: AppointmentRecord) => {
    setEditTarget(apt);
    const [day, month, year] = apt.date.split("/");
    setEditDate(`${year}-${month}-${day}`);
    setEditTime(apt.time);
  };

  const agendaActionButtons = (apt: AppointmentRecord) => {
    const reminderDisabled = parseAppointmentDateTime(apt).getTime() < nowTick;
    if (apt.status === "completed") {
      return <span className="text-xs text-muted-foreground">Concluído</span>;
    }
    if (apt.status === "cancelled") return null;
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {(apt.status === "scheduled" || apt.status === "confirmed") && (
          <>
            <Button
              size="sm"
              variant="gold"
              className="gap-1.5 shrink-0 shadow-none hover:!shadow-none"
              onClick={() => handleComplete(apt)}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
              Concluir
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={reminderDisabled}
              onClick={() => {
                if (reminderDisabled) return;
                handleReminderAndWhatsApp(apt);
              }}
            >
              Lembrete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-red-400 border-red-500/40 hover:bg-red-500/10"
              onClick={() => handleCancel(apt)}
            >
              Cancelar
            </Button>
          </>
        )}
        {apt.status === "in_service" && (
          <>
            <Button
              size="sm"
              variant="gold"
              className="gap-1.5 shrink-0 shadow-none hover:!shadow-none"
              onClick={() => handleComplete(apt)}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
              Concluir
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-red-400 border-red-500/40 hover:bg-red-500/10"
              onClick={() => handleCancel(apt)}
            >
              Cancelar
            </Button>
          </>
        )}
      </div>
    );
  };

  const getStatusLabel = (apt: AppointmentRecord) => {
    if (isVintage) {
      if (apt.status === "in_service") {
        return { label: "Em andamento", dot: "bg-primary", class: "border-primary/30 bg-primary/10 text-primary" };
      }
      if (apt.status === "completed") {
        return { label: "Concluído", dot: "bg-muted-foreground/50", class: "border-border/50 bg-muted/25 text-muted-foreground" };
      }
      if (apt.status === "confirmed") {
        return { label: "Confirmado", dot: "bg-primary/60", class: "border-primary/20 bg-primary/[0.06] text-primary/85" };
      }
      if (apt.status === "cancelled") {
        return { label: "Cancelado", dot: "bg-red-400", class: "border-red-500/35 bg-red-500/10 text-red-400" };
      }
      return { label: "Aguardando", dot: "bg-muted-foreground/45", class: "border-border/55 bg-secondary/25 text-muted-foreground" };
    }
    if (apt.status === "in_service") return { label: "Em andamento", dot: "bg-emerald-400", class: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" };
    if (apt.status === "completed") return { label: "Concluído", dot: "bg-emerald-400", class: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" };
    if (apt.status === "confirmed") return { label: "Confirmado", dot: "bg-blue-400", class: "border-blue-500/40 bg-blue-500/15 text-blue-400" };
    if (apt.status === "cancelled") return { label: "Cancelado", dot: "bg-red-400", class: "border-red-500/40 bg-red-500/15 text-red-400" };
    return { label: "Aguardando", dot: "bg-amber-400", class: "border-amber-500/40 bg-amber-500/15 text-amber-400" };
  };

  const renderAppointmentCard = (apt: AppointmentRecord, idx: number) => {
    const pr = getAgendaPriority(apt, new Date(nowTick), nextFutureId);
    const accent = agendaPriorityAccent(pr.kind, isVintage);
    const elapsedMin = apt.startedAt ? Math.round((nowTick - new Date(apt.startedAt).getTime()) / 60000) : 0;
    const estimate = apt.durationMinutes ?? 30;
    const remainingMin = Math.max(0, estimate - elapsedMin);
    const overtime = apt.status === "in_service" && elapsedMin > estimate;
    const progressPercent = apt.status === "in_service" ? Math.min(100, (elapsedMin / estimate) * 100) : 0;
    const priceNum = Number(apt.price ?? 0);
    const priceLine =
      priceNum > 0 ? `${formatMoney(priceNum)} • ${estimate} min` : `${estimate} min`;

    const clientHistory = appointments.filter((item) => item.client === apt.client);
    const clientCompleted = clientHistory.filter((item) => item.status === "completed");
    const recurring = clientCompleted.length >= 4;
    const vip = clientCompleted.length >= 8;
    const statusInfo = getStatusLabel(apt);
    const urgentLabel = urgencyLabel(apt, pr.kind, pr.minutesLate, nowTick);

    return (
      <motion.div
        key={apt.id}
        initial={reducedMotion ? false : { opacity: 0, y: 12, x: -8 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={successAppointmentId === apt.id ? { opacity: 0, scale: 0.98 } : undefined}
        transition={{ delay: reducedMotion ? 0 : idx * 0.03 }}
        className={`agenda-item-card relative rounded-2xl border-2 bg-card p-3 pl-4 shadow-none transition hover:bg-card ${accent.border}`}
      >
        <span className={`absolute left-1 top-3 bottom-3 w-1 rounded-full ${accent.bar}`} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="w-16 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{apt.time}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2 gap-y-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClientProfile(apt);
                  }}
                  className="text-left text-base font-semibold text-foreground truncate hover:text-primary"
                >
                  {apt.client === "Walk-in" ? "Encaixe" : apt.client}
                </button>
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {urgentLabel}
                </span>
              </div>
              <p className="text-sm text-foreground/90 mt-0.5 truncate">{apt.service}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{priceLine}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
                {recurring && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                      isVintage
                        ? "border-primary/25 bg-primary/[0.07] text-primary/90"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400",
                    )}
                  >
                    <Star className="w-3 h-3" strokeWidth={isModern ? 1.7 : 2} /> Cliente fiel
                  </span>
                )}
                {vip && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                      isVintage
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-amber-500/40 bg-amber-500/20 text-amber-300",
                    )}
                  >
                    <Flame className="w-3 h-3" strokeWidth={isModern ? 1.7 : 2} /> VIP
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 pt-1 lg:w-auto lg:min-w-[280px] lg:pt-0">
            {agendaActionButtons(apt)}
            <div className="text-xs text-muted-foreground lg:text-right">
              <div>{apt.date}</div>
              <div className="text-[11px] text-muted-foreground">{profile?.nomeBarbearia || apt.barbershopName}</div>
            </div>
          </div>
        </div>

        {apt.status === "in_service" && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{remainingMin} min restantes</span>
              <span>{elapsedMin} / {estimate} min</span>
            </div>
            <Progress
              value={progressPercent}
              className={cn(
                "agenda-progress mt-1 h-1.5 bg-muted/50 shadow-none",
                overtime ? "[&>div]:!bg-red-500/85" : isVintage ? "[&>div]:!bg-primary/75" : "[&>div]:!bg-emerald-600/75",
              )}
            />
          </div>
        )}

        <AnimatePresence>
          {successAppointmentId === apt.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "mt-2 flex items-center gap-2 rounded-lg border p-2.5 text-xs",
                isVintage
                  ? "border-primary/25 bg-primary/[0.08] text-primary"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
              )}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={isModern ? 1.7 : 2} />
              Atendimento concluído com sucesso
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderAgendaListRow = (apt: AppointmentRecord, listIdx: number) => {
    const pr = getAgendaPriority(apt, new Date(nowTick), nextFutureId);
    const accent = agendaPriorityAccent(pr.kind, isVintage);
    const urgentLabel = urgencyLabel(apt, pr.kind, pr.minutesLate, nowTick);
    const estimate = apt.durationMinutes ?? 30;
    const priceNum = Number(apt.price ?? 0);
    const displayClient = apt.client === "Walk-in" ? "Encaixe" : apt.client;
    const priceLine = priceNum > 0 ? `${formatMoney(priceNum)} • ${estimate} min` : `${estimate} min`;

    return (
      <motion.div
        key={`list-${apt.id}`}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reducedMotion ? 0 : listIdx * 0.02 }}
        className={`agenda-item-card relative overflow-hidden rounded-xl border bg-card shadow-none ${accent.border}`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.bar}`} aria-hidden />
        <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between">
          <button type="button" onClick={() => setDetailApt(apt)} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{apt.time}</span>
              <span className="font-semibold text-foreground truncate">{displayClient}</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {urgentLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground">{apt.service}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{priceLine}</p>
          </button>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[260px] sm:items-end">{agendaActionButtons(apt)}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: isModern ? 0.2 : 0.35 }}
        className={cn("space-y-6", isModern && "relative")}
      >
        {isModern ? (
          <div className="pointer-events-none absolute -left-6 -right-6 -top-2 h-72 overflow-hidden opacity-90 sm:-left-8 sm:-right-8" aria-hidden>
            <div className="absolute left-1/2 top-0 h-56 w-[min(100%,640px)] -translate-x-1/2 rounded-full bg-primary/[0.09] blur-[72px]" />
          </div>
        ) : null}

        <div className={cn(isModern && "relative z-[1]")}>
          <motion.div
            className="flex flex-wrap items-start justify-between gap-3"
            initial={isModern && !reducedMotion ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="min-w-0">
              <h1
                className={cn(
                  "theme-heading font-bold text-foreground tracking-tight",
                  isModern ? "text-[1.65rem] leading-tight sm:text-3xl lg:text-[2rem]" : "text-2xl lg:text-3xl",
                )}
              >
                {isModern ? "Sua agenda e oportunidades de hoje" : "Agenda de Hoje"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5 font-normal">
                {isModern ? "Visão do seu dia — agenda cheia e horários que ainda viram faturamento." : "Gerencie seus atendimentos em tempo real"}
              </p>
            </div>
          </motion.div>

          {isModern ? (
            <motion.div
              className={cn(
                "theme-surface relative mt-6 grid grid-cols-1 gap-4 overflow-hidden rounded-[var(--theme-radius-lg)] border border-primary/25 bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5",
                "shadow-[0_0_48px_-16px_hsl(var(--primary)/0.4)]",
              )}
              initial={!reducedMotion ? { opacity: 0, y: 14 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.14] via-primary/[0.03] to-transparent"
                aria-hidden
              />
              <div className="relative min-w-0">
                {todayFreeSlots.length > 0 ? (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">Oportunidade de hoje</p>
                    <p className="mt-2 text-base font-medium text-foreground sm:text-lg">
                      Você pode faturar{" "}
                      <span className="theme-heading text-[1.65rem] font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
                        {formatMoney(animatedPotentialRevenue)}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {todayFreeSlots.length}{" "}
                      {todayFreeSlots.length === 1 ? "horário disponível" : "horários disponíveis"} para converter em clientes
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Zap className="h-4 w-4 shrink-0 text-primary" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                      Sem horários livres no período configurado
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Abra vagas na agenda para recuperar receita.</p>
                  </>
                )}
              </div>
              <div className="relative flex w-full min-w-0 justify-stretch sm:w-auto sm:justify-end sm:self-center">
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  className="w-full shrink-0 gap-1.5 rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                  onClick={() => setVagasLivresOpen(true)}
                >
                  Abrir vagas agora
                </Button>
              </div>
            </motion.div>
          ) : (
            <div
              className={cn(
                "mt-6 grid grid-cols-1 gap-4 overflow-hidden rounded-xl p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4",
                "glass-card border border-primary/30 bg-primary/5",
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Zap className="h-4 w-4 shrink-0 text-primary" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                  {todayFreeSlots.length > 0 ? (
                    <>
                      {todayFreeSlots.length} {todayFreeSlots.length === 1 ? "vaga livre" : "vagas livres"} hoje
                    </>
                  ) : (
                    "Sem vagas livres no período configurado"
                  )}
                </p>
                {todayFreeSlots.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Até ~{formatMoney(potentialVagasRevenue)} em ticket médio se você preencher os horários
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Abra ou preencha vagas para recuperar receita.</p>
                )}
              </div>
              <div className="flex w-full min-w-0 justify-stretch sm:w-auto sm:justify-end sm:self-center">
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  className="w-full shrink-0 gap-1.5 rounded-md px-4 py-2 text-sm font-semibold hover:!scale-100 active:!scale-100 sm:w-auto"
                  onClick={() => setVagasLivresOpen(true)}
                >
                  Preencher vagas
                </Button>
              </div>
            </div>
          )}

          {todayFreeSlots.length > 0 && potentialVagasRevenue > 0 ? (
            isModern ? (
              <motion.div
                className="mt-4 rounded-xl border border-border/70 bg-card/80 px-4 py-3.5 backdrop-blur-sm"
                initial={!reducedMotion ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                  <span>
                    Hoje ainda dá para faturar{" "}
                    <span className="font-semibold text-primary tabular-nums">{formatMoney(potentialVagasRevenue)}</span>{" "}
                    preenchendo horários vazios — seus{" "}
                    <span className="font-medium text-foreground">{todayFreeSlots.length}</span>{" "}
                    {todayFreeSlots.length === 1 ? "horário livre pode virar cliente" : "horários livres podem virar clientes"} hoje.
                  </span>
                </p>
              </motion.div>
            ) : (
              <div className="mt-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <Lightbulb className="h-4 w-4 text-primary" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                  Insight
                </span>{" "}
                — Você pode ganhar cerca de{" "}
                <span className="font-semibold text-primary">{formatMoney(potentialVagasRevenue)}</span> hoje preenchendo as vagas
                livres.
              </div>
            )
          ) : null}

          {isModern ? (
            <motion.div
              className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3"
              variants={reducedMotion ? undefined : kpiContainerVariants}
              initial={reducedMotion ? false : "hidden"}
              animate={reducedMotion ? undefined : "show"}
            >
              <motion.div
                variants={reducedMotion ? undefined : kpiItemVariants}
                className={cn("rounded-[14px] p-4 flex flex-col gap-1.5 border border-border bg-card transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_28px_-16px_hsl(var(--primary)/0.2)]")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Hoje</p>
                  <CalendarDays className="h-4 w-4 text-primary/90 shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">{todayAppointments.length}</p>
                <p className="text-[11px] text-muted-foreground">Agendamentos</p>
              </motion.div>
              <motion.div
                variants={reducedMotion ? undefined : kpiItemVariants}
                className={cn("rounded-[14px] p-4 flex flex-col gap-1.5 border border-border bg-card transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_28px_-16px_hsl(var(--primary)/0.2)]")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Em andamento</p>
                  <Clock className="h-4 w-4 text-primary/90 shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">{inServiceTodayCount}</p>
                <p className="text-[11px] text-muted-foreground">Na cadeira</p>
              </motion.div>
              <motion.div
                variants={reducedMotion ? undefined : kpiItemVariants}
                className={cn("rounded-[14px] p-4 flex flex-col gap-1.5 border border-border bg-card transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_28px_-16px_hsl(var(--primary)/0.2)]")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Atrasados</p>
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums tracking-tight">{lateTodayCount}</p>
                <p className="text-[11px] text-muted-foreground">{">10 min"}</p>
              </motion.div>
              <motion.div
                variants={reducedMotion ? undefined : kpiItemVariants}
                className={cn("rounded-[14px] p-4 flex flex-col gap-1.5 border border-border bg-card transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_28px_-16px_hsl(var(--primary)/0.2)]")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Faturamento previsto</p>
                  <Banknote className="h-4 w-4 text-primary/90 shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-3xl sm:text-4xl font-bold text-primary tabular-nums tracking-tight">
                  {formatMoney(faturamentoPrevistoRestante)}
                </p>
                <p className="text-[11px] text-muted-foreground">Pendente + em serviço</p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/60 bg-card/80 p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-3xl font-bold text-primary tabular-nums tracking-tight">{todayAppointments.length}</p>
                <p className="text-[11px] text-muted-foreground">agendamentos no dia</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Em andamento</p>
                  <Clock className="h-4 w-4 text-primary shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-3xl font-bold text-primary tabular-nums tracking-tight">{inServiceTodayCount}</p>
                <p className="text-[11px] text-muted-foreground">em atendimento agora</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Atrasados</p>
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-3xl font-bold text-primary tabular-nums tracking-tight">{lateTodayCount}</p>
                <p className="text-[11px] text-muted-foreground">Mais de 10 min após o horário</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Faturamento previsto</p>
                  <Banknote className="h-4 w-4 text-primary shrink-0" strokeWidth={isModern ? 1.7 : 2} aria-hidden />
                </div>
                <p className="font-display text-3xl font-bold text-primary tabular-nums tracking-tight">
                  {formatMoney(faturamentoPrevistoRestante)}
                </p>
                <p className="text-[11px] text-muted-foreground">restante (pendentes + em atendimento)</p>
              </div>
            </div>
          )}

        {limiteAtingido && profile.plano === "basico" && (
          <div className="dashboard-surface dashboard-glow-border flex items-start gap-3 rounded-xl border border-primary/50 bg-primary/10 p-4">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={isModern ? 1.7 : 2} />
            <div>
              <p className="font-medium text-foreground">Limite do plano Básico atingido</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Você atingiu {LIMITE_PLANO_BASICO} agendamentos no mês. Faça upgrade para liberar capacidade.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className={cn("font-semibold text-foreground", isModern ? "text-xl font-bold tracking-tight" : "text-lg")}>
            {isModern ? "Atendimentos em andamento" : "Atendimentos de hoje"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isModern ? (
              <>
                Vagas abertas aparecem na timeline. Use <span className="font-medium text-foreground">Abrir vagas agora</span> para
                transformar horários livres em oportunidades.
              </>
            ) : (
              <>
                Vagas abertas (aguardando cliente) aparecem aqui. Use <span className="font-medium text-foreground">Preencher vagas</span>{" "}
                só para liberar horários livres.
              </>
            )}
          </p>
          <div className="rounded-xl border border-border/60 bg-card/70 p-3">
            <p
              className={cn(
                "text-[11px] uppercase tracking-wide text-muted-foreground",
                isVintage ? "font-semibold tracking-[0.16em] text-primary/50" : "font-medium",
              )}
            >
              Legenda de cores
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {isVintage ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Em atendimento
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/22 bg-primary/[0.06] px-2.5 py-1 text-[11px] text-primary/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/55" />
                    Próximo
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/22 bg-primary/[0.06] px-2.5 py-1 text-[11px] text-primary/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                    Agora
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Atrasado
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                    Futuro ou concluído
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Em atendimento
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Próximo
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Agora
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    Atrasado
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70" />
                    Futuro ou concluído
                  </span>
                </>
              )}
            </div>
          </div>
          <div className={cn(
            "p-4 sm:p-5 border shadow-sm transition-all duration-300",
            isModern ? "rounded-3xl border-border/50 bg-card/40" : "rounded-2xl border-primary/20 bg-card/30"
          )}>
            {mergedAgendaByTime.timeKeys.length > 0 ? (
              <div className="space-y-6">
                {mergedAgendaByTime.timeKeys.map((slotTime) => {
                  const group = mergedAgendaByTime.items.filter((it) => {
                    const t = it.kind === "appointment" ? it.apt.time.slice(0, 5) : it.slot.time.slice(0, 5);
                    return t === slotTime;
                  });
                  return (
                    <div key={slotTime} className="space-y-2">
                      <p className="text-sm font-medium tabular-nums text-muted-foreground">{slotTime}</p>
                      <div className="space-y-2">
                        {group.map((it, i) =>
                          it.kind === "appointment" ? (
                            renderAgendaListRow(it.apt, i)
                          ) : (
                            <OpenSlotAgendaRow
                              key={it.slot.id}
                              slot={it.slot}
                              barbershopId={barbershopId}
                              slotDateKey={todayKey}
                              avgTicketEstimate={avgPriceToday}
                              listIdx={i}
                              onRefresh={refresh}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card/80 p-6 text-center text-sm text-muted-foreground">
                {todayAppointments.length === 0 && todayOpenWaitingSlots.length === 0
                  ? "Nenhum agendamento nem vaga aberta para hoje."
                  : isModern
                    ? "Dia finalizado. Tudo sob controle."
                    : "Nenhum atendimento restante — todos concluídos ou já encerrados."}
              </div>
            )}
          </div>

          {completedTodayList.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/50">
              <h3 className="text-sm font-semibold text-muted-foreground">Concluídos hoje ({completedTodayCount})</h3>
              <div className="space-y-2 opacity-90">
                {completedTodayList.map((apt, idx) => renderAgendaListRow(apt, idx))}
              </div>
            </div>
          )}
        </div>

        </div>

        <Dialog open={vagasLivresOpen} onOpenChange={setVagasLivresOpen}>
          <DialogContent className="barber-dialog-surface max-h-[90vh] max-w-4xl overflow-y-auto gap-4 border-border p-6 sm:max-w-4xl sm:rounded-xl hide-scrollbar">
            <DialogHeader>
              <DialogTitle>{isModern ? "Oportunidades e vagas" : "Vagas livres"}</DialogTitle>
              <DialogDescription className={isModern ? "text-sm text-muted-foreground" : "text-sm text-foreground/70"}>
                {isModern
                  ? "Acompanhe horários ociosos e abra encaixes com mais chance de conversão."
                  : "Acompanhe os horários com menor movimento e abra encaixes com mais critério."}
              </DialogDescription>
            </DialogHeader>
            <VagasLivresPanel onDataChange={refresh} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!detailApt} onOpenChange={(open) => !open && setDetailApt(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Detalhes do agendamento</DialogTitle>
            </DialogHeader>
            {detailApt ? renderAppointmentCard(detailApt, 0) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar horário</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Horário</Label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!clientProfile} onOpenChange={(open) => !open && (setClientProfile(null), setClientNote(""))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Perfil do cliente</DialogTitle>
            </DialogHeader>
            {clientProfile && (() => {
              const completedForClient = appointments.filter((apt) => apt.client === clientProfile.client && apt.status === "completed");
              const lastCompleted = completedForClient
                .sort((a, b) => (parseAppointmentDateTime(b).getTime() - parseAppointmentDateTime(a).getTime()))
                [0];
              const lastCutDays = lastCompleted
                ? Math.floor((Date.now() - parseAppointmentDateTime(lastCompleted).getTime()) / (24 * 60 * 60 * 1000))
                : null;
              const photos = appointments.filter((apt) => apt.client === clientProfile.client && apt.thumbnailUrl);
              return (
                <div className="space-y-4 text-sm">
                  <p className="text-lg font-display font-bold text-foreground">{clientProfile.client}</p>
                  <p className="text-muted-foreground">Último serviço: {clientProfile.service}</p>
                  <p>
                    Frequência: <strong>{completedForClient.length}</strong> atendimentos concluídos
                    {completedForClient.length >= 4 && (
                      <span className={cn("ml-1.5", isVintage ? "text-primary/85" : "text-amber-400")}> · Cliente fiel</span>
                    )}
                  </p>
                  <p>
                    Último corte: {lastCutDays != null ? `há ${lastCutDays} dias` : "—"}
                  </p>
                  <p>Tipo de cabelo: não informado</p>
                  <p>Preferência: não informado</p>
                  {photos.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 shrink-0" strokeWidth={isModern ? 1.7 : 2} />
                        Últimos cortes
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {photos.slice(0, 4).map((apt) => (
                          <a
                            key={`${apt.id}-${apt.thumbnailUrl}`}
                            href={apt.thumbnailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-border/60 hover:ring-2 hover:ring-primary/40"
                          >
                            <img
                              src={apt.thumbnailUrl}
                              alt="Foto do corte"
                              className="w-20 h-20 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Clique para ampliar</p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Nota do cliente (opcional)</Label>
                    <Input
                      placeholder="Ex: Gosta do cabelo bem curto nas laterais"
                      value={clientNote}
                      onChange={(e) => setClientNote(e.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        <Dialog open={!!messageTarget} onOpenChange={(open) => !open && setMessageTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mensagem rápida ao cliente</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Escolha uma opção ou edite o texto abaixo.</p>
            <div className="grid gap-2">
              {QUICK_MESSAGES.map((msg) => (
                <Button
                  key={msg.label}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2.5"
                  onClick={() => setMessageText(msg.text)}
                >
                  {msg.label}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Mensagem (pode editar)</Label>
              <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={3} className="resize-none" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageTarget(null)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (!messageTarget) return;
                  openWhatsApp(messageTarget, messageText);
                  void notifyClient(messageTarget, "Mensagem da barbearia", messageText);
                  setMessageTarget(null);
                  toast({ title: "Mensagem enviada", description: "O cliente foi avisado." });
                }}
              >
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!completeWithProduct} onOpenChange={(open) => !open && setCompleteWithProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concluir atendimento</DialogTitle>
            </DialogHeader>
            {completeWithProduct && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <strong>{completeWithProduct.client}</strong> — {completeWithProduct.service}
                </p>
                <p className="text-sm">O cliente comprou algum produto na loja?</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => completeWithProduct && setCompleteWithProduct(null)}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (completeWithProduct) {
                    toast({ title: "Em breve", description: "Integração com a loja será disponibilizada em breve." });
                    setCompleteWithProduct(null);
                  }
                }}
              >
                Sim, registrar venda
              </Button>
              <Button
                onClick={() => completeWithProduct && doComplete(completeWithProduct)}
              >
                Não, só concluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberDashboard;
