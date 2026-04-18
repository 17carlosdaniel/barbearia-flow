import { supabase } from "@/lib/supabaseClient";
import type { ShopOrder } from "@/types/shop";
import { emitStoreOrderNotification } from "@/lib/domainNotifications";
import { registerOrderItemsAsSales } from "@/lib/storeV2";

const FALLBACK_ORDERS_KEY = "barberflow_shop_orders_fallback";
const ORDER_SALES_SYNC_KEY = "barberflow_order_sales_synced";

type LegacyOrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "em_separacao"
  | "enviado"
  | "entregue";

type AnyOrderRow = Record<string, unknown>;

export function normalizeOrderStatus(status: unknown): ShopOrder["status"] {
  if (status === "pendente" || status === "pago" || status === "em_atendimento" || status === "finalizado") {
    return status;
  }
  if (status === "aguardando_pagamento") return "pendente";
  if (status === "em_separacao") return "em_atendimento";
  if (status === "enviado" || status === "entregue") return "finalizado";
  return "pendente";
}

function mapOrderRow(raw: AnyOrderRow): ShopOrder {
  const createdAt = typeof raw.created_at === "string" ? raw.created_at : typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  return {
    id: String(raw.id ?? `OR-${Date.now()}`),
    orderPublicCode: typeof raw.order_public_code === "string" ? raw.order_public_code : typeof raw.orderPublicCode === "string" ? raw.orderPublicCode : undefined,
    userId: typeof raw.user_id === "string" ? raw.user_id : typeof raw.userId === "string" ? raw.userId : undefined,
    barbershopId: Number(raw.barbershop_id ?? raw.barbershopId ?? 0),
    items: Array.isArray(raw.items) ? (raw.items as ShopOrder["items"]) : [],
    subtotal: Number(raw.subtotal ?? 0),
    shipping: Number(raw.shipping ?? 0),
    total: Number(raw.total ?? 0),
    customerName: String(raw.customer_name ?? raw.customerName ?? "Cliente"),
    customerEmail: typeof raw.customer_email === "string" ? raw.customer_email : typeof raw.customerEmail === "string" ? raw.customerEmail : undefined,
    customerPhone: String(raw.customer_phone ?? raw.customerPhone ?? ""),
    paymentMethod: (raw.payment_method ?? raw.paymentMethod ?? "pix") as ShopOrder["paymentMethod"],
    status: normalizeOrderStatus(raw.status),
    pickupInStore: Boolean(raw.pickup_in_store ?? raw.pickupInStore ?? true),
    pickupLocation:
      typeof raw.pickupLocation === "string"
        ? raw.pickupLocation
        : typeof raw.address === "object" && raw.address !== null && typeof (raw.address as Record<string, unknown>).pickup_location === "string"
          ? String((raw.address as Record<string, unknown>).pickup_location)
          : undefined,
    address: typeof raw.address === "object" && raw.address !== null ? (raw.address as ShopOrder["address"]) : undefined,
    createdAt,
    coupon: typeof raw.coupon === "string" ? raw.coupon : undefined,
    discount: Number(raw.discount ?? 0),
    barberId: typeof raw.barber_id === "string" ? raw.barber_id : typeof raw.barberId === "string" ? raw.barberId : undefined,
    barberName: typeof raw.barber_name === "string" ? raw.barber_name : typeof raw.barberName === "string" ? raw.barberName : undefined,
    attendedAt: typeof raw.attended_at === "string" ? raw.attended_at : typeof raw.attendedAt === "string" ? raw.attendedAt : undefined,
    finalizedAt: typeof raw.finalized_at === "string" ? raw.finalized_at : typeof raw.finalizedAt === "string" ? raw.finalizedAt : undefined,
  };
}

function loadFallbackOrders(): ShopOrder[] {
  try {
    const raw = localStorage.getItem(FALLBACK_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => mapOrderRow(item as AnyOrderRow)) : [];
  } catch {
    return [];
  }
}

function saveFallbackOrders(orders: ShopOrder[]) {
  localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify(orders));
}

function hasOrderBeenSynced(orderId: string) {
  try {
    const raw = localStorage.getItem(ORDER_SALES_SYNC_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.includes(orderId) : false;
  } catch {
    return false;
  }
}

function markOrderSynced(orderId: string) {
  try {
    const raw = localStorage.getItem(ORDER_SALES_SYNC_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list.filter((id) => typeof id === "string") : [];
    if (!next.includes(orderId)) next.push(orderId);
    localStorage.setItem(ORDER_SALES_SYNC_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export async function createOrder(order: ShopOrder) {
  try {
    const normalizedStatus = normalizeOrderStatus(order.status);
    const payload = {
      user_id: order.userId ?? null,
      barbershop_id: order.barbershopId,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      discount: order.discount ?? 0,
      order_public_code: order.orderPublicCode ?? null,
      status: normalizedStatus,
      payment_method: order.paymentMethod,
      customer_name: order.customerName,
      customer_email: order.customerEmail ?? null,
      customer_phone: order.customerPhone,
      barber_id: order.barberId ?? null,
      barber_name: order.barberName ?? null,
      attended_at: order.attendedAt ?? null,
      finalized_at: order.finalizedAt ?? null,
      pickup_in_store: order.pickupInStore,
      address: order.pickupInStore
        ? {
            pickup_location: order.pickupLocation ?? null,
          }
        : order.address ?? null,
      coupon: order.coupon ?? null,
    };

    const { data, error } = await supabase
      .from("shop_orders")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    if (order.userId) {
      await emitStoreOrderNotification({
        userId: order.userId,
        event: "created",
        orderId: String((data as Record<string, unknown>)?.id ?? order.id ?? ""),
        status: normalizedStatus,
        total: order.total,
      });
    }
    return { ok: true as const, data: mapOrderRow((data ?? {}) as AnyOrderRow) };
  } catch {
    const fallback = loadFallbackOrders();
    fallback.unshift({ ...order, status: normalizedStatus });
    saveFallbackOrders(fallback);
    return { ok: false as const, data: { ...order, status: normalizedStatus } };
  }
}

export async function getOrdersByUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from("shop_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data.map((row) => mapOrderRow((row ?? {}) as AnyOrderRow)) : [];
  } catch {
    return loadFallbackOrders().filter((o) => o.userId === userId);
  }
}

export async function getOrdersByBarbershop(barbershopId: number) {
  try {
    const { data, error } = await supabase
      .from("shop_orders")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Array.isArray(data) ? data.map((row) => mapOrderRow((row ?? {}) as AnyOrderRow)) : [];
  } catch {
    return loadFallbackOrders().filter((o) => o.barbershopId === barbershopId);
  }
}

export async function updateOrderStatus(orderId: string, status: ShopOrder["status"]) {
  const normalizedStatus = normalizeOrderStatus(status);
  try {
    const { data: current } = await supabase
      .from("shop_orders")
      .select("id, user_id")
      .eq("id", orderId)
      .maybeSingle();

    const { error } = await supabase
      .from("shop_orders")
      .update({ status: normalizedStatus })
      .eq("id", orderId);
    if (error) throw error;
    const clientId = (current as Record<string, unknown> | null)?.user_id;
    if (typeof clientId === "string") {
      await emitStoreOrderNotification({
        userId: clientId,
        event: "status_changed",
        orderId,
        status: normalizedStatus,
      });
    }
    return true;
  } catch {
    const fallback = loadFallbackOrders().map((o) =>
      o.id === orderId ? { ...o, status: normalizedStatus } : o
    );
    saveFallbackOrders(fallback);
    return true;
  }
}

export async function updateOrder(orderId: string, updates: Partial<ShopOrder>) {
  const status = updates.status ? normalizeOrderStatus(updates.status) : undefined;
  try {
    const payload: Record<string, unknown> = {};
    if (status) payload.status = status;
    if (updates.barberId !== undefined) payload.barber_id = updates.barberId ?? null;
    if (updates.barberName !== undefined) payload.barber_name = updates.barberName ?? null;
    if (updates.attendedAt !== undefined) payload.attended_at = updates.attendedAt ?? null;
    if (updates.finalizedAt !== undefined) payload.finalized_at = updates.finalizedAt ?? null;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from("shop_orders").update(payload).eq("id", orderId);
      if (error) throw error;
    }
    if ((status === "pago" || status === "finalizado") && !hasOrderBeenSynced(orderId)) {
      const { data: orderRow } = await supabase.from("shop_orders").select("*").eq("id", orderId).maybeSingle();
      if (orderRow) {
        await registerOrderItemsAsSales(mapOrderRow(orderRow as AnyOrderRow));
        markOrderSynced(orderId);
      }
    }
    return true;
  } catch {
    const fallback = loadFallbackOrders().map((order) =>
      order.id === orderId ? { ...order, ...updates, status: status ?? order.status } : order
    );
    saveFallbackOrders(fallback);
    if ((status === "pago" || status === "finalizado") && !hasOrderBeenSynced(orderId)) {
      const order = fallback.find((item) => item.id === orderId);
      if (order) {
        await registerOrderItemsAsSales(order);
        markOrderSynced(orderId);
      }
    }
    return true;
  }
}

export async function markOrderAsPaid(orderId: string) {
  return updateOrder(orderId, { status: "pago" });
}

export async function markOrderInService(orderId: string, barberId?: string, barberName?: string) {
  return updateOrder(orderId, {
    status: "em_atendimento",
    barberId,
    barberName,
    attendedAt: new Date().toISOString(),
  });
}

export async function finalizeOrder(orderId: string, barberId?: string, barberName?: string) {
  return updateOrder(orderId, {
    status: "finalizado",
    barberId,
    barberName,
    finalizedAt: new Date().toISOString(),
  });
}

export async function cancelOrder(orderId: string) {
  return updateOrder(orderId, {
    status: "finalizado",
    finalizedAt: new Date().toISOString(),
  });
}

export function getOrderDaySummary(orders: ShopOrder[]) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const receita = todayOrders.reduce((acc, order) => acc + Number(order.total ?? 0), 0);
  const pendentes = todayOrders.filter((order) => order.status === "pendente").length;
  return {
    pedidosHoje: todayOrders.length,
    receita,
    pendentes,
  };
}
