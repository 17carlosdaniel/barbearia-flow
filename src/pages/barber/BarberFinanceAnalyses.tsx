import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentMethodBadge } from "@/components/barber/PaymentMethodBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Calendar as CalendarIcon,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Users,
  Scissors,
} from "lucide-react";
import {
  CHART_DATA,
  MOCK_TRANSACTIONS,
  buildLinePath,
  buildPrevSeries,
  formatMoneyWithCents,
  parseTransactionDate,
} from "@/pages/barber/barberFinanceShared";

const BarberFinanceAnalyses = () => {
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const [filterMethod, setFilterMethod] = useState<string>("Todos");
  const [filterBarber, setFilterBarber] = useState<string>("Todos");
  const [filterService, setFilterService] = useState<string>("Todos");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"receita" | "lucro">("receita");
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState(0);

  const chartProfitData = useMemo(() => CHART_DATA.map((v) => Math.round(v * 0.62)), []);
  const chartPrevData = useMemo(() => buildPrevSeries(CHART_DATA), []);
  const chartValues = chartMode === "receita" ? CHART_DATA : chartProfitData;
  const chartPathMain = useMemo(() => buildLinePath(chartValues, 620, 220), [chartValues]);
  const chartPathPrev = useMemo(() => buildLinePath(chartPrevData, 620, 220), [chartPrevData]);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [chartMode]);

  const filtered = MOCK_TRANSACTIONS.filter((t) => {
    if (filterMethod !== "Todos" && t.method !== filterMethod) return false;
    if (filterBarber !== "Todos" && t.barber !== filterBarber) return false;
    if (filterService !== "Todos" && t.service !== filterService) return false;
    const date = parseTransactionDate(t.date);
    if (fromDate && date < new Date(`${fromDate}T00:00:00`)) return false;
    if (toDate && date > new Date(`${toDate}T23:59:59`)) return false;
    return true;
  });

  const revenueByBarber = Object.entries(
    filtered.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.barber] = (acc[tx.barber] ?? 0) + tx.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const revenueByService = Object.entries(
    filtered.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.service] = (acc[tx.service] ?? 0) + tx.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              <Link to="/barbeiro/financeiro" className="hover:text-primary">
                Recebimentos
              </Link>{" "}
              / Análises
            </p>
            <h1 className={cn("text-2xl lg:text-3xl font-bold", isModern ? "font-display" : "font-vintage-display")}>
              {isModern ? "Análises completas" : "Resumo financeiro"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isModern
                ? "Acompanhe resultado, ticket e volume com filtros para decisões de operação."
                : "Veja o movimento do período com filtros e leitura refinada de resultados."}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/barbeiro/financeiro">{isModern ? "Voltar aos recebimentos" : "Voltar ao resumo"}</Link>
          </Button>
        </div>

        <div className="glass-card border border-border/40 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">
              {isModern ? "Comparativo de desempenho mensal" : "Comparação mensal (mês atual vs anterior)"}
            </h2>
            <div className="flex gap-2">
              <Button variant={chartMode === "receita" ? "default" : "outline"} size="sm" onClick={() => setChartMode("receita")}>
                Receita
              </Button>
              <Button variant={chartMode === "lucro" ? "default" : "outline"} size="sm" onClick={() => setChartMode("lucro")}>
                {isModern ? "Margem est." : "Lucro est."}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {isModern
              ? "Linha tracejada: ciclo anterior · linha cheia: ciclo atual"
              : "Linha tracejada: período anterior · Linha cheia: período atual"}
          </p>
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 620 220" className="w-full min-w-[560px] h-[220px]">
              <path d={chartPathPrev} fill="none" stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth="2" strokeDasharray="4 5" />
              <path d={chartPathMain} fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="8" />
              <motion.path
                ref={pathRef}
                d={chartPathMain}
                fill="none"
                stroke="hsl(var(--gold))"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: pathLength || 1, strokeDashoffset: pathLength || 1 }}
                animate={{ strokeDasharray: pathLength || 1, strokeDashoffset: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
          </div>
        </div>

        <div className="glass-card border border-border/50 rounded-2xl p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Filter className="h-5 w-5" />
              {isModern ? "Filtros de operação" : "Filtrar"}
            </span>
            <div className="flex flex-wrap gap-2">
              {["Todos", "Pix", "Cartão", "Dinheiro"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMethod(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterMethod === m ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:bg-card border border-transparent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <select value={filterBarber} onChange={(e) => setFilterBarber(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-card border border-border">
              <option>Todos</option>
              {Array.from(new Set(MOCK_TRANSACTIONS.map((t) => t.barber))).map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-card border border-border">
              <option>Todos</option>
              {Array.from(new Set(MOCK_TRANSACTIONS.map((t) => t.service))).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterMethod("Todos");
                setFilterBarber("Todos");
                setFilterService("Todos");
                setFromDate("");
                setToDate("");
              }}
            >
              {isModern ? "Resetar filtros" : "Limpar filtros"}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const headers = ["Cliente", "Barbeiro", "Servico", "Metodo", "Valor", "Comissao", "Data", "Status"];
                  const rows = filtered.map((t) => [t.client, t.barber, t.service, t.method, t.amount, t.commission, t.date, t.status]);
                  const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "financeiro.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-1" /> {isModern ? "Exportar CSV" : "Exportar relatório"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="glass-card border border-border/50 rounded-2xl p-4">
              <h4 className="font-semibold mb-3 inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> {isModern ? "Resultado por barbeiro" : "Receita por barbeiro"}
              </h4>
              <div className="space-y-2">
                {revenueByBarber.map(([barber, value]) => (
                  <div key={barber} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{barber}</span>
                    <span className="text-foreground font-medium">{formatMoneyWithCents(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card border border-border/50 rounded-2xl p-4">
              <h4 className="font-semibold mb-3 inline-flex items-center gap-2">
                <Scissors className="h-4 w-4 text-primary" /> {isModern ? "Desempenho por serviço" : "Receita por serviço"}
              </h4>
              <div className="space-y-2">
                {revenueByService.map(([service, value]) => (
                  <div key={service} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{service}</span>
                    <span className="text-foreground font-medium">{formatMoneyWithCents(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border/50">
              <h3 className="font-display text-xl font-semibold flex items-center gap-3 text-primary">
                <DollarSign className="h-6 w-6 shrink-0" /> {isModern ? "Movimento financeiro detalhado" : "Histórico de transações"}
              </h3>
            </div>
            <div className="divide-y divide-border/50">
              <AnimatePresence mode="popLayout">
                {filtered.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-6 py-5 min-h-[88px] border-l-2 border-transparent hover:border-primary/30 transition-colors hover:bg-card/60"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-5 min-w-0">
                        <PaymentMethodBadge method={tx.method} />
                        <div className="min-w-0">
                          <p className="font-semibold text-base text-foreground">{tx.client}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {tx.barber} • {tx.service} • {tx.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-5 shrink-0">
                        <div>
                          <span className="font-bold text-base text-green-400">+R$ {tx.amount.toFixed(2).replace(".", ",")}</span>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-end mt-1">
                            <CalendarIcon className="h-4 w-4" /> {tx.date}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium px-3 py-1.5 rounded-full shrink-0 ${
                            tx.status === "pago"
                              ? "bg-green-500/10 text-green-400"
                              : tx.status === "pendente"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {tx.status === "pago" ? "Pago" : tx.status === "pendente" ? "Pendente" : "Falhou"}
                        </span>
                        <button type="button" onClick={() => setExpandedTxId((prev) => (prev === tx.id ? null : tx.id))} className="text-muted-foreground hover:text-foreground">
                          {expandedTxId === tx.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedTxId === tx.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 rounded-lg bg-secondary/30 border border-border/40 p-3 text-sm"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <p>
                              <span className="text-muted-foreground">Serviço:</span> {tx.service}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Barbeiro:</span> {tx.barber}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Pagamento:</span> {tx.method}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Comissão:</span> {formatMoneyWithCents(tx.commission)}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <p className="px-6 py-12 text-center text-muted-foreground">Nenhuma transação encontrada.</p>}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberFinanceAnalyses;
