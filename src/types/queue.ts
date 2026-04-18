export type QueueEntryStatus = "waiting" | "notified" | "arriving" | "served" | "cancelled" | "expired";

export interface QueueClientEntry {
  id: string;
  sessionId: string;
  barbershopId: number;
  barbershopName: string;
  serviceName: string;
  position: number;
  totalInQueue: number;
  status: QueueEntryStatus;
  estimatedWaitMin: number;
  activeBarbers: number;
  createdAt: string;
}

export interface QueueRecommendation {
  sessionId: string;
  barbershopId: number;
  waitingCount: number;
  estimatedWaitMinutes: number;
  score: number;
}
