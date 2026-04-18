import { addClientPoints } from "@/lib/loyalty";

const STORAGE_KEY = "barbeflow_wait_engagement_v1";

export type MissionScope = "daily" | "weekly" | "always";
export type MissionType =
  | "evaluate_last_barbershop"
  | "quick_survey"
  | "follow_barbershops"
  | "weekly_booking_challenge"
  | "quiz_diagnostic";

export interface MissionDefinition {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  rewardPoints: number;
  scope: MissionScope;
  targetCount: number;
}

export interface MissionProgress {
  missionId: string;
  progressCount: number;
  completedCount: number;
  lastCompletedAt?: string;
}

export interface WaitQuizResult {
  id: string;
  createdAt: string;
  answers: Record<string, string>;
  recommendedStyle: string;
}

export interface WaitSurveyAnswer {
  id: string;
  createdAt: string;
  question: string;
  answer: string;
}

export interface WaitPhotoPost {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  caption?: string;
}

export interface WaitRewardEvent {
  id: string;
  createdAt: string;
  missionId: string;
  missionType: MissionType;
  points: number;
  barbershopId?: number;
  metadata?: Record<string, string | number | boolean>;
}

interface EngagementTelemetry {
  missionClicks: number;
  quizCompletions: number;
  surveyCompletions: number;
  photoPosts: number;
  updatedAt: string;
}

export interface WaitEngagementState {
  progress: MissionProgress[];
  quizHistory: WaitQuizResult[];
  surveyAnswers: WaitSurveyAnswer[];
  photoPosts: WaitPhotoPost[];
  rewardEvents: WaitRewardEvent[];
  followedBarbershopIds: number[];
  telemetry: EngagementTelemetry;
}

export interface MissionView extends MissionDefinition {
  progressCount: number;
  targetCount: number;
  completedCount: number;
  isCompletedForWindow: boolean;
  canClaimNow: boolean;
}

export interface MissionClaimResult {
  ok: boolean;
  reason?: "already_completed_window" | "not_enough_progress" | "mission_not_found";
  grantedPoints: number;
  event?: WaitRewardEvent;
}

const DEFAULT_MISSIONS: MissionDefinition[] = [
  {
    id: "m-evaluate-last",
    type: "evaluate_last_barbershop",
    title: "Avalie sua última barbearia",
    description: "Envie uma avaliação e ganhe pontos extras.",
    rewardPoints: 40,
    scope: "weekly",
    targetCount: 1,
  },
  {
    id: "m-survey",
    type: "quick_survey",
    title: "Responda pesquisa rápida",
    description: "Ajude a melhorar o app com feedback rápido.",
    rewardPoints: 20,
    scope: "daily",
    targetCount: 1,
  },
  {
    id: "m-follow-shops",
    type: "follow_barbershops",
    title: "Siga 3 barbearias",
    description: "Aumente suas recomendações personalizadas.",
    rewardPoints: 50,
    scope: "always",
    targetCount: 3,
  },
  {
    id: "m-weekly-bookings",
    type: "weekly_booking_challenge",
    title: "Desafio semanal",
    description: "Conclua 2 agendamentos na semana.",
    rewardPoints: 80,
    scope: "weekly",
    targetCount: 2,
  },
  {
    id: "m-quiz-diagnostic",
    type: "quiz_diagnostic",
    title: "Complete o diagnóstico capilar",
    description: "Finalize o Quiz Produtos para desbloquear pontos.",
    rewardPoints: 30,
    scope: "weekly",
    targetCount: 1,
  },
];

function getPeriodStart(scope: MissionScope, now = new Date()): number {
  const d = new Date(now);
  if (scope === "daily") {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (scope === "weekly") {
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  return 0;
}

function isCompletedInCurrentWindow(scope: MissionScope, lastCompletedAt?: string): boolean {
  if (!lastCompletedAt) return false;
  if (scope === "always") return true;
  const stamp = new Date(lastCompletedAt).getTime();
  if (Number.isNaN(stamp)) return false;
  return stamp >= getPeriodStart(scope);
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): Record<string, WaitEngagementState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WaitEngagementState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, WaitEngagementState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultState(): WaitEngagementState {
  return {
    progress: [],
    quizHistory: [],
    surveyAnswers: [],
    photoPosts: [],
    rewardEvents: [],
    followedBarbershopIds: [],
    telemetry: {
      missionClicks: 0,
      quizCompletions: 0,
      surveyCompletions: 0,
      photoPosts: 0,
      updatedAt: new Date().toISOString(),
    },
  };
}

function getMissionProgress(state: WaitEngagementState, missionId: string): MissionProgress {
  const existing = state.progress.find((p) => p.missionId === missionId);
  if (existing) return existing;
  const created: MissionProgress = { missionId, progressCount: 0, completedCount: 0 };
  state.progress.push(created);
  return created;
}

export function getMissionDefinitions(): MissionDefinition[] {
  return DEFAULT_MISSIONS;
}

export function getWaitEngagementState(clientId: string): WaitEngagementState {
  const all = loadAll();
  return all[clientId] ?? defaultState();
}

export function setWaitEngagementState(clientId: string, state: WaitEngagementState): void {
  const all = loadAll();
  all[clientId] = state;
  saveAll(all);
}

export function getMissionViews(clientId: string): MissionView[] {
  const state = getWaitEngagementState(clientId);
  return DEFAULT_MISSIONS.map((mission) => {
    const progress = state.progress.find((p) => p.missionId === mission.id) ?? {
      missionId: mission.id,
      progressCount: 0,
      completedCount: 0,
    };
    const completedForWindow = isCompletedInCurrentWindow(mission.scope, progress.lastCompletedAt);
    const canClaim = progress.progressCount >= mission.targetCount && !completedForWindow;
    return {
      ...mission,
      progressCount: progress.progressCount,
      completedCount: progress.completedCount,
      isCompletedForWindow: completedForWindow,
      canClaimNow: canClaim,
    };
  });
}

export function trackMissionClick(clientId: string): void {
  const state = getWaitEngagementState(clientId);
  state.telemetry.missionClicks += 1;
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
}

export function incrementMissionProgress(clientId: string, missionId: string, amount = 1): MissionProgress {
  const state = getWaitEngagementState(clientId);
  const progress = getMissionProgress(state, missionId);
  progress.progressCount += Math.max(amount, 0);
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return progress;
}

export function setMissionProgressCount(clientId: string, missionId: string, progressCount: number): MissionProgress {
  const state = getWaitEngagementState(clientId);
  const progress = getMissionProgress(state, missionId);
  progress.progressCount = Math.max(0, progressCount);
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return progress;
}

export function claimMissionReward(
  clientId: string,
  missionId: string,
  barbershopId?: number,
  metadata?: Record<string, string | number | boolean>,
): MissionClaimResult {
  const mission = DEFAULT_MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return { ok: false, reason: "mission_not_found", grantedPoints: 0 };
  }

  const state = getWaitEngagementState(clientId);
  const progress = getMissionProgress(state, mission.id);
  if (progress.progressCount < mission.targetCount) {
    setWaitEngagementState(clientId, state);
    return { ok: false, reason: "not_enough_progress", grantedPoints: 0 };
  }

  if (isCompletedInCurrentWindow(mission.scope, progress.lastCompletedAt)) {
    setWaitEngagementState(clientId, state);
    return { ok: false, reason: "already_completed_window", grantedPoints: 0 };
  }

  const nowIso = new Date().toISOString();
  progress.completedCount += 1;
  progress.lastCompletedAt = nowIso;
  if (mission.scope !== "always") {
    progress.progressCount = 0;
  }

  if (barbershopId != null) {
    addClientPoints(clientId, barbershopId, mission.rewardPoints);
  }

  const event: WaitRewardEvent = {
    id: makeId("reward"),
    createdAt: nowIso,
    missionId: mission.id,
    missionType: mission.type,
    points: mission.rewardPoints,
    barbershopId,
    metadata,
  };
  state.rewardEvents.unshift(event);
  state.telemetry.updatedAt = nowIso;
  setWaitEngagementState(clientId, state);
  return { ok: true, grantedPoints: mission.rewardPoints, event };
}

export function saveWaitQuizResult(
  clientId: string,
  answers: Record<string, string>,
  recommendedStyle: string,
): WaitQuizResult {
  const state = getWaitEngagementState(clientId);
  const item: WaitQuizResult = {
    id: makeId("quiz"),
    createdAt: new Date().toISOString(),
    answers,
    recommendedStyle,
  };
  state.quizHistory.unshift(item);
  state.telemetry.quizCompletions += 1;
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return item;
}

export function saveWaitSurveyAnswer(
  clientId: string,
  question: string,
  answer: string,
): WaitSurveyAnswer {
  const state = getWaitEngagementState(clientId);
  const item: WaitSurveyAnswer = {
    id: makeId("survey"),
    createdAt: new Date().toISOString(),
    question,
    answer,
  };
  state.surveyAnswers.unshift(item);
  state.telemetry.surveyCompletions += 1;
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return item;
}

export function saveWaitPhotoPost(clientId: string, imageDataUrl: string, caption?: string): WaitPhotoPost {
  const state = getWaitEngagementState(clientId);
  const item: WaitPhotoPost = {
    id: makeId("photo"),
    createdAt: new Date().toISOString(),
    imageDataUrl,
    caption,
  };
  state.photoPosts.unshift(item);
  state.telemetry.photoPosts += 1;
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return item;
}

export function followBarbershops(clientId: string, barbershopIds: number[]): number {
  const state = getWaitEngagementState(clientId);
  const nextSet = new Set(state.followedBarbershopIds);
  barbershopIds.forEach((id) => nextSet.add(id));
  state.followedBarbershopIds = Array.from(nextSet);
  state.telemetry.updatedAt = new Date().toISOString();
  setWaitEngagementState(clientId, state);
  return state.followedBarbershopIds.length;
}

export function getTotalRewardPoints(clientId: string): number {
  const state = getWaitEngagementState(clientId);
  return state.rewardEvents.reduce((sum, event) => sum + event.points, 0);
}

export function getRecentRewardEvents(clientId: string, limit = 6): WaitRewardEvent[] {
  const state = getWaitEngagementState(clientId);
  return state.rewardEvents.slice(0, limit);
}
