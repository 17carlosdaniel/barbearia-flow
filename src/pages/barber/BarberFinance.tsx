import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  CalendarDays, 
  Ticket, 
  ArrowRight, 
  ChevronRight, 
  Download, 
  Eye, 
  FileText, 
  Filter, 
  TrendingDown, 
  TrendingUp as TrendingUpIcon 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { PaymentMethodBadge } from "@/components/barber/PaymentMethodBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  CHART_DATA_WEEK,
  WEEK_LABELS,
  calculateWeekTrend,
  calculateDailyTrend,
  calculateMonthlyTrend,
  buildChartPoints,
  MOCK_TRANSACTIONS,
  buildLinePath,
  chartTotal,
  formatMoney,
  formatMoneyWithCents,
  parseTransactionDate,
  deltaPct,
} from "@/pages/barber/barberFinanceShared";

const useCountUp = (target: number, durationMs = 850) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
};

const CountUpCurrency = ({ target }: { target: number }) => {
  const value = useCountUp(target);
  return <>{formatMoney(value)}</>;
};

const BarberFinance = () => {
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  const filtered = MOCK_TRANSACTIONS;
  const totalPeriod = chartTotal(CHART_DATA_WEEK);
  const chartPathMain = useMemo(() => buildLinePath(CHART_DATA_WEEK, 620, 220), []);
  const chartPoints = useMemo(() => buildChartPoints(CHART_DATA_WEEK, 620, 220), []);
  const trend = useMemo(() => calculateWeekTrend(CHART_DATA_WEEK), []);

  const dailyGoal = 150;

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, []);

  const avgTicketOverall = filtered.length ? filtered.reduce((s, t) => s + t.amount, 0) / filtered.length : 0;
  const countedAvgTicket = useCountUp(Math.round(avgTicketOverall));
  const todayRevenue = filtered
    .filter((t) => parseTransactionDate(t.date).toDateString() === new Date().toDateString())
    .reduce((s, t) => s + t.amount, 0);
  const yesterdayRevenue = filtered
    .filter((t) => {
      const txDate = parseTransactionDate(t.date);
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return txDate.toDateString() === y.toDateString();
    })
    .reduce((s, t) => s + t.amount, 0);
  const monthRevenue = filtered
    .filter((t) => {
      const d = parseTransactionDate(t.date);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((s, t) => s + t.amount, 0);
  const previousMonthRevenue = filtered
    .filter((t) => {
      const d = parseTransactionDate(t.date);
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
    })
    .reduce((s, t) => s + t.amount, 0);

  // Dados para Bloco 1 Editorial
  const weekTotal = chartTotal(CHART_DATA_WEEK);
  const prevWeekTotal = chartTotal(CHART_DATA_WEEK.map(v => v * 0.9)); // Simulado
  const weekGrowth = deltaPct(weekTotal, prevWeekTotal);
  
  const [listFilter, setListFilter] = useState<string>("todos");
  const filteredLatest = useMemo(() => {
    let base = [...filtered].sort((a, b) => parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime());
    if (listFilter !== "todos") {
      base = base.filter(t => t.method.toLowerCase() === listFilter.toLowerCase());
    }
    return base.slice(0, 5);
  }, [filtered, listFilter]);

  const latest = [...filtered].sort((a, b) => parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime()).slice(0, 5);
  const dailyTrend = useMemo(() => calculateDailyTrend(todayRevenue, yesterdayRevenue), [todayRevenue, yesterdayRevenue]);
  const monthlyTrend = useMemo(() => calculateMonthlyTrend(monthRevenue, previousMonthRevenue), [monthRevenue, previousMonthRevenue]);
  const ticketTrend = useMemo(() => calculateWeekTrend(CHART_DATA_WEEK), []);
  const lastDayValue = CHART_DATA_WEEK[CHART_DATA_WEEK.length - 1] ?? 0;
  const weekAverage = CHART_DATA_WEEK.length ? Math.round(totalPeriod / CHART_DATA_WEEK.length) : 0;
  const bestDayIndex = CHART_DATA_WEEK.reduce((best, value, index, arr) => (value > arr[best] ? index : best), 0);
  const bestDayLabel = WEEK_LABELS[bestDayIndex] ?? "—";
  const trendToneClass = (direction: "up" | "down" | "neutral") =>
    direction === "up" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : direction === "down" ? "text-amber-300 border-amber-500/30 bg-amber-500/10" : "text-muted-foreground border-border/60 bg-muted/30";
  const trendText = (trendValue: { percent: number; direction: "up" | "down" | "neutral" }, upLabel: string, downLabel: string) => {
    if (trendValue.direction === "neutral") return "Sem variação";
    return `${trendValue.direction === "up" ? "+" : "-"}${trendValue.percent}% ${trendValue.direction === "up" ? upLabel : downLabel}`;
  };

  return (
    <DashboardLayout userType="barbeiro" title="Recebimentos" subtitle="Acompanhe a entrada da casa e o ritmo financeiro do período.">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-10 pb-12">
        
        {/* Bloco 1 — Resumo da casa (Editorial Vintage) */}
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-12 gap-8 items-end",
          isModern ? "hidden" : "block"
        )}>
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold))] opacity-60">Hoje na casa</h2>
            <div className="flex items-baseline gap-3">
              <p className="font-display text-5xl font-bold text-[hsl(var(--gold))] tracking-tight">
                <CountUpCurrency target={todayRevenue} />
              </p>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                dailyTrend.direction === "up" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
              )}>
                {dailyTrend.direction === "up" ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(dailyTrend.percent)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic opacity-70">
              {todayRevenue > yesterdayRevenue ? "Acima da média da semana passada" : "Abaixo do ritmo esperado"}
            </p>
          </div>

          <div className="lg:col-span-4 space-y-4 border-l border-[hsl(var(--gold)/0.15)] pl-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold))] opacity-60">Ritmo da semana</h2>
            <p className="font-display text-3xl font-bold text-foreground">
              {formatMoney(weekTotal)}
            </p>
            <p className="text-sm text-muted-foreground italic opacity-70">
              Tendência de {weekGrowth > 0 ? "crescimento" : "queda"} de {Math.abs(weekGrowth)}%
            </p>
          </div>

          <div className="lg:col-span-3 space-y-4 border-l border-[hsl(var(--gold)/0.15)] pl-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold))] opacity-60">Ticket da casa</h2>
            <p className="font-display text-3xl font-bold text-foreground">
              {formatMoney(countedAvgTicket)}
            </p>
            <p className="text-sm text-muted-foreground italic opacity-70">
              Valor médio por atendimento
            </p>
          </div>
        </div>

        {/* Bloco 1 — Modern (Mantido conforme original para não quebrar o outro tema) */}
        {isModern && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card border border-border/40 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground/85">Hoje</p>
                  <p className="font-display text-3xl md:text-[2rem] font-bold mt-2 text-primary leading-none">
                    <CountUpCurrency target={todayRevenue} />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">vs ontem</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <CalendarDays className="h-3.5 w-3.5" />
                  </div>
                  <p className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", trendToneClass(dailyTrend.direction))}>
                    {trendText(dailyTrend, "vs ontem", "vs ontem")}
                  </p>
                </div>
              </div>
            </div>
            {/* ... outros 2 cards modern ... */}
            <div className="glass-card border border-border/40 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground/85">Mês</p>
                  <p className="font-display text-3xl md:text-[2rem] font-bold mt-2 text-primary leading-none">
                    <CountUpCurrency target={monthRevenue} />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">vs mês anterior</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <p className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", trendToneClass(monthlyTrend.direction))}>
                    {trendText(monthlyTrend, "vs mês anterior", "vs mês anterior")}
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card border border-border/40 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground/85">Ticket médio</p>
                  <p className="font-display text-3xl md:text-[2rem] font-bold mt-2 text-primary leading-none">{formatMoney(countedAvgTicket)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">vs semana</p>
                </div>
                <div className="text-right space-y-2">
                  <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <Ticket className="h-3.5 w-3.5" />
                  </div>
                  <p className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", trendToneClass(ticketTrend.direction))}>
                    {trendText(ticketTrend, "vs semana", "vs semana")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bloco 2 — Movimento da semana (Gráfico Narrativo) */}
        <div className={cn(
          "rounded-2xl border p-6 lg:p-10 space-y-8 relative overflow-hidden",
          isModern ? "bg-card border-border/40" : "bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] border-[hsl(var(--gold)/0.2)] shadow-2xl"
        )}>
          {!isModern && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h2 className={cn(
                "text-2xl lg:text-3xl font-bold tracking-tight",
                !isModern && "font-display italic"
              )}>
                {isModern ? "Movimento do período" : "Movimento da semana"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                {isModern 
                  ? "Acompanhe a evolução do faturamento nos últimos 7 dias." 
                  : "Como a casa se comportou nos últimos dias — domingo concentrou o maior volume de atendimentos."}
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--gold))]" />
                {isModern ? "Ciclo atual" : "Semana atual"}
              </div>
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-muted-foreground" />
                {isModern ? "Ciclo anterior" : "Média histórica"}
              </div>
            </div>
          </div>

          <div className={cn(
            "w-full overflow-x-auto rounded-2xl p-6",
            isModern ? "bg-muted/20 border border-border/30" : "bg-black/20 border border-[hsl(var(--gold)/0.1)] shadow-inner"
          )}>
            <svg viewBox="0 0 620 220" className="w-full min-w-[560px] h-[220px]">
              {/* Grids e Path mantidos mas com stroke refinado */}
              {[0, 0.5, 1].map((ratio, i) => {
                const y = 18 + (220 - 36) * (1 - ratio);
                return (
                  <line key={i} x1="18" y1={y} x2="602" y2={y} stroke="hsl(var(--gold) / 0.05)" strokeWidth="1" />
                );
              })}
              <motion.path
                ref={pathRef}
                d={chartPathMain}
                fill="none"
                stroke={isModern ? "hsl(var(--primary))" : "hsl(var(--gold))"}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              {/* Pontos de hover mantidos conforme lógica original */}
              {chartPoints.map((point) => (
                <circle
                  key={`point-${point.index}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="transparent"
                  onMouseEnter={() => {
                    setHoveredPoint(point.index);
                    setTooltipData({ x: point.x, y: point.y - 30, value: point.value, label: WEEK_LABELS[point.index] });
                  }}
                  onMouseLeave={() => { setHoveredPoint(null); setTooltipData(null); }}
                  style={{ cursor: "pointer" }}
                />
              ))}
              {tooltipData && (
                <g>
                  <rect x={tooltipData.x - 45} y={tooltipData.y - 45} width="90" height="45" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--gold)/0.2)" strokeWidth="1" />
                  <text x={tooltipData.x} y={tooltipData.y - 28} textAnchor="middle" fontSize="10" fontWeight="bold" className="uppercase tracking-widest fill-muted-foreground">{tooltipData.label}</text>
                  <text x={tooltipData.x} y={tooltipData.y - 12} textAnchor="middle" fontSize="12" fontWeight="bold" className="fill-foreground">{formatMoney(tooltipData.value)}</text>
                </g>
              )}
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-[hsl(var(--gold)/0.1)]">
            {[
              { label: "Melhor dia", value: bestDayLabel, sub: formatMoney(CHART_DATA_WEEK[bestDayIndex] ?? 0) },
              { label: "Média diária", value: formatMoney(weekAverage), sub: "Ritmo constante" },
              { label: "Volume total", value: formatMoney(weekTotal), sub: "Acumulado 7 dias" },
              { label: "Status", value: weekGrowth > 0 ? "Semana em aceleração" : "Ritmo estável", sub: `${Math.abs(weekGrowth)}% vs anterior` },
            ].map(m => (
              <div key={m.label} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{m.label}</p>
                <p className={cn("text-lg font-bold", !isModern && "font-display")}>{m.value}</p>
                <p className="text-[10px] font-medium text-[hsl(var(--gold))] opacity-50 uppercase tracking-tight">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Bloco 3 — Recebimentos recentes */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h3 className={cn("text-xl font-bold", !isModern && "font-display italic")}>Entradas recentes</h3>
                <p className="text-xs text-muted-foreground opacity-70">Valores confirmados nos atendimentos mais recentes.</p>
              </div>
              
              <div className="flex items-center gap-2">
                {["todos", "pix", "cartão"].map(f => (
                  <button
                    key={f}
                    onClick={() => setListFilter(f)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                      listFilter === f 
                        ? "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]" 
                        : "border-border/40 text-muted-foreground hover:border-[hsl(var(--gold)/0.2)]"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredLatest.map((tx) => (
                <div key={tx.id} className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all hover:translate-x-1",
                  isModern ? "bg-card border-border/50" : "bg-black/20 border-[hsl(var(--gold)/0.1)] hover:border-[hsl(var(--gold)/0.3)]"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isModern ? "bg-primary/5 text-primary" : "bg-[hsl(var(--gold)/0.05)] text-[hsl(var(--gold))]"
                    )}>
                      <PaymentMethodBadge method={tx.method} size="sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{tx.client}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        {tx.service} · {tx.method === "Pix" ? "Recebido via Pix" : tx.method === "Cartão" ? "Recebido no cartão" : "Pago em dinheiro"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-base font-bold", !isModern && "font-display text-[hsl(var(--gold))]")}>
                      {formatMoneyWithCents(tx.amount)}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500">Valor confirmado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 4 — Próxima ação (Contextual Vintage) */}
          <div className="lg:col-span-4 space-y-6">
            <div className={cn(
              "rounded-2xl border p-8 space-y-8 h-full flex flex-col justify-between",
              isModern ? "bg-card border-border/40" : "bg-[hsl(var(--gold)/0.03)] border-[hsl(var(--gold)/0.2)] shadow-xl"
            )}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className={cn("text-xl font-bold", !isModern && "font-display italic")}>Próximo passo</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed opacity-80">
                    Alguns atendimentos de hoje ainda pedem conferência no balcão para fechamento do período.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button variant="outlineGold" className="w-full justify-between h-14 rounded-xl px-6 group" asChild>
                    <Link to="/barbeiro/financeiro/analises">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Ver visão completa</span>
                      </div>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  
                  <Button variant="outlineGold" className="w-full justify-between h-14 rounded-xl px-6 group" asChild>
                    <Link to="/barbeiro/financeiro/pix">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Conferir recebimentos</span>
                      </div>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-[hsl(var(--gold)/0.1)]">
                <Button variant="ghost" className="w-full gap-2 h-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-[hsl(var(--gold))]" asChild>
                  <Link to="/barbeiro/financeiro/analises">
                    <Download className="w-3.5 h-3.5" />
                    Exportar período
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </DashboardLayout>
  );
};

BarberFinance.displayName = "BarberFinance";

export default BarberFinance;
