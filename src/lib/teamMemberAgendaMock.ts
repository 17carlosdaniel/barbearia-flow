/** Dados demonstrativos da agenda do dia no drawer da equipe (sem backend). */

export type MockAgendaItemStatus = "completed" | "upcoming" | "open" | "in_progress";

export interface MockAgendaItem {
  id: string;
  start: string;
  end?: string;
  service: string;
  customer?: string;
  status: MockAgendaItemStatus;
}

export interface MockAgendaSummary {
  monthTotal: number;
  todayTotal: number;
  nextLabel: string;
  freeSlots: number;
  revenueToday: string;
  insight: string;
  lastSeenLabel?: string;
  /** Quando em atendimento, horário estimado de término (demo). */
  inProgressEndsAt?: string;
}

function seedFromUserId(userId: string): number {
  return userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
}

export function getMockAgendaForMember(input: {
  userId: string;
  status: "online" | "atendendo" | "offline";
  serviceLabels: string[];
}): { items: MockAgendaItem[]; summary: MockAgendaSummary } {
  const seed = seedFromUserId(input.userId);
  const s0 = input.serviceLabels[0] ?? "Corte degradê";
  const s1 = input.serviceLabels[1] ?? "Barba completa";
  const s2 = input.serviceLabels[2] ?? "Corte + barba";

  const monthTotal = 18 + (seed % 35);
  const todayTotal = input.status === "offline" ? 0 : 2 + (seed % 3);
  const revenueN = todayTotal * (35 + (seed % 25));
  const revenueToday = `R$ ${revenueN}`;

  const items: MockAgendaItem[] = [];

  if (input.status === "offline") {
    return {
      items: [],
      summary: {
        monthTotal,
        todayTotal: 0,
        nextLabel: "—",
        freeSlots: 0,
        revenueToday: "R$ 0",
        insight: "Offline agora. Próximo horário livre amanhã às 09:00.",
        lastSeenLabel: "Último acesso: hoje 08:42",
      },
    };
  }

  items.push(
    { id: `${input.userId}-1`, start: "09:00", end: "09:30", service: s0, customer: "João", status: "completed" },
    { id: `${input.userId}-2`, start: "10:15", end: "10:45", service: s1, customer: "Marcos", status: "completed" },
  );

  const inProgressEndsAt = "13:50";

  if (input.status === "atendendo") {
    items.push({
      id: `${input.userId}-ip`,
      start: "13:00",
      end: inProgressEndsAt,
      service: s2,
      customer: "Cliente atual",
      status: "in_progress",
    });
    items.push({
      id: `${input.userId}-3`,
      start: "14:30",
      end: "15:15",
      service: s2,
      customer: "Felipe",
      status: "upcoming",
    });
  } else {
    items.push({
      id: `${input.userId}-3`,
      start: "14:30",
      end: "15:15",
      service: s2,
      customer: "Felipe",
      status: "upcoming",
    });
  }

  items.push({ id: `${input.userId}-4`, start: "16:00", service: "Horário livre", status: "open" });
  if (seed % 2 === 0) {
    items.push({ id: `${input.userId}-5`, start: "17:30", service: "Horário livre", status: "open" });
  }

  const freeSlots = items.filter((i) => i.status === "open").length;
  const nextLabel = input.status === "atendendo" ? "Em atendimento" : "14:30";

  let insight: string;
  if (freeSlots >= 2) {
    insight = `Hoje ainda dá para encaixar mais clientes — ${freeSlots} horários livres à tarde.`;
  } else if (freeSlots === 1) {
    insight = "Há 1 horário livre hoje à tarde.";
  } else {
    insight = "Agenda cheia hoje. Próximo espaço amanhã às 10:00.";
  }

  return {
    items,
    summary: {
      monthTotal,
      todayTotal,
      nextLabel,
      freeSlots,
      revenueToday,
      insight,
      inProgressEndsAt: input.status === "atendendo" ? inProgressEndsAt : undefined,
    },
  };
}
