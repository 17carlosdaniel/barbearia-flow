import { supabase } from "@/lib/supabaseClient";
import {
  getMissionDefinitions,
  type MissionClaimResult,
  type MissionDefinition,
  type MissionView,
  type WaitPhotoPost,
  type WaitQuizResult,
  type WaitRewardEvent,
  type WaitSurveyAnswer,
} from "@/lib/waitEngagement";

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getPeriodStart(scope: "daily" | "weekly" | "always", now = new Date()): number {
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

function isCompletedInCurrentWindow(scope: "daily" | "weekly" | "always", lastCompletedAt?: string): boolean {
  if (!lastCompletedAt) return false;
  if (scope === "always") return true;
  const stamp = new Date(lastCompletedAt).getTime();
  if (Number.isNaN(stamp)) return false;
  return stamp >= getPeriodStart(scope);
}

function missionFallbackCatalog(): MissionDefinition[] {
  return getMissionDefinitions();
}

export async function getMissionViewsRemote(userId: string): Promise<MissionView[]> {
  if (!isUuid(userId)) return missionFallbackCatalog().map((m) => ({ ...m, progressCount: 0, completedCount: 0, isCompletedForWindow: false, canClaimNow: false }));

  const [catalogRes, progressRes] = await Promise.all([
    supabase
      .from("wait_missions_catalog")
      .select("id,type,title,description,reward_points,scope,target_count,active")
      .eq("active", true),
    supabase
      .from("wait_missions_progress")
      .select("mission_id,progress_count,completed_count,last_completed_at")
      .eq("user_id", userId),
  ]);

  const fallback = missionFallbackCatalog();
  const catalogRows = catalogRes.error || !catalogRes.data?.length
    ? fallback.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        reward_points: m.rewardPoints,
        scope: m.scope,
        target_count: m.targetCount,
        active: true,
      }))
    : catalogRes.data;

  const progressRows = progressRes.error ? [] : (progressRes.data ?? []);
  const progressByMission = new Map(
    progressRows.map((row) => [
      row.mission_id as string,
      {
        progressCount: Number(row.progress_count ?? 0),
        completedCount: Number(row.completed_count ?? 0),
        lastCompletedAt: row.last_completed_at ? String(row.last_completed_at) : undefined,
      },
    ]),
  );

  return catalogRows.map((row) => {
    const progress = progressByMission.get(String(row.id)) ?? { progressCount: 0, completedCount: 0, lastCompletedAt: undefined };
    const scope = String(row.scope) as "daily" | "weekly" | "always";
    const targetCount = Number(row.target_count ?? 1);
    const completedWindow = isCompletedInCurrentWindow(scope, progress.lastCompletedAt);
    return {
      id: String(row.id),
      type: String(row.type) as MissionDefinition["type"],
      title: String(row.title),
      description: String(row.description),
      rewardPoints: Number(row.reward_points ?? 0),
      scope,
      targetCount,
      progressCount: progress.progressCount,
      completedCount: progress.completedCount,
      isCompletedForWindow: completedWindow,
      canClaimNow: progress.progressCount >= targetCount && !completedWindow,
    };
  });
}

export async function setMissionProgressCountRemote(
  userId: string,
  missionId: string,
  progressCount: number,
): Promise<void> {
  if (!isUuid(userId)) return;
  const { data: current } = await supabase
    .from("wait_missions_progress")
    .select("completed_count,last_completed_at")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .maybeSingle();

  await syncMissionProgress(
    userId,
    missionId,
    Math.max(0, progressCount),
    Number(current?.completed_count ?? 0),
    current?.last_completed_at ? String(current.last_completed_at) : undefined,
  );
}

export async function incrementMissionProgressRemote(
  userId: string,
  missionId: string,
  amount = 1,
): Promise<void> {
  if (!isUuid(userId)) return;
  const { data: current } = await supabase
    .from("wait_missions_progress")
    .select("progress_count,completed_count,last_completed_at")
    .eq("user_id", userId)
    .eq("mission_id", missionId)
    .maybeSingle();
  const nextProgress = Number(current?.progress_count ?? 0) + Math.max(amount, 0);
  await syncMissionProgress(
    userId,
    missionId,
    nextProgress,
    Number(current?.completed_count ?? 0),
    current?.last_completed_at ? String(current.last_completed_at) : undefined,
  );
}

export async function claimMissionRewardRemote(
  userId: string,
  missionId: string,
  barbershopId?: number,
  metadata?: Record<string, string | number | boolean>,
): Promise<MissionClaimResult> {
  if (!isUuid(userId)) return { ok: false, reason: "mission_not_found", grantedPoints: 0 };
  const missions = await getMissionViewsRemote(userId);
  const mission = missions.find((m) => m.id === missionId);
  if (!mission) return { ok: false, reason: "mission_not_found", grantedPoints: 0 };
  if (mission.isCompletedForWindow) return { ok: false, reason: "already_completed_window", grantedPoints: 0 };
  if (!mission.canClaimNow) return { ok: false, reason: "not_enough_progress", grantedPoints: 0 };

  const now = new Date().toISOString();
  const event: WaitRewardEvent = {
    id: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    missionId,
    missionType: mission.type,
    points: mission.rewardPoints,
    barbershopId,
    metadata,
  };

  await syncRewardEvent(userId, event);
  await syncMissionProgress(
    userId,
    missionId,
    mission.scope === "always" ? mission.progressCount : 0,
    mission.completedCount + 1,
    now,
  );
  return { ok: true, grantedPoints: mission.rewardPoints, event };
}

export async function getRecentRewardEventsRemote(userId: string, limit = 6): Promise<WaitRewardEvent[]> {
  if (!isUuid(userId)) return [];
  const { data, error } = await supabase
    .from("wait_rewards_events")
    .select("id,mission_id,mission_type,points,barbershop_id,metadata,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    missionId: String(row.mission_id),
    missionType: String(row.mission_type) as WaitRewardEvent["missionType"],
    points: Number(row.points ?? 0),
    barbershopId: row.barbershop_id ? Number(row.barbershop_id) : undefined,
    metadata: (row.metadata as Record<string, string | number | boolean>) ?? {},
  }));
}

export async function syncRewardEvent(userId: string, event: WaitRewardEvent): Promise<void> {
  if (!isUuid(userId)) return;
  await supabase.from("wait_rewards_events").insert({
    id: event.id,
    user_id: userId,
    mission_id: event.missionId,
    mission_type: event.missionType,
    points: event.points,
    barbershop_id: event.barbershopId ?? null,
    metadata: event.metadata ?? {},
    created_at: event.createdAt,
  });
  await supabase.from("loyalty_points_ledger").insert({
    user_id: userId,
    barbershop_id: event.barbershopId ?? null,
    points: event.points,
    direction: "credit",
    source: "wait_mission",
    description: `Recompensa por missão: ${event.missionType}`,
    metadata: { mission_id: event.missionId, event_id: event.id },
    created_at: event.createdAt,
  });
}

export async function syncQuizResult(userId: string, item: WaitQuizResult): Promise<void> {
  if (!isUuid(userId)) return;
  await supabase.from("wait_quiz_results").insert({
    id: item.id,
    user_id: userId,
    answers: item.answers,
    recommended_style: item.recommendedStyle,
    created_at: item.createdAt,
  });
}

export async function syncSurveyAnswer(userId: string, item: WaitSurveyAnswer): Promise<void> {
  if (!isUuid(userId)) return;
  await supabase.from("wait_surveys").insert({
    id: item.id,
    user_id: userId,
    question: item.question,
    answer: item.answer,
    created_at: item.createdAt,
  });
}

export async function syncPhotoPost(userId: string, item: WaitPhotoPost): Promise<void> {
  if (!isUuid(userId)) return;
  await supabase.from("wait_photo_posts").insert({
    id: item.id,
    user_id: userId,
    image_data_url: item.imageDataUrl,
    caption: item.caption ?? null,
    created_at: item.createdAt,
  });
}

export async function syncMissionProgress(
  userId: string,
  missionId: string,
  progressCount: number,
  completedCount: number,
  lastCompletedAt?: string,
): Promise<void> {
  if (!isUuid(userId)) return;
  await supabase.from("wait_missions_progress").upsert(
    {
      user_id: userId,
      mission_id: missionId,
      progress_count: progressCount,
      completed_count: completedCount,
      last_completed_at: lastCompletedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,mission_id" },
  );
}
