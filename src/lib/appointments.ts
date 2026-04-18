/**
 * Armazenamento de agendamentos por barbearia (localStorage).
 * Usado para contar agendamentos do mês e aplicar limite do plano.
 */

import { getBarbershopById } from "@/lib/mockBarbershops";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { emitAppointmentNotification } from "@/lib/domainNotifications";
import { qualifyReferralForFirstService } from "@/lib/referralApi";

const STORAGE_KEY = "barbeflow_appointments";

/** Dispare ao atualizar `localStorage` de agendamentos para outras telas recarregarem na mesma aba. */
export const APPOINTMENTS_CHANGED_EVENT = "barberflow:appointments-changed";

export function emitAppointmentsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPOINTMENTS_CHANGED_EVENT));
}

export type PlanoId = "basico" | "profissional" | "premium";

export type LegacyAppointmentStatus = "pendente" | "concluido";
export type AppointmentStatus = "scheduled" | "confirmed" | "in_service" | "completed" | "cancelled";
export type BarbershopAppointmentRecord = Omit<AppointmentRecord, "status"> & { status: LegacyAppointmentStatus };

export interface AppointmentRecord {
  id: number;
  barbershopId: number;
  clientId?: string;
  client: string;
  barbershopName?: string;
  service: string;
  date: string; // DD/MM/YYYY
  time: string;
  location?: string;
  price?: number;
  durationMinutes?: number;
  thumbnailUrl?: string;
  whatsAppPhone?: string;
  status: AppointmentStatus;
  createdAt?: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  ratingSubmittedAt?: string;
  updatedAt?: string;
  openSlotId?: string;
  openSlotOrigin?: boolean;
}

function toCanonicalStatus(status: string | undefined): AppointmentStatus {
  switch (status) {
    case "pendente":
    case "pending":
      return "scheduled";
    case "concluido":
      return "completed";
    case "confirmed":
    case "in_service":
    case "completed":
    case "cancelled":
    case "scheduled":
      return status;
    default:
      return "scheduled";
  }
}

function toLegacyStatus(status: AppointmentStatus): LegacyAppointmentStatus {
  return status === "completed" ? "concluido" : "pendente";
}

function normalizeDate(date: string | undefined): string {
  if (!date) return "";
  if (date.includes("/")) return date;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
}

function enrichRecord(rec: AppointmentRecord): AppointmentRecord {
  const shop = getBarbershopById(rec.barbershopId);
  const profile = getBarbershopProfile(rec.barbershopId);
  return {
    ...rec,
    date: normalizeDate(rec.date),
    barbershopName: rec.barbershopName || profile.nomeBarbearia || shop?.name || `Barbearia #${rec.barbershopId}`,
    location: rec.location || [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ") || shop?.location || "",
    whatsAppPhone: rec.whatsAppPhone || profile.telefone || "",
    thumbnailUrl: rec.thumbnailUrl || profile.coverPhotoUrl || "",
  };
}

function migrateRecord(raw: Partial<AppointmentRecord> & Record<string, unknown>): AppointmentRecord | null {
  if (typeof raw.id !== "number" || typeof raw.barbershopId !== "number") return null;
  if (typeof raw.client !== "string" || typeof raw.service !== "string") return null;
  if (typeof raw.date !== "string" || typeof raw.time !== "string") return null;

  const nowIso = new Date().toISOString();
  const base: AppointmentRecord = {
    id: raw.id,
    barbershopId: raw.barbershopId,
    clientId: typeof raw.clientId === "string" ? raw.clientId : undefined,
    client: raw.client,
    barbershopName: typeof raw.barbershopName === "string" ? raw.barbershopName : undefined,
    service: raw.service,
    date: raw.date,
    time: raw.time,
    location: typeof raw.location === "string" ? raw.location : undefined,
    price: typeof raw.price === "number" ? raw.price : undefined,
    durationMinutes: typeof raw.durationMinutes === "number" ? raw.durationMinutes : undefined,
    thumbnailUrl: typeof raw.thumbnailUrl === "string" ? raw.thumbnailUrl : undefined,
    whatsAppPhone: typeof raw.whatsAppPhone === "string" ? raw.whatsAppPhone : undefined,
    status: toCanonicalStatus(typeof raw.status === "string" ? raw.status : undefined),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    confirmedAt: typeof raw.confirmedAt === "string" ? raw.confirmedAt : undefined,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : undefined,
    cancelledAt: typeof raw.cancelledAt === "string" ? raw.cancelledAt : undefined,
    ratingSubmittedAt: typeof raw.ratingSubmittedAt === "string" ? raw.ratingSubmittedAt : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
    openSlotId: typeof raw.openSlotId === "string" ? raw.openSlotId : undefined,
    openSlotOrigin: typeof raw.openSlotOrigin === "boolean" ? raw.openSlotOrigin : false,
  };
  return enrichRecord(base);
}

function loadAll(): AppointmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const migrated = parsed
      .map((item) => {
        const raw = item as Partial<AppointmentRecord> & Record<string, unknown>;
        return migrateRecord(raw);
      })
      .filter((item): item is AppointmentRecord => Boolean(item));
    const shouldPersistMigration =
      migrated.length !== parsed.length ||
      migrated.some((item, idx) => JSON.stringify(item) !== JSON.stringify(parsed[idx]));
    /* Não disparar `APPOINTMENTS_CHANGED_EVENT` aqui: `loadAll` costuma vir de telas que ouvem o evento
       (`refreshAppointments` → `getAppointmentsForClient` → `loadAll`), o que gerava recursão infinita. */
    if (shouldPersistMigration) {
      saveAll(migrated, { emit: false });
    }
    return migrated;
  } catch {
    return [];
  }
}

/** Campos grandes (URLs/base64) são reidratados por `enrichRecord` ao ler. */
function compactAppointmentForStorage(a: AppointmentRecord): AppointmentRecord {
  const copy: AppointmentRecord = { ...a };
  delete copy.thumbnailUrl;
  if (copy.location && copy.location.length > 420) {
    copy.location = `${copy.location.slice(0, 417)}...`;
  }
  return copy;
}

const MAX_APPOINTMENTS_STORED = 400;

/** Mantém ativos e os concluídos/cancelados mais recentes para não estourar ~5MB do localStorage. */
function pruneAppointmentsForStorage(list: AppointmentRecord[], max: number): AppointmentRecord[] {
  if (list.length <= max) return list;
  const isTerminal = (x: AppointmentRecord) => x.status === "completed" || x.status === "cancelled";
  const active = list.filter((a) => !isTerminal(a));
  const done = list.filter(isTerminal).sort((a, b) => a.id - b.id);
  const room = max - active.length;
  if (room <= 0) {
    return [...list].sort((a, b) => b.id - a.id).slice(0, max);
  }
  const keptDone = done.slice(Math.max(0, done.length - room));
  return [...active, ...keptDone];
}

function isQuotaExceededError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014)
  );
}

function saveAll(list: AppointmentRecord[], opts?: { emit?: boolean }) {
  const emit = opts?.emit !== false;
  let toWrite = pruneAppointmentsForStorage(list.map(compactAppointmentForStorage), MAX_APPOINTMENTS_STORED);

  const write = (data: AppointmentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  try {
    write(toWrite);
  } catch (e) {
    if (!isQuotaExceededError(e)) throw e;
    toWrite = pruneAppointmentsForStorage(toWrite, 200);
    try {
      write(toWrite);
    } catch (e2) {
      if (!isQuotaExceededError(e2)) throw e2;
      toWrite = pruneAppointmentsForStorage(toWrite, 90);
      write(toWrite);
    }
  }
  if (emit) emitAppointmentsChanged();
}

/** Limite do plano Básico (agendamentos por mês). Profissional e Premium = ilimitado. */
export const LIMITE_PLANO_BASICO = 50;

export function getLimitForPlan(plano: PlanoId | string | undefined): number | null {
  if (plano === "basico") return LIMITE_PLANO_BASICO;
  return null; // ilimitado
}

export function getAppointmentsForBarbershop(barbershopId: number): BarbershopAppointmentRecord[] {
  return loadAll()
    .filter((a) => a.barbershopId === barbershopId)
    .map((a) => ({
      ...a,
      status: toLegacyStatus(a.status),
    }));
}

export function getCanonicalAppointmentsForBarbershop(barbershopId: number): AppointmentRecord[] {
  return loadAll()
    .filter((a) => a.barbershopId === barbershopId)
    .sort((a, b) => {
      const dA = new Date(`${a.date.split("/").reverse().join("-")}T${a.time}:00`).getTime();
      const dB = new Date(`${b.date.split("/").reverse().join("-")}T${b.time}:00`).getTime();
      return dA - dB;
    });
}

/** Conta agendamentos do mês (qualquer status) para a barbearia. */
export function getAppointmentsCountForMonth(
  barbershopId: number,
  year: number,
  month: number
): number {
  const list = loadAll().filter((a) => a.barbershopId === barbershopId);
  return list.filter((a) => {
    const [d, m, y] = a.date.split("/").map(Number);
    return y === year && m === month;
  }).length;
}

export function addAppointment(
  barbershopId: number,
  data: Omit<AppointmentRecord, "id" | "barbershopId" | "status"> & { status?: AppointmentStatus | LegacyAppointmentStatus }
): AppointmentRecord {
  const list = loadAll();
  const id = list.length > 0 ? Math.max(...list.map((a) => a.id)) + 1 : 1;
  const nowIso = new Date().toISOString();
  const apt: AppointmentRecord = {
    id,
    barbershopId,
    clientId: data.clientId,
    client: data.client || "Cliente",
    barbershopName: data.barbershopName,
    service: data.service || "Serviço",
    date: normalizeDate(data.date),
    time: data.time || "10:00",
    location: data.location,
    price: data.price,
    durationMinutes: data.durationMinutes,
    thumbnailUrl: data.thumbnailUrl,
    whatsAppPhone: data.whatsAppPhone,
    status: toCanonicalStatus(data.status),
    createdAt: data.createdAt || nowIso,
    confirmedAt: data.confirmedAt,
    startedAt: data.startedAt,
    completedAt: data.completedAt,
    cancelledAt: data.cancelledAt,
    ratingSubmittedAt: data.ratingSubmittedAt,
    updatedAt: nowIso,
    openSlotId: data.openSlotId,
    openSlotOrigin: data.openSlotOrigin,
  };
  const enriched = enrichRecord(apt);
  list.push(enriched);
  saveAll(list);
  if (enriched.clientId) {
    void emitAppointmentNotification({
      userId: enriched.clientId,
      event: "created",
      service: enriched.service,
      barbershopName: enriched.barbershopName || "sua barbearia",
      date: enriched.date,
      time: enriched.time,
      status: enriched.status,
    });
  }
  return enriched;
}

export function updateAppointmentStatus(
  barbershopId: number,
  id: number,
  status: "pendente" | "concluido" | AppointmentStatus
): void {
  const list = loadAll();
  const idx = list.findIndex((a) => a.barbershopId === barbershopId && a.id === id);
  if (idx === -1) return;
  const nowIso = new Date().toISOString();
  const canonical = toCanonicalStatus(status);
  list[idx] = {
    ...list[idx],
    status: canonical,
    updatedAt: nowIso,
    confirmedAt: canonical === "confirmed" ? nowIso : list[idx].confirmedAt,
    startedAt: canonical === "in_service" ? nowIso : list[idx].startedAt,
    completedAt: canonical === "completed" ? nowIso : list[idx].completedAt,
    cancelledAt: canonical === "cancelled" ? nowIso : list[idx].cancelledAt,
  };
  saveAll(list);
  const target = list[idx];
  if (target.clientId) {
    void emitAppointmentNotification({
      userId: target.clientId,
      event: canonical === "cancelled" ? "cancelled" : "status_changed",
      service: target.service,
      barbershopName: target.barbershopName || "barbearia",
      date: target.date,
      time: target.time,
      status: canonical,
    });
    if (canonical === "completed") {
      void qualifyReferralForFirstService(target.clientId);
    }
  }
}

export function getAppointmentsForClient(clientId: string, clientName?: string): AppointmentRecord[] {
  const normalizedName = (clientName ?? "").trim().toLowerCase();
  const cid = (clientId ?? "").trim();
  return loadAll()
    .filter((a) => {
      if (a.clientId) {
        return cid.length > 0 && a.clientId.trim() === cid;
      }
      if (normalizedName) return a.client.trim().toLowerCase() === normalizedName;
      return false;
    })
    .sort((a, b) => {
      const dA = new Date(`${a.date.split("/").reverse().join("-")}T${a.time}:00`).getTime();
      const dB = new Date(`${b.date.split("/").reverse().join("-")}T${b.time}:00`).getTime();
      return dB - dA;
    });
}

export function cancelAppointmentByClient(clientId: string, appointmentId: number): AppointmentRecord | null {
  const list = loadAll();
  const idx = list.findIndex((a) => a.id === appointmentId && (!a.clientId || a.clientId === clientId));
  if (idx === -1) return null;
  const nowIso = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "cancelled",
    cancelledAt: nowIso,
    updatedAt: nowIso,
  };
  saveAll(list);
  return list[idx];
}

export function rescheduleAppointment(
  clientId: string,
  appointmentId: number,
  nextDate: string,
  nextTime: string
): AppointmentRecord | null {
  const list = loadAll();
  const idx = list.findIndex((a) => a.id === appointmentId && (!a.clientId || a.clientId === clientId));
  if (idx === -1) return null;
  const nowIso = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    date: normalizeDate(nextDate),
    time: nextTime,
    status: "scheduled",
    cancelledAt: undefined,
    completedAt: undefined,
    ratingSubmittedAt: undefined,
    updatedAt: nowIso,
  };
  saveAll(list);
  return list[idx];
}

export function rescheduleAppointmentForBarber(
  barbershopId: number,
  appointmentId: number,
  nextDate: string,
  nextTime: string,
): AppointmentRecord | null {
  const list = loadAll();
  const idx = list.findIndex((a) => a.id === appointmentId && a.barbershopId === barbershopId);
  if (idx === -1) return null;
  const nowIso = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    date: normalizeDate(nextDate),
    time: nextTime,
    status: "scheduled",
    cancelledAt: undefined,
    completedAt: undefined,
    startedAt: undefined,
    updatedAt: nowIso,
  };
  saveAll(list);
  return list[idx];
}

export function markAppointmentReviewed(clientId: string, appointmentId: number): AppointmentRecord | null {
  const list = loadAll();
  const idx = list.findIndex((a) => a.id === appointmentId && (!a.clientId || a.clientId === clientId));
  if (idx === -1) return null;
  const nowIso = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    ratingSubmittedAt: nowIso,
    updatedAt: nowIso,
  };
  saveAll(list);
  return list[idx];
}

/** Retorna se a barbearia pode receber mais agendamentos neste mês (respeitando o plano). */
export function canAddAppointment(
  barbershopId: number,
  plano: PlanoId | string | undefined
): { ok: boolean; count: number; limit: number | null } {
  const now = new Date();
  const count = getAppointmentsCountForMonth(barbershopId, now.getFullYear(), now.getMonth() + 1);
  const limit = getLimitForPlan(plano);
  const ok = limit === null || count < limit;
  return { ok, count, limit };
}

function formatDateBr(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Uma vez por barbearia — injeta agendamentos de demonstração para o dia atual (horários livres não conflitantes). */
const DEMO_FLAG_PREFIX = "barbeflow_demo_agenda_v2_";

export function ensureDemoAppointmentsForBarbershop(barbershopId: number): void {
  const flag = `${DEMO_FLAG_PREFIX}${barbershopId}`;
  try {
    if (localStorage.getItem(flag)) return;
  } catch {
    return;
  }
  const today = formatDateBr(new Date());
  const list = loadAll();
  const takenTimes = new Set(
    list
      .filter((a) => a.barbershopId === barbershopId && a.date === today)
      .map((a) => a.time.slice(0, 5)),
  );

  const nowIso = new Date().toISOString();
  const startedEarlier = new Date(Date.now() - 22 * 60 * 1000).toISOString();

  const demo: Array<Omit<AppointmentRecord, "id" | "barbershopId">> = [
    {
      client: "João Silva",
      service: "Corte Degradê",
      date: today,
      time: "09:00",
      status: "completed",
      price: 50,
      durationMinutes: 45,
      whatsAppPhone: "5511999887701",
      completedAt: nowIso,
    },
    {
      client: "Carlos Mendes",
      service: "Barba",
      date: today,
      time: "10:00",
      status: "completed",
      price: 35,
      durationMinutes: 30,
      whatsAppPhone: "5511999887702",
      completedAt: nowIso,
    },
    {
      client: "André Lima",
      service: "Corte + Barba",
      date: today,
      time: "11:00",
      status: "in_service",
      price: 80,
      durationMinutes: 60,
      whatsAppPhone: "5511999887703",
      startedAt: startedEarlier,
    },
    {
      client: "Felipe Souza",
      service: "Corte social",
      date: today,
      time: "14:00",
      status: "scheduled",
      price: 45,
      durationMinutes: 30,
      whatsAppPhone: "5511999887704",
    },
    {
      client: "Bruno Dias",
      service: "Degradê + sobrancelha",
      date: today,
      time: "15:30",
      status: "confirmed",
      price: 55,
      durationMinutes: 45,
      whatsAppPhone: "5511999887705",
      confirmedAt: nowIso,
    },
    {
      client: "Thiago Rocha",
      service: "Barba",
      date: today,
      time: "16:30",
      status: "scheduled",
      price: 40,
      durationMinutes: 30,
      whatsAppPhone: "5511999887706",
    },
    {
      client: "Ricardo Nunes",
      service: "Corte infantil",
      date: today,
      time: "17:15",
      status: "confirmed",
      price: 40,
      durationMinutes: 30,
      whatsAppPhone: "5511999887707",
      confirmedAt: nowIso,
    },
  ];

  for (const row of demo) {
    const t = row.time.slice(0, 5);
    if (takenTimes.has(t)) continue;
    addAppointment(barbershopId, row);
    takenTimes.add(t);
  }

  try {
    localStorage.setItem(flag, "1");
  } catch {
    // ignore
  }
}

/** Compat: garante demo na barbearia 1 (dashboard legado). */
export function ensureSeedForBarbershop1(): AppointmentRecord[] {
  ensureDemoAppointmentsForBarbershop(1);
  return getCanonicalAppointmentsForBarbershop(1);
}
