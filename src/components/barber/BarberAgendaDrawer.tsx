import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  CalendarDays,
  Clock3,
  Scissors,
  BadgeDollarSign,
  CircleDot,
  Plus,
  Ban,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MockAgendaItem, MockAgendaSummary } from "@/lib/teamMemberAgendaMock";

export type BarberAgendaDrawerStatus = "online" | "offline" | "busy";

const statusLabel: Record<MockAgendaItem["status"], string> = {
  completed: "Concluído",
  upcoming: "Próximo",
  open: "Livre",
  in_progress: "Em atendimento",
};

export type BarberAgendaDrawerBarber = {
  id: string;
  name: string;
  roleLabel: string;
  status: BarberAgendaDrawerStatus;
};

type BarberAgendaDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Chamado após a animação de fechar (limpar membro selecionado no pai). */
  onExitComplete?: () => void;
  barber: BarberAgendaDrawerBarber | null;
  items: MockAgendaItem[];
  summary: MockAgendaSummary | null;
};

function statusBadgeClass(status: MockAgendaItem["status"], vintage: boolean): string {
  if (vintage) {
    switch (status) {
      case "completed":
        return "border border-white/10 bg-white/5 text-[#B7A895]";
      case "upcoming":
        return "border border-[#D4A24C]/25 bg-[#2B1F14] text-[#E1B562]";
      case "open":
        return "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
      case "in_progress":
        return "border border-sky-500/25 bg-sky-500/10 text-sky-300";
      default:
        return "";
    }
  }
  switch (status) {
    case "completed":
      return "border border-white/10 bg-white/[0.03] text-zinc-500";
    case "upcoming":
      return "border border-primary/25 bg-primary/10 text-primary";
    case "open":
      return "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    case "in_progress":
      return "border border-amber-500/25 bg-amber-500/10 text-amber-300";
    default:
      return "";
  }
}

export function BarberAgendaDrawer({ open, onClose, onExitComplete, barber, items, summary }: BarberAgendaDrawerProps) {
  const { identity } = useTheme();
  const vintage = identity === "vintage";
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  const dur = vintage ? 0.28 : 0.18;
  const stagger = reduceMotion ? 0 : vintage ? 0.04 : 0.02;

  useEffect(() => {
    if (!barber) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [barber]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>("[data-drawer-focus]");
    queueMicrotask(() => el?.focus());
  }, [open, barber?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined" || !barber) return null;

  const statusLine =
    barber.status === "online"
      ? vintage
        ? "Online"
        : "Online"
      : barber.status === "busy"
        ? vintage
          ? summary?.inProgressEndsAt
            ? `Em atendimento · até ~${summary.inProgressEndsAt}`
            : "Em atendimento"
          : `Em atendimento${summary?.inProgressEndsAt ? ` · ~${summary.inProgressEndsAt}` : ""}`
        : vintage
          ? "Offline"
          : "Offline";

  const eyebrow = vintage ? "Agenda do barbeiro" : "Agenda do dia";
  const insightPrefix = vintage ? "" : "";

  const handleOpenSlot = () => {
    toast({ title: "Em breve", description: "Abrir vaga na agenda estará disponível em breve." });
  };

  const handleBlock = () => {
    toast({ title: "Em breve", description: "Bloquear horário estará disponível em breve." });
  };

  const handleFullAgenda = () => {
    onClose();
    navigate("/barbeiro");
  };

  const easeCurve = vintage ? ([0.25, 0.1, 0.25, 1] as const) : ([0.16, 1, 0.3, 1] as const);

  const drawerContent = (
    <>
      <motion.div
        key="agenda-overlay"
        role="presentation"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.01 : dur * 0.85, ease: easeCurve }}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[60]",
          vintage ? "bg-black/60 backdrop-blur-[2px]" : "bg-black/55 backdrop-blur-[1px]",
        )}
      />
      <motion.aside
        key="agenda-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Agenda de ${barber.name}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: reduceMotion ? 0.01 : dur, ease: easeCurve }}
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-full w-full max-w-[460px] flex-col border-l shadow-none",
          vintage
            ? "border-[#D4A24C]/20 bg-gradient-to-b from-[#18110d] to-[#120d0a] shadow-[0_0_40px_rgba(212,162,76,0.08)]"
            : "border-white/10 bg-[#0B0B0B]",
        )}
      >
      <div className={cn("border-b px-5 py-4 sm:px-6 sm:py-5", vintage ? "border-[#D4A24C]/10" : "border-white/10")}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] uppercase tracking-[0.2em]",
                vintage ? "text-[#B89B76]" : "text-zinc-500",
              )}
            >
              {eyebrow}
            </p>
            <h2
              className={cn(
                "mt-1 text-xl font-semibold sm:text-2xl",
                vintage ? "font-display text-[#F6EFE5]" : "font-sans text-white",
              )}
            >
              {vintage ? `Agenda de ${barber.name}` : barber.name}
            </h2>
            <p className={cn("mt-1 text-sm", vintage ? "text-[#B7A895]" : "text-zinc-400")}>
              {barber.roleLabel} · {statusLine}
            </p>
            {barber.status === "offline" && summary?.lastSeenLabel && (
              <p className={cn("mt-1 text-xs", vintage ? "text-[#8a7a68]" : "text-zinc-500")}>{summary.lastSeenLabel}</p>
            )}
          </div>
          <button
            type="button"
            data-drawer-focus
            onClick={onClose}
            className={cn(
              "rounded-lg p-2 transition-colors shrink-0",
              vintage
                ? "border border-[#D4A24C]/20 text-[#B7A895] hover:bg-[#20170f] hover:text-[#F6EFE5]"
                : "border border-white/10 text-zinc-400 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div
              className={cn(
                "rounded-xl p-3 sm:p-4",
                vintage ? "border border-[#D4A24C]/15 bg-[#1A1410]/90" : "border border-white/10 bg-[#111111]",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <CalendarDays className={cn("h-4 w-4", vintage ? "text-[#D4A24C]" : "text-primary")} />
                <span className={cn("text-xs", vintage ? "text-[#B7A895]" : "text-zinc-500")}>
                  {vintage ? "Próximo" : "Próximo"}
                </span>
              </div>
              <p className={cn("text-base font-semibold sm:text-lg", vintage ? "text-[#F6EFE5]" : "text-white")}>
                {summary.nextLabel}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl p-3 sm:p-4",
                vintage ? "border border-[#D4A24C]/15 bg-[#1A1410]/90" : "border border-white/10 bg-[#111111]",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Clock3 className={cn("h-4 w-4", vintage ? "text-[#D4A24C]" : "text-primary")} />
                <span className={cn("text-xs", vintage ? "text-[#B7A895]" : "text-zinc-500")}>
                  {vintage ? "Livres hoje" : "Livres hoje"}
                </span>
              </div>
              <p className={cn("text-base font-semibold sm:text-lg", vintage ? "text-[#F6EFE5]" : "text-white")}>
                {summary.freeSlots}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl p-3 sm:p-4",
                vintage ? "border border-[#D4A24C]/15 bg-[#1A1410]/90" : "border border-white/10 bg-[#111111]",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <BadgeDollarSign className={cn("h-4 w-4", vintage ? "text-[#D4A24C]" : "text-primary")} />
                <span className={cn("text-xs", vintage ? "text-[#B7A895]" : "text-zinc-500")}>Hoje</span>
              </div>
              <p className={cn("text-base font-semibold sm:text-lg", vintage ? "text-[#F6EFE5]" : "text-white")}>
                {summary.revenueToday}
              </p>
            </div>
          </div>
        )}

        {summary && (
          <p className={cn("mt-3 text-xs leading-relaxed", vintage ? "text-[#B7A895]" : "text-zinc-500")}>
            {insightPrefix}
            {summary.monthTotal} atendimentos no mês · {summary.todayTotal} hoje
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className={cn("text-sm font-semibold", vintage ? "font-display text-[#F6EFE5]" : "text-white")}>Hoje</h3>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px]",
              vintage ? "border border-[#D4A24C]/20 bg-[#241a12] text-[#E1B562]" : "border border-white/10 bg-white/[0.03] text-zinc-300",
            )}
          >
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </div>

        {items.length === 0 ? (
          <div
            className={cn(
              "rounded-xl p-4 sm:p-5",
              vintage ? "border border-[#D4A24C]/15 bg-[#1A1410]/90" : "border border-white/10 bg-[#111111]",
            )}
          >
            <p className={cn("text-sm font-medium", vintage ? "text-[#F6EFE5]" : "text-white")}>Nenhum atendimento hoje</p>
            <p className={cn("mt-1 text-sm", vintage ? "text-[#B7A895]" : "text-zinc-400")}>
              {vintage
                ? "Abra uma vaga ou ajuste a disponibilidade para receber clientes."
                : "Use as ações abaixo para abrir vaga ou ver a agenda completa."}
            </p>
          </div>
        ) : (
          <motion.ul className="space-y-2 sm:space-y-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: stagger } } }}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                variants={{
                  hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: vintage ? 10 : 6 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: reduceMotion ? 0 : vintage ? 0.24 : 0.16 },
                  },
                }}
                className={cn(
                  "rounded-xl p-3 sm:p-4",
                  vintage ? "border border-[#D4A24C]/15 bg-[#1A1410]/90" : "border border-white/10 bg-[#111111]",
                  (item.status === "upcoming" || item.status === "in_progress") &&
                    (vintage ? "shadow-[0_0_18px_rgba(212,162,76,0.06)]" : "ring-1 ring-primary/15"),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 rounded-lg p-2",
                        vintage ? "border border-[#D4A24C]/20 bg-[#241a12]" : "border border-white/10 bg-white/[0.03]",
                      )}
                    >
                      <Scissors className={cn("h-4 w-4", vintage ? "text-[#D4A24C]" : "text-primary")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("text-sm font-semibold", vintage ? "text-[#F6EFE5]" : "text-white")}>
                          {item.start}
                          {item.end ? ` — ${item.end}` : ""}
                        </p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px]", statusBadgeClass(item.status, vintage))}>
                          {statusLabel[item.status]}
                        </span>
                      </div>
                      <p className={cn("mt-1 text-sm", vintage ? "text-[#F6EFE5]" : "text-zinc-200")}>{item.service}</p>
                      {item.customer && (
                        <p className={cn("mt-1 text-xs", vintage ? "text-[#B7A895]" : "text-zinc-500")}>Cliente: {item.customer}</p>
                      )}
                    </div>
                  </div>
                  {item.status === "in_progress" && <CircleDot className="mt-1 h-4 w-4 shrink-0 text-amber-400 animate-pulse" />}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {summary?.insight && items.length > 0 && (
          <p
            className={cn(
              "mt-4 rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
              vintage ? "border-[#D4A24C]/15 bg-[#1A1410]/80 text-[#B7A895]" : "border-white/10 bg-white/[0.02] text-zinc-400",
            )}
          >
            {summary.insight}
          </p>
        )}
      </div>

      <div className={cn("border-t px-5 py-4 sm:px-6", vintage ? "border-[#D4A24C]/10" : "border-white/10")}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleOpenSlot}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform duration-150",
              vintage
                ? "bg-[#D4A24C] text-black hover:brightness-105 active:scale-[0.99]"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {vintage ? "Abrir vaga na agenda" : "Abrir vaga"}
          </button>
          <button
            type="button"
            onClick={handleBlock}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150",
              vintage
                ? "border-[#D4A24C]/25 bg-transparent text-[#F6EFE5] hover:bg-[#20170f]"
                : "border-white/10 bg-transparent text-zinc-100 hover:bg-white/[0.04]",
            )}
          >
            <Ban className="h-4 w-4 shrink-0" />
            Bloquear horário
          </button>
        </div>
        <button
          type="button"
          onClick={handleFullAgenda}
          className={cn(
            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150",
            vintage
              ? "border-[#D4A24C]/25 text-[#F6EFE5] hover:bg-[#20170f]"
              : "border-white/10 text-zinc-100 hover:bg-white/[0.04]",
          )}
        >
          Ver agenda completa
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </motion.aside>
    </>
  );

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && barber ? drawerContent : null}
    </AnimatePresence>,
    document.body,
  );
}
