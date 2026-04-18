const STORAGE_KEY = "barbeflow_barber_catalog";

export const SERVICE_CATEGORIES = [
  "Corte masculino",
  "Corte feminino",
  "Visagismo",
  "Barba",
  "Tingimentos",
  "Chapinha",
  "Sobrancelha",
  "Coloração",
  "Outro",
] as const;

export const ADDITIONAL_SERVICES = [
  "Lavagem",
  "Hidratação",
  "Permanente",
  "Styling",
  "Finalização",
] as const;

export interface BarberService {
  id: string;
  barbershopId: number;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  description: string;
  photoUrl: string;
}

export interface BarberPackage {
  id: string;
  barbershopId: number;
  name: string;
  serviceIds: string[];
  productIds?: string[];
  discountType?: "percentual" | "fixo";
  discountValue?: number;
  basePrice?: number;
  finalPrice?: number;
  savingsValue?: number;
  price: number;
  discountPercent: number;
  description: string;
  tags?: string[];
  validUntil?: string;
  usageType?: "single" | "multiple";
  imageUrl?: string;
}

export interface BarberCatalog {
  services: BarberService[];
  packages: BarberPackage[];
}

function loadAll(): Record<number, BarberCatalog> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, BarberCatalog>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getBarberCatalog(barbershopId: number): BarberCatalog {
  const all = loadAll();
  const current = all[barbershopId] ?? { services: [], packages: [] };
  const normalizedPackages = (current.packages ?? []).map((pkg) => {
    const basePrice = Number(pkg.basePrice ?? pkg.price ?? 0);
    const finalPrice = Number(pkg.finalPrice ?? pkg.price ?? 0);
    const discountType = pkg.discountType ?? "percentual";
    const discountValue =
      pkg.discountValue ??
      (discountType === "fixo"
        ? Math.max(0, basePrice - finalPrice)
        : Number(pkg.discountPercent ?? 0));
    const savingsValue = Number(pkg.savingsValue ?? Math.max(0, basePrice - finalPrice));
    return {
      ...pkg,
      productIds: Array.isArray(pkg.productIds) ? pkg.productIds : [],
      discountType,
      discountValue,
      basePrice,
      finalPrice,
      savingsValue,
      usageType: pkg.usageType ?? "single",
      tags: Array.isArray(pkg.tags) ? pkg.tags : [],
    };
  });
  return { ...current, packages: normalizedPackages };
}

export function setBarberCatalog(barbershopId: number, catalog: BarberCatalog): void {
  const all = loadAll();
  all[barbershopId] = catalog;
  saveAll(all);
}

/** Dica de duração média por categoria (minutos) */
export const DEFAULT_DURATION_BY_CATEGORY: Record<string, number> = {
  "Corte masculino": 30,
  "Corte feminino": 45,
  "Visagismo": 40,
  "Barba": 20,
  "Tingimentos": 60,
  "Chapinha": 45,
  "Sobrancelha": 15,
  "Coloração": 90,
  "Lavagem": 15,
  "Hidratação": 30,
  "Permanente": 120,
  "Styling": 20,
  "Finalização": 10,
  "Outro": 30,
};
