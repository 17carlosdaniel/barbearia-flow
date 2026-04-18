/** Dados mock e utilitários compartilhados entre Financeiro (resumo) e Análises. */

export type MockTransaction = {
  id: number;
  client: string;
  barber: string;
  service: string;
  method: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
};

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  { id: 1, client: "João Silva", barber: "João", service: "Corte Degradê", method: "Pix", amount: 55, commission: 27.5, date: "24/02/2026 09:30", status: "pago" },
  { id: 2, client: "Pedro Santos", barber: "Pedro", service: "Barba", method: "Pix", amount: 35, commission: 15.75, date: "24/02/2026 10:15", status: "pago" },
  { id: 3, client: "Lucas Oliveira", barber: "João", service: "Corte + Barba", method: "Cartão", amount: 80, commission: 40, date: "24/02/2026 11:00", status: "pago" },
  { id: 4, client: "Carlos Daniel", barber: "Pedro", service: "Corte Social", method: "Pix", amount: 45, commission: 20.25, date: "23/02/2026 14:00", status: "pago" },
  { id: 5, client: "Rafael Costa", barber: "Lucas", service: "Corte Degradê", method: "Dinheiro", amount: 55, commission: 24.75, date: "23/02/2026 15:30", status: "pago" },
  { id: 6, client: "André Lima", barber: "Lucas", service: "Platinado", method: "Cartão", amount: 120, commission: 54, date: "22/02/2026 16:00", status: "falhou" },
  { id: 7, client: "Marcos Souza", barber: "João", service: "Corte + Barba", method: "Pix", amount: 80, commission: 40, date: "22/02/2026 10:00", status: "pendente" },
];

export const CHART_DATA = [
  210, 260, 240, 310, 295, 340, 365, 380, 320, 355, 390, 410, 430, 415, 455, 490, 470, 520, 510, 545, 560, 575, 540, 598, 610, 595, 640, 660, 680, 700,
];

// Últimos 7 dias para home (Seg a Dom)
export const CHART_DATA_WEEK = [
  430, 415, 455, 490, 470, 520, 545,
];

export const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const calculateWeekTrend = (data: number[]): { percent: number; direction: "up" | "down" | "neutral" } => {
  if (data.length < 2) return { percent: 0, direction: "neutral" };
  const first = data[0];
  const last = data[data.length - 1];
  const percent = Math.round(((last - first) / first) * 100);
  return {
    percent: Math.abs(percent),
    direction: percent > 2 ? "up" : percent < -2 ? "down" : "neutral",
  };
};

// Comparação: ontem vs hoje
export const calculateDailyTrend = (today: number, yesterday: number) => {
  if (yesterday === 0) return { percent: 0, direction: "neutral" as const };
  const percent = Math.round(((today - yesterday) / yesterday) * 100);
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "neutral" as const,
  };
};

// Comparação: mês atual vs mês anterior
export const calculateMonthlyTrend = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return { percent: 0, direction: "neutral" as const };
  const percent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? "up" : percent < 0 ? "down" : "neutral" as const,
  };
};

export const buildChartPoints = (values: number[], width: number, height: number, pad = 18) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const stepX = (width - pad * 2) / (values.length - 1);
  
  return values.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return { x, y, value: v, index: i };
  });
};

export const buildPrevSeries = (values: number[]) => values.map((v, i) => Math.round(v * (0.82 + (i % 5) * 0.02)));

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const formatMoneyWithCents = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const parseTransactionDate = (value: string) => {
  const [datePart, timePart] = value.split(" ");
  const [d, m, y] = datePart.split("/").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, Number(timePart?.split(":")[0] || 0), Number(timePart?.split(":")[1] || 0));
};

export const chartTotal = (data: number[]) => data.reduce((s, v) => s + v, 0);

export const deltaPct = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const buildLinePath = (values: number[], width: number, height: number, pad = 18) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
};
