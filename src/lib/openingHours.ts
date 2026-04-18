const STORAGE_KEY = "barbeflow_opening_hours";

/** Dia da semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DaySchedule {
  /** Abre às */
  open: string;
  /** Fecha às (ou fecha para almoço se tiver open2/close2) */
  close: string;
  /** Abre de novo às (após almoço) — se preenchido, há intervalo de almoço */
  open2?: string;
  /** Fecha às (horário final da tarde) */
  close2?: string;
}

/** Por dia: null = fechado, senão abre/fecha (e opcionalmente open2/close2 para almoço) */
export type WeekSchedule = Record<DayOfWeek, DaySchedule | null>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  0: null,
  1: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
  2: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
  3: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
  4: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
  5: { open: "09:00", close: "12:00", open2: "13:00", close2: "18:00" },
  6: { open: "09:00", close: "13:00" },
};

function loadAll(): Record<number, WeekSchedule> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, WeekSchedule>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const DAY_NAMES: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export function getOpeningHours(barbershopId: number): WeekSchedule {
  const all = loadAll();
  const stored = all[barbershopId];
  if (!stored) return { ...DEFAULT_SCHEDULE };
  return { ...DEFAULT_SCHEDULE, ...stored };
}

export function setOpeningHours(barbershopId: number, schedule: WeekSchedule): void {
  const all = loadAll();
  all[barbershopId] = schedule;
  saveAll(all);
}

/** Converte "HH:mm" em minutos desde meia-noite */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Verifica se a barbearia está aberta no momento (manhã ou tarde, considerando almoço).
 */
export function isOpenNow(barbershopId: number, now: Date = new Date()): boolean {
  const schedule = getOpeningHours(barbershopId);
  const day = now.getDay() as DayOfWeek;
  const slot = schedule[day];
  if (!slot) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const openMin = timeToMinutes(slot.open);
  const closeMin = timeToMinutes(slot.close);
  if (current >= openMin && current < closeMin) return true;
  if (slot.open2 && slot.close2) {
    const open2Min = timeToMinutes(slot.open2);
    const close2Min = timeToMinutes(slot.close2);
    if (current >= open2Min && current < close2Min) return true;
  }
  return false;
}

/**
 * Retorna texto de status considerando um ou dois turnos (almoço).
 */
export function getOpeningStatus(
  barbershopId: number,
  now: Date = new Date()
): { status: "open" | "closed"; label: string; detail?: string } {
  const schedule = getOpeningHours(barbershopId);
  const day = now.getDay() as DayOfWeek;
  const slot = schedule[day];

  if (!slot) {
    const nextDay = DAY_NAMES.find((d) => d.value > day) ?? DAY_NAMES[1];
    return { status: "closed", label: "Fechado", detail: `Abre ${nextDay.label}` };
  }

  const current = now.getHours() * 60 + now.getMinutes();
  const openMin = timeToMinutes(slot.open);
  const closeMin = timeToMinutes(slot.close);
  const hasLunch = slot.open2 != null && slot.close2 != null;
  const open2Min = hasLunch ? timeToMinutes(slot.open2!) : 0;
  const close2Min = hasLunch ? timeToMinutes(slot.close2!) : 0;

  if (current < openMin) {
    return { status: "closed", label: "Fechado", detail: `Abre às ${slot.open}` };
  }
  if (current >= openMin && current < closeMin) {
    return {
      status: "open",
      label: "Aberto agora",
      detail: hasLunch ? `Fecha para almoço às ${slot.close}` : `Fecha às ${slot.close}`,
    };
  }
  if (hasLunch) {
    if (current >= closeMin && current < open2Min) {
      return { status: "closed", label: "Fechado", detail: `Abre de novo às ${slot.open2}` };
    }
    if (current >= open2Min && current < close2Min) {
      return {
        status: "open",
        label: "Aberto agora",
        detail: `Fecha às ${slot.close2}`,
      };
    }
    if (current >= close2Min) {
      return { status: "closed", label: "Fechado", detail: `Abre amanhã às ${slot.open}` };
    }
  } else {
    if (current >= closeMin) {
      return { status: "closed", label: "Fechado", detail: `Abre amanhã às ${slot.open}` };
    }
  }

  return { status: "closed", label: "Fechado" };
}
