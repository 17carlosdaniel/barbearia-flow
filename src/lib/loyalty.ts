const STORAGE_KEY_FIRST_VISIT = "barbeflow_first_visit_offer";
const STORAGE_KEY_POINTS = "barbeflow_loyalty_points";

export interface FirstVisitOffer {
  barbershopId: number;
  enabled: boolean;
  discountPercent: number;
  description: string;
}

function loadFirstVisitOffers(): Record<number, FirstVisitOffer> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getFirstVisitOffer(barbershopId: number): FirstVisitOffer | null {
  const all = loadFirstVisitOffers();
  const offer = all[barbershopId];
  if (!offer?.enabled) return null;
  return offer;
}

/** Retorna a oferta salva mesmo se desativada (para edição no perfil) */
export function getFirstVisitOfferRaw(barbershopId: number): FirstVisitOffer | null {
  const all = loadFirstVisitOffers();
  return all[barbershopId] ?? null;
}

export function setFirstVisitOffer(barbershopId: number, offer: Partial<FirstVisitOffer>): void {
  const all = loadFirstVisitOffers();
  all[barbershopId] = {
    barbershopId,
    enabled: false,
    discountPercent: 10,
    description: "Desconto na primeira visita",
    ...all[barbershopId],
    ...offer,
  };
  localStorage.setItem(STORAGE_KEY_FIRST_VISIT, JSON.stringify(all));
}

/** Clientes que já usaram a oferta de primeira visita (barbershopId -> clientId[]) */
const USED_FIRST_VISIT_KEY = "barbeflow_used_first_visit";

export function hasUsedFirstVisitOffer(barbershopId: number, clientId: string): boolean {
  try {
    const raw = localStorage.getItem(USED_FIRST_VISIT_KEY);
    const map: Record<number, string[]> = raw ? JSON.parse(raw) : {};
    return (map[barbershopId] ?? []).includes(clientId);
  } catch {
    return false;
  }
}

export function markFirstVisitOfferUsed(barbershopId: number, clientId: string): void {
  try {
    const raw = localStorage.getItem(USED_FIRST_VISIT_KEY);
    const map: Record<number, string[]> = raw ? JSON.parse(raw) : {};
    if (!map[barbershopId]) map[barbershopId] = [];
    if (!map[barbershopId].includes(clientId)) map[barbershopId].push(clientId);
    localStorage.setItem(USED_FIRST_VISIT_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Pontos por cliente por barbearia: clientId -> { barbershopId: points } */
export function getClientPoints(clientId: string): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POINTS);
    const all: Record<string, Record<number, number>> = raw ? JSON.parse(raw) : {};
    return all[clientId] ?? {};
  } catch {
    return {};
  }
}

export function addClientPoints(clientId: string, barbershopId: number, points: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POINTS);
    const all: Record<string, Record<number, number>> = raw ? JSON.parse(raw) : {};
    if (!all[clientId]) all[clientId] = {};
    all[clientId][barbershopId] = (all[clientId][barbershopId] ?? 0) + points;
    localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getPointsForBarbershop(clientId: string, barbershopId: number): number {
  return getClientPoints(clientId)[barbershopId] ?? 0;
}
