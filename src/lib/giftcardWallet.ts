const STORAGE_PREFIX = "barbeflow_gift_wallet_v1:";

function keyFor(userId?: string): string | null {
  if (!userId) return null;
  return `${STORAGE_PREFIX}${userId}`;
}

export function getGiftWalletBalance(userId?: string): number {
  const key = keyFor(userId);
  if (!key) return 0;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function addGiftWalletBalance(userId: string | undefined, amount: number): number {
  const key = keyFor(userId);
  if (!key) return 0;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const next = Math.max(getGiftWalletBalance(userId) + safeAmount, 0);
  try {
    localStorage.setItem(key, String(next));
  } catch {
    // ignore
  }
  return next;
}

