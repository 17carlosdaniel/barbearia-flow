import { getCanonicalAppointmentsForBarbershop, type AppointmentRecord } from "@/lib/appointments";
import { getOrdersByBarbershop } from "@/lib/shopOrders";
import { supabase } from "@/lib/supabaseClient";
import type { ShopOrder } from "@/types/shop";

const PROFILE_FB_KEY = "barberflow_customer_profiles_fallback";

type AnyRow = Record<string, unknown>;

export type HistoryPeriod = "today" | "week" | "month";

export interface CustomerProfile {
  id: string;
  barbershopId: number;
  clientId?: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  tags: string[];
  updatedAt: string;
}

export interface HistoryRecord {
  id: string;
  source: "appointment" | "order";
  clientKey: string;
  clientName: string;
  customerPhone?: string;
  service: string;
  barberName?: string;
  price: number;
  durationMinutes?: number;
  status: string;
  dateIso: string;
}

export interface CustomerGroup {
  clientKey: string;
  clientName: string;
  customerPhone?: string;
  visits: number;
  totalSpent: number;
  avgTicket: number;
  lastService: string;
  lastServiceAt: string;
  preferredService: string;
  lastBarberName?: string;
  notes?: string;
  tags: string[];
  daysSinceLastVisit: number;
}

export interface HistoryInsightsData {
  records: HistoryRecord[];
  customers: CustomerGroup[];
  totalRevenue: number;
  totalVisits: number;
  uniqueCustomers: number;
  topService: string;
  busiestWeekday: string;
  staleCustomers: CustomerGroup[];
}

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

const toDayStart = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const parsePtDateTime = (date: string, time: string) => {
  const [d, m, y] = date.split("/").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, Number(time?.split(":")[0] || 0), Number(time?.split(":")[1] || 0));
};

const toClientKey = (clientId?: string, customerPhone?: string, customerName?: string) => {
  const normalizedPhone = (customerPhone || "").replace(/\D/g, "");
  const normalizedName = (customerName || "").trim().toLowerCase();
  if (clientId) return `id:${clientId}`;
  if (normalizedPhone) return `phone:${normalizedPhone}`;
  return `name:${normalizedName}`;
};

const mapProfileRow = (row: AnyRow): CustomerProfile => ({
  id: String(row.id ?? ""),
  barbershopId: Number(row.barbershop_id ?? row.barbershopId ?? 0),
  clientId: typeof row.client_id === "string" ? row.client_id : typeof row.clientId === "string" ? row.clientId : undefined,
  customerName: String(row.customer_name ?? row.customerName ?? ""),
  customerPhone:
    typeof row.customer_phone === "string" ? row.customer_phone : typeof row.customerPhone === "string" ? row.customerPhone : undefined,
  notes: typeof row.notes === "string" ? row.notes : undefined,
  tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map(String) : [],
  updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
});

const loadProfilesFallback = () => {
  try {
    const raw = localStorage.getItem(PROFILE_FB_KEY);
    if (!raw) return [] as CustomerProfile[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => mapProfileRow((item ?? {}) as AnyRow)) : [];
  } catch {
    return [] as CustomerProfile[];
  }
};

const saveProfilesFallback = (rows: CustomerProfile[]) => {
  localStorage.setItem(PROFILE_FB_KEY, JSON.stringify(rows));
};

export async function getCustomerProfilesByBarbershop(barbershopId: number): Promise<CustomerProfile[]> {
  try {
    const { data, error } = await supabase
      .from("barbershop_customer_profiles")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((item) => mapProfileRow((item ?? {}) as AnyRow));
  } catch {
    return loadProfilesFallback().filter((profile) => profile.barbershopId === barbershopId);
  }
}

export async function saveCustomerProfile(
  barbershopId: number,
  payload: {
    clientKey: string;
    clientName: string;
    customerPhone?: string;
    notes?: string;
    tags: string[];
  },
) {
  const [type, value] = payload.clientKey.split(":");
  const normalizedName = payload.clientName.trim() || "Cliente";
  const normalizedPhone = payload.customerPhone?.trim() || null;
  const normalizedTags = payload.tags.filter(Boolean).slice(0, 8);
  const data = {
    barbershop_id: barbershopId,
    client_id: type === "id" ? value : null,
    customer_name: normalizedName,
    customer_phone: normalizedPhone,
    notes: payload.notes?.trim() || null,
    tags: normalizedTags,
  };
  try {
    const { data: existing, error: readError } = await supabase
      .from("barbershop_customer_profiles")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .eq("customer_name", normalizedName)
      .eq("customer_phone", normalizedPhone)
      .maybeSingle();
    if (readError) throw readError;

    const query = existing?.id
      ? supabase.from("barbershop_customer_profiles").update(data).eq("id", existing.id).select("*").single()
      : supabase.from("barbershop_customer_profiles").insert(data).select("*").single();
    const { data: saved, error } = await query;
    if (error) throw error;
    return mapProfileRow((saved ?? {}) as AnyRow);
  } catch {
    const list = loadProfilesFallback();
    const idx = list.findIndex(
      (profile) =>
        profile.barbershopId === barbershopId &&
        profile.customerName.trim().toLowerCase() === normalizedName.toLowerCase() &&
        (profile.customerPhone || "") === (normalizedPhone || ""),
    );
    const next: CustomerProfile = {
      id: idx >= 0 ? list[idx].id : `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      barbershopId,
      clientId: type === "id" ? value : undefined,
      customerName: normalizedName,
      customerPhone: normalizedPhone || undefined,
      notes: payload.notes?.trim() || undefined,
      tags: normalizedTags,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) list[idx] = next;
    else list.unshift(next);
    saveProfilesFallback(list);
    return next;
  }
}

const mapAppointmentRecord = (appointment: AppointmentRecord): HistoryRecord => {
  const date = parsePtDateTime(appointment.date, appointment.time);
  return {
    id: `apt_${appointment.id}`,
    source: "appointment",
    clientKey: toClientKey(appointment.clientId, undefined, appointment.client),
    clientName: appointment.client,
    customerPhone: undefined,
    service: appointment.service || "Servico",
    barberName: undefined,
    price: Number(appointment.price ?? 0),
    durationMinutes: appointment.durationMinutes,
    status: appointment.status,
    dateIso: date.toISOString(),
  };
};

const mapOrderRecord = (order: ShopOrder): HistoryRecord => {
  const date = new Date(order.createdAt);
  return {
    id: `ord_${order.id}`,
    source: "order",
    clientKey: toClientKey(order.userId, order.customerPhone, order.customerName),
    clientName: order.customerName || "Cliente",
    customerPhone: order.customerPhone || undefined,
    service: "Pedido da loja",
    barberName: order.barberName,
    price: Number(order.total ?? 0),
    durationMinutes: undefined,
    status: order.status,
    dateIso: date.toISOString(),
  };
};

export async function getHistoryInsightsByBarbershop(
  barbershopId: number,
  options?: { period?: HistoryPeriod; staleDays?: number },
): Promise<HistoryInsightsData> {
  const period = options?.period ?? "month";
  const staleDays = options?.staleDays ?? 20;

  const [profiles, orders] = await Promise.all([
    getCustomerProfilesByBarbershop(barbershopId),
    getOrdersByBarbershop(barbershopId),
  ]);
  const appointments = getCanonicalAppointmentsForBarbershop(barbershopId).filter((item) => item.status === "completed");
  const paidOrders = orders.filter((order) => order.status === "pago" || order.status === "finalizado");

  const rawRecords = [
    ...appointments.map(mapAppointmentRecord),
    ...paidOrders.map(mapOrderRecord),
  ].sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());

  const now = new Date();
  const start = toDayStart(now);
  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(start.getDate() - 29);
  const records = rawRecords.filter((item) => (period === "today" ? toDayStart(new Date(item.dateIso)).getTime() === start.getTime() : new Date(item.dateIso) >= start));

  const serviceMap = new Map<string, number>();
  const weekdayMap = new Map<string, number>();
  const customerMap = new Map<string, CustomerGroup>();
  const profileByKey = new Map<string, CustomerProfile>();

  profiles.forEach((profile) => {
    const key = toClientKey(profile.clientId, profile.customerPhone, profile.customerName);
    profileByKey.set(key, profile);
  });

  records.forEach((record) => {
    if (record.source === "appointment") {
      serviceMap.set(record.service, (serviceMap.get(record.service) ?? 0) + 1);
      const day = weekdayLabels[new Date(record.dateIso).getDay()] || "Dia";
      weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1);
    }
    const existing = customerMap.get(record.clientKey);
    if (existing) {
      existing.visits += 1;
      existing.totalSpent += record.price;
      if (new Date(record.dateIso).getTime() > new Date(existing.lastServiceAt).getTime()) {
        existing.lastServiceAt = record.dateIso;
        existing.lastService = record.service;
        existing.lastBarberName = record.barberName || existing.lastBarberName;
      }
      const serviceCounter = (existing as CustomerGroup & { _serviceCount?: Map<string, number> })._serviceCount || new Map<string, number>();
      serviceCounter.set(record.service, (serviceCounter.get(record.service) ?? 0) + 1);
      (existing as CustomerGroup & { _serviceCount?: Map<string, number> })._serviceCount = serviceCounter;
      customerMap.set(record.clientKey, existing);
      return;
    }

    const profile = profileByKey.get(record.clientKey);
    const serviceCount = new Map<string, number>();
    serviceCount.set(record.service, 1);
    customerMap.set(record.clientKey, {
      clientKey: record.clientKey,
      clientName: record.clientName,
      customerPhone: record.customerPhone || profile?.customerPhone,
      visits: 1,
      totalSpent: record.price,
      avgTicket: record.price,
      lastService: record.service,
      lastServiceAt: record.dateIso,
      preferredService: record.service,
      lastBarberName: record.barberName,
      notes: profile?.notes,
      tags: profile?.tags ?? [],
      daysSinceLastVisit: 0,
      _serviceCount: serviceCount,
    } as CustomerGroup & { _serviceCount: Map<string, number> });
  });

  const customers = Array.from(customerMap.values())
    .map((customer) => {
      const serviceCounter = (customer as CustomerGroup & { _serviceCount?: Map<string, number> })._serviceCount ?? new Map<string, number>();
      const preferredService =
        Array.from(serviceCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? customer.preferredService;
      const daysSinceLastVisit = Math.floor((toDayStart(now).getTime() - toDayStart(new Date(customer.lastServiceAt)).getTime()) / 86400000);
      return {
        ...customer,
        avgTicket: customer.visits > 0 ? Number((customer.totalSpent / customer.visits).toFixed(2)) : 0,
        totalSpent: Number(customer.totalSpent.toFixed(2)),
        preferredService,
        daysSinceLastVisit,
      };
    })
    .sort((a, b) => new Date(b.lastServiceAt).getTime() - new Date(a.lastServiceAt).getTime());

  const topService = Array.from(serviceMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sem dados";
  const busiestWeekday = Array.from(weekdayMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Sem dados";
  const staleCustomers = customers.filter((customer) => customer.daysSinceLastVisit >= staleDays).slice(0, 4);
  const totalRevenue = Number(records.reduce((sum, record) => sum + record.price, 0).toFixed(2));

  return {
    records,
    customers,
    totalRevenue,
    totalVisits: records.length,
    uniqueCustomers: customers.length,
    topService,
    busiestWeekday,
    staleCustomers,
  };
}
