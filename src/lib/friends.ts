export type FriendStatus = "pending_outgoing" | "pending_incoming" | "accepted";

export type FriendProfile = {
  userId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  avatarColor?: string;
  lastBarbershop?: string;
};

type FriendsStore = Record<string, FriendProfile[]>;
type RequestsStore = Record<
  string,
  Array<{
    requestId: string;
    fromUserId: string;
    fromProfile: FriendProfile;
    createdAt: string;
  }>
>;

const FRIENDS_KEY = "barberflow_friends_map";
const REQUESTS_KEY = "barberflow_friend_requests_map";

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadFriendsStore(): FriendsStore {
  return safeParseJson<FriendsStore>(localStorage.getItem(FRIENDS_KEY), {});
}

function saveFriendsStore(store: FriendsStore) {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(store));
}

function loadRequestsStore(): RequestsStore {
  return safeParseJson<RequestsStore>(localStorage.getItem(REQUESTS_KEY), {});
}

function saveRequestsStore(store: RequestsStore) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(store));
}

function normalizeProfile(profile: FriendProfile): FriendProfile {
  return {
    userId: String(profile.userId),
    name: String(profile.name || "Usuário").slice(0, 120),
    username: profile.username ? String(profile.username).slice(0, 64) : undefined,
    avatarUrl: profile.avatarUrl ? String(profile.avatarUrl).slice(0, 500) : undefined,
    avatarColor: profile.avatarColor ? String(profile.avatarColor).slice(0, 40) : undefined,
    lastBarbershop: profile.lastBarbershop ? String(profile.lastBarbershop).slice(0, 120) : undefined,
  };
}

export function getFriends(userId: string): FriendProfile[] {
  const store = loadFriendsStore();
  return store[userId] ?? [];
}

export function upsertFriend(userId: string, friend: FriendProfile): FriendProfile[] {
  const store = loadFriendsStore();
  const current = store[userId] ?? [];
  const normalized = normalizeProfile(friend);
  const next = current.some((f) => f.userId === normalized.userId)
    ? current.map((f) => (f.userId === normalized.userId ? { ...f, ...normalized } : f))
    : [normalized, ...current];
  store[userId] = next;
  saveFriendsStore(store);
  return next;
}

export function getIncomingRequests(userId: string) {
  const store = loadRequestsStore();
  return store[userId] ?? [];
}

export function sendFriendRequest(params: {
  fromUserId: string;
  toUserId: string;
  fromProfile: FriendProfile;
}): { ok: boolean; requestId?: string; reason?: string } {
  const fromUserId = String(params.fromUserId);
  const toUserId = String(params.toUserId);
  if (!fromUserId || !toUserId) return { ok: false, reason: "missing_user" };
  if (fromUserId === toUserId) return { ok: false, reason: "self_request" };

  const store = loadRequestsStore();
  const list = store[toUserId] ?? [];
  const already = list.some((r) => r.fromUserId === fromUserId);
  if (already) return { ok: false, reason: "already_pending" };

  const requestId = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const next = [
    {
      requestId,
      fromUserId,
      fromProfile: normalizeProfile(params.fromProfile),
      createdAt: new Date().toISOString(),
    },
    ...list,
  ];
  store[toUserId] = next;
  saveRequestsStore(store);
  return { ok: true, requestId };
}

export function acceptFriendRequest(params: {
  toUserId: string;
  requestId: string;
}): { ok: boolean; fromUserId?: string } {
  const toUserId = String(params.toUserId);
  const requestId = String(params.requestId);
  const requests = loadRequestsStore();
  const incoming = requests[toUserId] ?? [];
  const req = incoming.find((r) => r.requestId === requestId);
  if (!req) return { ok: false };

  // Remove request
  requests[toUserId] = incoming.filter((r) => r.requestId !== requestId);
  saveRequestsStore(requests);

  // Add friendship for both sides (store minimal profile)
  upsertFriend(toUserId, req.fromProfile);
  upsertFriend(req.fromUserId, { userId: toUserId, name: "Novo amigo" });

  return { ok: true, fromUserId: req.fromUserId };
}

