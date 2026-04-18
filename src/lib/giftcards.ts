export type GiftcardStatus = "active" | "redeemed" | "cancelled";

export type GiftcardRecord = {
  code: string;
  createdAt: string;
  createdByUserId?: string;
  recipientName?: string;
  giftName?: string;
  amount: number;
  message?: string;
  status: GiftcardStatus;
  redeemedAt?: string;
  redeemedByUserId?: string;
};

const STORAGE_KEY = "barbeflow_giftcards_ledger_v1";

function safeParse(raw: string | null): GiftcardRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x === "object") as GiftcardRecord[];
  } catch {
    return [];
  }
}

function loadAll(): GiftcardRecord[] {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function saveAll(next: GiftcardRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function normalizeGiftcardCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function addGiftcard(record: Omit<GiftcardRecord, "status"> & { status?: GiftcardStatus }): GiftcardRecord {
  const code = normalizeGiftcardCode(record.code);
  const nextRecord: GiftcardRecord = {
    ...record,
    code,
    status: record.status ?? "active",
  };
  const all = loadAll();
  const idx = all.findIndex((g) => normalizeGiftcardCode(g.code) === code);
  const next = idx >= 0 ? all.map((g, i) => (i === idx ? { ...g, ...nextRecord } : g)) : [nextRecord, ...all];
  saveAll(next);
  return nextRecord;
}

export function getGiftcardByCode(code: string): GiftcardRecord | null {
  const normalized = normalizeGiftcardCode(code);
  if (!normalized) return null;
  const all = loadAll();
  return all.find((g) => normalizeGiftcardCode(g.code) === normalized) ?? null;
}

export function redeemGiftcard(params: {
  code: string;
  userId?: string;
}):
  | { ok: true; record: GiftcardRecord }
  | { ok: false; reason: "not_found" | "already_redeemed" | "invalid_code" } {
  const normalized = normalizeGiftcardCode(params.code);
  if (!normalized) return { ok: false, reason: "invalid_code" };
  const all = loadAll();
  const idx = all.findIndex((g) => normalizeGiftcardCode(g.code) === normalized);
  if (idx < 0) return { ok: false, reason: "not_found" };
  const current = all[idx];
  if (current.status === "redeemed") return { ok: false, reason: "already_redeemed" };

  const nowIso = new Date().toISOString();
  const updated: GiftcardRecord = {
    ...current,
    status: "redeemed",
    redeemedAt: nowIso,
    redeemedByUserId: params.userId,
  };
  const next = all.map((g, i) => (i === idx ? updated : g));
  saveAll(next);
  return { ok: true, record: updated };
}

export function listMyRedeemedGiftcards(userId?: string): GiftcardRecord[] {
  if (!userId) return [];
  return loadAll().filter((g) => g.status === "redeemed" && g.redeemedByUserId === userId);
}

