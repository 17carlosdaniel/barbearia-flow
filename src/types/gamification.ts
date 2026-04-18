export type MissionScope = "daily" | "weekly" | "always";

export interface MissionCatalogItem {
  id: string;
  type: string;
  title: string;
  description: string;
  rewardPoints: number;
  scope: MissionScope;
  targetCount: number;
  active: boolean;
}

export interface MissionProgressRow {
  missionId: string;
  progressCount: number;
  completedCount: number;
  lastCompletedAt?: string;
}

export interface MissionViewItem extends MissionCatalogItem {
  isCompletedForWindow: boolean;
  canClaimNow: boolean;
}
