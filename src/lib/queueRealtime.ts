import { supabase } from "@/lib/supabaseClient";

export interface QueueRealtimeEntry {
  id: string;
  sessionId: string;
  barbershopId: number;
  barbershopName: string;
  serviceName: string;
  position: number;
  totalInQueue: number;
  status: "waiting" | "notified" | "arriving" | "served" | "cancelled" | "expired";
  estimatedWaitMin: number;
  activeBarbers: number;
  createdAt: string;
}

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

interface QueueEntryRow {
  id: string;
  session_id: string;
  position: number;
  status: QueueRealtimeEntry["status"];
  created_at: string;
  queue_sessions?: {
    barbershop_id: number;
    service_name: string;
    active_barbers: number;
  };
}

export interface SmartQueueRecommendation {
  sessionId: string;
  barbershopId: number;
  waitingCount: number;
  estimatedWaitMinutes: number;
  score: number;
}

export async function getQueueEntriesForClient(
  userId: string,
  resolveBarbershopName: (barbershopId: number) => string,
): Promise<QueueRealtimeEntry[]> {
  if (!isUuid(userId)) return [];
  const { data, error } = await supabase
    .from("queue_entries")
    .select("id,session_id,position,status,created_at,queue_sessions(barbershop_id,service_name,active_barbers)")
    .eq("client_id", userId)
    .in("status", ["waiting", "notified", "arriving"])
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as QueueEntryRow[];
  const sessionIds = Array.from(new Set(rows.map((row) => row.session_id)));
  const totalsBySession: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: totalsData } = await supabase
      .from("queue_entries")
      .select("session_id, id")
      .in("session_id", sessionIds)
      .in("status", ["waiting", "notified", "arriving"]);
    for (const item of totalsData ?? []) {
      const sid = String((item as Record<string, unknown>).session_id);
      totalsBySession[sid] = (totalsBySession[sid] ?? 0) + 1;
    }
  }

  const mapped: QueueRealtimeEntry[] = [];
  for (const row of rows) {
    const barbershopId = row.queue_sessions?.barbershop_id ?? 0;
    let estimatedWaitMin = Math.max((row.position - 1) * 15, 0);
    try {
      const { data } = await supabase.rpc("queue_estimated_wait_minutes", {
        p_session_id: row.session_id,
        p_position: row.position,
      });
      if (typeof data === "number") estimatedWaitMin = data;
    } catch {
      // fallback estimate
    }
    mapped.push({
      id: row.id,
      sessionId: row.session_id,
      barbershopId,
      barbershopName: resolveBarbershopName(barbershopId),
      serviceName: row.queue_sessions?.service_name ?? "Corte",
      position: row.position,
      totalInQueue: totalsBySession[row.session_id] ?? row.position,
      status: row.status,
      estimatedWaitMin,
      activeBarbers: row.queue_sessions?.active_barbers ?? 1,
      createdAt: row.created_at,
    });
  }

  return mapped;
}

export async function joinQueue(sessionId: string, clientName: string): Promise<void> {
  const { error } = await supabase.rpc("queue_join", {
    p_session_id: sessionId,
    p_client_name: clientName || "Cliente",
  });
  if (error) throw error;
}

export async function leaveQueue(entryId: string): Promise<void> {
  const { error } = await supabase.rpc("queue_leave", { p_entry_id: entryId });
  if (error) throw error;
}

export async function markQueueArriving(entryId: string): Promise<void> {
  const { error } = await supabase.rpc("queue_mark_arriving", { p_entry_id: entryId });
  if (error) throw error;
}

export async function getOrCreateOpenQueueSession(barbershopId: number, serviceName = "Corte"): Promise<string | null> {
  const { data: existing, error } = await supabase
    .from("queue_sessions")
    .select("id")
    .eq("barbershop_id", barbershopId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  if (!error && existing?.id) return existing.id as string;

  const { data: created, error: createError } = await supabase
    .from("queue_sessions")
    .insert({
      barbershop_id: barbershopId,
      service_name: serviceName,
      status: "open",
      active_barbers: 1,
      avg_service_minutes: 30,
    })
    .select("id")
    .single();
  if (createError) return null;
  return created?.id as string;
}

export function subscribeQueueForClient(userId: string, onChanged: () => void): { unsubscribe: () => void } {
  if (!isUuid(userId)) {
    return { unsubscribe: () => undefined };
  }
  const channel = supabase
    .channel(`queue-client-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_entries", filter: `client_id=eq.${userId}` },
      () => onChanged(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_sessions" },
      () => onChanged(),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

export async function upsertQueueAlertSubscription(
  entryId: string,
  userId: string,
  alertType: "one_ahead" | "my_turn" | "nearby_slot",
  enabled: boolean,
): Promise<void> {
  if (!isUuid(userId)) return;
  const { error } = await supabase
    .from("queue_alert_subscriptions")
    .upsert(
      {
        entry_id: entryId,
        user_id: userId,
        alert_type: alertType,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entry_id,user_id,alert_type" },
    );
  if (error) throw error;
}

export async function getSmartQueueRecommendations(limit = 3): Promise<SmartQueueRecommendation[]> {
  const { data, error } = await supabase.rpc("get_smart_queue_recommendations", { p_limit: limit });
  if (error) throw error;
  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    sessionId: String(row.session_id),
    barbershopId: Number(row.barbershop_id),
    waitingCount: Number(row.waiting_count ?? 0),
    estimatedWaitMinutes: Number(row.estimated_wait_minutes ?? 0),
    score: Number(row.score ?? 0),
  }));
}
