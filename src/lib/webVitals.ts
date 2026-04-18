type MetricName = "LCP" | "INP" | "CLS";

export type MetricPayload = {
  name: MetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: string;
};

const WEB_VITALS_STORAGE_KEY = "barberflow_web_vitals";
const WEB_VITALS_QUEUE_KEY = "barberflow_web_vitals_queue";
const MAX_ITEMS = 60;
const MAX_QUEUE_ITEMS = 200;
const FLUSH_INTERVAL_MS = 20_000;
const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT as string | undefined;

function getRating(name: MetricName, value: number): MetricPayload["rating"] {
  if (name === "LCP") {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }
  if (name === "INP") {
    if (value <= 200) return "good";
    if (value <= 500) return "needs-improvement";
    return "poor";
  }
  if (value <= 0.1) return "good";
  if (value <= 0.25) return "needs-improvement";
  return "poor";
}

function reportMetric(name: MetricName, value: number) {
  const payload: MetricPayload = {
    name,
    value,
    rating: getRating(name, value),
    timestamp: new Date().toISOString(),
  };
  persistMetric(payload);
  enqueueMetric(payload);
  console.info("[WebVitals]", payload);
  void flushVitalsQueue();
}

function persistMetric(payload: MetricPayload) {
  try {
    const current = getStoredWebVitals();
    const next = [payload, ...current].slice(0, MAX_ITEMS);
    localStorage.setItem(WEB_VITALS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export function getStoredWebVitals(): MetricPayload[] {
  try {
    const raw = localStorage.getItem(WEB_VITALS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as MetricPayload[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getVitalsQueue(): MetricPayload[] {
  try {
    const raw = localStorage.getItem(WEB_VITALS_QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as MetricPayload[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setVitalsQueue(items: MetricPayload[]) {
  try {
    localStorage.setItem(WEB_VITALS_QUEUE_KEY, JSON.stringify(items.slice(0, MAX_QUEUE_ITEMS)));
  } catch {
    // noop
  }
}

function enqueueMetric(payload: MetricPayload) {
  const current = getVitalsQueue();
  setVitalsQueue([payload, ...current]);
}

async function flushVitalsQueue() {
  if (!endpoint) return;
  const queue = getVitalsQueue();
  if (!queue.length) return;

  const batch = queue.slice(0, 20);
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "barberflow-web",
        userAgent: navigator.userAgent,
        sentAt: new Date().toISOString(),
        metrics: batch,
      }),
      keepalive: true,
    });
    setVitalsQueue(queue.slice(batch.length));
  } catch {
    // mantém fila para retentativa
  }
}

export function initWebVitalsObserver() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  let clsValue = 0;

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const last = entries[entries.length - 1];
      if (last) reportMetric("LCP", last.startTime);
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as PerformanceEntry[]) {
        const shifted = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shifted.hadRecentInput) clsValue += shifted.value ?? 0;
      }
      reportMetric("CLS", clsValue);
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    const inpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      let maxLatency = 0;
      for (const entry of entries as PerformanceEntry[]) {
        const e = entry as PerformanceEntry & { duration?: number };
        maxLatency = Math.max(maxLatency, e.duration ?? 0);
      }
      if (maxLatency > 0) reportMetric("INP", maxLatency);
    });
    inpObserver.observe({ type: "event", buffered: true });
    window.setInterval(() => {
      void flushVitalsQueue();
    }, FLUSH_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        void flushVitalsQueue();
      }
    });
  } catch {
    // Silencioso para ambientes sem suporte total de métricas.
  }
}

