import { supabase } from "@/lib/supabaseClient";

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function qualifyReferralForFirstService(userId: string): Promise<boolean> {
  if (!isUuid(userId)) return false;
  const { data, error } = await supabase.rpc("qualify_referral_conversion", {
    p_referred_user_id: userId,
    p_referrer_points: 20,
    p_referred_points: 10,
  });
  if (error) return false;
  return Boolean(data);
}
