import { supabase } from "@/lib/supabaseClient";

let loyaltySummaryRpcUnavailable = false;

function isMissingRpcError(error: unknown): boolean {
  const e = error as { code?: string; message?: string; details?: string; hint?: string } | null;
  const text = `${e?.message ?? ""} ${e?.details ?? ""} ${e?.hint ?? ""}`.toLowerCase();
  return e?.code === "PGRST202" || text.includes("get_loyalty_summary") || text.includes("could not find the function");
}

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export interface LoyaltySummary {
  total_points: number;
  credits: number;
  debits: number;
}

export interface LoyaltyLedgerRow {
  id: string;
  points: number;
  direction: "credit" | "debit";
  source: string;
  description: string | null;
  created_at: string;
}

export interface ReferralOverview {
  registered: number;
  qualified: number;
  rewarded: number;
  rewardsCount: number;
}

export interface LoyaltyRewardItem {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  active: boolean;
  stock: number | null;
  metadata: Record<string, unknown>;
}

export interface LoyaltyRedemptionRow {
  id: string;
  reward_id: string;
  points_spent: number;
  status: "redeemed" | "cancelled";
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface LoyaltyFriendRankingRow {
  friend_user_id: string;
  friend_label: string;
  total_points: number;
}

export async function getLoyaltySummary(userId: string): Promise<LoyaltySummary> {
  if (!isUuid(userId)) {
    return { total_points: 0, credits: 0, debits: 0 };
  }
  if (loyaltySummaryRpcUnavailable) {
    return { total_points: 0, credits: 0, debits: 0 };
  }
  const { data, error } = await supabase.rpc("get_loyalty_summary", { p_user_id: userId });
  if (error) {
    if (isMissingRpcError(error)) {
      loyaltySummaryRpcUnavailable = true;
      return { total_points: 0, credits: 0, debits: 0 };
    }
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_points: Number(row?.total_points ?? 0),
    credits: Number(row?.credits ?? 0),
    debits: Number(row?.debits ?? 0),
  };
}

export async function getLoyaltyLedger(userId: string, limit = 30): Promise<LoyaltyLedgerRow[]> {
  if (!isUuid(userId)) return [];
  const { data, error } = await supabase
    .from("loyalty_points_ledger")
    .select("id, points, direction, source, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LoyaltyLedgerRow[];
}

export async function ensureReferralCode(userId: string): Promise<string | null> {
  if (!isUuid(userId)) return null;
  const { data, error } = await supabase.rpc("ensure_referral_code", { p_user_id: userId });
  if (error) throw error;
  return typeof data === "string" ? data : null;
}

export async function registerReferralByCode(userId: string, code: string): Promise<boolean> {
  if (!isUuid(userId)) return false;
  const { data, error } = await supabase.rpc("register_referral_by_code", {
    p_referred_user_id: userId,
    p_referral_code: code,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function getReferralOverview(userId: string): Promise<ReferralOverview> {
  if (!isUuid(userId)) {
    return { registered: 0, qualified: 0, rewarded: 0, rewardsCount: 0 };
  }

  const [conversionsRes, rewardsRes] = await Promise.all([
    supabase
      .from("referral_conversions")
      .select("status")
      .eq("referrer_user_id", userId),
    supabase
      .from("referral_rewards")
      .select("id")
      .eq("referrer_user_id", userId),
  ]);

  if (conversionsRes.error) throw conversionsRes.error;
  if (rewardsRes.error) throw rewardsRes.error;

  const rows = conversionsRes.data ?? [];
  return {
    registered: rows.filter((row) => row.status === "registered").length,
    qualified: rows.filter((row) => row.status === "qualified").length,
    rewarded: rows.filter((row) => row.status === "rewarded").length,
    rewardsCount: (rewardsRes.data ?? []).length,
  };
}

export async function getLoyaltyRewardsCatalog(): Promise<LoyaltyRewardItem[]> {
  const { data, error } = await supabase
    .from("loyalty_rewards_catalog")
    .select("id,title,description,points_cost,reward_type,active,stock,metadata")
    .eq("active", true)
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LoyaltyRewardItem[];
}

export async function getLoyaltyRedemptions(userId: string, limit = 20): Promise<LoyaltyRedemptionRow[]> {
  if (!isUuid(userId)) return [];
  const { data, error } = await supabase
    .from("loyalty_reward_redemptions")
    .select("id,reward_id,points_spent,status,created_at,metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LoyaltyRedemptionRow[];
}

export async function redeemLoyaltyReward(userId: string, rewardId: string): Promise<boolean> {
  if (!isUuid(userId)) return false;
  const { data, error } = await supabase.rpc("redeem_loyalty_reward", {
    p_user_id: userId,
    p_reward_id: rewardId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function addLoyaltyFriendByCode(
  userId: string,
  friendCode: string,
  friendLabel?: string,
): Promise<boolean> {
  if (!isUuid(userId)) return false;
  const { data, error } = await supabase.rpc("add_loyalty_friend_by_code", {
    p_user_id: userId,
    p_friend_code: friendCode,
    p_friend_label: friendLabel ?? null,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function getLoyaltyFriendsRanking(userId: string): Promise<LoyaltyFriendRankingRow[]> {
  if (!isUuid(userId)) return [];
  const { data, error } = await supabase.rpc("get_loyalty_friends_ranking", {
    p_user_id: userId,
  });
  if (error) throw error;
  return (data ?? []) as LoyaltyFriendRankingRow[];
}
