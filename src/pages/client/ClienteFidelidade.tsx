import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Trophy,
  Sparkles,
  Star,
  Heart,
  Compass,
  Clock,
  Award,
  MessageCircle,
  Users,
  Gift,
  TrendingUp,
  Zap,
  Crown,
  UserPlus,
  Lock,
  Medal,
  Search,
  Flame,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getClienteFidelidadeCopy } from "@/lib/clienteFidelidadeCopy";
import {
  addLoyaltyFriendByCode,
  ensureReferralCode,
  getLoyaltyFriendsRanking,
  getLoyaltyLedger,
  getLoyaltyRedemptions,
  getLoyaltyRewardsCatalog,
  getLoyaltySummary,
  getReferralOverview,
  redeemLoyaltyReward,
  registerReferralByCode,
  type LoyaltyFriendRankingRow,
  type LoyaltyRedemptionRow,
  type LoyaltyRewardItem,
} from "@/lib/loyaltyBackend";
import {
  claimMissionRewardRemote,
  getMissionViewsRemote,
  getRecentRewardEventsRemote,
} from "@/lib/waitEngagementApi";
import type { MissionView, WaitRewardEvent } from "@/lib/waitEngagement";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  heart: Heart,
  compass: Compass,
  clock: Clock,
  award: Award,
  "message-circle": MessageCircle,
  users: Users,
  trophy: Trophy,
  star: Star,
  gift: Gift,
};

const DEFAULT_BADGES = [
  { id: "1", name: "Primeira Visita", description: "Fez seu primeiro agendamento", icon: "sparkles", requirement_type: "appointments", requirement_value: 1 },
  { id: "2", name: "Cliente Fiel", description: "Completou 5 agendamentos", icon: "heart", requirement_type: "appointments", requirement_value: 5 },
  { id: "3", name: "Explorador", description: "Experimentou 3 estilos diferentes", icon: "compass", requirement_type: "styles", requirement_value: 3 },
  { id: "4", name: "Pontual", description: "5 agendamentos sem atraso", icon: "clock", requirement_type: "on_time", requirement_value: 5 },
  { id: "5", name: "Veterano", description: "Completou 20 agendamentos", icon: "award", requirement_type: "appointments", requirement_value: 20 },
  { id: "6", name: "Avaliador", description: "Deixou 3 avaliações", icon: "message-circle", requirement_type: "reviews", requirement_value: 3 },
];

type Badge = { id: string; name: string; description: string | null; icon: string; requirement_value: number };
type PointsRow = { id: string; points: number; description: string | null; source: string; created_at: string };

const LEVELS = [
  { label: "Bronze", threshold: 100, icon: Star },
  { label: "Prata", threshold: 300, icon: TrendingUp },
  { label: "Ouro", threshold: 700, icon: Zap },
  { label: "Diamante", threshold: 1000, icon: Crown },
] as const;

const SOCIAL_META_KEY = "barbeflow_loyalty_social_meta_v1";

/** Placeholder mais cinza; some ao focar (clique), sem esperar digitar. */
const loyaltyPlaceholderInputClass =
  "placeholder:text-muted-foreground/60 dark:placeholder:text-zinc-500 focus:placeholder:text-transparent focus-visible:placeholder:text-transparent transition-[color] duration-150";

type SocialMetaRecord = Record<string, { streak: number; lastConnectAt?: string }>;

const CONNECTION_BADGES = [
  { id: "b1", title: "Iniciante Social", target: 1 },
  { id: "b2", title: "Conector", target: 3 },
  { id: "b3", title: "Mestre das Conexões", target: 5 },
];

const SUGGESTED_PEOPLE = [
  { id: "s1", name: "Rafael Cortez", handle: "@rafa.fade", common: "Curte degradê e estilo clássico" },
  { id: "s2", name: "Bruno Lima", handle: "@brunobarber", common: "Tem interesse em cuidados de barba" },
  { id: "s3", name: "Mateus Rocha", handle: "@mateusflow", common: "Cliente ativo em promoções semanais" },
  { id: "s4", name: "Felipe Costa", handle: "@felipecorte", common: "Avalia barbearias com frequência" },
];

function loadSocialMeta(): SocialMetaRecord {
  try {
    const raw = localStorage.getItem(SOCIAL_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSocialMeta(value: SocialMetaRecord) {
  localStorage.setItem(SOCIAL_META_KEY, JSON.stringify(value));
}

const ClienteFidelidade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = useMemo(() => getClienteFidelidadeCopy(identity), [identity]);
  const headingFont = isVintage ? "font-vintage-heading" : "font-display";

  const [activeTab, setActiveTab] = useState("resumo");
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReferralCode, setMyReferralCode] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendAliasInput, setFriendAliasInput] = useState("");
  const [friendSearchInput, setFriendSearchInput] = useState("");
  const [friendInputFocused, setFriendInputFocused] = useState(false);
  const [friendConnectStatus, setFriendConnectStatus] = useState<"idle" | "success" | "error">("idle");
  const [socialStreak, setSocialStreak] = useState(0);
  const [rewardBusyId, setRewardBusyId] = useState<string | null>(null);
  const [missionBusyId, setMissionBusyId] = useState<string | null>(null);
  const [referralOverview, setReferralOverview] = useState({
    registered: 0,
    qualified: 0,
    rewarded: 0,
    rewardsCount: 0,
  });
  const [rewardsCatalog, setRewardsCatalog] = useState<LoyaltyRewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemptionRow[]>([]);
  const [friendsRanking, setFriendsRanking] = useState<LoyaltyFriendRankingRow[]>([]);
  const [missions, setMissions] = useState<MissionView[]>([]);
  const [missionRewards, setMissionRewards] = useState<WaitRewardEvent[]>([]);

  const fetchFidelityData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [badgesRes, earnedRes, summary, ledger, ownCode, referralStats, rewards, redeems, ranking, remoteMissions, remoteMissionRewards] = await Promise.all([
        supabase.from("loyalty_badges").select("*"),
        supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
        getLoyaltySummary(user.id).catch(() => null),
        getLoyaltyLedger(user.id, 30).catch(() => []),
        ensureReferralCode(user.id).catch(() => null),
        getReferralOverview(user.id).catch(() => ({
          registered: 0,
          qualified: 0,
          rewarded: 0,
          rewardsCount: 0,
        })),
        getLoyaltyRewardsCatalog().catch(() => []),
        getLoyaltyRedemptions(user.id, 20).catch(() => []),
        getLoyaltyFriendsRanking(user.id).catch(() => []),
        getMissionViewsRemote(user.id).catch(() => []),
        getRecentRewardEventsRemote(user.id, 6).catch(() => []),
      ]);

      if (badgesRes.data?.length) setBadges(badgesRes.data as Badge[]);
      setEarnedBadges((earnedRes.data || []).map((e: { badge_id: string }) => e.badge_id));
      const ledgerRows = (ledger || []).map((row) => ({
        id: row.id,
        points: row.direction === "debit" ? -Math.abs(row.points) : Math.abs(row.points),
        description: row.description,
        source: row.source,
        created_at: row.created_at,
      }));
      setPointsHistory(ledgerRows);
      setTotalPoints(summary?.total_points ?? ledgerRows.reduce((a, p) => a + p.points, 0));
      setMyReferralCode(ownCode ?? "");
      setReferralOverview(referralStats);
      setRewardsCatalog(rewards);
      setRedemptions(redeems);
      setFriendsRanking(ranking);
      setMissions(remoteMissions);
      setMissionRewards(remoteMissionRewards);
    } catch {
      setBadges(DEFAULT_BADGES);
      setEarnedBadges([]);
      setPointsHistory([]);
      setTotalPoints(0);
      setRewardsCatalog([]);
      setRedemptions([]);
      setFriendsRanking([]);
      setMissions([]);
      setMissionRewards([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchFidelityData();
  }, [fetchFidelityData]);

  useEffect(() => {
    if (!user?.id) return;
    const all = loadSocialMeta();
    const current = all[user.id];
    setSocialStreak(current?.streak ?? 0);
  }, [user?.id]);

  const levelData = useMemo(() => {
    if (totalPoints < LEVELS[0].threshold) return { ...LEVELS[0], prevThreshold: 0 };
    if (totalPoints < LEVELS[1].threshold) return { ...LEVELS[1], prevThreshold: LEVELS[0].threshold };
    if (totalPoints < LEVELS[2].threshold) return { ...LEVELS[2], prevThreshold: LEVELS[1].threshold };
    return { ...LEVELS[3], prevThreshold: LEVELS[2].threshold };
  }, [totalPoints]);

  const nextLevelTarget = useMemo(() => {
    const next = LEVELS.find((lvl) => totalPoints < lvl.threshold);
    return next?.threshold ?? LEVELS[LEVELS.length - 1].threshold;
  }, [totalPoints]);

  const nextLevelRow = useMemo(() => LEVELS.find((lvl) => totalPoints < lvl.threshold), [totalPoints]);

  /** Nome do nível em que o usuário entra ao atingir o próximo marco de pontos (ex.: Bronze → Prata). */
  const nextTierDisplayName = useMemo(() => {
    const i = LEVELS.findIndex((lvl) => totalPoints < lvl.threshold);
    if (i < 0) return null;
    return LEVELS[i + 1]?.label ?? LEVELS[i].label;
  }, [totalPoints]);

  const progress = useMemo(() => {
    const span = Math.max(nextLevelTarget - levelData.prevThreshold, 1);
    const offset = Math.max(totalPoints - levelData.prevThreshold, 0);
    return Math.min((offset / span) * 100, 100);
  }, [levelData.prevThreshold, nextLevelTarget, totalPoints]);

  const pointsToNext = nextLevelRow ? Math.max(nextLevelRow.threshold - totalPoints, 0) : 0;

  const nextReward = useMemo(
    () => rewardsCatalog.find((r) => r.points_cost > totalPoints),
    [rewardsCatalog, totalPoints],
  );

  const rankingWithMe = useMemo(() => {
    const me = { friend_user_id: user?.id || "me", friend_label: copy.you, total_points: totalPoints };
    return [me, ...friendsRanking]
      .sort((a, b) => b.total_points - a.total_points)
      .map((row, idx) => ({ ...row, position: idx + 1 }));
  }, [friendsRanking, totalPoints, user?.id, copy.you]);

  const socialConnectionsCount = friendsRanking.length;
  const connectionProgress = Math.min((socialConnectionsCount / 5) * 100, 100);
  const connectionTierLabel =
    socialConnectionsCount >= 5 ? CONNECTION_BADGES[2].title : socialConnectionsCount >= 3 ? CONNECTION_BADGES[1].title : CONNECTION_BADGES[0].title;

  const suggestedPeople = useMemo(() => {
    const connected = new Set(friendsRanking.map((f) => f.friend_label.toLowerCase()));
    const q = friendSearchInput.trim().toLowerCase();
    return SUGGESTED_PEOPLE
      .filter((person) => !connected.has(person.name.toLowerCase()))
      .filter((person) =>
        !q ? true : `${person.name} ${person.handle} ${person.common}`.toLowerCase().includes(q),
      );
  }, [friendSearchInput, friendsRanking]);

  const badgeStats = useMemo(() => {
    if (!Array.isArray(badges) || !Array.isArray(earnedBadges)) {
      return { unlocked: [], locked: [], sortedLocked: [], close: [], near: [], rare: [] };
    }
    const unlocked = badges.filter((b) => earnedBadges.includes(b.id));
    const locked = badges.filter((b) => !earnedBadges.includes(b.id));
    const sortedLocked = [...locked].sort((a, b) => a.requirement_value - b.requirement_value);
    const close = locked.filter((b) => b.requirement_value <= 5);
    const rare = unlocked.filter((b) => b.requirement_value >= 10);
    return { unlocked, locked, sortedLocked, close, near: sortedLocked.slice(0, 3), rare };
  }, [badges, earnedBadges]);

  const handleRedeem = async (reward: LoyaltyRewardItem) => {
    if (!user?.id) return;
    setRewardBusyId(reward.id);
    try {
      const ok = await redeemLoyaltyReward(user.id, reward.id);
      if (!ok) {
        toast({
          title: "Resgate indisponível",
          description: "Saldo insuficiente ou recompensa sem estoque.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Resgate confirmado", description: `${reward.title} resgatado com sucesso.` });
      await fetchFidelityData();
    } catch {
      toast({ title: "Erro no resgate", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setRewardBusyId(null);
    }
  };

  const handleAddFriend = async () => {
    if (!user?.id || !friendCodeInput.trim()) return;
    try {
      const ok = await addLoyaltyFriendByCode(user.id, friendCodeInput.trim(), friendAliasInput.trim() || undefined);
      if (!ok) {
        setFriendConnectStatus("error");
        toast({ title: "Não foi possível adicionar", description: "Código inválido ou já conectado.", variant: "destructive" });
        return;
      }
      const today = new Date();
      const todayKey = today.toISOString().slice(0, 10);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      const allMeta = loadSocialMeta();
      const current = allMeta[user.id] ?? { streak: 0, lastConnectAt: undefined };
      const nextStreak =
        current.lastConnectAt === todayKey
          ? current.streak
          : current.lastConnectAt === yesterdayKey
            ? current.streak + 1
            : 1;
      allMeta[user.id] = { streak: nextStreak, lastConnectAt: todayKey };
      saveSocialMeta(allMeta);
      setSocialStreak(nextStreak);
      setFriendConnectStatus("success");
      setFriendCodeInput("");
      setFriendAliasInput("");
      toast({ title: "Amigo adicionado", description: "Seu ranking social foi atualizado." });
      await fetchFidelityData();
    } catch {
      setFriendConnectStatus("error");
      toast({ title: "Erro ao adicionar amigo", description: "Tente novamente.", variant: "destructive" });
    }
  };

  const handleClaimMission = async (missionId: string) => {
    if (!user?.id) return;
    setMissionBusyId(missionId);
    try {
      const claim = await claimMissionRewardRemote(user.id, missionId, 1, { source: "loyalty_screen" });
      if (!claim.ok) {
        toast({ title: "Missão indisponível", description: "Complete os requisitos para resgatar." });
      } else {
        toast({ title: "Recompensa liberada", description: `+${claim.grantedPoints} pontos adicionados.` });
      }
      await fetchFidelityData();
    } catch {
      toast({ title: "Erro ao resgatar missão", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setMissionBusyId(null);
    }
  };

  const surfaceCard = (extra?: string) =>
    cn(
      "rounded-xl border p-4 sm:p-5",
      isVintage ? "glass-card border-border/55" : "bg-card/85 border-border/35 shadow-sm",
      extra,
    );

  const renderRewardsGrid = (compact?: boolean) => {
    if (!rewardsCatalog.length) {
      return <p className="text-sm text-muted-foreground py-4">{isVintage ? copy.shopEmpty : copy.rewardsEmpty}</p>;
    }
    return (
      <div className={cn("grid gap-3", compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {rewardsCatalog.map((reward) => {
          const canRedeem = totalPoints >= reward.points_cost;
          const missing = Math.max(reward.points_cost - totalPoints, 0);
          return (
            <div
              key={reward.id}
              className={cn(
                "rounded-lg border p-3 flex flex-col",
                isVintage ? "border-border/45 bg-background/30" : "border-border/35 bg-background/40",
              )}
            >
              <p className="font-semibold text-sm">{reward.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {reward.description || (isVintage ? copy.blockShopLead : copy.blockRewardsLead)}
              </p>
              <p className={cn(headingFont, "text-lg font-bold text-primary mt-2")}>{copy.ptsCost(reward.points_cost)}</p>
              {!canRedeem && (
                <p className="text-[11px] text-muted-foreground mt-1">{copy.nearUnlock(reward.title, missing)}</p>
              )}
              <Button
                className="mt-3 w-full"
                size="sm"
                variant={canRedeem ? "gold" : "outline"}
                disabled={!canRedeem || rewardBusyId === reward.id}
                onClick={() => handleRedeem(reward)}
              >
                {rewardBusyId === reward.id ? copy.redeeming : copy.redeemNow}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReferralBlock = () => (
    <div id="loyalty-referral" className={surfaceCard(isVintage ? "border-primary/20" : "border-border/40")}>
      <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockReferTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.blockReferLead}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/40 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{copy.yourCode}</p>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <Input value={myReferralCode || "…"} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              className="shrink-0 rounded-full px-5"
              disabled={!myReferralCode}
              onClick={() => {
                navigator.clipboard.writeText(myReferralCode || "").catch(() => undefined);
                toast({ title: "Código copiado" });
              }}
            >
              {copy.copyCode}
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{copy.useFriendCode}</p>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <Input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder={copy.codePlaceholder}
              className={cn("font-mono text-sm rounded-xl", loyaltyPlaceholderInputClass)}
            />
            <Button
              className="shrink-0 rounded-full px-5"
              onClick={async () => {
                if (!user?.id || !referralInput.trim()) return;
                try {
                  const ok = await registerReferralByCode(user.id, referralInput.trim());
                  if (!ok) {
                    toast({ title: "Código inválido", description: "Não foi possível registrar.", variant: "destructive" });
                    return;
                  }
                  setReferralInput("");
                  toast({ title: "Indicação registrada", description: "Recompensas após o primeiro serviço." });
                  await fetchFidelityData();
                } catch {
                  toast({ title: "Erro ao registrar", description: "Tente novamente.", variant: "destructive" });
                }
              }}
            >
              {copy.applyCode}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {[
          [copy.metricRegistered, referralOverview.registered],
          [copy.metricQualified, referralOverview.qualified],
          [copy.metricRewarded, referralOverview.rewarded],
          [copy.metricRewardsPaid, referralOverview.rewardsCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-border/35 bg-background/35 px-2.5 py-2">
            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            <p className={cn(headingFont, "text-lg font-bold tabular-nums")}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialFull = () => (
    <div className={surfaceCard()}>
      <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockSocialTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.blockSocialLead}</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{copy.rankingTitle}</p>
          {rankingWithMe.slice(0, 8).map((row) => (
            <div
              key={`${row.friend_user_id}-${row.position}`}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-2.5 py-2"
            >
              <div className="inline-flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[10px] inline-flex items-center justify-center font-semibold shrink-0">
                  {row.position}
                </span>
                <span className={cn("text-sm truncate", row.friend_label === copy.you ? "font-semibold text-primary" : "")}>
                  {row.friend_label}
                </span>
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0">{row.total_points} pts</span>
            </div>
          ))}
        </div>
        <div className="friend-social-hero rounded-xl border border-border/45 p-4">
          <div className="friend-social-avatars" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">{copy.socialProgressLabel}</p>
            <div className="mt-2 rounded-lg border border-border/40 bg-background/50 p-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{copy.socialProgressLabel}</span>
                <span className="font-semibold text-primary">{connectionTierLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${connectionProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="friend-connection-progress h-full"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {copy.socialConnections(socialConnectionsCount, 5)} · {copy.socialStreak(socialStreak)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {CONNECTION_BADGES.map((badge) => {
                const unlocked = socialConnectionsCount >= badge.target;
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "rounded-md border px-1.5 py-1.5 text-center text-[10px]",
                      unlocked ? "border-primary/45 bg-primary/10 text-primary" : "border-border/45 bg-background/60 text-muted-foreground",
                    )}
                  >
                    <div className="inline-flex items-center justify-center gap-0.5">
                      {unlocked ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      <span>{badge.target}</span>
                    </div>
                    <p className="mt-0.5 truncate">{badge.title}</p>
                  </div>
                );
              })}
            </div>
            <label className="text-xs text-muted-foreground block mt-3">{copy.friendCodeLabel}</label>
            <Input
              className={cn(
                "mt-1 font-mono text-sm rounded-xl",
                loyaltyPlaceholderInputClass,
                friendConnectStatus === "success" && "friend-connect-input-success",
                friendConnectStatus === "error" && "friend-connect-input-error",
                friendInputFocused && "friend-connect-input-focused",
              )}
              value={friendCodeInput}
              onFocus={() => setFriendInputFocused(true)}
              onBlur={() => setFriendInputFocused(false)}
              onChange={(e) => {
                setFriendCodeInput(e.target.value.toUpperCase());
                if (friendConnectStatus !== "idle") setFriendConnectStatus("idle");
              }}
              placeholder={copy.friendCodePlaceholder}
            />
            <Input
              className={cn("mt-2 text-sm rounded-xl", loyaltyPlaceholderInputClass)}
              value={friendAliasInput}
              onChange={(e) => setFriendAliasInput(e.target.value)}
              placeholder={copy.aliasOptional}
            />
            <Button className="w-full mt-2 rounded-full" variant="gold" size="sm" onClick={handleAddFriend}>
              <UserPlus className="h-4 w-4 mr-2" />
              {copy.connectFriend}
            </Button>
            {friendConnectStatus === "success" && (
              <p className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {copy.connectSuccess}
              </p>
            )}
            {friendConnectStatus === "error" && (
              <p className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 shrink-0" />
                {copy.connectError}
              </p>
            )}
            <div className="mt-4 rounded-lg border border-border/40 bg-background/45 p-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium">{copy.suggestedPeople}</p>
              </div>
              <Input
                className={cn("mt-2 text-sm rounded-xl", loyaltyPlaceholderInputClass)}
                value={friendSearchInput}
                onChange={(e) => setFriendSearchInput(e.target.value)}
                placeholder={copy.searchPeoplePlaceholder}
              />
              {suggestedPeople.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-3">{copy.suggestedEmpty}</p>
              ) : (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedPeople.slice(0, 4).map((person) => (
                    <div key={person.id} className="friend-suggestion-card flex items-center gap-2 p-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-[10px] font-semibold inline-flex items-center justify-center shrink-0">
                        {person.name
                          .split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{person.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{person.common}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompactRanking = () => (
    <div className={surfaceCard()}>
      <h3 className={cn(headingFont, "text-base font-semibold")}>{copy.compactRankingTitle}</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">{copy.compactRankingLead}</p>
      <div className="space-y-1.5">
        {rankingWithMe.slice(0, 5).map((row) => (
          <div key={row.friend_user_id} className="flex items-center justify-between text-sm py-1 border-b border-border/20 last:border-0">
            <span className={cn(row.friend_label === copy.you && "font-semibold text-primary")}>
              {row.position}. {row.friend_label}
            </span>
            <span className="text-xs font-medium tabular-nums">{row.total_points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgressBlock = () => (
    <div className={surfaceCard(isVintage ? "border-primary/18" : undefined)}>
      <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockProgressTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1">{copy.blockProgressLead}</p>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{copy.levelLine(levelData.label)}</p>
            <p className={cn(headingFont, "text-2xl font-bold text-foreground tabular-nums")}>{totalPoints}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{copy.pointsBalance}</p>
          </div>
          {nextLevelRow && nextTierDisplayName ? (
            <p className="text-xs text-right text-muted-foreground max-w-[200px]">
              {copy.pointsToNextLevel(pointsToNext, nextTierDisplayName)}
            </p>
          ) : (
            <p className="text-xs text-primary font-medium">{copy.nextUnlockTop}</p>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-muted/80 overflow-hidden">
          <motion.div
            className={cn("h-full loyalty-progress-bar")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {totalPoints}/{nextLevelTarget} · {copy.progressHint}
        </p>
        <p className="text-sm text-foreground/90">{copy.currentLevelBenefit(levelData.label)}</p>
        {nextReward ? (
          <p className="text-sm text-primary/90">
            {copy.nextUnlockHint(nextReward.title, Math.max(nextReward.points_cost - totalPoints, 0))}
          </p>
        ) : null}
        {!nextLevelRow ? <p className="text-sm text-muted-foreground">{copy.nextUnlockTop}</p> : null}
        <Button variant={isVintage ? "gold-outline" : "outline"} size="sm" className="gap-1" onClick={() => setActiveTab("ganhar")}>
          {copy.ctaSeeHowToEarn}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderNextActions = () => (
    <div className={surfaceCard()}>
      <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockActionsTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.blockActionsLead}</p>
      <div className="space-y-2">
        {[
          { label: copy.staticActionBook, pts: copy.staticActionBookPts, onClick: () => navigate("/cliente/novo-agendamento") },
          { label: copy.staticActionReview, pts: copy.staticActionReviewPts, onClick: () => navigate("/cliente/historico") },
          {
            label: copy.staticActionRefer,
            pts: copy.staticActionReferPts,
            onClick: () => document.getElementById("loyalty-referral")?.scrollIntoView({ behavior: "smooth" }),
          },
          { label: copy.staticActionWeekly, pts: copy.staticActionWeeklyPts, onClick: () => setActiveTab("conquistas") },
        ].map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/35 bg-background/35 px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-foreground">{row.label}</span>
              <span className="text-xs font-semibold text-primary tabular-nums shrink-0">{row.pts}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground">{copy.actionAvailable}</span>
              <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={row.onClick}>
                {copy.actionDoNow}
              </Button>
            </div>
          </div>
        ))}
        {missions.slice(0, 3).map((m) => (
          <div
            key={m.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{m.title}</p>
              <p className="text-[11px] text-muted-foreground">{copy.missionProgress(m.progressCount, m.targetCount)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-primary">+{m.rewardPoints} pts</span>
              <span className="text-[11px] text-muted-foreground">{m.canClaimNow ? copy.actionAvailable : copy.actionInProgress}</span>
              <Button
                size="sm"
                variant={m.canClaimNow ? "gold" : "outline"}
                className="h-8 text-xs"
                disabled={!m.canClaimNow || missionBusyId === m.id}
                onClick={() => handleClaimMission(m.id)}
              >
                {missionBusyId === m.id ? copy.missionProcessing : copy.actionDoNow}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVantagensVintage = () => (
    <div className={surfaceCard("border-primary/15")}>
      <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockRewardsTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-3">{copy.blockRewardsLead}</p>
      <ul className="text-sm text-foreground/90 space-y-2 list-disc pl-4">
        <li>{copy.currentLevelBenefit(levelData.label)}</li>
        {nextReward ? (
          <li>{copy.nextUnlockHint(nextReward.title, Math.max(nextReward.points_cost - totalPoints, 0))}</li>
        ) : (
          <li>{copy.nextUnlockTop}</li>
        )}
        <li>{copy.blockShopLead}</li>
      </ul>
    </div>
  );

  const renderLedgerSnippet = () => (
    <div className={surfaceCard()}>
      <h3 className={cn(headingFont, "text-base font-semibold")}>{copy.blockLedgerTitle}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-3">{copy.blockLedgerLead}</p>
      {pointsHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.ledgerEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {pointsHistory.slice(0, 5).map((pt) => (
            <li key={pt.id} className="flex items-center justify-between text-sm border-b border-border/25 pb-2 last:border-0 last:pb-0">
              <span className="text-muted-foreground truncate pr-2">{pt.description || pt.source}</span>
              <span className={cn("font-semibold tabular-nums shrink-0", pt.points >= 0 ? "text-primary" : "text-destructive")}>
                {copy.ptsSigned(pt.points)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout userType="cliente">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
          />
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="cliente">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-6">
        <header
          className={cn(
            "rounded-xl border p-5 sm:p-6",
            isVintage
              ? "glass-card border-primary/25 bg-gradient-to-br from-primary/12 via-card to-transparent"
              : "border-border/35 bg-card/90",
          )}
        >
          <div className="flex items-start gap-3">
            {!isVintage && <LayoutDashboard className="h-6 w-6 text-primary shrink-0 mt-0.5" />}
            {isVintage && <Trophy className="h-6 w-6 text-primary shrink-0 mt-0.5" />}
            <div>
              <h1 className={cn(headingFont, "text-2xl sm:text-3xl font-bold tracking-tight")}>{copy.flowTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[56ch] leading-relaxed">{copy.flowSubtitle}</p>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn(
              "w-full justify-start overflow-x-auto h-auto flex-wrap sm:flex-nowrap gap-1 p-1",
              isVintage && "bg-card/50",
            )}
          >
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">
              {copy.tabSummary}
            </TabsTrigger>
            <TabsTrigger value="conquistas" className="text-xs sm:text-sm">
              {copy.tabAchievements}
            </TabsTrigger>
            <TabsTrigger value="ganhar" className="text-xs sm:text-sm">
              {copy.tabEarn}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-6 mt-6">
            {isVintage ? (
              <>
                {renderProgressBlock()}
                {renderReferralBlock()}
                {renderVantagensVintage()}
                {renderSocialFull()}
                <div className={surfaceCard()}>
                  <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockShopTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.blockShopLead}</p>
                  {renderRewardsGrid()}
                  {redemptions.length > 0 && (
                    <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-3">
                      <p className="text-sm font-medium">{copy.lastRedemptions}</p>
                      <div className="mt-2 space-y-1">
                        {redemptions.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                            <span className="font-semibold text-primary">-{item.points_spent} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {renderLedgerSnippet()}
              </>
            ) : (
              <>
                {renderProgressBlock()}
                {renderNextActions()}
                <div className={surfaceCard()}>
                  <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.blockRewardsTitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.blockRewardsLead}</p>
                  {renderRewardsGrid(true)}
                </div>
                {renderReferralBlock()}
                {renderLedgerSnippet()}
                {renderCompactRanking()}
              </>
            )}
          </TabsContent>

          <TabsContent value="conquistas" className="space-y-6 mt-6">
            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.achHeroTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.achHeroLead}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  [copy.achStatUnlocked, badgeStats.unlocked.length],
                  [copy.achStatOpen, badgeStats.locked.length],
                  [copy.achStatClose, badgeStats.close.length],
                  [copy.achStatRare, badgeStats.rare.length],
                ].map(([label, n]) => (
                  <div key={String(label)} className="rounded-lg border border-border/35 bg-background/40 px-2 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className={cn(headingFont, "text-xl font-bold")}>{n}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={surfaceCard("border-primary/15")}>
              <h3 className={cn(headingFont, "text-base font-semibold")}>{copy.achNearTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.achNearLead}</p>
              {badgeStats.near.length === 0 ? (
                <p className="text-sm text-muted-foreground">{copy.achNearEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {badgeStats.near.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/40 bg-background/35 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.description}</p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs" onClick={() => navigate("/cliente/novo-agendamento")}>
                        {copy.achContinue}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-base font-semibold")}>{copy.achUnlockedTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.achUnlockedLead}</p>
              {badgeStats.unlocked.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
                  <p className="font-medium text-foreground">{copy.achUnlockedEmpty}</p>
                  <p className="text-sm text-muted-foreground mt-2">{copy.achUnlockedEmptyLead}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {badgeStats.unlocked.map((b) => {
                    const Icon = ICON_MAP[b.icon] || Trophy;
                    return (
                      <div
                        key={b.id}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {b.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-base font-semibold")}>{copy.achLockedTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.achLockedLead}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {badgeStats.locked.map((badge) => {
                  const Icon = ICON_MAP[badge.icon] || Trophy;
                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "rounded-xl border p-3 flex gap-3",
                        isVintage ? "border-border/45 bg-background/30" : "border-border/35 bg-background/40",
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{badge.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-2 inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {copy.badgeMeta(badge.requirement_value)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={cn(
                "rounded-xl border-2 border-dashed p-4 sm:p-5",
                isVintage ? "border-primary/25 bg-primary/5" : "border-border/50 bg-muted/20",
              )}
            >
              <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.missionsTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{copy.missionsLead}</p>
              {missions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{copy.missionsEmpty}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={cn(
                        "rounded-lg border p-3",
                        isVintage ? "border-border/50 bg-card/80" : "border-border/40 bg-card/90",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{mission.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{mission.description}</p>
                        </div>
                        <span className="text-[10px] rounded-full px-2 py-0.5 bg-primary/15 text-primary border border-primary/25 shrink-0">
                          +{mission.rewardPoints} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{copy.missionProgress(mission.progressCount, mission.targetCount)}</p>
                      <Button
                        className="mt-2 w-full h-8 text-xs"
                        variant={mission.canClaimNow ? "gold" : "outline"}
                        disabled={!mission.canClaimNow || missionBusyId === mission.id}
                        onClick={() => handleClaimMission(mission.id)}
                      >
                        {missionBusyId === mission.id ? copy.missionProcessing : mission.canClaimNow ? copy.missionClaim : copy.missionPending}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="link" className="mt-3 h-auto p-0 text-primary text-sm" onClick={() => setActiveTab("ganhar")}>
                {copy.viewAllMissions}
              </Button>
              {missionRewards.length > 0 && (
                <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-3">
                  <p className="text-sm font-medium inline-flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    {copy.missionRewardsRecent}
                  </p>
                  <div className="space-y-1 mt-2">
                    {missionRewards.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{event.missionType}</span>
                        <span className="font-semibold text-primary">+{event.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ganhar" className="space-y-6 mt-6">
            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.earnHowTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">{copy.earnHowLead}</p>
            </div>

            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-base font-semibold mb-4")}>{copy.earnCategoriesTitle}</h3>
              <div className="space-y-5">
                {[
                  {
                    title: isVintage ? copy.vintageCatAttendance : copy.catAppointments,
                    items: [
                      ["Cada agendamento concluído", "+10 pts"],
                      [isVintage ? "Combinações especiais de serviços" : "Combo de serviços", "+15 pts"],
                    ],
                  },
                  {
                    title: copy.catParticipation,
                    items: [
                      ["Deixar avaliação", "+5 pts"],
                      [isVintage ? "Compartilhar registro com foto" : "Enviar foto do resultado", "+10 pts"],
                      ["Responder pesquisa rápida", "+20 pts"],
                    ],
                  },
                  {
                    title: copy.catRelationship,
                    items: [
                      ["Indicar um amigo", "+20 pts"],
                      [isVintage ? "Amigo ativa o clube (primeiro atendimento)" : "Amigo conclui primeiro atendimento", "Bônus extra"],
                    ],
                  },
                  {
                    title: isVintage ? copy.vintageCatChallenges : copy.catMissions,
                    items: [
                      [isVintage ? "Desafios diários" : "Missão diária", "+10 a +20 pts"],
                      [isVintage ? "Desafios semanais" : "Missão semanal", "+40 a +80 pts"],
                    ],
                  },
                  {
                    title: isVintage ? copy.vintageCatPresence : copy.catSocial,
                    items: [
                      ["Subir no ranking entre amigos", isVintage ? "Bônus variável" : "Bônus variável"],
                      [isVintage ? "Manter conexões sociais" : "Completar conexões", isVintage ? "Desbloqueios sociais" : "Desbloqueios"],
                    ],
                  },
                ].map((cat) => (
                  <div key={cat.title}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">{cat.title}</p>
                    <ul className="space-y-2">
                      {cat.items.map(([a, pts]) => (
                        <li key={a} className="flex items-center justify-between gap-3 text-sm rounded-lg border border-border/30 bg-background/30 px-3 py-2">
                          <span>{a}</span>
                          <span className="text-xs font-semibold text-primary tabular-nums shrink-0">{pts}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-base font-semibold")}>{isVintage ? copy.vintageTipsTitle : copy.earnTipsTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{isVintage ? copy.vintageTipsLead : copy.earnTipsLead}</p>
              <ul className="list-disc pl-4 space-y-1.5 text-sm text-muted-foreground">
                {(isVintage ? [copy.vintageTip1, copy.vintageTip2, copy.vintageTip3, copy.vintageTip4] : [copy.earnTip1, copy.earnTip2, copy.earnTip3, copy.earnTip4]).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div className={surfaceCard()}>
              <h3 className={cn(headingFont, "text-lg font-semibold")}>{copy.historyFullTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{copy.historyFullLead}</p>
              <div className="max-h-[340px] overflow-auto rounded-lg border border-border/35">
                {pointsHistory.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">{copy.historyEmpty}</p>
                ) : (
                  pointsHistory.map((pt, i) => (
                    <div
                      key={pt.id}
                      className={cn(
                        "flex items-center justify-between p-3 text-sm",
                        i > 0 && "border-t border-border/25",
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium truncate">{pt.description || pt.source}</p>
                        <p className="text-xs text-muted-foreground">{new Date(pt.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span className={cn("font-semibold tabular-nums shrink-0", pt.points >= 0 ? "text-primary" : "text-destructive")}>
                        {pt.points >= 0 ? "+" : ""}
                        {pt.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClienteFidelidade;
