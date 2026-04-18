import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  Store,
  Wallet,
  Monitor,
  ShoppingBag,
  ArrowUpCircle,
  Clock,
  Activity,
  Layers,
  Receipt,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getOrdersByBarbershop } from "@/lib/shopOrders";
import { getStoreV2Dashboard } from "@/lib/storeV2";
import { cn } from "@/lib/utils";
import type { ShopOrder } from "@/types/shop";
import type { StoreProduct } from "@/types/store";
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const orderDate = (order: ShopOrder) => new Date(order.createdAt);

const inDayRange = (order: ShopOrder, startKey: string, endKey: string) => {
  const k = dayKey(orderDate(order));
  return k >= startKey && k <= endKey;
};

type ChartBounds = { min: number; max: number };

const chartPad = 24;
const chartW = 760;
const chartH = 240;

function getChartBounds(a: number[], b: number[]): ChartBounds {
  const all = [...a, ...b];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  return { min, max };
}

function valuesToPoints(values: number[], width: number, height: number, pad: number, bounds: ChartBounds) {
  const range = Math.max(bounds.max - bounds.min, 1);
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: pad + index * stepX,
    y: height - pad - ((value - bounds.min) / range) * (height - pad * 2),
  }));
}

function buildSmoothLinePath(values: number[], width: number, height: number, pad: number, bounds: ChartBounds): string {
  if (!values.length) return "";
  const points = valuesToPoints(values, width, height, pad, bounds);
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildSmoothAreaPath(values: number[], width: number, height: number, pad: number, bounds: ChartBounds): string {
  if (!values.length) return "";
  const line = buildSmoothLinePath(values, width, height, pad, bounds);
  const stepX = values.length > 1 ? (width - chartPad * 2) / (values.length - 1) : 0;
  const startX = chartPad;
  const endX = chartPad + stepX * (values.length - 1);
  const baseY = height - chartPad;
  return `${line} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
}

function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0 && current <= 0) return null;
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

const BarberShopDashboard = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);
  const [chartHoverIdx, setChartHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [shopOrders, dashboard] = await Promise.all([
        getOrdersByBarbershop(barbershopId),
        getStoreV2Dashboard(barbershopId),
      ]);
      setOrders(Array.isArray(shopOrders) ? shopOrders : []);
      setProducts(Array.isArray(dashboard.products) ? dashboard.products : []);
    };
    void load();
  }, [barbershopId]);

  useEffect(() => {
    setChartHoverIdx(null);
  }, [periodDays]);

  const analytics = useMemo(() => {
    const now = new Date();

    const dayBuckets = Array.from({ length: periodDays }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (periodDays - 1 - idx));
      const key = dayKey(d);
      return { key, label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` };
    });
    const currentStartKey = dayBuckets[0]!.key;
    const currentEndKey = dayBuckets[dayBuckets.length - 1]!.key;

    const prevBuckets = Array.from({ length: periodDays }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (periodDays * 2 - 1 - idx));
      const key = dayKey(d);
      return { key, label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` };
    });
    const prevStartKey = prevBuckets[0]!.key;
    const prevEndKey = prevBuckets[prevBuckets.length - 1]!.key;

    const revenueByDayMap = new Map(dayBuckets.map((bucket) => [bucket.key, 0]));
    orders.forEach((order) => {
      const key = dayKey(orderDate(order));
      if (!revenueByDayMap.has(key)) return;
      revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + Number(order.total ?? 0));
    });
    const revenueSeries = dayBuckets.map((bucket) => ({
      label: bucket.label,
      value: Number((revenueByDayMap.get(bucket.key) ?? 0).toFixed(2)),
    }));

    const hasHistory = revenueSeries.some((p) => p.value > 0);

    const prevRevenueByDay = new Map(prevBuckets.map((b) => [b.key, 0]));
    orders.forEach((order) => {
      const key = dayKey(orderDate(order));
      if (!prevRevenueByDay.has(key)) return;
      prevRevenueByDay.set(key, (prevRevenueByDay.get(key) ?? 0) + Number(order.total ?? 0));
    });

    const previousRevenueSeries = prevBuckets.map((bucket) => ({
      label: bucket.label,
      value: Number((prevRevenueByDay.get(bucket.key) ?? 0).toFixed(2)),
    }));

    const periodRevenue = revenueSeries.reduce((s, p) => s + p.value, 0);
    const previousPeriodRevenue = prevBuckets.reduce((s, b) => s + (prevRevenueByDay.get(b.key) ?? 0), 0);

    const ordersCurrent = orders.filter((o) => inDayRange(o, currentStartKey, currentEndKey));

    const ticketMedio = ordersCurrent.length
      ? ordersCurrent.reduce((a, o) => a + Number(o.total ?? 0), 0) / ordersCurrent.length
      : 0;

    const produtosVendidos = ordersCurrent.reduce((acc, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return acc + items.reduce((sum: number, item) => sum + Number(item.quantity ?? 0), 0);
    }, 0);

    const productSalesCount = new Map<string, number>();
    const productRevenue = new Map<string, number>();
    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        const id = item.product?.id;
        if (!id) return;
        const qty = Number(item.quantity ?? 0);
        const value = qty * Number(item.product?.price ?? 0);
        productSalesCount.set(id, (productSalesCount.get(id) ?? 0) + qty);
        productRevenue.set(id, (productRevenue.get(id) ?? 0) + value);
      });
    });

    const topProducts = products
      .map((product) => ({
        id: product.id,
        name: product.name,
        sold: productSalesCount.get(product.id) ?? 0,
        revenue: productRevenue.get(product.id) ?? 0,
      }))
      .filter((product) => product.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);

    const lowStock = products
      .filter((product) => product.stock <= product.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);

    const growthPercent = deltaPct(periodRevenue, previousPeriodRevenue);
    const trendLabel = isModern ? "vs ciclo anterior" : "vs período anterior";

    return {
      periodRevenue,
      ticketMedio,
      produtosVendidos,
      revenueSeries,
      previousRevenueSeries,
      topProducts,
      lowStock,
      hasHistory,
      trends: {
        revenue: growthPercent,
        label: trendLabel,
      },
    };
  }, [orders, products, periodDays, isModern]);

  const chartBounds = useMemo(() => {
    const a = analytics.revenueSeries.map((p) => p.value);
    const b = analytics.previousRevenueSeries.map((p) => p.value);
    return getChartBounds(a, b);
  }, [analytics.revenueSeries, analytics.previousRevenueSeries]);

  const chartPath = useMemo(
    () => buildSmoothLinePath(analytics.revenueSeries.map((p) => p.value), chartW, chartH, chartPad, chartBounds),
    [analytics.revenueSeries, chartBounds],
  );
  const chartAreaPath = useMemo(
    () => buildSmoothAreaPath(analytics.revenueSeries.map((p) => p.value), chartW, chartH, chartPad, chartBounds),
    [analytics.revenueSeries, chartBounds],
  );
  const secondaryPath = useMemo(
    () => buildSmoothLinePath(analytics.previousRevenueSeries.map((p) => p.value), chartW, chartH, chartPad, chartBounds),
    [analytics.previousRevenueSeries, chartBounds],
  );

  const chartEndpoints = useMemo(() => {
    const a = analytics.revenueSeries.map((p) => p.value);
    const b = analytics.previousRevenueSeries.map((p) => p.value);
    return {
      primary: valuesToPoints(a, chartW, chartH, chartPad, chartBounds).at(-1),
      secondary: valuesToPoints(b, chartW, chartH, chartPad, chartBounds).at(-1),
    };
  }, [analytics.revenueSeries, analytics.previousRevenueSeries, chartBounds]);

  const hoverLineX = useMemo(() => {
    if (chartHoverIdx === null || !analytics.revenueSeries.length) return null;
    const n = analytics.revenueSeries.length;
    const stepX = n > 1 ? (chartW - chartPad * 2) / (n - 1) : 0;
    return chartPad + chartHoverIdx * stepX;
  }, [chartHoverIdx, analytics.revenueSeries.length]);

  const chartTooltipAnchorPct = useMemo(() => {
    if (chartHoverIdx === null || !analytics.revenueSeries.length) return null;
    const n = analytics.revenueSeries.length;
    const stepX = n > 1 ? (chartW - chartPad * 2) / (n - 1) : 0;
    const xSvg = chartPad + chartHoverIdx * stepX;
    return (xSvg / chartW) * 100;
  }, [chartHoverIdx, analytics.revenueSeries.length]);

  const periodTotal = useMemo(
    () => analytics.revenueSeries.reduce((sum, point) => sum + point.value, 0),
    [analytics.revenueSeries],
  );

  const updateChartHoverFromPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * chartW;
      const n = analytics.revenueSeries.length;
      if (n < 1) return;
      const stepX = n > 1 ? (chartW - chartPad * 2) / (n - 1) : 0;
      let idx = Math.round((vx - chartPad) / (stepX || 1));
      idx = Math.max(0, Math.min(n - 1, idx));
      setChartHoverIdx(idx);
    },
    [analytics.revenueSeries],
  );

  const chartSection = (opts: { compact?: boolean }) => {
    const hasData = analytics.hasHistory;

    return (
      <div
        className={cn(
          "rounded-2xl border p-6 space-y-6 transition-all duration-500 overflow-hidden relative",
          isModern ? "border-border/50 bg-card shadow-sm" : "border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] shadow-xl",
          !hasData && (isModern ? "py-10" : "py-14"),
        )}
      >
        {!isModern && hasData && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border",
                isModern ? "bg-primary/10 border-primary/20 text-primary" : "bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]"
              )}>
                <Activity className="w-4 h-4" />
              </div>
              <h2 className={cn("text-lg font-bold tracking-tight", !isModern && "text-xl font-display")}>
                {isModern ? "Resumo operacional" : "Compasso do período"}
              </h2>
            </div>
            {!hasData && (
              <p className={cn("text-muted-foreground leading-relaxed max-w-md", isModern ? "text-xs" : "text-sm italic opacity-80")}>
                {isModern 
                  ? "Sem movimento registrado no período. Assim que vendas e recebimentos entrarem, o resumo aparece aqui." 
                  : "O panorama do período ainda está em silêncio. Quando a vitrine girar e os recebimentos entrarem, o compasso aparece."}
              </p>
            )}
          </div>

          {hasData && (
            <div className="flex gap-2 shrink-0">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-widest",
                    periodDays === d
                      ? isModern
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold))]"
                      : isModern
                        ? "border-border/60 text-muted-foreground hover:bg-muted/50"
                        : "border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.05)]",
                  )}
                  onClick={() => setPeriodDays(d as 7 | 30)}
                >
                  {d} dias
                </button>
              ))}
            </div>
          )}
        </div>

        {hasData ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  isModern ? "text-primary" : "text-[hsl(var(--gold))] font-display",
                )}
              >
                {formatCurrency(periodTotal)}
              </span>
              <span className={cn("text-sm text-muted-foreground", !isModern && "italic opacity-70")}>
                {isModern ? "faturados no ciclo" : "em movimento na casa"}
              </span>
            </div>

            <div
              className={cn(
                "w-full overflow-x-auto rounded-2xl transition-all",
                isModern ? "bg-muted/20 border border-border/30" : "bg-black/20 border border-[hsl(var(--gold)/0.1)] shadow-inner",
              )}
              onPointerLeave={() => setChartHoverIdx(null)}
            >
              <div className={cn("relative min-w-[600px] w-full p-6", opts.compact && "p-4")}>
                <AnimatePresence>
                  {chartHoverIdx !== null && chartTooltipAnchorPct !== null && analytics.revenueSeries[chartHoverIdx] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute z-30 pointer-events-none w-max max-w-[220px] rounded-xl border px-4 py-3 shadow-2xl bg-card border-border backdrop-blur-md"
                      style={{
                        left: `${chartTooltipAnchorPct}%`,
                        top: 10,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {(() => {
                        const idx = chartHoverIdx;
                        const cur = analytics.revenueSeries[idx]!;
                        const prev = analytics.previousRevenueSeries[idx];
                        return (
                          <>
                            <p className="text-base font-bold text-foreground">{formatCurrency(cur.value)}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                              {cur.label} · {isModern ? "Período atual" : "Movimento do dia"}
                            </p>
                            {prev && prev.value > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/40">
                                <p className="text-[10px] text-muted-foreground">
                                  Anterior: <span className="text-foreground font-medium">{formatCurrency(prev.value)}</span>
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                <svg
                  key={periodDays}
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className={cn("w-full min-w-[600px] touch-none select-none", opts.compact ? "h-[180px]" : "h-[240px]")}
                  onPointerMove={updateChartHoverFromPointer}
                  onPointerDown={updateChartHoverFromPointer}
                >
                  <defs>
                    <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={isModern ? "hsl(var(--primary))" : "hsl(var(--gold))"}
                        stopOpacity="0.2"
                      />
                      <stop
                        offset="100%"
                        stopColor={isModern ? "hsl(var(--primary))" : "hsl(var(--gold))"}
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  <path d={chartAreaPath} fill="url(#chartArea)" />

                  <path
                    d={secondaryPath}
                    fill="none"
                    stroke={isModern ? "currentColor" : "hsl(var(--gold))"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                    className="text-muted-foreground/30 opacity-40"
                  />

                  <motion.path
                    d={chartPath}
                    fill="none"
                    stroke={isModern ? "hsl(var(--primary))" : "hsl(var(--gold))"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />

                  {hoverLineX !== null && (
                    <line
                      x1={hoverLineX}
                      y1={chartPad}
                      x2={hoverLineX}
                      y2={chartH - chartPad}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="text-muted-foreground/40"
                    />
                  )}

                  {chartEndpoints.primary && (
                    <circle
                      cx={chartEndpoints.primary.x}
                      cy={chartEndpoints.primary.y}
                      r={5}
                      fill={isModern ? "hsl(var(--primary))" : "hsl(var(--gold))"}
                      className="shadow-xl"
                    />
                  )}

                  {analytics.revenueSeries.map((point, i) => {
                    const n = analytics.revenueSeries.length;
                    const step = Math.max(1, Math.ceil(n / 6));
                    if (i % step !== 0 && i !== n - 1) return null;
                    const x = chartPad + (n > 1 ? ((chartW - chartPad * 2) / (n - 1)) * i : 0);
                    return (
                      <text
                        key={`${point.label}-${i}`}
                        x={x}
                        y={chartH - 4}
                        textAnchor="middle"
                        className="text-[10px] font-bold uppercase tracking-tighter fill-muted-foreground/60"
                      >
                        {point.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <span className="inline-flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", isModern ? "bg-primary" : "bg-[hsl(var(--gold))]")} />
                Ciclo atual
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/30 border-dashed bg-transparent" />
                Ciclo anterior
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
              isModern ? "bg-muted text-muted-foreground/40" : "bg-[hsl(var(--gold)/0.05)] text-[hsl(var(--gold)/0.2)] border border-[hsl(var(--gold)/0.1)]"
            )}>
              <Monitor className="w-8 h-8" />
            </div>
            <Button 
              variant={isModern ? "outline" : "outlineGold"} 
              size="sm" 
              className="rounded-xl font-bold h-10 px-6"
              asChild
            >
              <Link to="/barbeiro/loja">
                <Plus className="w-4 h-4 mr-2" />
                {isModern ? "Cadastrar primeiro produto" : "Abastecer a vitrine"}
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  };

  /* const kpiGrid = (compact: boolean) => (
    <div className={cn("grid gap-4", compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
      {[
        {
          label: isModern ? "Entrada no período" : "Entrada no balcão",
          value: formatCurrency(periodTotal),
          trend: analytics.trends.revenue,
          icon: Wallet,
        },
        {
          label: isModern ? "Ticket médio" : "Ticket do balcão",
          value: formatCurrency(analytics.ticketMedio),
          trend: 0,
          icon: ShoppingBag,
        },
        {
          label: isModern ? "Itens vendidos" : "Saída no balcão",
          value: analytics.produtosVendidos,
          trend: 0,
          icon: Package,
        },
      ].map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={cn(
            "rounded-2xl border p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300",
            isModern 
              ? "bg-card border-border/50 shadow-sm hover:border-primary/20" 
              : "bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--card)/0.8)] border-[hsl(var(--gold)/0.2)] shadow-lg hover:border-[hsl(var(--gold)/0.4)]"
          )}
        >
          {!isModern && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.15)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isModern ? "bg-muted text-muted-foreground/60 group-hover:bg-primary/10 group-hover:text-primary" : "bg-[hsl(var(--gold)/0.05)] text-[hsl(var(--gold)/0.4)] group-hover:text-[hsl(var(--gold))]"
            )}>
              <kpi.icon className="w-5 h-5" />
            </div>
            {kpi.trend !== 0 && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                kpi.trend !== null && kpi.trend > 0 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-rose-500/10 text-rose-500"
              )}>
                {kpi.trend !== null && kpi.trend > 0 ? <ArrowUpCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {kpi.trend !== null ? Math.abs(kpi.trend).toFixed(0) : 0}%
              </div>
            )}
          </div>

          <div className="space-y-1 relative z-10">
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isModern ? "text-muted-foreground/60" : "text-[hsl(var(--gold))] opacity-50"
            )}>
              {kpi.label}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              !isModern && "font-display text-[hsl(var(--gold))]"
            )}>
              {kpi.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  ); */

  return (
    <DashboardLayout
      userType="barbeiro"
      title={isModern ? "Panorama" : "Panorama da casa"}
      subtitle={isModern
        ? "Centro de comando do período com leitura imediata e próxima ação."
        : "Leitura do compasso do período e do próximo passo da operação."}
    >
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        <section
          className={cn(
            "rounded-2xl border px-5 py-4 sm:px-6 sm:py-5",
            isModern ? "bg-card border-border/50 shadow-sm" : "bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.92)] border-[hsl(var(--gold)/0.2)] shadow-xl",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", isModern ? "text-muted-foreground/70" : "text-[hsl(var(--gold))] opacity-60")}>
                {isModern ? "Resumo do período" : "Ritmo da casa"}
              </p>
            </div>
            {analytics.trends.revenue !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                  analytics.trends.revenue > 0
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                )}
              >
                {analytics.trends.revenue > 0 ? <ArrowUpCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {Math.abs(analytics.trends.revenue).toFixed(0)}% <span className="text-muted-foreground/70">{analytics.trends.label}</span>
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", isModern ? "bg-primary/10 border-primary/20 text-primary" : "bg-[hsl(var(--gold)/0.08)] border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]")}>
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isModern ? "text-muted-foreground/70" : "text-[hsl(var(--gold))] opacity-60")}>
                  {isModern ? "Entradas" : "Entrada"}
                </p>
                <p className={cn("text-lg sm:text-xl font-bold tracking-tight truncate", !isModern && "font-display")}>{formatCurrency(periodTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", isModern ? "bg-primary/10 border-primary/20 text-primary" : "bg-[hsl(var(--gold)/0.08)] border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]")}>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isModern ? "text-muted-foreground/70" : "text-[hsl(var(--gold))] opacity-60")}>
                  {isModern ? "Ticket médio" : "Ticket"}
                </p>
                <p className={cn("text-lg sm:text-xl font-bold tracking-tight truncate", !isModern && "font-display")}>{formatCurrency(analytics.ticketMedio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", isModern ? "bg-primary/10 border-primary/20 text-primary" : "bg-[hsl(var(--gold)/0.08)] border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]")}>
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isModern ? "text-muted-foreground/70" : "text-[hsl(var(--gold))] opacity-60")}>
                  {isModern ? "Saídas" : "Saída"}
                </p>
                <p className={cn("text-lg sm:text-xl font-bold tracking-tight truncate", !isModern && "font-display")}>{analytics.produtosVendidos}</p>
              </div>
            </div>
          </div>
        </section>

        {chartSection({ compact: true })}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className={cn(
              "rounded-2xl border p-6 h-full",
              isModern ? "bg-card border-border/50 shadow-sm" : "bg-black/20 border-[hsl(var(--gold)/0.15)] shadow-xl"
            )}>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    isModern ? "bg-primary/10 text-primary" : "bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
                  )}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={cn("font-bold", !isModern && "font-display text-lg")}>
                      {isModern ? "Movimento da vitrine" : "Pulso da vitrine"}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                      {isModern ? "Pedidos e destaques" : "Giro e evidências"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest gap-2" asChild>
                  <Link to="/barbeiro/loja/pedidos">
                    Ver tudo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>

              {orders.length === 0 && analytics.topProducts.length === 0 ? (
                <div className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-4 text-sm text-muted-foreground",
                  isModern ? "bg-muted/10 border-border/50" : "bg-black/20 border-[hsl(var(--gold)/0.12)]"
                )}>
                  <Store className="w-4 h-4 text-primary" />
                  <span>{isModern ? "Sem movimento de vitrine no período." : "Nenhum giro marcado no período."}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{isModern ? "Últimos pedidos" : "Balcão recente"}</p>
                    {orders.slice(0, 4).map((order) => (
                      <div key={order.id} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all hover:translate-x-1",
                        isModern ? "bg-muted/10 border-border/40 hover:bg-muted/20" : "bg-black/20 border-[hsl(var(--gold)/0.1)] hover:border-[hsl(var(--gold)/0.3)]"
                      )}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                            {order.customerName?.charAt(0) || "C"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{order.customerName || "Cliente"}</p>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 truncate">{order.status}</p>
                          </div>
                        </div>
                        <p className="font-bold text-sm shrink-0">{formatCurrency(order.total)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{isModern ? "Destaques" : "Peças em evidência"}</p>
                    {analytics.topProducts.length === 0 ? (
                      <div className={cn("rounded-xl border px-4 py-4 text-sm text-muted-foreground", isModern ? "bg-muted/10 border-border/50" : "bg-black/20 border-[hsl(var(--gold)/0.12)]")}>
                        {isModern ? "Ainda sem produto em destaque." : "Ainda sem um destaque na vitrine."}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topProducts.map((p) => (
                          <div key={p.id} className={cn("rounded-xl border px-4 py-3 flex items-center justify-between gap-3", isModern ? "bg-muted/10 border-border/50" : "bg-black/20 border-[hsl(var(--gold)/0.12)]")}>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{p.name}</p>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">{p.sold} vendidos</p>
                            </div>
                            <p className="text-sm font-bold shrink-0">{formatCurrency(p.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className={cn(
              "rounded-2xl border p-6 h-full",
              isModern ? "bg-amber-500/5 border-amber-500/20 shadow-sm" : "bg-gradient-to-br from-rose-500/5 to-transparent border-rose-500/20 shadow-xl"
            )}>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    isModern ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={cn("font-bold", !isModern && "font-display text-lg")}>
                      {isModern ? "Estoque crítico" : "Depósito pedindo cuidado"}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                      {isModern ? "Reposição necessária" : "Cuidado com o estoque"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest gap-2" asChild>
                  <Link to="/barbeiro/loja/produtos">
                    Ver tudo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>

              {analytics.lowStock.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{isModern ? "Estoque em dia. Nada para repor agora." : "Depósito em dia. Nada pedindo reposição."}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.lowStock.map((product) => (
                    <div key={product.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{product.name}</p>
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                            {product.stock} em estoque
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isModern ? "outline" : "outlineGold"}
                        size="sm"
                        className={cn("h-8 rounded-lg text-[10px] font-bold uppercase tracking-widest", isModern && "border-rose-500/25 text-rose-500 hover:bg-rose-500/5")}
                        asChild
                      >
                        <Link to="/barbeiro/loja/produtos">{isModern ? "Repor" : "Repor agora"}</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          className={cn(
            "rounded-2xl border px-5 py-4 sm:px-6 sm:py-5",
            isModern ? "bg-card border-border/50 shadow-sm" : "bg-black/20 border-[hsl(var(--gold)/0.15)] shadow-xl",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                isModern ? "bg-primary/10 text-primary" : "bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
              )}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isModern ? "text-muted-foreground/70" : "text-[hsl(var(--gold))] opacity-60")}>
                  {isModern ? "Ações operacionais" : "Próximos passos da casa"}
                </p>
                <p className={cn("text-sm text-muted-foreground", !isModern && "italic opacity-80")}>
                  {isModern ? "Atalhos que destravam a operação sem atravessar telas demais." : "Atalhos para manter o ritmo sem perder o fio."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant={isModern ? "outline" : "outlineGold"} size="sm" className="rounded-xl font-bold h-10 px-5" asChild>
                <Link to="/barbeiro/loja">
                  <Store className="w-4 h-4 mr-2" />
                  {isModern ? "Abastecer vitrine" : "Abastecer a vitrine"}
                </Link>
              </Button>
              <Button variant={isModern ? "outline" : "outlineGold"} size="sm" className="rounded-xl font-bold h-10 px-5" asChild>
                <Link to="/barbeiro/financeiro">
                  <Receipt className="w-4 h-4 mr-2" />
                  Ver recebimentos
                </Link>
              </Button>
              <Button variant={isModern ? "outline" : "outlineGold"} size="sm" className="rounded-xl font-bold h-10 px-5" asChild>
                <Link to="/barbeiro/loja/produtos">
                  <Package className="w-4 h-4 mr-2" />
                  {isModern ? "Repor" : "Repor agora"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default BarberShopDashboard;
