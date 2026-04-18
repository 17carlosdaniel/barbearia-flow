# Web Vitals Endpoint (Exemplo pronto)

Este projeto ja envia lotes de Web Vitals quando `VITE_WEB_VITALS_ENDPOINT` esta configurado.

## 1) Opcao recomendada: Supabase Edge Function

Ja foi adicionado:
- Function: `supabase/functions/web-vitals/index.ts`
- Function resumo 24h: `supabase/functions/web-vitals-summary/index.ts`
- Migration: `supabase/migrations/20260407163000_web_vitals_events.sql`

### Deploy

1. Rodar migration:
```bash
supabase db push
```

2. Deploy da function:
```bash
supabase functions deploy web-vitals
supabase functions deploy web-vitals-summary
```

3. Definir no `.env` do frontend:
```env
VITE_WEB_VITALS_ENDPOINT=https://<project-ref>.functions.supabase.co/web-vitals
VITE_WEB_VITALS_SUMMARY_ENDPOINT=https://<project-ref>.functions.supabase.co/web-vitals-summary
```

### Payload esperado

```json
{
  "source": "barberflow-web",
  "userAgent": "Mozilla/5.0 ...",
  "sentAt": "2026-04-07T16:00:00.000Z",
  "metrics": [
    {
      "name": "LCP",
      "value": 1833.2,
      "rating": "good",
      "timestamp": "2026-04-07T16:00:00.000Z"
    }
  ]
}
```

## 2) Opcao alternativa: endpoint Node/Express

Se preferir backend proprio:

```ts
import express from "express";
const app = express();
app.use(express.json({ limit: "256kb" }));

app.post("/web-vitals", async (req, res) => {
  const { source, userAgent, sentAt, metrics } = req.body ?? {};
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return res.status(400).json({ error: "metrics required" });
  }

  // Salvar em banco/filas observabilidade
  // await db.insertMany("web_vitals_events", metrics.map(...))

  return res.status(200).json({ ok: true, inserted: metrics.length, source, userAgent, sentAt });
});

app.listen(3333, () => {
  console.log("Web Vitals endpoint running on :3333");
});
```

E no frontend:
```env
VITE_WEB_VITALS_ENDPOINT=http://localhost:3333/web-vitals
```

## 3) Consulta rapida no Supabase

```sql
select
  metric_name,
  count(*) as total,
  round(avg(metric_value)::numeric, 3) as avg_value
from public.web_vitals_events
group by metric_name
order by metric_name;
```

## 4) Card remoto no /kpis

Com `VITE_WEB_VITALS_SUMMARY_ENDPOINT` configurado, a tela `/kpis` passa a mostrar:
- media 24h por metrica
- p75 por metrica
- total de amostras
- filtros de periodo: `24h`, `7d`, `30d` (query string `?period=` no endpoint de resumo)

