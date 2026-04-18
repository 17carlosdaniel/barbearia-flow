import { supabase } from "@/lib/supabaseClient";

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function emitAppointmentNotification(params: {
  userId: string;
  event: "created" | "updated" | "cancelled" | "rescheduled" | "status_changed";
  service: string;
  barbershopName: string;
  date?: string;
  time?: string;
  status?: string;
}): Promise<void> {
  if (!isUuid(params.userId)) return;
  const { error } = await supabase.rpc("emit_appointment_notification", {
    p_user_id: params.userId,
    p_event: params.event,
    p_service: params.service,
    p_barbershop_name: params.barbershopName,
    p_date: params.date ?? null,
    p_time: params.time ?? null,
    p_status: params.status ?? null,
  });
  if (error) throw error;
}

export async function emitStoreOrderNotification(params: {
  userId: string;
  event: "created" | "confirmed" | "status_changed";
  orderId: string;
  status?: string;
  total?: number;
}): Promise<void> {
  if (!isUuid(params.userId)) return;
  const { error } = await supabase.rpc("emit_store_order_notification", {
    p_user_id: params.userId,
    p_event: params.event,
    p_order_id: params.orderId,
    p_status: params.status ?? null,
    p_total: typeof params.total === "number" ? params.total : null,
  });
  if (error) throw error;
}

export async function emitGiftcardNotification(params: {
  userId: string;
  event: "created" | "expiring" | "updated";
  code: string;
  recipientName?: string;
  amount?: number;
}): Promise<void> {
  if (!isUuid(params.userId)) return;
  const { error } = await supabase.rpc("emit_giftcard_notification", {
    p_user_id: params.userId,
    p_event: params.event,
    p_code: params.code,
    p_recipient_name: params.recipientName ?? null,
    p_amount: typeof params.amount === "number" ? params.amount : null,
  });
  if (error) throw error;
}

export async function emitLoyaltyNotification(params: {
  userId: string;
  title: string;
  message: string;
  priority?: "low" | "normal" | "high" | "critical";
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isUuid(params.userId)) return;
  const { error } = await supabase.rpc("emit_notification", {
    p_user_id: params.userId,
    p_role: "cliente",
    p_category: "loyalty",
    p_title: params.title,
    p_message: params.message,
    p_priority: params.priority ?? "normal",
    p_action_type: "open_loyalty",
    p_action_label: "Ver fidelidade",
    p_action_payload: "/cliente/fidelidade",
    p_metadata: params.metadata ?? {},
    p_dedupe_key: params.dedupeKey ?? null,
    p_cooldown_seconds: 30,
  });
  if (error) throw error;
}
