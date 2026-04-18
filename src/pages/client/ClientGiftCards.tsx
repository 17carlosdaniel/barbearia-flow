import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Gift,
  QrCode,
  Copy,
  Send,
  Check,
  Scissors,
  Sparkles,
  Users,
  ShieldCheck,
  Plus,
  MapPin,
  HelpCircle,
  LayoutGrid,
  List,
  Palette,
  Volume2,
  VolumeX,
  EyeOff,
  Search,
  Radar,
  Store,
  MessageSquare,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { getClientGiftCardsCopy } from "@/lib/clientGiftCardsCopy";
import { getGiftCardSettingsModalCopy } from "@/lib/clientGiftCardsSettingsCopy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { emitGiftcardNotification } from "@/lib/domainNotifications";
import { getFriends, sendFriendRequest } from "@/lib/friends";
import { pushNotification } from "@/lib/notifications";
import { addGiftcard, normalizeGiftcardCode, redeemGiftcard, getGiftcardByCode } from "@/lib/giftcards";
import { addGiftWalletBalance, getGiftWalletBalance } from "@/lib/giftcardWallet";

interface GiftOption {
  id: number;
  name: string;
  price: number;
  icon: LucideIcon;
  customizable?: boolean;
}

interface Friend {
  id: number;
  name: string;
  username: string;
  userId?: string;
  avatarColor: string;
  online?: boolean;
  avatarUrl?: string;
  lastBarbershop?: string;
  frequent?: boolean;
}

const getGiftOptions = (isVintage: boolean): GiftOption[] => [
  { id: 1, name: isVintage ? "Corte da Casa" : "Corte", price: 45, icon: Scissors },
  { id: 2, name: isVintage ? "Barba e Acabamento" : "Corte + barba", price: 75, icon: Sparkles },
  { id: 3, name: isVintage ? "Experiência Completa" : "Pacote premium", price: 120, icon: Gift },
  { id: 4, name: isVintage ? "Valor em crédito" : "Crédito livre", price: 50, icon: Gift, customizable: true },
];

const getGiftDetails = (id: number, isVintage: boolean): { title: string; bullets: string[] } => {
  const dict: Record<number, { title: string; bullets: string[] }> = {
    1: { title: isVintage ? "Corte da Casa" : "Corte", bullets: ["Lavagem + corte", "Finalização", "Duração média 30–40 min"] },
    2: { title: isVintage ? "Barba e Acabamento" : "Corte + barba", bullets: ["Corte + barba", "Toalha quente", "Duração média 50–60 min"] },
    3: { title: isVintage ? "Experiência Completa" : "Pacote premium", bullets: ["Pacote completo", "Acabamento detalhado", "Tratamento exclusivo"] },
    4: { title: isVintage ? "Valor em crédito" : "Crédito livre", bullets: ["Você escolhe o valor do presente", "Use em serviços ou combos"] },
  };
  return dict[id];
};

const friendsMock: Friend[] = [
  {
    id: 1,
    userId: "c2",
    name: "João Silva",
    username: "@joaocorte",
    avatarColor: "bg-emerald-500",
    online: true,
    frequent: true,
    lastBarbershop: "Barbearia Premium",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  },
  { id: 2, name: "Marcos Lima", username: "@marcosfade", avatarColor: "bg-sky-500", lastBarbershop: "Classic Barber" },
  {
    id: 3,
    userId: "c3",
    name: "Pedro Alves",
    username: "@pedrobarba",
    avatarColor: "bg-amber-500",
    online: true,
    frequent: true,
    lastBarbershop: "King's Cut",
    avatarUrl:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=120&q=80",
  },
  { id: 4, userId: "c4", name: "Lucas Rocha", username: "@lucasstyle", avatarColor: "bg-purple-500", lastBarbershop: "Barber & Style" },
];

const MESSAGE_LIMIT = 180;
const CUSTOM_FRIENDS_STORAGE_KEY = "clientGiftCustomFriends";
const GIFT_SETTINGS_KEY = "clientGiftSettings";

type AccentPresetKey = "azul" | "roxo" | "verde" | "dourado";
type ViewMode = "lista" | "cards";

type GiftSettings = {
  accent: AccentPresetKey;
  viewMode: ViewMode;
  sound: boolean;
  hideSelf: boolean;
  quickMessageSuggestions: boolean;
  prefillRecipientFromContact: boolean;
};

const ACCENT_PRESETS: Record<
  AccentPresetKey,
  { label: string; hslPrimary: string; hslAccent?: string; dotClass: string }
> = {
  azul: { label: "Azul", hslPrimary: "217 85% 62%", hslAccent: "217 85% 62%", dotClass: "bg-sky-400" },
  roxo: { label: "Roxo", hslPrimary: "268 85% 68%", hslAccent: "268 85% 68%", dotClass: "bg-violet-400" },
  verde: { label: "Verde", hslPrimary: "152 75% 50%", hslAccent: "152 75% 50%", dotClass: "bg-emerald-400" },
  dourado: { label: "Dourado", hslPrimary: "35 50% 42%", hslAccent: "25 40% 28%", dotClass: "bg-amber-500" },
};

function migrateLegacyAccent(raw: string | undefined): AccentPresetKey {
  if (raw === "vintage" || raw === "dourado") return "dourado";
  if (raw === "modern") return "azul";
  if (raw && raw in ACCENT_PRESETS) return raw as AccentPresetKey;
  return "azul";
}

function loadGiftSettings(): GiftSettings {
  try {
    const raw = localStorage.getItem(GIFT_SETTINGS_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<GiftSettings> & { accent?: string };
    const accent = migrateLegacyAccent(parsed.accent);
    const viewMode: ViewMode = parsed.viewMode === "cards" ? "cards" : "lista";
    const sound = parsed.sound !== false;
    const hideSelf = Boolean(parsed.hideSelf);
    const quickMessageSuggestions = parsed.quickMessageSuggestions !== false;
    const prefillRecipientFromContact = parsed.prefillRecipientFromContact !== false;
    return { accent, viewMode, sound, hideSelf, quickMessageSuggestions, prefillRecipientFromContact };
  } catch {
    return {
      accent: "azul",
      viewMode: "lista",
      sound: true,
      hideSelf: false,
      quickMessageSuggestions: true,
      prefillRecipientFromContact: true,
    };
  }
}

function saveGiftSettings(next: GiftSettings) {
  try {
    localStorage.setItem(GIFT_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function playUiSound(kind: "click" | "success") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "success" ? 880 : 520;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "success" ? 0.08 : 0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "success" ? 0.18 : 0.12));
    osc.start(now);
    osc.stop(now + (kind === "success" ? 0.2 : 0.14));
    window.setTimeout(() => ctx.close().catch(() => undefined), 260);
  } catch {
    // ignore (blocked by browser policies, etc.)
  }
}

function loadCustomFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FRIENDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomFriends(friends: Friend[]) {
  localStorage.setItem(CUSTOM_FRIENDS_STORAGE_KEY, JSON.stringify(friends));
}

function JourneyStep({
  step,
  title,
  lead,
  headingClassName,
  isVintage,
  sectionId,
  children,
}: {
  step: number;
  title: string;
  lead: string;
  headingClassName: string;
  isVintage: boolean;
  sectionId?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={sectionId}
      className={cn(
        "scroll-mt-24 transition-all duration-500",
        isVintage
          ? "rounded-3xl border border-primary/10 bg-card/40 p-6 md:p-8 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          : "rounded-2xl border border-border/40 bg-card/50 p-4 sm:p-6 shadow-xl shadow-primary/5 backdrop-blur-md",
      )}
    >
      <div className={cn("flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6", isVintage ? "gap-3" : "gap-3 border-b border-border/20 pb-4 mb-6")}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center font-black border transition-transform duration-500 hover:rotate-12",
            isVintage
              ? "rounded-xl h-10 w-10 border-primary/20 bg-primary/10 text-primary text-sm shadow-inner"
              : "rounded-lg h-8 w-8 bg-primary/10 text-primary text-[11px] shadow-sm",
          )}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              headingClassName,
              "font-bold text-foreground tracking-tight",
              isVintage ? "text-xl md:text-2xl" : "text-base md:text-lg",
            )}
          >
            {title}
          </h2>
          {isVintage && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed opacity-70">
              {lead}
            </p>
          )}
        </div>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

const ClientGiftCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { identity, setIdentity } = useTheme();
  const copy = useMemo(() => getClientGiftCardsCopy(identity), [identity]);
  const settingsCopy = useMemo(() => getGiftCardSettingsModalCopy(identity), [identity]);
  const isVintage = identity === "vintage";
  const headingFont = isVintage ? "font-vintage-heading" : "font-display";
  const [selected, setSelected] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState(50);
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"select" | "processing" | "done">("select");
  const [giftCode, setGiftCode] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemTouched, setRedeemTouched] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{ amount: number; code: string } | null>(null);
  const [redeemConfetti, setRedeemConfetti] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [customFriends, setCustomFriends] = useState<Friend[]>(loadCustomFriends);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hoveredFriendId, setHoveredFriendId] = useState<number | null>(null);
  const [previewFriendId, setPreviewFriendId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [newFriendBarbershop, setNewFriendBarbershop] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GiftSettings>(loadGiftSettings);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const [regionOnlySameBarbershop, setRegionOnlySameBarbershop] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    // Se o usuário nunca mexeu nas configurações, pré-configura pela identidade do app.
    // Não sobrescreve preferências já salvas.
    try {
      const raw = localStorage.getItem(GIFT_SETTINGS_KEY);
      if (raw) return;
    } catch {
      // ignore
    }
    const preset: AccentPresetKey = identity === "vintage" ? "dourado" : "azul";
    setSettings((prev) => ({ ...prev, accent: preset }));
  }, [identity]);

  useEffect(() => {
    settingsRef.current = settings;
    saveGiftSettings(settings);
  }, [settings]);

  useEffect(() => {
    const updateMedia = () => setIsMobile(window.innerWidth < 768);
    updateMedia();
    window.addEventListener("resize", updateMedia);
    return () => window.removeEventListener("resize", updateMedia);
  }, []);

  const friends = useMemo(() => {
    const base = [...customFriends, ...friendsMock];
    if (user?.name) {
      base.unshift({
        id: 999,
        name: user.name,
        username: `@${user.name.toLowerCase().replace(/\s+/g, "")}`,
        avatarColor: "bg-primary",
        online: true,
        lastBarbershop: "Sua barbearia favorita",
      });
    }
    const seen = new Set<string>();
    return base.filter((f) => {
      const key = `${f.name}-${f.username}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customFriends, user?.name]);

  useEffect(() => {
    setFriendsLoading(true);
    const id = window.setTimeout(() => setFriendsLoading(false), 420);
    return () => window.clearTimeout(id);
  }, [friends.length]);

  const giftOptions = useMemo(() => getGiftOptions(isVintage), [isVintage]);
  const selectedGift = giftOptions.find((g) => g.id === selected);
  const finalPrice = selectedGift?.customizable ? customValue : selectedGift?.price || 0;
  const walletBalance = useMemo(() => getGiftWalletBalance(user?.id), [user?.id, redeemSuccess]);

  const redeemValidation = useMemo(() => {
    const normalized = normalizeGiftcardCode(redeemCode);
    if (!redeemTouched || normalized.length < 6) return { state: "idle" as const, message: "" };
    const record = getGiftcardByCode(normalized);
    if (!record) return { state: "invalid" as const, message: "Código não encontrado" };
    if (record.status === "redeemed") return { state: "used" as const, message: "Código já utilizado" };
    return { state: "valid" as const, message: "Código válido" };
  }, [redeemCode, redeemTouched]);

  const filteredFriends = friends
    .filter((f) => (settings.hideSelf ? f.id !== 999 : true))
    .filter((f) => (f.name + f.username).toLowerCase().includes(friendSearch.toLowerCase()));

  const selectedFriend =
    filteredFriends.find((f) => f.id === selectedFriendId) ??
    friends.find((f) => f.id === selectedFriendId);
  const hoveredFriend = friends.find((f) => f.id === hoveredFriendId);
  const previewFriend = friends.find((f) => f.id === previewFriendId);

  const nearbyPeople = useMemo(
    () =>
      filteredFriends
        .filter((f) => f.id !== 999)
        .filter((f) => {
          const q = regionQuery.trim().toLowerCase();
          if (!q) return true;
          return (f.name + f.username).toLowerCase().includes(q);
        })
        .slice(0, 10)
        .map((f, idx) => ({
          ...f,
          distanceKm: idx + 1,
          commonShop: f.lastBarbershop || "Barbearia da região",
          isNewInArea: idx % 2 === 0,
        })),
    [filteredFriends, regionQuery],
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleGenerate = () => {
    if (!selectedGift) {
      toast({ title: copy.toastSelectGiftTitle, variant: "destructive" });
      return;
    }
    if (!recipientName.trim()) {
      toast({ title: copy.toastRecipientRequiredTitle, variant: "destructive" });
      return;
    }
    setStep("processing");
    setTimeout(() => {
      const code = `BF-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      setGiftCode(code);
      setStep("done");
      if (settingsRef.current.sound) playUiSound("success");
      try {
        addGiftcard({
          code,
          createdAt: new Date().toISOString(),
          createdByUserId: user?.id,
          recipientName: recipientName.trim() || undefined,
          giftName: selectedGift?.name,
          amount: finalPrice,
          message: message.trim() || undefined,
        });
      } catch {
        // ignore (storage blocked)
      }
      if (user?.id) {
        void emitGiftcardNotification({
          userId: user.id,
          event: "created",
          code,
          recipientName: recipientName || undefined,
          amount: finalPrice,
        });
      }
      toast({ title: copy.toastCreatedTitle, description: copy.toastCreatedDesc });
      toast({ title: copy.toastBonusTitle, description: copy.toastBonusDesc });
    }, 1500);
  };

  const handleRedeem = () => {
    const code = normalizeGiftcardCode(redeemCode);
    if (!code) {
      toast({
        title: copy.toastRedeemMissingTitle,
        description: copy.toastRedeemMissingDesc,
        variant: "destructive",
      });
      return;
    }
    setRedeeming(true);
    try {
      const res = redeemGiftcard({ code, userId: user?.id });
      if (res.ok === false) {
        const reason = res.reason;
        toast({
          title: reason === "already_redeemed" ? copy.toastRedeemUsedTitle : copy.toastRedeemInvalidTitle,
          description: reason === "already_redeemed" ? copy.toastRedeemUsedDesc : copy.toastRedeemInvalidDesc,
          variant: "destructive",
        });
        return;
      }
      if (settings.sound) playUiSound("success");
      addGiftWalletBalance(user?.id, res.record.amount);
      setRedeemSuccess({ amount: res.record.amount, code: res.record.code });
      setRedeemDialogOpen(true);
      setRedeemConfetti(true);
      window.setTimeout(() => setRedeemConfetti(false), 1200);
      toast({
        title: copy.toastRedeemOkTitle,
        description: copy.toastRedeemOkDesc.replace("{amount}", res.record.amount.toFixed(2)),
      });
      setRedeemCode("");
      setRedeemTouched(false);
      if (user?.id) {
        void emitGiftcardNotification({
          userId: user.id,
          event: "updated",
          code: res.record.code,
          recipientName: res.record.recipientName,
          amount: res.record.amount,
        });
      }
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopy = () => {
    if (!giftCode) return;
    navigator.clipboard.writeText(giftCode).catch(() => undefined);
    if (settings.sound) playUiSound("click");
    toast({ title: copy.toastCopiedTitle, description: copy.toastCopiedDesc });
  };

  const handleShareWhatsApp = () => {
    const text = `Presente para você, ${recipientName || "convidado"}.

Vale-Corte BarberFlow: ${selectedGift?.name}
Valor: R$ ${finalPrice}
Código: ${giftCode}${message ? `\nMensagem: "${message}"` : ""}

Resgate em qualquer barbearia parceira.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onMessageChange = (value: string) => {
    setMessage(value.slice(0, MESSAGE_LIMIT));
  };

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriendId(friend.id);
    if (settings.sound) playUiSound("click");
    if (settings.prefillRecipientFromContact && !recipientName.trim()) setRecipientName(friend.name);
    if (isMobile) {
      setPreviewFriendId(friend.id);
      setPreviewOpen(true);
    }
  };

  const handleAddFriend = () => {
    const cleanName = newFriendName.trim();
    if (!cleanName) {
      toast({ title: copy.toastAddFriendNameTitle, variant: "destructive" });
      return;
    }
    const usernameRaw = newFriendUsername.trim();
    const username = usernameRaw ? (usernameRaw.startsWith("@") ? usernameRaw : `@${usernameRaw}`) : `@${cleanName.toLowerCase().replace(/\s+/g, "")}`;
    const newFriend: Friend = {
      id: Date.now(),
      name: cleanName,
      username,
      avatarColor: "bg-primary",
      lastBarbershop: newFriendBarbershop.trim() || "Não informado",
    };
    const next = [newFriend, ...customFriends];
    setCustomFriends(next);
    saveCustomFriends(next);
    setAddFriendOpen(false);
    setNewFriendName("");
    setNewFriendUsername("");
    setNewFriendBarbershop("");
    toast({ title: copy.toastAddFriendOkTitle, description: copy.toastAddFriendOkDesc });
  };

  const FriendAvatar = ({ friend, large = false }: { friend: Friend; large?: boolean }) => {
    const size = large ? "w-12 h-12" : "w-10 h-10";
    if (friend.avatarUrl) {
      return (
        <img
          src={friend.avatarUrl}
          alt={friend.name}
          className={`${size} rounded-full object-cover border border-border/60`}
        />
      );
    }
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center text-[11px] font-semibold text-white ${friend.avatarColor}`}
      >
        {getInitials(friend.name)}
      </div>
    );
  };

  return (
    <DashboardLayout userType="cliente" immersive>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={
          {
            ["--primary" as never]: ACCENT_PRESETS[settings.accent].hslPrimary,
            ["--ring" as never]: ACCENT_PRESETS[settings.accent].hslPrimary,
            ["--accent" as never]: ACCENT_PRESETS[settings.accent].hslAccent || ACCENT_PRESETS[settings.accent].hslPrimary,
            ["--gold" as never]: ACCENT_PRESETS[settings.accent].hslPrimary,
          } as CSSProperties
        }
        className="relative"
      >
        {/* Glow removido para teste */}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-4 mb-10">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={cn(
                "w-12 h-12 flex items-center justify-center shrink-0 shadow-lg",
                isVintage ? "rounded-2xl bg-primary/10 border border-primary/20" : "rounded-xl bg-primary text-primary-foreground"
              )}
            >
              <Gift className={cn("h-6 w-6", isVintage ? "text-primary" : "text-primary-foreground")} />
            </motion.div>
            <div className="min-w-0">
              <h1 className={cn(headingFont, "text-3xl lg:text-4xl font-bold tracking-tight text-foreground")}>{copy.pageTitle}</h1>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-md">{copy.pageSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 sm:ml-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" 
              onClick={() => setRedeemDialogOpen(true)}
            >
              {copy.redeemTopAction}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl px-4 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={() => setSettingsOpen(true)}
            >
              <Palette className="h-4 w-4 mr-2 text-primary" />
              <span className="text-xs font-bold uppercase tracking-tight">{settingsCopy.openButtonLabel}</span>
            </Button>
          </div>
        </div>

        {step === "select" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mx-auto w-full">
            <div className="space-y-8">
              <JourneyStep
                step={1}
                title={copy.step1Title}
                lead={copy.step1Lead}
                headingClassName={headingFont}
                isVintage={isVintage}
                sectionId="journey-step-gift"
              >
                <div className={cn("grid grid-cols-1 sm:grid-cols-2", isVintage ? "gap-5" : "gap-4")}>
                  {giftOptions.map((gift) => (
                    <motion.button
                      key={gift.id}
                      type="button"
                      whileHover={
                        isVintage
                          ? { y: -8, scale: 1.02, boxShadow: "0 25px 60px -15px rgba(0,0,0,0.6)" }
                          : { y: -4, scale: 1.01, boxShadow: "0 20px 40px -20px hsl(var(--primary)/0.3)" }
                      }
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelected(gift.id)}
                      className={cn(
                        "text-left transition-all border duration-300 relative group",
                        isVintage
                          ? cn(
                              "rounded-[2rem] p-6 bg-gradient-to-br from-card via-card to-background",
                              selected === gift.id
                                ? "border-primary ring-4 ring-primary/10 shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.6)]"
                                : "border-primary/10 hover:border-primary/30",
                            )
                          : cn(
                              "rounded-3xl p-5 bg-card/40 backdrop-blur-sm",
                              selected === gift.id
                                ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5"
                                : "border-border/40 hover:border-primary/40",
                            ),
                      )}
                    >
                      {isVintage && selected === gift.id && (
                        <motion.div 
                          layoutId="vintage-selected-bg"
                          className="absolute inset-0 bg-primary/[0.03] -z-10"
                        />
                      )}
                      <div className="flex items-start gap-4">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-6",
                            isVintage 
                              ? "w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20" 
                              : "w-11 h-11 rounded-cl bg-primary/10 text-primary",
                          )}
                        >
                          <gift.icon className={isVintage ? "h-7 w-7" : "h-5 w-5"} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(headingFont, isVintage ? "text-xl font-bold" : "text-base font-bold tracking-tight")}>
                            {gift.name}
                          </h3>
                          {gift.customizable ? (
                            <div className="mt-1.5 flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-60">A partir de</span>
                              <p
                                className={cn(
                                  "font-black tracking-tight",
                                  isVintage ? "text-2xl text-gradient-gold" : "text-lg text-primary",
                                )}
                              >
                                R$ {gift.price}
                              </p>
                            </div>
                          ) : (
                            <p
                              className={cn(
                                "font-black tracking-tighter mt-1 tabular-nums",
                                isVintage ? "text-2xl text-gradient-gold" : "text-xl text-primary",
                              )}
                            >
                              R$ {gift.price}
                            </p>
                          )}
                        </div>
                        {selected === gift.id && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn(
                              "shrink-0 flex items-center justify-center",
                              isVintage ? "w-6 h-6 rounded-full bg-primary text-primary-foreground" : "w-5 h-5 rounded-full bg-primary text-primary-foreground"
                            )}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </motion.div>
                        )}
                      </div>
                      
                      {isVintage && (
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-1 h-8 bg-primary/20 rounded-full blur-sm" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {selectedGift && (
                    <motion.div
                      key={selectedGift.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={cn(
                        "rounded-2xl p-5 mt-4 border",
                        isVintage
                          ? "bg-primary/[0.04] border-primary/20"
                          : "bg-secondary/25 border-border/50",
                      )}
                    >
                      <p className={cn("text-sm font-semibold text-foreground", !isVintage && "tracking-tight")}>
                        {copy.giftSummaryTitle}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-6">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {copy.giftSummaryServiceLabel}
                          </p>
                          <p className={cn("mt-0.5 font-semibold text-foreground", headingFont)}>{selectedGift.name}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{copy.giftSummaryValueLabel}</p>
                          <p
                            className={cn(
                              "mt-0.5 text-lg font-bold tabular-nums",
                              isVintage ? "text-gradient-gold" : "text-primary",
                            )}
                          >
                            R$ {selectedGift.customizable ? customValue : selectedGift.price}
                          </p>
                        </div>
                      </div>
                      {isVintage && (
                        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                          {selectedGift.customizable
                            ? copy.giftSummaryVintageTaglineCredit
                            : copy.giftSummaryVintageTagline}
                        </p>
                      )}
                      <div className={cn("mt-4 pt-4 border-t", isVintage ? "border-primary/15" : "border-border/50")}>
                        <p className="text-xs font-semibold text-foreground mb-2">{copy.packageDetailsLabel}</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          {getGiftDetails(selectedGift.id, isVintage)?.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2">
                              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selected && selectedGift?.customizable && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-secondary/30 border border-border/45 rounded-2xl p-5 mt-4"
                  >
                    <label className="text-sm font-medium mb-2 block">{copy.customValueLabel}</label>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">R$</span>
                      <input
                        type="number"
                        min={20}
                        max={500}
                        value={customValue}
                        onChange={(e) => setCustomValue(Number(e.target.value))}
                        className="bg-background/80 border border-border rounded-lg px-3 py-2 w-28 text-lg font-bold"
                      />
                    </div>
                  </motion.div>
                )}
              </JourneyStep>

              <JourneyStep
                step={2}
                title={copy.step2Title}
                lead={copy.step2Lead}
                headingClassName={headingFont}
                isVintage={isVintage}
                sectionId="journey-step-recipient"
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">{copy.friendSectionEyebrow}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setRegionOpen(true)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 bg-secondary/35 text-muted-foreground hover:text-foreground hover:border-primary/35 transition-all"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Descobrir pessoas da região para presentear.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 bg-secondary/35 text-muted-foreground hover:text-foreground hover:border-primary/35 transition-all"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Você pode alternar o modo de visualização e privacidade em Configurações.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <input
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder={copy.friendSectionSearchPlaceholder}
                    className="w-full bg-background/80 border border-border/70 rounded-lg px-3 py-2.5 text-sm mb-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-transparent"
                  />
                  <div className="relative">
                    {settings.viewMode === "lista" ? (
                      <div className="flex gap-4 overflow-x-auto pt-4 pb-12 px-4 hide-scrollbar -mx-4 -mt-4">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -3, scale: 1.05 }}
                        onClick={() => setRegionOpen(true)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 min-w-[90px] h-[105px] border-2 border-dashed transition-all",
                          isVintage 
                            ? "rounded-2xl border-primary/20 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10"
                            : "rounded-xl border-border/40 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-primary"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border",
                          isVintage ? "bg-primary/10 border-primary/20" : "bg-primary/5 border-primary/10"
                        )}>
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{copy.friendAddAction || "Adicionar"}</span>
                      </motion.button>
                      {friendsLoading ? (
                        Array.from({ length: 6 }).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "min-w-[90px] h-[105px] flex flex-col items-center justify-center gap-3 animate-pulse border",
                              isVintage ? "rounded-2xl border-primary/5 bg-primary/[0.02]" : "rounded-xl border-border/20 bg-secondary/20"
                            )}
                          >
                            <div className="w-12 h-12 rounded-full bg-muted/60" />
                            <div className="h-3 w-14 rounded bg-muted/40" />
                          </div>
                        ))
                      ) : filteredFriends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-w-[280px] h-[105px] border border-dashed border-border/40 rounded-2xl bg-muted/5">
                          <p className="text-xs font-bold text-foreground/60">{copy.friendsEmptyTitle}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{copy.friendsEmptyHint}</p>
                        </div>
                      ) : (
                        filteredFriends.map((friend, idx) => {
                          const isActive = friend.id === selectedFriendId;
                          return (
                            <motion.button
                              key={friend.id}
                              type="button"
                              onMouseEnter={() => setHoveredFriendId(friend.id)}
                              onMouseLeave={() => setHoveredFriendId((prev) => (prev === friend.id ? null : prev))}
                              onClick={() => handleSelectFriend(friend)}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: isActive ? 1.08 : 1 }}
                              transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                              whileHover={{ y: -4, scale: isActive ? 1.08 : 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-2xl border transition-all min-w-[90px] h-[105px]",
                                isActive
                                  ? isVintage
                                    ? "border-primary bg-primary/10 shadow-[0_15px_35px_-10px_hsl(var(--primary)/0.4)]"
                                    : "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                                  : isVintage
                                    ? "border-primary/10 bg-card hover:border-primary/30"
                                    : "border-border/40 bg-card/60 hover:border-primary/40"
                              )}
                            >
                              <div className="relative">
                                <FriendAvatar friend={friend} large />
                                {friend.online && (
                                  <motion.span 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                                  />
                                )}
                                {isActive && (
                                  <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center text-primary-foreground shadow-md"
                                  >
                                    <Check className="w-3 h-3 font-black" />
                                  </motion.span>
                                )}
                              </div>
                              <div className="text-center min-w-0 pointer-events-none">
                                <p className={cn(
                                  "truncate font-black text-[11px]",
                                  isActive ? "text-primary" : "text-foreground/80"
                                )}>
                                  {friend.name.split(" ")[0]}
                                </p>
                                {friend.frequent && (
                                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-primary/50 mt-0.5">VIP</p>
                                )}
                              </div>
                            </motion.button>
                          );
                        })
                      )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <motion.button
                            type="button"
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRegionOpen(true)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                              isVintage
                                ? "border-2 border-primary/20 bg-primary/5 text-primary hover:border-primary/40"
                                : "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            )}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {copy.friendAddAction || "Adicionar contato"}
                          </motion.button>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {friendsLoading ? "Sincronizando..." : `${filteredFriends.length} Contatos`}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {friendsLoading
                            ? Array.from({ length: 4 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "rounded-2xl border p-4 flex items-center gap-4 animate-pulse",
                                    isVintage ? "border-primary/5 bg-primary/[0.02]" : "border-border/20 bg-secondary/10"
                                  )}
                                >
                                  <div className="w-12 h-12 rounded-full bg-muted/60" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-32 rounded bg-muted/60" />
                                    <div className="h-3 w-20 rounded bg-muted/40" />
                                  </div>
                                </div>
                              ))
                            : filteredFriends.length === 0 ? (
                                <div className="col-span-full rounded-2xl border-2 border-dashed border-border/30 bg-background/40 px-6 py-10 text-center">
                                  <p className="text-sm font-bold text-foreground/60">{copy.friendsEmptyTitle}</p>
                                  <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto opacity-70">{copy.friendsEmptyHint}</p>
                                </div>
                              )
                            : filteredFriends.map((friend, idx) => {
                                const isActive = friend.id === selectedFriendId;
                                return (
                                  <motion.button
                                    key={friend.id}
                                    type="button"
                                    onClick={() => handleSelectFriend(friend)}
                                    onMouseEnter={() => setHoveredFriendId(friend.id)}
                                    onMouseLeave={() => setHoveredFriendId((prev) => (prev === friend.id ? null : prev))}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4, boxShadow: isVintage ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "0 15px 30px -10px rgba(0,0,0,0.1)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                      "group rounded-[1.5rem] border p-4 text-left transition-all duration-300 relative",
                                      isActive
                                        ? isVintage 
                                          ? "border-primary ring-4 ring-primary/10 bg-primary/10 shadow-2xl"
                                          : "border-primary ring-2 ring-primary/20 bg-primary/10"
                                        : isVintage
                                          ? "border-primary/10 bg-card/60 hover:border-primary/30"
                                          : "border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card"
                                    )}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <motion.div whileHover={{ scale: 1.1 }} className="origin-center">
                                          <FriendAvatar friend={friend} large />
                                        </motion.div>
                                        {friend.online && (
                                          <motion.span 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" 
                                          />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-foreground truncate">{friend.name}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                          {friend.frequent && (
                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">
                                              VIP
                                            </span>
                                          )}
                                          <span className="text-[10px] text-muted-foreground font-medium inline-flex items-center gap-1.5 opacity-70">
                                            <span className={cn("w-1.5 h-1.5 rounded-full", ACCENT_PRESETS[settings.accent].dotClass)} />
                                            {friend.lastBarbershop || "Cliente"}
                                          </span>
                                        </div>
                                      </div>
                                      {isActive && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
                                        >
                                          <Check className="w-3.5 h-3.5 font-black" />
                                        </motion.div>
                                      )}
                                    </div>
                                  </motion.button>
                                );
                              })}
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {!isMobile && hoveredFriend && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="friend-hover-card"
                        >
                          <div className="flex items-center gap-2">
                            <FriendAvatar friend={hoveredFriend} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{hoveredFriend.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{hoveredFriend.username}</p>
                            </div>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            Última barbearia: {hoveredFriend.lastBarbershop || "Não informado"}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{copy.recipientNameLabel}</label>
                    <input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={copy.recipientNamePlaceholder}
                      className="w-full bg-background/80 border border-border/70 rounded-lg px-3 py-2.5 text-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-transparent"
                    />
                  </div>
                </div>
              </JourneyStep>

              <JourneyStep
                step={3}
                title={copy.step3Title}
                lead={copy.step3Lead}
                headingClassName={headingFont}
                isVintage={isVintage}
                sectionId="journey-step-message"
              >
                <div className="space-y-3">
                  <label className="text-sm font-medium block">{copy.messageFieldLabel}</label>
                  <div className="flex flex-wrap gap-2.5 mb-2">
                    {settings.quickMessageSuggestions &&
                      copy.quickMessages.map((quick, qIdx) => (
                      <motion.button
                        key={quick}
                        type="button"
                        whileHover={{ y: -2, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: qIdx * 0.05 }}
                        onClick={() => onMessageChange(quick)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all shadow-sm",
                          isVintage
                            ? "border-primary/20 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10"
                            : "border-border/40 bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5",
                        )}
                      >
                        {quick}
                      </motion.button>
                    ))}
                  </div>
                  {!settings.quickMessageSuggestions && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">{settingsCopy.chipsDisabledHint}</p>
                  )}
                  <div className="relative group">
                    <textarea
                      value={message}
                      onChange={(e) => onMessageChange(e.target.value)}
                      placeholder={copy.messagePlaceholder}
                      rows={isVintage ? 4 : 3}
                      className={cn(
                        "w-full bg-background/60 border rounded-2xl px-4 py-3 text-sm resize-none transition-all focus:outline-none focus:ring-4 placeholder:text-muted-foreground/30 focus:placeholder:text-transparent",
                        isVintage 
                          ? "border-primary/15 focus:border-primary/40 focus:ring-primary/5 shadow-inner" 
                          : "border-border/40 focus:border-primary/40 focus:ring-primary/5"
                      )}
                    />
                    <div className={cn(
                      "absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-black tabular-nums transition-opacity duration-300",
                      message.length > MESSAGE_LIMIT * 0.8 ? "bg-red-500/10 text-red-500" : "bg-muted/50 text-muted-foreground/60 opacity-0 group-focus-within:opacity-100"
                    )}>
                      {message.length}/{MESSAGE_LIMIT}
                    </div>
                  </div>
                </div>
              </JourneyStep>

              <JourneyStep
                step={4}
                title={copy.step4Title}
                lead={copy.step4Lead}
                headingClassName={headingFont}
                isVintage={isVintage}
                sectionId="journey-step-review"
              >
                {isVintage ? (
                  /* ── Vintage: Concierge Premium Voucher ─────────────────── */
                  <div className="relative mx-auto w-full max-w-[680px] group">
                    <motion.div 
                      whileHover={{ y: -5, rotateX: 2 }}
                      className="relative rounded-[2rem] border-2 border-primary/20 bg-background shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] p-2 overflow-hidden"
                    >
                      <div className="relative rounded-[1.5rem] bg-[linear-gradient(135deg,hsl(var(--gold-dark)),hsl(var(--gold)),hsl(var(--gold-light)))] p-6 sm:p-8 overflow-hidden border border-white/20">
                        {/* Elegance patterns */}
                        <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                        <div className="absolute -left-4 top-1/2 -mt-4 w-8 h-8 rounded-full bg-background border-r-2 border-primary/20 z-10" />
                        <div className="absolute -right-4 top-1/2 -mt-4 w-8 h-8 rounded-full bg-background border-l-2 border-primary/20 z-10" />
                        <div className="absolute top-1/2 left-4 right-4 h-px border-t-2 border-dashed border-white/20 -mt-[1px]" />

                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                <Gift className="h-6 w-6 text-white drop-shadow-md" />
                              </div>
                              <div>
                                <h4 className="font-vintage-heading text-xl sm:text-3xl font-bold text-white tracking-widest leading-none drop-shadow-md">{copy.reviewSignature || "VOUCHER"}</h4>
                                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{copy.reviewStatusReady || "Exclusive Access"}</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">Gift Pass</p>
                               <p className="text-white font-mono text-[10px] mt-0.5 opacity-80">BF-772-VNTG</p>
                            </div>
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Redeemed for</p>
                              <h5 className="font-vintage-heading text-lg sm:text-2xl text-white truncate drop-shadow-sm">
                                {selectedGift?.name || copy.previewEmpty}
                              </h5>
                              <div className="mt-3 flex items-center gap-4">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Para</p>
                                  <p className="text-xs font-bold text-white mt-0.5">{recipientName || selectedFriend?.name || copy.previewGuestFallback}</p>
                                </div>
                                <div className="w-px h-6 bg-white/20" />
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Data</p>
                                  <p className="text-xs font-bold text-white mt-0.5">{new Date().toLocaleDateString("pt-BR")}</p>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-white/50 mb-1">Value</span>
                              <p className="font-vintage-heading text-4xl sm:text-6xl font-black text-white drop-shadow-2xl tabular-nums leading-none">
                                R${finalPrice}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  /* ── Modern: Fintech-style Checkout Summary ────────────────── */
                  <div className="mx-auto w-full max-w-[580px]">
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[2rem] bg-card border border-border/40 shadow-2xl shadow-primary/5 overflow-hidden"
                    >
                      <div className="bg-primary/5 px-6 py-4 border-b border-border/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{copy.reviewSignature || "Checkout"}</h4>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{copy.reviewStatusReady || "Pronto para gerar"}</p>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-end border-b border-border/10 pb-6">
                           <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{copy.reviewRowGift}</p>
                             <p className="text-lg font-bold tracking-tight text-foreground">{selectedGift?.name || copy.previewEmpty}</p>
                           </div>
                           <div className="text-right space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{copy.reviewRowValue}</p>
                             <p className="text-3xl font-black text-primary tabular-nums">R$ {finalPrice}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{copy.reviewRowRecipient}</p>
                             <div className="flex items-center gap-2 mt-1">
                               {selectedFriend && <FriendAvatar friend={selectedFriend} />}
                               <p className="text-sm font-bold truncate text-foreground">{recipientName || selectedFriend?.name || copy.previewGuestFallback}</p>
                             </div>
                           </div>
                           <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ID Transação</p>
                             <p className="text-sm font-mono text-muted-foreground/80 mt-1">TR-#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{copy.reviewRowMessage}</p>
                          <div className={cn(
                            "rounded-2xl px-5 py-4 text-sm transition-all border shadow-inner",
                            message.trim() ? "bg-secondary/20 border-border/40 italic text-foreground" : "bg-muted/30 border-dashed border-border/80 text-muted-foreground/50"
                          )}>
                            {message.trim() ? `"${message}"` : copy.reviewNoMessage}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      document.getElementById("journey-step-gift")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {copy.secondaryCtaEdit}
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex w-full sm:w-auto">
                    <Button
                      variant="gold"
                      onClick={() => {
                        if (settings.sound) playUiSound("click");
                        handleGenerate();
                      }}
                      disabled={!selected}
                      className={cn(
                        "relative w-full sm:w-auto rounded-full px-8 py-3 text-base transition-shadow overflow-hidden",
                        isVintage ? "hover:shadow-gold" : "shadow-sm hover:shadow-md",
                      )}
                    >
                      {isVintage && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                          animate={{ x: ["0%", "300%"] }}
                          transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
                        />
                      )}
                      <span className="relative inline-flex items-center justify-center gap-2">
                        {copy.generateCta}
                        <Gift className="h-4 w-4 shrink-0" />
                      </span>
                    </Button>
                  </motion.div>
                </div>

                <p className="mt-6 text-center">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
                    onClick={() => setRedeemDialogOpen(true)}
                  >
                    {copy.redeemParallelHint}
                  </button>
                </p>
              </JourneyStep>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] space-y-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className={cn(
                  "w-32 h-32 rounded-full border-4 border-dashed",
                  isVintage ? "border-primary/40 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]" : "border-primary/30"
                )}
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                 <Gift className={cn("w-12 h-12", isVintage ? "text-primary" : "text-primary")} />
              </motion.div>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className={cn(headingFont, "text-2xl font-bold text-foreground")}>{copy.processingEyebrow || "Preparando seu presente..." }</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto opacity-70">
                {copy.processingLead} <span className="text-foreground font-black">{recipientName || selectedFriend?.name}</span>
              </p>
            </div>

            <div
              className={cn(
                "w-full max-w-sm rounded-[2rem] p-6 border shadow-2xl relative overflow-hidden",
                isVintage
                  ? "border-primary/20 bg-card/60 backdrop-blur-md"
                  : "border-border/40 bg-card/40 backdrop-blur-xl",
              )}
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ID Transação</p>
                    <p className="text-xs font-mono font-bold opacity-40">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Serviço</p>
                    <p className="text-xs font-bold">{selectedGift?.name}</p>
                 </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent my-4" />
              <div className="flex items-center justify-between">
                 <p className="text-sm font-bold">Total</p>
                 <p className={cn("text-2xl font-black", isVintage ? "text-gradient-gold" : "text-primary")}>R$ {finalPrice}</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center space-y-8 py-8"
          >
            <div className="relative inline-block">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/20"
              >
                <Check className="h-12 w-12 text-emerald-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40"
              >
                <Gift className="w-4 h-4" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <h2 className={cn(headingFont, "text-3xl sm:text-4xl font-black tracking-tight")}>{copy.doneTitle}</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto opacity-70">O presente perfeito já está pronto para surpreender.</p>
            </div>

            <div className={cn(
              "relative rounded-[2.5rem] border p-8 sm:p-10 shadow-2xl overflow-hidden",
              isVintage ? "bg-card/60 backdrop-blur-md border-primary/10" : "bg-card border-border/40"
            )}>
              {isVintage && <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, black 1px, transparent 0)", backgroundSize: "32px 32px" }} />}
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="p-6 bg-white rounded-3xl shadow-2xl border-8 border-background"
                >
                  <QrCode className={cn("h-32 w-32", isVintage ? "text-primary/70" : "text-primary/60")} />
                </motion.div>
                
                <div className="w-full space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{copy.redeemParallelHint || "Toque no código para copiar"}</p>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-background rounded-2xl border-2 border-dashed border-primary/20 p-5 flex items-center justify-between group cursor-pointer"
                    onClick={handleCopy}
                  >
                    <p className="font-mono text-xl font-black text-primary tracking-wider">{giftCode}</p>
                    <Copy className="h-5 w-5 text-primary/40 group-hover:text-primary transition-colors" />
                  </motion.div>
                </div>

                <div className={cn(
                  "w-full rounded-2xl p-5 text-left border space-y-4",
                  isVintage ? "bg-primary/[0.03] border-primary/10" : "bg-secondary/20 border-border/30"
                )}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Para</p>
                      <p className="text-base font-bold text-foreground">{recipientName || "Seu convidado"}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Valor</p>
                       <p className={cn("text-xl font-black", isVintage ? "text-gradient-gold" : "text-primary")}>R$ {finalPrice}</p>
                    </div>
                  </div>
                  {message && (
                    <div className="pt-4 border-t border-border/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Mensagem</p>
                      <p className="text-sm italic text-foreground/80 leading-relaxed">"{message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Button 
                variant="gold" 
                className="rounded-full w-full sm:w-auto px-10 h-12 text-sm font-bold shadow-xl shadow-primary/20"
                onClick={handleShareWhatsApp}
                disabled={!giftCode}
              >
                  Compartilhar WhatsApp
               </Button>
               <Button 
                variant="outline" 
                className="rounded-full w-full sm:w-auto px-10 h-12 text-sm font-bold border-border/40"
                onClick={() => {
                  setStep("select");
                  setSelected(null);
                  setRecipientName("");
                  setMessage("");
                  setFriendSearch("");
                  setSelectedFriendId(null);
                  setGiftCode("");
                }}
              >
                  {copy.doneCreateAnother || "Criar Novo Gift Card"}
               </Button>
            </div>
          </motion.div>
        )}

        <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
          <DialogContent
            className={cn(
              "sm:max-w-md overflow-hidden",
              isVintage
                ? "glass-card border-primary/25 p-0"
                : "border-border/50 bg-card p-0",
            )}
          >
            {/* ── Header com identidade ────────────────────── */}
            {isVintage ? (
              <div className="bg-[linear-gradient(135deg,hsl(var(--gold-dark)),hsl(var(--gold)),hsl(var(--gold-light)))] px-6 pt-6 pb-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.5),transparent_60%)]" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <Gift className="h-8 w-8 text-white/90 mb-3 drop-shadow-md" />
                  <DialogTitle className="font-vintage-heading text-xl font-bold text-white tracking-wide">
                    {copy.redeemDialogTitle}
                  </DialogTitle>
                  <DialogDescription className="text-white/75 text-sm mt-1.5 leading-relaxed max-w-[32ch]">
                    {copy.redeemDialogLead}
                  </DialogDescription>
                </div>
              </div>
            ) : (
              <div className="px-6 pt-6 pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-base font-semibold tracking-tight">
                      {copy.redeemDialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {copy.redeemDialogLead}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            )}

            {/* ── Corpo do modal ───────────────────────────── */}
            <div className={cn("space-y-4", isVintage ? "px-6 py-5" : "px-6 py-4")}>
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 p-4 space-y-3">
                {redeemConfetti && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <motion.div
                        key={`gc-dlg-${i}`}
                        initial={{ opacity: 0, y: -20, x: (i % 11) * 30 - 140, rotate: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [0, 360], rotate: [0, 220] }}
                        transition={{ duration: 1.0, delay: i * 0.015, ease: "easeOut" }}
                        className="absolute left-1/2 top-0 w-2 h-3 rounded-sm"
                        style={{ background: i % 2 === 0 ? "hsl(var(--gold))" : "hsl(var(--primary))" }}
                      />
                    ))}
                  </div>
                )}
                {walletBalance > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {copy.redeemWalletPrefix}{" "}
                    <span className="text-primary font-semibold">R$ {walletBalance.toFixed(2)}</span>
                  </p>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="redeem-code-input" className="text-sm font-medium text-foreground">
                    {copy.redeemInputLabel}
                  </label>
                  <input
                    id="redeem-code-input"
                    value={redeemCode}
                    onChange={(e) => {
                      setRedeemCode(e.target.value);
                      if (!redeemTouched) setRedeemTouched(true);
                    }}
                    onBlur={() => setRedeemTouched(true)}
                    placeholder={copy.redeemPlaceholder}
                    autoComplete="off"
                    className={cn(
                      "w-full bg-background/80 border rounded-lg px-3 py-2.5 text-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-all focus:ring-1 focus:outline-none font-mono tracking-wider placeholder:text-muted-foreground/40 focus:placeholder:text-transparent",
                      redeemValidation.state === "valid"
                        ? "border-emerald-500/60 focus:border-emerald-500/70 focus:ring-emerald-500/20"
                        : redeemValidation.state === "invalid" || redeemValidation.state === "used"
                          ? "border-destructive/60 focus:border-destructive/70 focus:ring-destructive/20"
                          : "border-border/70 focus:border-primary/50 focus:ring-primary/20",
                    )}
                  />
                </div>
                {redeemValidation.state !== "idle" && (
                  <div
                    className={cn(
                      "text-xs flex items-center gap-1.5",
                      redeemValidation.state === "valid" ? "text-emerald-400" : "text-destructive",
                    )}
                  >
                    {redeemValidation.state === "valid" ? (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    )}
                    {redeemValidation.message}
                  </div>
                )}
                <Button
                  type="button"
                  className={cn("w-full", isVintage && "rounded-full")}
                  variant={isVintage ? "gold" : "default"}
                  onClick={handleRedeem}
                  disabled={redeeming}
                >
                  {redeeming ? copy.redeemButtonLoading : copy.redeemButton}
                </Button>
              </div>

              {redeemSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "border rounded-xl p-4 flex flex-col gap-3",
                    isVintage
                      ? "bg-primary/5 border-primary/25"
                      : "bg-emerald-500/5 border-emerald-500/25",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isVintage ? "bg-primary/10" : "bg-emerald-500/10",
                    )}>
                      <Check className={cn("w-5 h-5", isVintage ? "text-primary" : "text-emerald-400")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{copy.redeemSuccessTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        R$ {redeemSuccess.amount.toFixed(2)} {copy.redeemSuccessLead}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="gold" className="flex-1" onClick={() => window.location.assign("/cliente/buscar")}>
                      {copy.useNowButton}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(redeemSuccess.code).catch(() => undefined);
                        toast({ title: copy.toastCopiedTitle, description: copy.toastCopiedRedeemDesc });
                      }}
                    >
                      {copy.copyCodeButton}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar amigo</DialogTitle>
              <DialogDescription>
                Cadastre rapidamente um contato para enviar Gift Cards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-foreground/85">Nome</label>
                <input
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="Ex: Bruno Costa"
                  className="w-full bg-background/80 border border-border/70 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground/85">Username (opcional)</label>
                <input
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  placeholder="@brunocosta"
                  className="w-full bg-background/80 border border-border/70 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-foreground/85">Última barbearia visitada</label>
                <input
                  value={newFriendBarbershop}
                  onChange={(e) => setNewFriendBarbershop(e.target.value)}
                  placeholder="Ex: Barbearia Premium"
                  className="w-full bg-background/80 border border-border/70 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddFriendOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gold" onClick={handleAddFriend}>
                Salvar contato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmar destinatário</DialogTitle>
              <DialogDescription>
                Confira os dados antes de enviar o presente.
              </DialogDescription>
            </DialogHeader>
            {previewFriend && (
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="scale-110 origin-left">
                    <FriendAvatar friend={previewFriend} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{previewFriend.name}</p>
                    <p className="text-xs text-muted-foreground">{previewFriend.username}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  Última barbearia: {previewFriend.lastBarbershop || "Não informado"}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent
            className={cn(
              "max-h-[min(90vh,720px)] overflow-y-auto hide-scrollbar",
              isVintage ? "sm:max-w-lg border-primary/20" : "sm:max-w-md",
            )}
          >
            <DialogHeader className={cn(!isVintage && "space-y-1")}>
              <DialogTitle className={cn(isVintage && "font-vintage-heading text-xl")}>{settingsCopy.title}</DialogTitle>
              <DialogDescription className={cn(isVintage && "leading-relaxed")}>{settingsCopy.subtitle}</DialogDescription>
            </DialogHeader>

            <div className={cn("space-y-6", !isVintage && "space-y-5")}>
              <div
                className={cn(
                  "space-y-4",
                  isVintage && "rounded-2xl border border-border/50 bg-secondary/20 p-4",
                  !isVintage && "pb-5 border-b border-border/45",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
                    isVintage && "text-primary/75",
                  )}
                >
                  {settingsCopy.sectionAppearance}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{settingsCopy.visualThemeLabel}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{settingsCopy.visualThemeTooltip}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIdentity("vintage");
                        if (settings.sound) playUiSound("click");
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                        identity === "vintage"
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      {settingsCopy.visualThemeVintage}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentity("modern");
                        if (settings.sound) playUiSound("click");
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                        identity === "modern"
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      {settingsCopy.visualThemeModern}
                    </button>
                  </div>
                </div>

                <div className={cn("space-y-2", isVintage && "pt-1")}>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground">{settingsCopy.accentLabel}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{settingsCopy.accentTooltip}</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(ACCENT_PRESETS) as AccentPresetKey[]).map((key) => {
                      const preset = ACCENT_PRESETS[key];
                      const active = settings.accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSettings((prev) => ({ ...prev, accent: key }));
                            if (settings.sound) playUiSound("click");
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left transition-all",
                            active
                              ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
                              : "border-border/60 bg-background/60 hover:border-primary/35",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full border border-border/60 shrink-0"
                              style={{ backgroundColor: `hsl(${preset.hslPrimary})` }}
                            />
                            <span className="text-xs font-semibold text-foreground truncate">{preset.label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{settingsCopy.accentChipHint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "space-y-3",
                  isVintage && "rounded-2xl border border-border/50 bg-secondary/20 p-4",
                  !isVintage && "pb-5 border-b border-border/45",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
                    isVintage && "text-primary/75",
                  )}
                >
                  {settingsCopy.sectionDisplay}
                </p>
                <div className="flex items-center gap-2">
                  {settings.viewMode === "cards" ? (
                    <LayoutGrid className="w-4 h-4 text-primary" />
                  ) : (
                    <List className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-sm font-semibold text-foreground">{settingsCopy.friendsDisplayLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  {settings.viewMode === "cards" ? settingsCopy.friendsDisplayLeadCards : settingsCopy.friendsDisplayLeadLista}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, viewMode: "lista" }))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      settings.viewMode === "lista"
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {settingsCopy.friendsLista}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, viewMode: "cards" }))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      settings.viewMode === "cards"
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {settingsCopy.friendsCards}
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "space-y-3",
                  isVintage && "rounded-2xl border border-border/50 bg-secondary/20 p-4",
                  !isVintage && "pb-5 border-b border-border/45",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
                    isVintage && "text-primary/75",
                  )}
                >
                  {settingsCopy.sectionInteraction}
                </p>

                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                    isVintage ? "border-border/55 bg-background/50" : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {settings.sound ? <Volume2 className="w-4 h-4 text-primary shrink-0" /> : <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{settingsCopy.soundLabel}</p>
                      <p className="text-xs text-muted-foreground">{settingsCopy.soundDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.sound}
                    onCheckedChange={(checked) => {
                      setSettings((prev) => ({ ...prev, sound: checked }));
                      if (checked) playUiSound("click");
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                    isVintage ? "border-border/55 bg-background/50" : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{settingsCopy.quickSuggestionsLabel}</p>
                      <p className="text-xs text-muted-foreground">{settingsCopy.quickSuggestionsDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.quickMessageSuggestions}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, quickMessageSuggestions: checked }))}
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                    isVintage ? "border-border/55 bg-background/50" : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{settingsCopy.prefillNameLabel}</p>
                      <p className="text-xs text-muted-foreground">{settingsCopy.prefillNameDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.prefillRecipientFromContact}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, prefillRecipientFromContact: checked }))}
                  />
                </div>
              </div>

              <div className={cn("space-y-3", isVintage && "rounded-2xl border border-border/50 bg-secondary/20 p-4")}>
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground",
                    isVintage && "text-primary/75",
                  )}
                >
                  {settingsCopy.sectionPrivacy}
                </p>
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                    isVintage ? "border-border/55 bg-background/50" : "border-border/60 bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <EyeOff className={cn("w-4 h-4 shrink-0", settings.hideSelf ? "text-primary" : "text-muted-foreground")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{settingsCopy.privacyLabel}</p>
                      <p className="text-xs text-muted-foreground">{settingsCopy.privacyDesc}</p>
                    </div>
                  </div>
                  <Switch checked={settings.hideSelf} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, hideSelf: checked }))} />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/40 pt-4">
              {settingsCopy.footerHint ? (
                <p className="text-[11px] text-muted-foreground text-left w-full sm:max-w-[55%] order-2 sm:order-1">{settingsCopy.footerHint}</p>
              ) : (
                <span className="hidden sm:block order-1" />
              )}
              <Button variant="outline" className="w-full sm:w-auto order-1 sm:order-2" onClick={() => setSettingsOpen(false)}>
                {settingsCopy.closeButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={regionOpen} onOpenChange={setRegionOpen}>
          <DialogContent className="sm:max-w-lg glass-card border border-border/70">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-primary" />
                Adicionar amigo
              </DialogTitle>
              <DialogDescription>
                Encontre pessoas e envie um pedido de amizade para presentear e compartilhar recomendações.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-background via-card to-background border border-border/70">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.25),transparent_55%)] opacity-80" />
                <motion.div
                  className="absolute inset-4 rounded-full border border-primary/30 bg-background/40"
                  initial={{ scale: 0.9, opacity: 0.9 }}
                  animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.9, 0.4, 0.9] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-10 rounded-full border border-primary/20"
                  initial={{ scale: 0.6, opacity: 0.7 }}
                  animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.7, 0.2, 0.7] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.4 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-gold">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Buscar pessoas</div>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={regionQuery}
                    onChange={(e) => setRegionQuery(e.target.value)}
                    placeholder="Buscar por nome ou @username"
                    className="w-full bg-background/80 border border-border/70 rounded-lg pl-9 pr-3 py-2 text-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-transparent"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-primary" />
                    <span>Mesmas barbearias que você</span>
                  </div>
                  <Switch
                    checked={regionOnlySameBarbershop}
                    onCheckedChange={(checked) => setRegionOnlySameBarbershop(checked)}
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {nearbyPeople.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhuma pessoa sugerida para esse raio no momento.
                  </p>
                ) : (
                  nearbyPeople.map((person, idx) => {
                    if (regionOnlySameBarbershop && !person.lastBarbershop) return null;
                    return (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="friend-suggestion-card"
                      >
                        <FriendAvatar friend={person} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {person.name} • {person.distanceKm} km de você
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Também frequenta {person.commonShop}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            {person.isNewInArea && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                Novo na região
                              </span>
                            )}
                            {person.frequent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
                                Amigo de amigos
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 text-xs"
                          onClick={() => {
                            if (!user?.id) return;
                            const toUserId = person.userId ? String(person.userId) : "";
                            if (!toUserId) {
                              toast({
                                title: copy.toastDiscoverUserUnavailableTitle,
                                description: copy.toastDiscoverUserUnavailableDesc,
                              });
                              return;
                            }

                            const fromProfile = {
                              userId: user.id,
                              name: user.name,
                              username: `@${user.name.toLowerCase().replace(/\s+/g, "")}`,
                              avatarColor: "bg-primary",
                              lastBarbershop: "Sua barbearia favorita",
                            };

                            const sent = sendFriendRequest({ fromUserId: user.id, toUserId, fromProfile });
                            if (!sent.ok) {
                              toast({
                                title: copy.toastDiscoverRequestPendingTitle,
                                description: copy.toastDiscoverRequestPendingDesc,
                              });
                              return;
                            }

                            void pushNotification(toUserId, "cliente", {
                              type: "social",
                              title: "Pedido de amizade",
                              message: `${user.name} quer te adicionar para trocar presentes e recomendações.`,
                              priority: "normal",
                              actionType: "friend_accept",
                              actionLabel: "Aceitar",
                              metadata: {
                                requestId: sent.requestId,
                                fromUserId: user.id,
                                fromName: user.name,
                                fromUsername: fromProfile.username,
                                fromAvatarColor: fromProfile.avatarColor,
                                fromLastBarbershop: fromProfile.lastBarbershop,
                              },
                            });

                            toast({ title: copy.toastDiscoverSentTitle, description: copy.toastDiscoverSentDesc });
                            setRegionOpen(false);
                          }}
                        >
                          Adicionar
                        </Button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRegionOpen(false)} className="w-full sm:w-auto">
                Fechar descoberta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientGiftCards;

