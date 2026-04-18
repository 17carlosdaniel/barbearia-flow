import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle, DollarSign, Filter, RefreshCcw, Search, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getHistoryInsightsByBarbershop, type HistoryInsightsData, type HistoryPeriod, type HistoryRecord } from "@/lib/customerInsights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
};

function periodLabelPt(period: HistoryPeriod): string {
  if (period === "today") return "Hoje";
  if (period === "week") return "Esta semana";
  return "Este mês";
}

const BarberHistory = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;

  const [period, setPeriod] = useState<HistoryPeriod>("week");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("todos");
  const [barberFilter, setBarberFilter] = useState("todos");
  const [data, setData] = useState<HistoryInsightsData>({
    records: [],
    customers: [],
    totalRevenue: 0,
    totalVisits: 0,
    uniqueCustomers: 0,
    topService: "Sem dados",
    busiestWeekday: "Sem dados",
    staleCustomers: [],
  });

  const [isReloading, setIsReloading] = useState(false);

  const reload = useCallback(async () => {
    setIsReloading(true);
    try {
      const next = await getHistoryInsightsByBarbershop(barbershopId, { period, staleDays: 20 });
      setData(next);
    } finally {
      // Pequeno delay para a animação ser visível se a rede for muito rápida
      setTimeout(() => setIsReloading(false), 600);
    }
  }, [barbershopId, period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.records.filter((record) => {
      if (serviceFilter !== "todos" && record.service !== serviceFilter) return false;
      if (barberFilter !== "todos" && (record.barberName || "Sem barbeiro") !== barberFilter) return false;
      if (!q) return true;
      return (
        record.clientName.toLowerCase().includes(q) ||
        record.service.toLowerCase().includes(q) ||
        (record.customerPhone || "").toLowerCase().includes(q)
      );
    });
  }, [data.records, search, serviceFilter, barberFilter]);

  // Hierarchy calculations
  const highestTicket = useMemo(() => {
    if (filteredRecords.length === 0) return 0;
    return Math.max(...filteredRecords.map((r) => r.price));
  }, [filteredRecords]);

  const customerVisitsMap = useMemo(() => {
    const map = new Map<string, number>();
    data.customers.forEach((c) => map.set(c.clientKey, c.visits));
    return map;
  }, [data.customers]);

  const isRecurringClient = (clientKey: string) => {
    const visits = customerVisitsMap.get(clientKey) || 0;
    return visits >= 4;
  };

  const isTopService = (service: string) => {
    return data.topService !== "Sem dados" && service === data.topService;
  };

  const serviceOptions = useMemo(
    () => Array.from(new Set(data.records.map((record) => record.service))).sort((a, b) => a.localeCompare(b)),
    [data.records],
  );

  const barberOptions = useMemo(
    () =>
      Array.from(new Set(data.records.map((record) => record.barberName || "Sem barbeiro"))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [data.records],
  );

  const periodHeadline = periodLabelPt(period);
  const editorialSummary = `${periodHeadline}: ${data.totalVisits} atendimentos concluídos, ${formatCurrency(data.totalRevenue)} em faturamento e ${data.uniqueCustomers} clientes únicos.`;
  const insightLine =
    data.topService !== "Sem dados" || data.busiestWeekday !== "Sem dados"
      ? `No período, o serviço mais frequente foi ${data.topService}; o dia com mais movimento foi ${data.busiestWeekday}.`
      : null;

  const filterToolbar = (
    <div className={cn("space-y-5", !isModern && "pb-8")}>
      {/* Period selector as primary command */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl p-1",
        isModern ? "bg-muted/30" : "bg-[hsl(var(--gold)/0.05] border border-[hsl(var(--gold)/0.1)]"
      )}>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest px-3",
          isModern ? "text-muted-foreground/50" : "text-[hsl(var(--gold))] opacity-60"
        )}>
          {isModern ? "Período:" : "Olhar da casa:"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "today" as const, label: "Hoje" },
              { id: "week" as const, label: "Esta semana" },
              { id: "month" as const, label: "Este mês" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                period === option.id
                  ? isModern
                    ? "bg-background text-foreground shadow-sm"
                    : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] shadow-lg shadow-[hsl(var(--gold)/0.25)]"
                  : isModern
                    ? "text-muted-foreground hover:bg-background/50"
                    : "text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.1)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            disabled={isReloading}
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-background/50 transition-all",
              !isModern && "text-[hsl(var(--gold))]"
            )}
            onClick={() => void reload()}
          >
            <RefreshCcw className={cn("w-3.5 h-3.5", isReloading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Search and filters grouped together */}
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-3 items-end",
        !isModern && "bg-black/10 rounded-2xl p-4 border border-[hsl(var(--gold)/0.08)]"
      )}>
        <div className="relative lg:col-span-5 space-y-1.5">
          <Label className={cn(
            "text-[10px] font-bold uppercase tracking-widest ml-1",
            isModern ? "text-muted-foreground/60" : "text-[hsl(var(--gold))] opacity-70"
          )}>
            {isModern ? "Buscar atendimento" : "Buscar na memória"}
          </Label>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              className={cn(
                "h-11 pl-10 rounded-lg bg-background/80 border-border/60 focus:ring-2",
                isModern ? "focus:ring-primary/20" : "focus:ring-[hsl(var(--gold)/0.2)] font-medium"
              )}
              placeholder="Nome, serviço ou telefone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-1.5">
          <Label className={cn(
            "text-[10px] font-bold uppercase tracking-widest ml-1",
            isModern ? "text-muted-foreground/60" : "text-[hsl(var(--gold))] opacity-70"
          )}>
            Serviço
          </Label>
          <select
            className={cn(
              "w-full h-11 rounded-lg border px-3 text-sm bg-background/80 focus:ring-2 outline-none transition-all",
              isModern 
                ? "border-border/60 focus:ring-primary/20" 
                : "border-border/50 text-foreground focus:ring-[hsl(var(--gold)/0.2)] font-medium",
            )}
            value={serviceFilter}
            onChange={(event) => setServiceFilter(event.target.value)}
          >
            <option value="todos">Todos os serviços</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-4 space-y-1.5">
          <Label className={cn(
            "text-[10px] font-bold uppercase tracking-widest ml-1",
            isModern ? "text-muted-foreground/60" : "text-[hsl(var(--gold))] opacity-70"
          )}>
            {isModern ? "Profissional" : "Equipe"}
          </Label>
          <select
            className={cn(
              "w-full h-11 rounded-lg border px-3 text-sm bg-background/80 focus:ring-2 outline-none transition-all",
              isModern 
                ? "border-border/60 focus:ring-primary/20" 
                : "border-border/50 text-foreground focus:ring-[hsl(var(--gold)/0.2)] font-medium",
            )}
            value={barberFilter}
            onChange={(event) => setBarberFilter(event.target.value)}
          >
            <option value="todos">{isModern ? "Todos os profissionais" : "Toda a equipe"}</option>
            {barberOptions.map((barber) => (
              <option key={barber} value={barber}>
                {barber}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const recordRow = (item: HistoryRecord, index: number) => {
    const when = formatDateTime(item.dateIso);
    const statusLabel =
      item.status === "completed" ? "Concluído" : item.status === "scheduled" ? "Agendado" : item.status;

    const isMostRecent = index === 0;
    const isHighestTicket = item.price === highestTicket && highestTicket > 0;
    const isRecurring = isRecurringClient(item.clientKey);
    const isFrequentService = isTopService(item.service);

    // Calculate days since this appointment
    const daysSince = Math.floor((Date.now() - new Date(item.dateIso).getTime()) / (1000 * 60 * 60 * 24));
    const timeAgoLabel = daysSince === 0 ? "Hoje" : daysSince === 1 ? "Ontem" : `${daysSince} dias atrás`;

    const recordClass = isModern
      ? cn(
          "rounded-2xl border bg-card p-5 hover:border-primary/20 transition-all group",
          isMostRecent ? "border-primary/40 ring-1 ring-primary/10" : "border-border",
          isHighestTicket && "border-amber-500/30 ring-1 ring-amber-500/10"
        )
      : cn(
          "rounded-2xl border bg-black/20 p-6 hover:border-[hsl(var(--gold)/0.4)] transition-all group",
          isMostRecent ? "border-[hsl(var(--gold)/0.5] ring-1 ring-[hsl(var(--gold)/0.15]" : "border-[hsl(var(--gold)/0.15)]",
          isHighestTicket && "border-amber-500/40 ring-1 ring-amber-500/20"
        );

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.02 * Math.min(index, 8) }}
        className={recordClass}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors relative",
              isModern 
                ? "bg-primary/5 text-primary group-hover:bg-primary/10" 
                : "bg-[hsl(var(--gold)/0.05)] text-[hsl(var(--gold))] group-hover:bg-[hsl(var(--gold)/0.1)]"
            )}>
              <CheckCircle className="w-6 h-6" />
              {isMostRecent && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  isModern ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]"
                )}>
                  •
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className={cn(
                  "font-bold text-foreground leading-tight truncate",
                  isModern ? "text-base" : "text-xl font-display"
                )}>
                  {item.clientName}
                </p>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg border font-bold shrink-0",
                  item.status === "completed"
                    ? isModern 
                      ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" 
                      : "border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]"
                    : "border-border/50 text-muted-foreground bg-muted/10",
                )}>
                  {statusLabel}
                </span>
                {isRecurring && (
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg border font-bold shrink-0",
                    isModern 
                      ? "border-amber-500/30 text-amber-500 bg-amber-500/5" 
                      : "border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]"
                  )}>
                    Fiel
                  </span>
                )}
                {isFrequentService && (
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg border font-bold shrink-0",
                    isModern 
                      ? "border-primary/30 text-primary bg-primary/5" 
                      : "border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.05)]"
                  )}>
                    {isModern ? "Popular" : "Frequente"}
                  </span>
                )}
                {isHighestTicket && (
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-lg border font-bold shrink-0",
                    isModern 
                      ? "border-amber-400/40 text-amber-400 bg-amber-400/5" 
                      : "border-amber-500/40 text-amber-500 bg-amber-500/5"
                  )}>
                    Maior ticket
                  </span>
                )}
              </div>
              <p className={cn(
                "font-bold truncate",
                isModern ? "text-sm text-primary/80" : "text-base text-[hsl(var(--gold))] italic"
              )}>
                {item.service}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                <span>{formatCurrency(item.price)}</span>
                <span className="opacity-30">·</span>
                <span>{item.durationMinutes || 30} min</span>
                <span className="opacity-30">·</span>
                <span className="truncate">{item.barberName || (isModern ? "Sem profissional" : "Sem vínculo de cadeira")}</span>
              </div>
              {/* Narrative insight line */}
              <p className={cn(
                "text-xs italic",
                isModern ? "text-muted-foreground/50" : "text-[hsl(var(--gold))] opacity-40"
              )}>
                {isMostRecent ? "Último atendimento" : timeAgoLabel}
              </p>
            </div>
          </div>

          <div className={cn(
            "flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-4 sm:pt-0 shrink-0",
            !isModern && "border-[hsl(var(--gold)/0.1)]"
          )}>
            <p className={cn(
              "font-bold",
              isModern ? "text-sm text-foreground" : "text-lg text-[hsl(var(--gold))]"
            )}>
              {when.date}
            </p>
            <p className={cn(
              "font-bold opacity-60",
              isModern ? "text-xs text-muted-foreground" : "text-sm text-[hsl(var(--gold))] italic"
            )}>
              {when.time}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout 
      userType="barbeiro"
    >
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Resumo / Contexto do Período */}
        <div className={cn(
          "rounded-2xl border p-6 lg:p-8",
          isModern ? "bg-card border-border/50 shadow-sm" : "bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] border-[hsl(var(--gold)/0.2)] shadow-xl"
        )}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em]",
                isModern ? "text-primary" : "text-[hsl(var(--gold))]"
              )}>
                Resumo do período
              </h2>
              <p className={cn(
                "text-lg lg:text-xl font-bold leading-relaxed max-w-3xl",
                !isModern && "font-display italic"
              )}>
                {editorialSummary}
              </p>
              {insightLine && (
                <p className="text-sm text-muted-foreground italic opacity-70">
                  {insightLine}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-4 shrink-0">
              <div className={cn(
                "px-5 py-3 rounded-2xl border",
                isModern ? "bg-muted/10 border-border/40" : "bg-black/20 border-[hsl(var(--gold)/0.1)]"
              )}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Total</p>
                <p className={cn("text-xl font-bold", !isModern && "text-[hsl(var(--gold))]")}>{data.totalVisits}</p>
              </div>
              <div className={cn(
                "px-5 py-3 rounded-2xl border",
                isModern ? "bg-muted/10 border-border/40" : "bg-black/20 border-[hsl(var(--gold)/0.1)]"
              )}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Volume</p>
                <p className={cn("text-xl font-bold", !isModern && "text-[hsl(var(--gold))]")}>{formatCurrency(data.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Toolbar */}
        {filterToolbar}

        {/* Lista de Atendimentos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className={cn(
              "text-[10px] font-bold uppercase tracking-[0.2em]",
              isModern ? "text-muted-foreground/60" : "text-[hsl(var(--gold))] opacity-50"
            )}>
              {isModern ? "Registros de atendimento" : "Memória da cadeira"}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {filteredRecords.length} encontrados
            </span>
          </div>

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className={cn(
                "rounded-2xl border border-dashed p-12 text-center",
                isModern ? "bg-muted/5 border-border/60" : "bg-black/10 border-[hsl(var(--gold)/0.2)]"
              )}>
                <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground italic">
                  Nenhum atendimento combina com estes filtros.
                </p>
              </div>
            ) : (
              filteredRecords.map((item, index) => recordRow(item, index))
            )}
          </div>
        </section>

        {/* Oportunidades de Retorno */}
        {data.staleCustomers.length > 0 && (
          <section className={cn(
            "rounded-2xl border p-6 lg:p-8",
            isModern ? "bg-amber-500/5 border-amber-500/20" : "bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20 shadow-lg"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isModern ? "bg-amber-500/10 text-amber-500" : "bg-amber-500/10 text-amber-500"
              )}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("font-bold", !isModern && "font-display text-lg")}>
                  Oportunidades de retorno
                </h3>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Quem passou do tempo ideal sem nova visita
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {data.staleCustomers.map((customer) => (
                <div
                  key={customer.clientKey}
                  className={cn(
                    "flex flex-col gap-1 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02]",
                    isModern ? "bg-card border-border/60" : "bg-black/20 border-amber-500/20"
                  )}
                >
                  <span className="text-sm font-bold text-foreground">{customer.clientName}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                    {customer.daysSinceLastVisit} dias sem voltar
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BarberHistory;
