import type { AppointmentRecord } from "@/lib/appointments";
import { addAppointment, getCanonicalAppointmentsForBarbershop, updateAppointmentStatus } from "@/lib/appointments";
import { parseAppointmentDateTime } from "@/lib/barberSchedule";

const OPEN_SLOTS_KEY = "barberflow_open_slots";

/** `filled` é legado — migrado para `occupied` ao carregar. */
export type OpenSlotStatus = "open" | "occupied" | "filled" | "closed";

export interface OpenSlotRecord {
  id: string;
  barbershopId: number;
  date: string; // DD/MM/YYYY
  time: string; // HH:mm
  /** Duração do atendimento (min) — também define por quanto tempo a vaga fica “no ar” antes de expirar. */
  durationMinutes: number;
  potentialValue: number;
  status: OpenSlotStatus;
  source?: "manual" | "auto";
  assignedBarberName?: string;
  createdAt: string;
  updatedAt: string;
  /** Fim da janela em que a vaga pode ser ocupada (ISO). Depois disso fecha sozinha se ainda estiver `open`. */
  expiresAt?: string;
  /** Preenchido quando status = occupied (cliente em atendimento). */
  filledAppointmentId?: number;
  filledByClientName?: string;
  occupiedAt?: string;
}

const SHOP_SLOT_START_HOUR = 9;
const SHOP_SLOT_END_HOUR = 19;

function listingExpiresAtFromCreated(createdAt: string, durationMinutes: number): string {
  return new Date(new Date(createdAt).getTime() + durationMinutes * 60 * 1000).toISOString();
}

function listingExpiresAtFromNow(durationMinutes: number): string {
  return new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
}

/** ISO até quando a listagem “aguardando cliente” vale (migração / leitura). */
export function getOpenSlotListingExpiresAtIso(slot: OpenSlotRecord): string {
  if (slot.expiresAt) return slot.expiresAt;
  return listingExpiresAtFromCreated(slot.createdAt, slot.durationMinutes);
}

/** Milissegundos até expirar a vaga aberta; 0 se já passou ou não é `open`. */
export function getOpenSlotListingMsRemaining(slot: OpenSlotRecord): number {
  if (slot.status !== "open") return 0;
  const exp = new Date(getOpenSlotListingExpiresAtIso(slot)).getTime();
  if (!Number.isFinite(exp)) return 0;
  return Math.max(0, exp - Date.now());
}

function migrateRecord(raw: OpenSlotRecord): OpenSlotRecord {
  let r: OpenSlotRecord = raw.status === "filled" ? { ...raw, status: "occupied" } : { ...raw };
  if (r.status === "open" && !r.expiresAt) {
    r = { ...r, expiresAt: listingExpiresAtFromCreated(r.createdAt, r.durationMinutes) };
  }
  return r;
}

function closeExpiredOpenSlots(list: OpenSlotRecord[]): { list: OpenSlotRecord[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const next = list.map((s) => {
    if (s.status !== "open") return s;
    const exp = new Date(getOpenSlotListingExpiresAtIso(s)).getTime();
    if (!Number.isFinite(exp) || now <= exp) return s;
    changed = true;
    return { ...s, status: "closed" as const, updatedAt: new Date().toISOString() };
  });
  return { list: next, changed };
}

function loadAll(): OpenSlotRecord[] {
  try {
    const raw = localStorage.getItem(OPEN_SLOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const snapshot = JSON.stringify(parsed);
    let list = (parsed as OpenSlotRecord[]).map(migrateRecord);
    const { list: purged, changed: expiredSome } = closeExpiredOpenSlots(list);
    list = purged;
    const migratedChanged = JSON.stringify(list) !== snapshot;
    if (migratedChanged || expiredSome) saveAll(list);
    return list;
  } catch {
    return [];
  }
}

function saveAll(list: OpenSlotRecord[]) {
  localStorage.setItem(OPEN_SLOTS_KEY, JSON.stringify(list));
}

function isActiveStatus(s: OpenSlotStatus): boolean {
  return s === "open" || s === "occupied" || s === "filled";
}

/** Vagas ainda “no quadro” (amarelo ou verde). */
export function getOpenSlotsByBarbershop(barbershopId: number) {
  return loadAll()
    .filter((slot) => slot.barbershopId === barbershopId && isActiveStatus(slot.status))
    .sort((a, b) => {
      const dA = new Date(`${a.date.split("/").reverse().join("-")}T${a.time}:00`).getTime();
      const dB = new Date(`${b.date.split("/").reverse().join("-")}T${b.time}:00`).getTime();
      return dA - dB;
    });
}

export function getOpenSlotsForDate(barbershopId: number, date: string) {
  return getOpenSlotsByBarbershop(barbershopId).filter((slot) => slot.date === date);
}

/** Início do slot dentro da grade da loja (9h–19h45, alinhado a getFreeSlots). */
export function isOpenSlotTimeAllowed(time: string): boolean {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  if (h < SHOP_SLOT_START_HOUR || h > SHOP_SLOT_END_HOUR) return false;
  if (h === SHOP_SLOT_END_HOUR && m > 45) return false;
  return true;
}

function hasBlockingAppointment(barbershopId: number, date: string, time: string): boolean {
  return getCanonicalAppointmentsForBarbershop(barbershopId).some(
    (a) =>
      a.date === date &&
      a.time === time &&
      a.status !== "completed" &&
      a.status !== "cancelled",
  );
}

function hasActiveSlotAt(barbershopId: number, date: string, time: string, ignoreId?: string): boolean {
  return loadAll().some(
    (s) =>
      s.barbershopId === barbershopId &&
      s.date === date &&
      s.time === time &&
      isActiveStatus(s.status) &&
      s.id !== ignoreId,
  );
}

export type UpsertOpenSlotPayload = {
  date: string;
  time: string;
  durationMinutes: number;
  potentialValue: number;
  source?: "manual" | "auto";
  id?: string;
  assignedBarberName?: string;
};

export function upsertOpenSlot(barbershopId: number, payload: UpsertOpenSlotPayload): OpenSlotRecord | null {
  if (!isOpenSlotTimeAllowed(payload.time)) {
    return null;
  }
  if (hasBlockingAppointment(barbershopId, payload.date, payload.time)) {
    return null;
  }

  const list = loadAll();
  const now = new Date().toISOString();
  const existingIndex = payload.id
    ? list.findIndex((slot) => slot.id === payload.id && slot.barbershopId === barbershopId)
    : list.findIndex(
        (slot) =>
          slot.barbershopId === barbershopId &&
          slot.date === payload.date &&
          slot.time === payload.time &&
          slot.status === "open",
      );

  if (existingIndex >= 0) {
    const cur = list[existingIndex]!;
    if (cur.status !== "open") {
      return null;
    }
    list[existingIndex] = {
      ...cur,
      durationMinutes: payload.durationMinutes,
      potentialValue: payload.potentialValue,
      source: payload.source ?? cur.source ?? "manual",
      updatedAt: now,
      expiresAt: listingExpiresAtFromNow(payload.durationMinutes),
      ...(payload.assignedBarberName !== undefined
        ? { assignedBarberName: payload.assignedBarberName || undefined }
        : {}),
    };
    saveAll(list);
    return list[existingIndex];
  }

  if (hasActiveSlotAt(barbershopId, payload.date, payload.time)) {
    return null;
  }

  const next: OpenSlotRecord = {
    id: payload.id ?? `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    barbershopId,
    date: payload.date,
    time: payload.time,
    durationMinutes: payload.durationMinutes,
    potentialValue: payload.potentialValue,
    status: "open",
    source: payload.source ?? "manual",
    assignedBarberName: payload.assignedBarberName || undefined,
    createdAt: now,
    updatedAt: now,
    expiresAt: listingExpiresAtFromNow(payload.durationMinutes),
  };
  list.push(next);
  saveAll(list);
  return next;
}

/** Ajusta duração e valor enquanto a vaga ainda está só em “aguardando”. */
export function updateOpenSlotDuration(
  barbershopId: number,
  slotId: string,
  durationMinutes: number,
  potentialValue: number,
): OpenSlotRecord | null {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === slotId && s.barbershopId === barbershopId);
  if (idx === -1) return null;
  const cur = list[idx]!;
  if (cur.status !== "open") return null;
  list[idx] = {
    ...cur,
    durationMinutes,
    potentialValue,
    updatedAt: new Date().toISOString(),
    expiresAt: listingExpiresAtFromNow(durationMinutes),
  };
  saveAll(list);
  return list[idx];
}

export function closeOpenSlot(barbershopId: number, slotId: string) {
  const list = loadAll();
  const idx = list.findIndex((slot) => slot.id === slotId && slot.barbershopId === barbershopId);
  if (idx === -1) return;
  const cur = list[idx]!;
  if (cur.filledAppointmentId != null && (cur.status === "occupied" || cur.status === "filled")) {
    updateAppointmentStatus(barbershopId, cur.filledAppointmentId, "cancelled");
  }
  list[idx] = { ...cur, status: "closed", updatedAt: new Date().toISOString() };
  saveAll(list);
}

/** Cliente garante a vaga (ex.: Fila de espera): cria agendamento `scheduled` e marca vaga ocupada. */
export function occupyOpenSlot(
  barbershopId: number,
  slotId: string,
  options?: { clientName?: string; whatsAppPhone?: string; clientId?: string },
): { slot: OpenSlotRecord; appointment: AppointmentRecord } | null {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === slotId && s.barbershopId === barbershopId);
  if (idx === -1) return null;
  const slot = list[idx]!;
  if (slot.status !== "open") return null;
  if (getOpenSlotListingMsRemaining(slot) <= 0) {
    list[idx] = { ...slot, status: "closed", updatedAt: new Date().toISOString() };
    saveAll(list);
    return null;
  }

  const client = (options?.clientName || "Cliente").trim() || "Cliente";
  const now = new Date();
  const nowIso = now.toISOString();
  const [day, month, year] = slot.date.split("/").map(Number);
  const [hour, minute] = slot.time.split(":").map(Number);
  const slotStart = new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
  // Se a vaga foi publicada com horário já passado, joga para próximos minutos
  // para aparecer em "Meus agendamentos" como compromisso ativo.
  const appointmentStart = slotStart.getTime() < now.getTime() ? new Date(now.getTime() + 5 * 60 * 1000) : slotStart;
  const appointmentDate = `${String(appointmentStart.getDate()).padStart(2, "0")}/${String(appointmentStart.getMonth() + 1).padStart(2, "0")}/${appointmentStart.getFullYear()}`;
  const appointmentTime = `${String(appointmentStart.getHours()).padStart(2, "0")}:${String(appointmentStart.getMinutes()).padStart(2, "0")}`;
  const apt = addAppointment(barbershopId, {
    client,
    clientId: options?.clientId,
    service: "Horário livre",
    date: appointmentDate,
    time: appointmentTime,
    durationMinutes: slot.durationMinutes,
    price: slot.potentialValue,
    status: "scheduled",
    whatsAppPhone: options?.whatsAppPhone,
    openSlotId: slot.id,
    openSlotOrigin: true,
  });

  list[idx] = {
    ...slot,
    status: "occupied",
    filledAppointmentId: apt.id,
    filledByClientName: client,
    occupiedAt: nowIso,
    updatedAt: nowIso,
  };
  saveAll(list);
  return { slot: list[idx]!, appointment: apt };
}

/** Legado: vincula appointment já criado à vaga como ocupada. */
export function fillOpenSlot(barbershopId: number, slotId: string, payload: { appointmentId: number; clientName?: string }) {
  const list = loadAll();
  const idx = list.findIndex((slot) => slot.id === slotId && slot.barbershopId === barbershopId);
  if (idx === -1) return;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx]!,
    status: "occupied",
    filledAppointmentId: payload.appointmentId,
    filledByClientName: payload.clientName,
    occupiedAt: now,
    updatedAt: now,
  };
  saveAll(list);
}

/** Finaliza atendimento: agenda vira concluída e some da lista de vagas ativas. */
export function completeOpenSlotAttendance(barbershopId: number, slotId: string): boolean {
  const list = loadAll();
  const idx = list.findIndex((s) => s.id === slotId && s.barbershopId === barbershopId);
  if (idx === -1) return false;
  const slot = list[idx]!;
  if (slot.status !== "occupied" && slot.status !== "filled") return false;
  const aptId = slot.filledAppointmentId;
  if (aptId == null) return false;

  updateAppointmentStatus(barbershopId, aptId, "completed");
  list[idx] = { ...slot, status: "closed", updatedAt: new Date().toISOString() };
  saveAll(list);
  return true;
}

export function reopenOpenSlotFromAppointment(barbershopId: number, apt: AppointmentRecord) {
  return upsertOpenSlot(barbershopId, {
    id: apt.openSlotId,
    date: apt.date,
    time: apt.time,
    durationMinutes: apt.durationMinutes ?? 30,
    potentialValue: Number(apt.price ?? 0),
    source: "auto",
  });
}

/** Minutos restantes estimados do encaixe (horário início + duração). */
export function getOpenSlotRemainingMinutes(slot: Pick<OpenSlotRecord, "date" | "time" | "durationMinutes">): number | null {
  const start = parseAppointmentDateTime({ date: slot.date, time: slot.time });
  const end = new Date(start.getTime() + slot.durationMinutes * 60 * 1000);
  const diff = end.getTime() - Date.now();
  if (!Number.isFinite(diff)) return null;
  return Math.max(0, Math.ceil(diff / 60000));
}
