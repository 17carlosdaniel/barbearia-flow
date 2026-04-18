const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type MetricName = "LCP" | "INP" | "CLS";
type MetricRating = "good" | "needs-improvement" | "poor";

type MetricPayload = {
  name: MetricName;
  value: number;
  rating: MetricRating;
  timestamp: string;
};

type WebVitalsBody = {
  source?: string;
  userAgent?: string;
  sentAt?: string;
  metrics?: MetricPayload[];
};

const edgeRuntime = globalThis as unknown as {
  Deno?: { serve: (handler: (req: Request) => Response | Promise<Response>) => void };
};

if (!edgeRuntime.Deno?.serve) {
  throw new Error("Deno runtime indisponivel para esta Edge Function.");
}

function isValidMetric(metric: MetricPayload): boolean {
  if (!metric || typeof metric !== "object") return false;
  if (!["LCP", "INP", "CLS"].includes(metric.name)) return false;
  if (!Number.isFinite(metric.value)) return false;
  if (!["good", "needs-improvement", "poor"].includes(metric.rating)) return false;
  return Boolean(metric.timestamp);
}

edgeRuntime.Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as WebVitalsBody;
    const metrics = Array.isArray(body.metrics) ? body.metrics.filter(isValidMetric) : [];
    if (!metrics.length) {
      return new Response(JSON.stringify({ error: "metrics payload is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "Supabase env vars not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = metrics.map((metric) => ({
      source: body.source ?? "barberflow-web",
      user_agent: body.userAgent ?? req.headers.get("user-agent") ?? "unknown",
      sent_at: body.sentAt ?? new Date().toISOString(),
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_timestamp: metric.timestamp,
    }));

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/web_vitals_events`, {
      method: "POST",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      return new Response(JSON.stringify({ error: "insert failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

