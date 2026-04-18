const STORAGE_KEY = "barbeflow_cancelled_by_client";

export interface CancelledByClientItem {
  client: string;
  service: string;
  date: string;
  time: string;
}

function loadAll(): Record<number, CancelledByClientItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, CancelledByClientItem[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCancelledByClient(barbershopId: number): CancelledByClientItem[] {
  const all = loadAll();
  return all[barbershopId] ?? [];
}

export function addCancelledByClient(
  barbershopId: number,
  item: CancelledByClientItem
): void {
  const all = loadAll();
  const list = all[barbershopId] ?? [];
  list.push(item);
  all[barbershopId] = list;
  saveAll(all);
}
