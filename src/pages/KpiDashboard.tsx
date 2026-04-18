import { useEffect, useMemo, useState } from "react";
import { getStoredWebVitals } from "@/lib/webVitals";
import { Button } from "@/components/ui/button";

const KpiDashboard = () => {
  const vitals = getStoredWebVitals();
  const latestByMetric = useMemo(() => {
    return {
      LCP: vitals.find((v) => v.name === "LCP") ?? null,
      INP: vitals.find((v) => v.name === "INP") ?? null,
      CLS: vitals.find((v) => v.name === "CLS") ?? null,
    };
  }, [vitals]);

  const formatMetric = (name: "LCP" | "INP" | "CLS") => {
    const metric = latestByMetric[name];
    if (!metric) return "Sem dados";
    if (name === "CLS") return `${metric.value.toFixed(3)} (${metric.rating})`;
    return `${Math.round(metric.value)}ms (${metric.rating})`;
  };
  const [summary24h, setSummary24h] = useState<
    Array<{ metric_name: "LCP" | "INP" | "CLS"; avg_value: number; p75_value: number; samples: number }>
  >([]);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");

  useEffect(() => {
    const endpoint = import.meta.env.VITE_WEB_VITALS_SUMMARY_ENDPOINT as string | undefined;
    if (!endpoint) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${endpoint}?period=${period}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          metrics?: Array<{ metric_name: "LCP" | "INP" | "CLS"; avg_value: number; p75_value: number; samples: number }>;
        };
        if (!cancelled) setSummary24h(Array.isArray(json.metrics) ? json.metrics : []);
      } catch {
        // noop
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <main className="container max-w-5xl py-10 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de KPIs</h1>
      <p className="text-muted-foreground">
        Painel-base para governança de performance, UX, aquisição e retenção.
      </p>

      <section className="grid md:grid-cols-2 gap-4">
        <article className="glass-card p-5">
          <h2 className="font-semibold mb-2">Performance</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>LCP alvo: &lt; 2.5s</li>
            <li>INP alvo: &lt; 200ms</li>
            <li>CLS alvo: &lt; 0.1</li>
            <li>JS inicial por rota: budget de 250-350KB gzip</li>
            <li className="text-foreground mt-2">LCP atual: {formatMetric("LCP")}</li>
            <li className="text-foreground">INP atual: {formatMetric("INP")}</li>
            <li className="text-foreground">CLS atual: {formatMetric("CLS")}</li>
          </ul>
        </article>
        <article className="glass-card p-5">
          <h2 className="font-semibold mb-2">UX e Conversão</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>Tempo até primeira ação</li>
            <li>Taxa de conclusão de agendamento</li>
            <li>Abandono por etapa do checkout</li>
            <li>CTR dos CTAs principais</li>
          </ul>
        </article>
        <article className="glass-card p-5">
          <h2 className="font-semibold mb-2">Leads e SEO</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>Sessions orgânicas por cluster</li>
            <li>Inscrições de newsletter</li>
            <li>Taxa visitante → lead</li>
            <li>Lead → cadastro</li>
          </ul>
        </article>
        <article className="glass-card p-5">
          <h2 className="font-semibold mb-2">Retenção</h2>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>Reagendamento em 30/60/90 dias</li>
            <li>Clientes ativos por coorte</li>
            <li>NPS e avaliação média</li>
            <li>Tempo médio de resposta suporte</li>
          </ul>
        </article>
      </section>

      <section className="glass-card p-5 space-y-3">
        <h2 className="font-semibold">Histórico recente de Web Vitals</h2>
        {vitals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há medições. Navegue pelo app para coletar LCP/INP/CLS.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Métrica</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Coletado em</th>
                </tr>
              </thead>
              <tbody>
                {vitals.slice(0, 15).map((item, idx) => (
                  <tr key={`${item.name}-${item.timestamp}-${idx}`} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{item.name}</td>
                    <td className="py-2 pr-3">
                      {item.name === "CLS" ? item.value.toFixed(3) : `${Math.round(item.value)}ms`}
                    </td>
                    <td className="py-2 pr-3">{item.rating}</td>
                    <td className="py-2">{new Date(item.timestamp).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-card p-5 space-y-3">
        <h2 className="font-semibold">Resumo remoto (Supabase)</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={period === "24h" ? "default" : "outline"} onClick={() => setPeriod("24h")}>
            24h
          </Button>
          <Button size="sm" variant={period === "7d" ? "default" : "outline"} onClick={() => setPeriod("7d")}>
            7d
          </Button>
          <Button size="sm" variant={period === "30d" ? "default" : "outline"} onClick={() => setPeriod("30d")}>
            30d
          </Button>
        </div>
        {summary24h.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem dados remotos ainda. Configure `VITE_WEB_VITALS_SUMMARY_ENDPOINT` e aguarde novas coletas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Métrica</th>
                  <th className="py-2 pr-3">Média</th>
                  <th className="py-2 pr-3">P75</th>
                  <th className="py-2">Amostras</th>
                </tr>
              </thead>
              <tbody>
                {summary24h.map((row) => (
                  <tr key={row.metric_name} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-medium">{row.metric_name}</td>
                    <td className="py-2 pr-3">
                      {row.metric_name === "CLS" ? row.avg_value.toFixed(3) : `${Math.round(row.avg_value)}ms`}
                    </td>
                    <td className="py-2 pr-3">
                      {row.metric_name === "CLS" ? row.p75_value.toFixed(3) : `${Math.round(row.p75_value)}ms`}
                    </td>
                    <td className="py-2">{row.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default KpiDashboard;

