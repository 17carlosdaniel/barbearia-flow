const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const edgeRuntime = globalThis as unknown as {
  Deno?: { serve: (handler: (req: Request) => Response | Promise<Response>) => void };
};

if (!edgeRuntime.Deno?.serve) {
  throw new Error("Deno runtime indisponivel para esta Edge Function.");
}

type EventRow = {
  metric_name: "LCP" | "INP" | "CLS";
  metric_value: number;
};

edgeRuntime.Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
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

    const url = new URL(req.url);
    const period = url.searchParams.get("period") ?? "24h";
    const periodHours = period === "7d" ? 24 * 7 : period === "30d" ? 24 * 30 : 24;
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString();
    const query = new URL(`${supabaseUrl}/rest/v1/web_vitals_events`);
    query.searchParams.set("select", "metric_name,metric_value");
    query.searchParams.set("metric_timestamp", `gte.${since}`);
    query.searchParams.set("order", "metric_name.asc");

    const queryRes = await fetch(query.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
    });

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      return new Response(JSON.stringify({ error: "query failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = (await queryRes.json()) as EventRow[];
    const grouped: Record<string, number[]> = { LCP: [], INP: [], CLS: [] };
    for (const row of rows) {
      if (grouped[row.metric_name]) grouped[row.metric_name].push(Number(row.metric_value));
    }

    const data = Object.entries(grouped)
      .map(([metric_name, values]) => {
        if (!values.length) return null;
        const sorted = [...values].sort((a, b) => a - b);
        const avg_value = values.reduce((sum, v) => sum + v, 0) / values.length;
        const p75Index = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
        return {
          metric_name,
          avg_value,
          p75_value: sorted[p75Index],
          samples: values.length,
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        window: period,
        generatedAt: new Date().toISOString(),
        metrics: data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

