import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Flame, MessageCircle, RefreshCw, Sparkles, Sunrise, Sunset, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { getCanonicalAppointmentsForBarbershop } from "@/lib/appointments";
import { formatDateKey, getFreeSlotsForDate, parseAppointmentDateTime } from "@/lib/barberSchedule";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getOpenSlotsForDate, upsertOpenSlot } from "@/lib/openSlots";
import { getTeam } from "@/lib/team";
import { cn } from "@/lib/utils";

const formatMoney = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DEFAULT_GRID_DURATION_MIN = 30;
const DURATION_OPTIONS = [15, 30, 45, 60] as const;
const FREE_OPTS = { startHour: 9, endHour: 19, intervalMinutes: 45 } as const;

export type VagasLivresPanelProps = {
  onDataChange?: () => void;
};

type OpenDraftState =
  | { phase: "form"; time: string }
  | { phase: "success"; time: string; durationMinutes: number };

type SlotPeriod = "morning" | "afternoon" | "evening";

type SlotVisualState = "normal" | "recommended" | "priority" | "lowDemand";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function slotDateTime(dateKey: string, time: string) {
  return parseAppointmentDateTime({ date: dateKey, time });
}

function slotHour(time: string): number {
  return Number(time.split(":")[0]) || 0;
}

/** Manhã até 11h59 · Tarde 12h–17h59 · Noite a partir das 18h (alinha ao atalho 12h–17h) */
function slotPeriod(time: string): SlotPeriod {
  const h = slotHour(time);
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

const VagasLivresPanel = ({ onDataChange }: VagasLivresPanelProps) => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const [refreshTick, setRefreshTick] = useState(0);
  const profile = useMemo(() => getBarbershopProfile(barbershopId), [barbershopId]);
  const team = useMemo(() => getTeam(barbershopId), [barbershopId]);
  const staffList = useMemo(() => {
    if (!team) return [] as { name: string }[];
    return [{ name: team.owner.name }, ...team.members.map((m) => ({ name: m.name }))];
  }, [team]);
  const multiStaff = staffList.length > 1;

  const copy = isModern
    ? {
        title: "Vagas livres",
        subtitle: "Veja os melhores horários para abrir vagas com menor risco operacional.",
        summaryPotentialTitle: "Potencial livre",
        summaryCountTitle: "Horários disponíveis",
        summaryIdleTitle: "Faixa mais ociosa",
        summaryActionTitle: "Ação sugerida",
        countSuffix: "vagas hoje",
        countSuffixOther: "livres nesta data",
        idleAfter16: "Após 16h",
        idleNone: "Sem concentração",
        actionAfternoon: "Abrir tarde",
        actionAfternoonHint: "Libera 12h–17h agora.",
        periodMorning: "Manhã",
        periodAfternoon: "Tarde",
        periodEvening: "Noite",
        badgePriority: "Abrir agora",
        badgeRecommended: "Recomendado",
        badgeLow: "Baixa procura",
        microNormal: "Disponível",
        microRecommended: "Boa chance",
        microPriority: "Melhor janela",
        microLow: "Menor demanda",
        cardCta: "Abrir vaga",
        afternoonCta: "Abrir encaixes da tarde",
        refreshLabel: "Atualizar",
        legendTitle: "Legenda",
        legendNormal: "sem destaque",
        legendRecommended: "próximas 2h",
        legendPriority: "melhor janela",
        legendLow: "baixa procura",
      }
    : {
        title: "Vagas livres",
        subtitle: "Acompanhe os horários com menor movimento e abra encaixes com mais critério.",
        summaryPotentialTitle: "Movimento em aberto",
        summaryCountTitle: "Horários livres",
        summaryIdleTitle: "Faixa mais livre",
        summaryActionTitle: "Sugestão do dia",
        countSuffix: "aguardando abertura",
        countSuffixOther: "livres nesta data",
        idleAfter16: "Após 16h",
        idleNone: "Agenda equilibrada",
        actionAfternoon: "Liberar tarde",
        actionAfternoonHint: "Disponibiliza o período da tarde.",
        periodMorning: "Manhã",
        periodAfternoon: "Tarde",
        periodEvening: "Noite",
        badgePriority: "Sugerido",
        badgeRecommended: "Melhor janela",
        badgeLow: "Menor procura",
        microNormal: "Disponível",
        microRecommended: "Boa janela",
        microPriority: "Vale abrir agora",
        microLow: "Menor movimento",
        cardCta: "Abrir vaga",
        afternoonCta: "Liberar horários da tarde",
        refreshLabel: "Atualizar",
        legendTitle: "Legenda",
        legendNormal: "livre",
        legendRecommended: "janela recomendada",
        legendPriority: "próximo encaixe",
        legendLow: "movimento calmo",
      };

  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedStaffName, setSelectedStaffName] = useState(() => {
    const t = getTeam(barbershopId);
    return t?.owner.name ?? getBarbershopProfile(barbershopId).barberName ?? "Equipe";
  });
  const [openDraft, setOpenDraft] = useState<OpenDraftState | null>(null);
  const [draftDuration, setDraftDuration] = useState<number>(30);

  const bump = () => {
    setRefreshTick((p) => p + 1);
    onDataChange?.();
  };

  const dateKey = formatDateKey(selectedDate);
  const appointments = getCanonicalAppointmentsForBarbershop(barbershopId);
  const freeSlots = getFreeSlotsForDate(appointments, selectedDate, FREE_OPTS);
  const openedSlots = getOpenSlotsForDate(barbershopId, dateKey);
  const openSet = new Set(openedSlots.map((slot) => slot.time));
  const avgPrice = useMemo(() => {
    const vals = appointments.map((a) => Number(a.price ?? 0)).filter((v) => Number.isFinite(v) && v > 0);
    return vals.length ? vals.reduce((acc, v) => acc + v, 0) / vals.length : 45;
  }, [appointments]);
  const perSlotValue = Math.round(avgPrice);

  const remainingFreeSlots = freeSlots.filter((t) => !openSet.has(t));
  const dayPotentialIfAllLiberated = remainingFreeSlots.length * perSlotValue;

  const isToday = formatDateKey(selectedDate) === formatDateKey(startOfDay(new Date()));

  const { slotsInNext2h, next2hSlotSet, lastChanceSlots } = useMemo(() => {
    void refreshTick;
    const now = new Date();
    const last = new Set<string>();
    const in2h = new Set<string>();
    if (!isToday) {
      remainingFreeSlots.forEach((t) => {
        if (t >= "16:00") last.add(t);
      });
      return { slotsInNext2h: 0, next2hSlotSet: in2h, lastChanceSlots: last };
    }

    const twoH = now.getTime() + 120 * 60 * 1000;
    remainingFreeSlots.forEach((t) => {
      const ts = slotDateTime(dateKey, t).getTime();
      if (ts > now.getTime() && ts <= twoH) in2h.add(t);
      if (t >= "16:00") last.add(t);
    });

    return { slotsInNext2h: in2h.size, next2hSlotSet: in2h, lastChanceSlots: last };
  }, [isToday, remainingFreeSlots, dateKey, refreshTick]);

  const urgentSlot = useMemo(() => {
    void refreshTick;
    if (!isToday || remainingFreeSlots.length === 0) return null;
    const now = new Date();
    const sorted = [...remainingFreeSlots].sort((a, b) => a.localeCompare(b));
    const t0 = now.getTime();
    for (const t of sorted) {
      if (slotDateTime(dateKey, t).getTime() > t0) return t;
    }
    return sorted[0] ?? null;
  }, [isToday, remainingFreeSlots, dateKey, refreshTick]);

  const hasEveningConcentration = remainingFreeSlots.some((t) => slotHour(t) >= 16);
  const hasAfternoonSlots = remainingFreeSlots.some((t) => {
    const h = slotHour(t);
    return h >= 12 && h < 18;
  });

  const groupedByPeriod = useMemo(() => {
    const slots = remainingFreeSlots.slice(0, 24);
    const groups: Record<SlotPeriod, string[]> = { morning: [], afternoon: [], evening: [] };
    slots.forEach((t) => groups[slotPeriod(t)].push(t));
    return groups;
  }, [remainingFreeSlots]);

  const periodMeta: { id: SlotPeriod; label: string; icon: typeof Sunrise }[] = [
    { id: "morning", label: copy.periodMorning, icon: Sunrise },
    { id: "afternoon", label: copy.periodAfternoon, icon: Sunset },
    { id: "evening", label: copy.periodEvening, icon: Moon },
  ];

  const dateLabel = selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  const setToday = () => setSelectedDate(startOfDay(new Date()));
  const setTomorrow = () => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const barberTag = multiStaff ? selectedStaffName : profile.barberName || team?.owner.name || "Profissional";

  const shareOpenSlotToWhatsApp = (time: string, durationMinutes?: number) => {
    const shop = profile.nomeBarbearia || "nossa barbearia";
    const dur = durationMinutes ? ` (${durationMinutes} min)` : "";
    const msg = encodeURIComponent(
      `Horário livre às ${time}${dur} na ${shop}. Quer garantir? Chama aqui e fecha teu horário.`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const priceForDuration = (minutes: number) => Math.max(0, Math.round(perSlotValue * (minutes / 30)));

  const confirmOpenSlotFromModal = () => {
    if (!openDraft || openDraft.phase !== "form") return;
    const timeStr = openDraft.time;
    const duration = draftDuration;
    const barberName = multiStaff ? selectedStaffName : undefined;
    const created = upsertOpenSlot(barbershopId, {
      date: dateKey,
      time: timeStr,
      durationMinutes: duration,
      potentialValue: priceForDuration(duration),
      source: "manual",
      assignedBarberName: barberName,
    });
    if (!created) {
      toast({
        title: "Não foi possível abrir",
        description: "Horário inválido, fora do expediente ou já ocupado por agendamento/vaga.",
        variant: "destructive",
      });
      return;
    }
    setOpenDraft({ phase: "success", time: timeStr, durationMinutes: duration });
    bump();
  };

  const handleBulkAfternoon = () => {
    const toOpen = remainingFreeSlots.filter((t) => {
      const h = slotHour(t);
      return h >= 12 && h < 18;
    });
    if (toOpen.length === 0) {
      toast({ title: "Nada para abrir", description: "Sem horários livres na tarde (12h–17h) nesta data." });
      return;
    }
    const barberName = multiStaff ? selectedStaffName : undefined;
    toOpen.forEach((time) => {
      upsertOpenSlot(barbershopId, {
        date: dateKey,
        time,
        durationMinutes: DEFAULT_GRID_DURATION_MIN,
        potentialValue: priceForDuration(DEFAULT_GRID_DURATION_MIN),
        source: "manual",
        assignedBarberName: barberName,
      });
    });
    bump();
    toast({ title: `${toOpen.length} vaga(s) aberta(s)` });
  };

  const moneyLine = isToday
    ? `${formatMoney(dayPotentialIfAllLiberated)} ainda disponíveis`
    : `${formatMoney(dayPotentialIfAllLiberated)} disponíveis nesta data`;

  function slotVisualState(slot: string): SlotVisualState {
    const isPriority = urgentSlot === slot;
    const in2h = next2hSlotSet.has(slot);
    const low = lastChanceSlots.has(slot) && isToday && !in2h;
    if (isPriority) return "priority";
    if (in2h) return "recommended";
    if (low) return "lowDemand";
    return "normal";
  }

  function slotBadge(state: SlotVisualState): string | null {
    if (state === "priority") return copy.badgePriority;
    if (state === "recommended") return copy.badgeRecommended;
    if (state === "lowDemand") return copy.badgeLow;
    return null;
  }

  function slotMicro(state: SlotVisualState): string {
    if (state === "priority") return copy.microPriority;
    if (state === "recommended") return copy.microRecommended;
    if (state === "lowDemand") return copy.microLow;
    return copy.microNormal;
  }

  const accentColor = isModern ? "text-primary" : "text-primary";
  const iconBadgeClass = cn(
    "flex h-8 w-8 items-center justify-center rounded-full",
    isModern ? "bg-primary/10" : "bg-primary/15 shadow-sm shadow-primary/10"
  );

  return (
    <div className="space-y-5 scroll-smooth touch-manipulation pb-1 hide-scrollbar">
      {/* 1. Cabeçalho / Contexto do Dia */}
      <div className={cn(
        "relative overflow-hidden",
        isModern ? "rounded-xl border border-border/60 bg-card p-5" : "rounded-[2rem] border border-primary/25 bg-gradient-to-b from-card to-card/95 p-8 shadow-xl"
      )}>
        {!isModern && (
          <motion.div
            className="pointer-events-none absolute -top-24 -right-20 w-52 h-52 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 70%)" }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className={cn("font-bold text-foreground", isModern ? "text-xl" : "text-3xl")}>
              {copy.title}
            </h1>
            <p className={cn("text-muted-foreground leading-relaxed", isModern ? "text-xs max-w-sm" : "text-sm max-w-md")}>
              {copy.subtitle}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-lg border border-border/40">
              <Input
                type="date"
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(startOfDay(new Date(`${e.target.value}T12:00:00`)))}
                className={cn("h-8 border-none bg-transparent text-[11px] w-[120px] focus-visible:ring-0")}
              />
              <div className="flex gap-1 pr-1">
                <button onClick={setToday} className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider rounded bg-background hover:bg-muted transition-colors">Hoje</button>
                <button onClick={setTomorrow} className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider rounded bg-background hover:bg-muted transition-colors">Amanhã</button>
              </div>
            </div>
            {multiStaff && (
              <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
                <SelectTrigger className="h-10 w-[160px] text-xs bg-muted/20 border-border/40 rounded-lg">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* 2. Resumo do Dia mais leve */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3",
        isModern ? "" : "px-2"
      )}>
        {[
          { label: copy.summaryPotentialTitle, value: moneyLine, color: "text-foreground" },
          { label: copy.summaryCountTitle, value: `${remainingFreeSlots.length} ${isToday ? copy.countSuffix : copy.countSuffixOther}`, color: "text-foreground" },
          { label: copy.summaryIdleTitle, value: hasEveningConcentration ? copy.idleAfter16 : copy.idleNone, color: "text-foreground" },
          { label: copy.summaryActionTitle, value: copy.actionAfternoon, color: accentColor, action: handleBulkAfternoon, show: hasAfternoonSlots }
        ].filter(i => i.show !== false).map((item, i) => (
          <div key={i} className={cn(
            "flex flex-col justify-between p-4 rounded-xl border transition-all",
            isModern ? "bg-card border-border/60" : "bg-card/50 border-primary/10 shadow-sm",
            item.action && "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
          )} onClick={item.action}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
            <p className={cn("text-sm font-bold truncate", item.color)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 3. Oportunidades por turno */}
      <div className={isModern ? "space-y-6" : "space-y-10"}>
        {periodMeta.map(({ id, label, icon: Icon }) => {
          const slots = groupedByPeriod[id];
          if (slots.length === 0) return null;

          // Separar em destacados e comuns
          const highlighted = slots.filter(s => slotVisualState(s) === "priority" || slotVisualState(s) === "recommended").slice(0, 3);
          const others = slots.filter(s => !highlighted.includes(s));

          return (
            <div key={id} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className={iconBadgeClass}>
                  <Icon className={cn("w-4 h-4", accentColor)} />
                </div>
                <h3 className={cn("font-bold text-foreground", isModern ? "text-sm" : "text-lg")}>{label}</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-auto">{slots.length} horários</span>
              </div>

              {/* Destaques principais */}
              {highlighted.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {highlighted.map(slot => {
                    const state = slotVisualState(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => setOpenDraft({ phase: "form", time: slot })}
                        className={cn(
                          "relative group flex items-center justify-between p-4 rounded-2xl border transition-all overflow-hidden",
                          isModern 
                            ? "bg-primary/5 border-primary/30 hover:bg-primary/10" 
                            : "bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 shadow-lg"
                        )}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn("text-xs font-bold uppercase tracking-widest", accentColor)}>
                            {slotBadge(state)}
                          </span>
                          <span className="text-2xl font-bold text-foreground tabular-nums">{slot}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{slotMicro(state)}</span>
                        </div>
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                          isModern ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground shadow-xl"
                        )}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Grade compacta */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {others.map(slot => {
                  return (
                    <button
                      key={slot}
                      onClick={() => setOpenDraft({ phase: "form", time: slot })}
                      className={cn(
                        "flex flex-col items-center justify-center py-3 rounded-xl border transition-all group",
                        isModern 
                          ? "bg-card border-border/40 hover:border-primary/40" 
                          : "bg-card/40 border-primary/5 hover:border-primary/20 hover:bg-card/60"
                      )}
                    >
                      <span className="text-sm font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">{slot}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase mt-0.5">{copy.cardCta}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda Enxuta */}
      <div className={cn(
        "flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-border/40",
        isModern ? "px-4" : "px-8"
      )}>
        {[
          { label: copy.badgePriority, color: "bg-primary" },
          { label: copy.badgeRecommended, color: isModern ? "bg-sky-500" : "bg-primary/60" },
          { label: copy.badgeLow, color: "bg-rose-500" },
          { label: copy.microNormal, color: "bg-muted-foreground/30" }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", item.color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <section
        className={cn(
          "rounded-xl border border-dashed px-4 py-3 text-center",
          isModern ? "border-primary/25 bg-primary/5" : "border-primary/30 bg-primary/[0.07]",
        )}
      >
        <p className={cn("text-xs leading-relaxed", isModern ? "text-muted-foreground" : "text-foreground/70")}>
          Horários <span className="font-medium text-foreground">aguardando cliente</span> ou{" "}
          <span className="font-medium text-foreground">em atendimento</span> continuam visíveis na{" "}
          <span className="font-medium text-primary">Agenda de Hoje</span> ao fechar este painel.
        </p>
      </section>

      <Dialog
        open={Boolean(openDraft)}
        onOpenChange={(o) => {
          if (!o) {
            setOpenDraft(null);
            setDraftDuration(30);
          }
        }}
      >
        <DialogContent className="barber-dialog-surface border-border sm:max-w-md">
          {openDraft?.phase === "success" ? (
            <>
              <DialogHeader>
                <DialogTitle className={!isModern ? "font-vintage-display text-2xl text-primary" : ""}>Vaga aberta</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center relative",
                  isModern ? "bg-primary/10" : "bg-primary shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)]"
                )}>
                  {!isModern && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
                  )}
                  <CheckCircle2 className={cn("h-10 w-10 relative z-10", isModern ? "text-primary" : "text-primary-foreground")} />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className={cn("text-2xl font-bold", isModern ? "" : "font-vintage-display text-gradient-gold")}>
                      Sucesso!
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      Horário disponibilizado com êxito
                    </p>
                  </div>
                  
                  <div className={cn(
                    "px-6 py-3 rounded-2xl border",
                    isModern ? "bg-muted/30 border-border" : "bg-primary/5 border-primary/20"
                  )}>
                    <p className={cn(
                      "text-3xl font-bold tabular-nums",
                      isModern ? "text-foreground" : "font-vintage-display text-primary"
                    )}>
                      {openDraft.time}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                      {openDraft.durationMinutes} minutos de duração
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outlineGold"
                  className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border-primary/30"
                  onClick={() => shareOpenSlotToWhatsApp(openDraft.time, openDraft.durationMinutes)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Divulgar no WhatsApp
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="gold"
                  className="w-full font-black uppercase tracking-widest text-[10px] h-12 rounded-xl"
                  onClick={() => {
                    setOpenDraft(null);
                    setDraftDuration(30);
                  }}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className={cn(!isModern && "space-y-1 pb-4")}>
                <DialogTitle className={cn(
                  !isModern ? "font-vintage-display text-2xl text-primary" : ""
                )}>
                  Abrir vaga
                </DialogTitle>
                {!isModern && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Disponibilize este horário para novo agendamento
                  </p>
                )}
              </DialogHeader>
              
              <div className="space-y-8 py-4">
                {/* HORÁRIO EM DESTAQUE */}
                <div className={cn(
                  "relative flex flex-col items-center justify-center py-6 rounded-2xl border",
                  isModern 
                    ? "bg-muted/30 border-border" 
                    : "bg-primary/5 border-primary/20 shadow-inner"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">
                    Horário selecionado
                  </span>
                  <p className={cn(
                    "font-bold tabular-nums text-foreground overflow-visible",
                    isModern ? "text-4xl tracking-tighter leading-none" : "text-6xl font-vintage-display text-gradient-gold py-2 leading-tight"
                  )}>
                    {openDraft?.time}
                  </p>
                </div>

                {/* DURAÇÃO DA VAGA */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Duração da vaga
                    </p>
                    <span className="text-[10px] font-bold text-primary/60 italic">
                      {draftDuration} minutos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDraftDuration(d)}
                        className={cn(
                          "h-12 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all",
                          draftDuration === d
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : isModern
                              ? "bg-background border-border text-foreground hover:border-primary/40"
                              : "bg-primary/5 border-primary/10 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        )}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                  
                  {/* REGRA DE EXPIRAÇÃO REFINADA */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    isModern ? "bg-muted/30 border-border" : "bg-primary/[0.02] border-primary/5"
                  )}>
                    <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground/80 font-medium">
                      {!isModern 
                        ? "Este horário ficará disponível como vaga livre na agenda e poderá expirar automaticamente caso não seja ocupado a tempo."
                        : "A vaga expira automaticamente conforme as regras da agenda."}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 sm:gap-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="font-black uppercase tracking-widest text-[10px] h-12 rounded-xl text-muted-foreground"
                  onClick={() => setOpenDraft(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  variant="gold" 
                  className="font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-lg shadow-primary/20"
                  onClick={confirmOpenSlotFromModal}
                >
                  {isModern ? "Abrir vaga" : "Disponibilizar horário"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VagasLivresPanel;
