import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, ChevronDown, Filter, LayoutList, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import StarRating from "@/components/shop/StarRating";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { ClientHistoryCopy } from "@/lib/clientHistoryCopy";
import { getClientHistoryCopy } from "@/lib/clientHistoryCopy";
import { addReview } from "@/lib/reviews";
import { getBarbershopById, mockBarbershops } from "@/lib/mockBarbershops";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import {
  APPOINTMENTS_CHANGED_EVENT,
  getAppointmentsForClient,
  markAppointmentReviewed,
  type AppointmentRecord,
} from "@/lib/appointments";

type HistoryStatus = "completed" | "rated";
type PeriodFilter = "all" | "year" | "90d";

interface HistoryItem {
  id: number;
  barbershopId?: number;
  barbershop: string;
  service: string;
  date: string;
  dateISO: string;
  pricePaid: number;
  loyaltySaved: number;
  status: HistoryStatus;
  rated: boolean;
  rating?: number;
  feedbackComment?: string;
  barbershopImage: string;
  serviceImage: string;
  resultPhotoUrl?: string;
  /** Quando disponível (mock / futuro agendamento). */
  professional?: string;
}

const APPOINTMENT_HISTORY_ID_OFFSET = 10_000_000;

const FALLBACK_BARBER_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=80";
const FALLBACK_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=200&q=80";

const PHOTO_STORAGE_KEY = "barberflow_history_result_photos";
const RATING_STORAGE_KEY = "barberflow_history_ratings";
const FEEDBACK_STORAGE_KEY = "barberflow_history_feedbacks";

function dayDiff(iso: string) {
  const now = new Date();
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function avgIntervalSameService(items: HistoryItem[], service: string): number | null {
  const asc = items
    .filter((i) => i.service === service)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  if (asc.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 1; i < asc.length; i++) {
    const d1 = new Date(asc[i].dateISO).getTime();
    const d0 = new Date(asc[i - 1].dateISO).getTime();
    diffs.push(Math.floor((d1 - d0) / 86400000));
  }
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

function topBarbershopLastMonths(
  items: HistoryItem[],
  months: number,
): { name: string; count: number } | null {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const recent = items.filter((i) => new Date(i.dateISO) >= cutoff);
  if (!recent.length) return null;
  const counts: Record<string, number> = {};
  for (const i of recent) counts[i.barbershop] = (counts[i.barbershop] ?? 0) + 1;
  const ent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!ent) return null;
  return { name: ent[0], count: ent[1] };
}

function priceBand(items: HistoryItem[]): { min: number; max: number } | null {
  if (items.length < 2) return null;
  const prices = [...items.map((i) => i.pricePaid)].sort((a, b) => a - b);
  const low = prices[0];
  const high = prices[prices.length - 1];
  if (high - low < 12) return { min: low, max: high };
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  return { min: q1, max: q3 };
}

function cardSystemInsight(
  item: HistoryItem,
  sortedHistory: HistoryItem[],
  copy: ClientHistoryCopy,
  globalAvgInterval: number | null,
): string {
  const same = avgIntervalSameService(sortedHistory, item.service);
  if (same != null && same >= 14) {
    return copy.insightRepeatWeeks(Math.max(1, Math.round(same / 7)));
  }
  if (same != null && same >= 1) {
    return copy.insightRepeatServiceFallback(same);
  }
  if (globalAvgInterval != null && globalAvgInterval >= 7) {
    return copy.insightRepeatWeeks(Math.max(1, Math.round(globalAvgInterval / 7)));
  }
  return copy.insightDaysSinceLast(dayDiff(item.dateISO));
}

function buildRecommendations(
  history: HistoryItem[],
  copy: ClientHistoryCopy,
  avgInterval: number | null,
): string[] {
  const sorted = [...history].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  const out: string[] = [];
  if (!sorted.length) return out;
  const first = sorted[0];
  const d = dayDiff(first.dateISO);
  if (d >= 30) out.push(copy.recLineLastStyle(first.service, d));
  else if (d >= 21) out.push(copy.recLineReturnSoon(d));

  if (avgInterval != null && avgInterval >= 10) {
    const w = Math.max(1, Math.round(avgInterval / 7));
    if (!out.some((l) => l.includes(String(w)))) {
      out.push(copy.recLineRhythmWeeks(w));
    }
  }

  const top = topBarbershopLastMonths(history, 3);
  if (top && top.count >= 2) out.push(copy.recLineTopShop(top.name, 3));

  const band = priceBand(history);
  if (band && history.length >= 3) out.push(copy.recLinePriceBand(band.min, band.max));

  const seen = new Set<string>();
  const deduped = out.filter((line) => {
    const key = line.slice(0, 48);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length === 0 && sorted.length >= 1) {
    const first = sorted[0];
    deduped.push(copy.recLineLastStyle(first.service, dayDiff(first.dateISO)));
  }
  return deduped.slice(0, 4);
}

function appointmentToHistoryItem(apt: AppointmentRecord): HistoryItem {
  const shop = getBarbershopById(apt.barbershopId);
  const profile = getBarbershopProfile(apt.barbershopId);
  const barbershopName =
    apt.barbershopName || profile.nomeBarbearia || shop?.name || `Barbearia #${apt.barbershopId}`;
  const parts = apt.date.split("/").map((p) => p.trim());
  const dateISO =
    parts.length === 3
      ? `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
      : new Date().toISOString().slice(0, 10);
  const cover = (apt.thumbnailUrl || profile.coverPhotoUrl || "").trim();
  const img = cover || FALLBACK_BARBER_IMAGE;
  const price = apt.price ?? 0;
  const hasReview = Boolean(apt.ratingSubmittedAt);

  return {
    id: APPOINTMENT_HISTORY_ID_OFFSET + apt.id,
    barbershopId: apt.barbershopId,
    barbershop: barbershopName,
    service: apt.service,
    date: apt.date,
    dateISO,
    pricePaid: price,
    loyaltySaved: Math.min(50, Math.round(price * 0.15)),
    status: hasReview ? "rated" : "completed",
    rated: hasReview,
    barbershopImage: img,
    serviceImage: img !== FALLBACK_BARBER_IMAGE ? img : FALLBACK_SERVICE_IMAGE,
  };
}

function enrichHistoryFromLocalStorage(items: HistoryItem[]): HistoryItem[] {
  let photosMap: Record<string, string> = {};
  let ratingsMap: Record<string, number> = {};
  let feedbackMap: Record<string, string> = {};

  try {
    const rawPhotos = localStorage.getItem(PHOTO_STORAGE_KEY);
    if (rawPhotos) photosMap = JSON.parse(rawPhotos);
  } catch {
    photosMap = {};
  }

  try {
    const rawRatings = localStorage.getItem(RATING_STORAGE_KEY);
    if (rawRatings) ratingsMap = JSON.parse(rawRatings);
  } catch {
    ratingsMap = {};
  }

  try {
    const rawFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (rawFeedback) feedbackMap = JSON.parse(rawFeedback);
  } catch {
    feedbackMap = {};
  }

  return items.map((item) => {
    const rating = ratingsMap[String(item.id)];
    const photo = photosMap[String(item.id)];
    const feedback = feedbackMap[String(item.id)];
    const isRated = typeof rating === "number";
    return {
      ...item,
      rated: isRated ? true : item.rated,
      rating: isRated ? rating : item.rating,
      feedbackComment: feedback || item.feedbackComment,
      status: isRated ? "rated" : item.status === "rated" ? "rated" : item.status,
      resultPhotoUrl: photo || item.resultPhotoUrl,
    };
  });
}

const mockHistory: HistoryItem[] = [
  {
    id: 1,
    barbershop: "Barbearia Premium",
    service: "Corte Degradê",
    professional: "Rafael",
    date: "01/03/2026",
    dateISO: "2026-03-01",
    pricePaid: 55,
    loyaltySaved: 8,
    status: "rated",
    rated: true,
    rating: 5,
    barbershopImage:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=80",
    serviceImage:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 2,
    barbershop: "Classic Barber",
    service: "Corte + Barba",
    professional: "Marcos",
    date: "15/02/2026",
    dateISO: "2026-02-15",
    pricePaid: 80,
    loyaltySaved: 12,
    status: "completed",
    rated: false,
    barbershopImage:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=200&q=80",
    serviceImage:
      "https://images.unsplash.com/photo-1593702288056-f8394a5e6e24?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 3,
    barbershop: "King's Cut",
    service: "Barba Completa",
    professional: "Diego",
    date: "01/02/2026",
    dateISO: "2026-02-01",
    pricePaid: 40,
    loyaltySaved: 5,
    status: "rated",
    rated: true,
    rating: 4,
    barbershopImage:
      "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=200&q=80",
    serviceImage:
      "https://images.unsplash.com/photo-1621607512407-3c6d7b15f39f?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: 4,
    barbershop: "Studio Gold",
    service: "Corte Social",
    date: "08/01/2026",
    dateISO: "2026-01-08",
    pricePaid: 45,
    loyaltySaved: 6,
    status: "completed",
    rated: false,
    barbershopImage:
      "https://images.unsplash.com/photo-1621605816171-8a4ecf7a64de?auto=format&fit=crop&w=200&q=80",
    serviceImage:
      "https://images.unsplash.com/photo-1599351431402-6f2dd8f5cf58?auto=format&fit=crop&w=200&q=80",
  },
];

const ClientHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = useMemo(() => getClientHistoryCopy(identity), [identity]);
  const headingFont = isVintage ? "font-vintage-heading" : "font-display";
  const [history, setHistory] = useState<HistoryItem[]>(() => enrichHistoryFromLocalStorage(mockHistory));
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [unitFilter, setUnitFilter] = useState("");
  const [proFilter, setProFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [onlyPhoto, setOnlyPhoto] = useState(false);
  const [onlyRated, setOnlyRated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackPhotoDraft, setFeedbackPhotoDraft] = useState<string | undefined>(undefined);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    [history],
  );

  const rebuildHistory = useCallback(() => {
    const base =
      user?.role === "cliente"
        ? [
            ...getAppointmentsForClient(user.id, user.name)
              .filter((a) => a.status === "completed")
              .map(appointmentToHistoryItem),
            ...mockHistory,
          ]
        : mockHistory;
    setHistory(enrichHistoryFromLocalStorage(base));
  }, [user]);

  useEffect(() => {
    rebuildHistory();
  }, [rebuildHistory]);

  useEffect(() => {
    const handler = () => rebuildHistory();
    window.addEventListener(APPOINTMENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(APPOINTMENTS_CHANGED_EVENT, handler);
  }, [rebuildHistory]);

  const statsDetail = useMemo(() => {
    const year = new Date().getFullYear();
    const yearItems = history.filter((item) => new Date(item.dateISO).getFullYear() === year);
    const yearCuts = yearItems.length;
    const loyaltySaved = yearItems.reduce((sum, item) => sum + item.loyaltySaved, 0);
    const avgTicket =
      yearItems.length > 0 ? yearItems.reduce((s, i) => s + i.pricePaid, 0) / yearItems.length : 0;
    let avgInterval: number | null = null;
    if (sortedHistory.length >= 2) {
      const diffs: number[] = [];
      for (let i = 0; i < sortedHistory.length - 1; i++) {
        const d1 = new Date(sortedHistory[i].dateISO).getTime();
        const d2 = new Date(sortedHistory[i + 1].dateISO).getTime();
        diffs.push(Math.floor((d1 - d2) / 86400000));
      }
      avgInterval = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
    const counts: Record<string, number> = {};
    for (const h of history) {
      counts[h.service] = (counts[h.service] ?? 0) + 1;
    }
    const favoriteStyle = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { year, yearCuts, loyaltySaved, avgTicket, avgInterval, favoriteStyle };
  }, [history, sortedHistory]);

  const filterOptions = useMemo(() => {
    const units = [...new Set(history.map((h) => h.barbershop))].sort();
    const pros = [
      ...new Set(history.map((h) => h.professional).filter((p): p is string => Boolean(p))),
    ].sort();
    const services = [...new Set(history.map((h) => h.service))].sort();
    return { units, pros, services };
  }, [history]);

  const filtered = useMemo(() => {
    const year = new Date().getFullYear();
    const cutoff90 = new Date();
    cutoff90.setDate(cutoff90.getDate() - 90);
    const q = search.trim().toLowerCase();

    return sortedHistory
      .filter((item) => {
        if (period === "year" && new Date(item.dateISO).getFullYear() !== year) return false;
        if (period === "90d" && new Date(item.dateISO) < cutoff90) return false;
        if (unitFilter && item.barbershop !== unitFilter) return false;
        if (proFilter && item.professional !== proFilter) return false;
        if (serviceFilter && item.service !== serviceFilter) return false;
        if (onlyPhoto && !item.resultPhotoUrl) return false;
        if (onlyRated && !item.rated) return false;
        if (!q) return true;
        return (
          item.barbershop.toLowerCase().includes(q) ||
          item.service.toLowerCase().includes(q) ||
          (item.professional?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [
    sortedHistory,
    search,
    period,
    unitFilter,
    proFilter,
    serviceFilter,
    onlyPhoto,
    onlyRated,
  ]);

  const rest = useMemo(() => filtered, [filtered]);

  const recommendationLines = useMemo(
    () => buildRecommendations(history, copy, statsDetail.avgInterval),
    [history, copy, statsDetail.avgInterval],
  );

  const activeFilterCount =
    (period !== "all" ? 1 : 0) +
    (unitFilter ? 1 : 0) +
    (proFilter ? 1 : 0) +
    (serviceFilter ? 1 : 0) +
    (onlyPhoto ? 1 : 0) +
    (onlyRated ? 1 : 0);

  const clearFilters = () => {
    setPeriod("all");
    setUnitFilter("");
    setProFilter("");
    setServiceFilter("");
    setOnlyPhoto(false);
    setOnlyRated(false);
  };

  const handleFeedbackPhotoChange = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFeedbackPhotoDraft(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const openRatingForm = (item: HistoryItem) => {
    setRatingTarget(item.id);
    setRatingValue(item.rating ?? 5);
    setFeedbackText(item.feedbackComment ?? "");
    setFeedbackPhotoDraft(item.resultPhotoUrl);
  };

  const saveRating = (id: number, rating: number, feedback: string, photoUrl?: string) => {
    const targetItem = history.find((item) => item.id === id);
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rated: true,
              rating,
              feedbackComment: feedback.trim(),
              resultPhotoUrl: photoUrl || item.resultPhotoUrl,
              status: "rated",
            }
          : item,
      ),
    );
    try {
      const raw = localStorage.getItem(RATING_STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      map[String(id)] = rating;
      localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }

    if (photoUrl) {
      try {
        const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
        const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        map[String(id)] = photoUrl;
        localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(map));
      } catch {
        /* ignore */
      }
    }

    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[String(id)] = feedback.trim();
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }

    if (targetItem) {
      if (targetItem.barbershopId != null) {
        addReview(targetItem.barbershopId, user?.name || "Cliente", rating, feedback, { photoUrl });
      } else {
        const matchedShop = mockBarbershops.find(
          (shop) => shop.name.toLowerCase() === targetItem.barbershop.toLowerCase(),
        );
        if (matchedShop) {
          addReview(matchedShop.id, user?.name || "Cliente", rating, feedback, { photoUrl });
        }
      }
    }

    if (user?.id && id >= APPOINTMENT_HISTORY_ID_OFFSET) {
      markAppointmentReviewed(user.id, id - APPOINTMENT_HISTORY_ID_OFFSET);
    }

    setRatingTarget(null);
    setFeedbackText("");
    setFeedbackPhotoDraft(undefined);
    toast({ title: "Feedback enviado", description: "Obrigado pelo seu feedback com foto e avaliação." });
  };

  const handleRebook = (item: HistoryItem) => {
    const barbershopId =
      item.barbershopId ?? mockBarbershops.find((s) => s.name === item.barbershop)?.id;
    navigate("/cliente/novo-agendamento", {
      state: { prefill: { barbershopId, serviceName: item.service } },
    });
    toast({
      title: isVintage ? "Retomando nesta casa" : "Reagendamento",
      description: `${item.barbershop} · ${item.service}`,
    });
  };

  const handleViewDetails = (item: HistoryItem) => {
    if (item.barbershopId != null) {
      navigate(`/cliente/barbearia/${item.barbershopId}`);
      return;
    }
    const matched = mockBarbershops.find(
      (s) => s.name.toLowerCase() === item.barbershop.toLowerCase(),
    );
    if (matched) {
      navigate(`/cliente/barbearia/${matched.id}`);
      return;
    }
    navigate("/cliente/buscar", { state: { initialQuery: item.barbershop } });
  };

  const handleRecCta = () => {
    navigate("/cliente/novo-agendamento");
  };

  const renderRatingForm = (item: HistoryItem) =>
    ratingTarget === item.id ? (
      <div
        className={cn(
          "rounded-lg border p-3 space-y-3 mt-3",
          isVintage ? "border-border/50 bg-secondary/15" : "border-border/50 bg-muted/30",
        )}
      >
        <div className="flex items-center gap-2">
          <StarRating rating={ratingValue} interactive onChange={setRatingValue} size={14} />
          <span className="text-xs text-muted-foreground">{ratingValue}/5</span>
        </div>
        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Conte como foi seu atendimento..."
          className="min-h-[74px]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`feedback-photo-${item.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFeedbackPhotoChange(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            className={isVintage ? "border-border/60" : undefined}
            onClick={() =>
              (document.getElementById(`feedback-photo-${item.id}`) as HTMLInputElement | null)?.click()
            }
          >
            <Camera className="w-4 h-4 mr-1.5" />
            {feedbackPhotoDraft ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {feedbackPhotoDraft && (
            <img
              src={feedbackPhotoDraft}
              alt="Prévia"
              className="w-10 h-10 rounded-md object-cover border border-border/50"
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isVintage ? "gold-outline" : "default"}
            onClick={() => saveRating(item.id, ratingValue, feedbackText, feedbackPhotoDraft)}
          >
            Enviar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRatingTarget(null);
              setFeedbackText("");
              setFeedbackPhotoDraft(undefined);
            }}
          >
            Cancelar
          </Button>
        </div>
      </div>
    ) : null;

  const isEmptyHistory = history.length === 0;

  return (
    <DashboardLayout userType="cliente">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("space-y-8 max-w-4xl mx-auto", isVintage && "pb-4")}
      >
        <div>
          <h1 className={cn(headingFont, "text-2xl lg:text-3xl font-bold text-foreground tracking-tight")}>
            {copy.pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-[56ch] leading-relaxed">{copy.pageSubtitle}</p>
        </div>

        {isEmptyHistory ? (
          <div
            className={cn(
              "rounded-xl border p-8 text-center space-y-4",
              isVintage ? "glass-card border-border/55" : "bg-card/70 border-border/40",
            )}
          >
            <h2 className={cn(headingFont, "text-lg font-semibold text-foreground")}>{copy.emptyFullTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{copy.emptyFullBody}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant={isVintage ? "gold-outline" : "gold"} onClick={() => navigate("/cliente/novo-agendamento")}>
                {copy.emptyFullCtaBook}
              </Button>
              <Button variant="outline" onClick={() => navigate("/cliente/buscar")}>
                {copy.emptyFullCtaExplore}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl p-4 sm:p-5 border",
                isVintage
                  ? "glass-card border-border/55"
                  : "bg-card/80 border-border/35 shadow-sm",
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide flex items-center gap-2 text-muted-foreground",
                  !isVintage && "text-foreground/80",
                )}
              >
                <LayoutList className="w-3.5 h-3.5 opacity-70" />
                {copy.statsTitle}
              </p>
              <div
                className={cn(
                  "mt-4 grid gap-3 text-sm",
                  isVintage ? "sm:grid-cols-3" : "sm:grid-cols-3",
                )}
              >
                {!isVintage ? (
                  <>
                    <div className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsCutsYear(statsDetail.year)}
                      </p>
                      <p className={cn(headingFont, "text-lg font-bold text-foreground tabular-nums mt-0.5")}>
                        {statsDetail.yearCuts}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsAvgTicket}
                      </p>
                      <p className={cn(headingFont, "text-lg font-bold text-foreground tabular-nums mt-0.5")}>
                        R$ {statsDetail.avgTicket.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-background/50 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsAvgInterval}
                      </p>
                      <p className={cn(headingFont, "text-lg font-bold text-foreground tabular-nums mt-0.5")}>
                        {statsDetail.avgInterval != null
                          ? `${statsDetail.avgInterval} dias`
                          : copy.statsNoInterval}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsCutsYear(statsDetail.year)}
                      </p>
                      <p className={cn(headingFont, "text-lg font-bold text-foreground tabular-nums mt-0.5")}>
                        {statsDetail.yearCuts}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsLoyalty}
                      </p>
                      <p className={cn(headingFont, "text-lg font-bold text-primary tabular-nums mt-0.5")}>
                        R$ {statsDetail.loyaltySaved.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2.5">
                      <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                        {copy.statsFavoriteStyle}
                      </p>
                      <p className="text-base font-medium text-foreground mt-0.5">{statsDetail.favoriteStyle}</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            <div
              className={cn(
                "flex flex-col sm:flex-row gap-2 sm:items-stretch",
              )}
            >
              <div
                className={cn(
                  "relative flex-1 rounded-xl border px-1",
                  isVintage ? "glass-card border-border/55" : "bg-card/70 border-border/35",
                )}
              >
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className={cn(
                    "pl-9 h-11 border-0 bg-transparent shadow-none focus-visible:ring-0",
                    "placeholder:text-muted-foreground/50 focus:placeholder-transparent transition-all"
                  )}
                />
              </div>
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 shrink-0 gap-2",
                      isVintage && "border-border/60",
                      activeFilterCount > 0 && "border-primary/40 text-foreground",
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    {copy.filtersButton}
                    {activeFilterCount > 0 ? (
                      <span className="text-[10px] tabular-nums rounded-full bg-primary/15 px-1.5 py-0.5">
                        {activeFilterCount}
                      </span>
                    ) : null}
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-w-[calc(100vw-2rem)]" align="end">
                  <p className="text-sm font-medium text-foreground mb-3">{copy.filtersTitle}</p>
                  <div className="space-y-3 max-h-[min(70vh,420px)] overflow-y-auto pr-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{copy.filterPeriodLabel}</Label>
                      <select
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                      >
                        <option value="all">{copy.filterPeriodAll}</option>
                        <option value="year">{copy.filterPeriodYear}</option>
                        <option value="90d">{copy.filterPeriod90d}</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{copy.filterUnit}</Label>
                      <select
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm"
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                      >
                        <option value="">{copy.filterUnitAll}</option>
                        {filterOptions.units.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{copy.filterProfessional}</Label>
                      <select
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm"
                        value={proFilter}
                        onChange={(e) => setProFilter(e.target.value)}
                        disabled={filterOptions.pros.length === 0}
                      >
                        <option value="">{copy.filterProfessionalAll}</option>
                        {filterOptions.pros.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{copy.filterServiceType}</Label>
                      <select
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-sm"
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                      >
                        <option value="">{copy.filterServiceAll}</option>
                        {filterOptions.services.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="f-photo" checked={onlyPhoto} onCheckedChange={(c) => setOnlyPhoto(c === true)} />
                      <Label htmlFor="f-photo" className="text-sm font-normal cursor-pointer">
                        {copy.filterWithPhoto}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="f-rated" checked={onlyRated} onCheckedChange={(c) => setOnlyRated(c === true)} />
                      <Label htmlFor="f-rated" className="text-sm font-normal cursor-pointer">
                        {copy.filterWithRating}
                      </Label>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                      {copy.filterClear}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {filtered.length === 0 ? (
              <div
                className={cn(
                  "rounded-xl p-8 text-center text-muted-foreground border",
                  isVintage ? "glass-card border-border/50" : "bg-muted/20 border-border/35",
                )}
              >
                <p className="text-sm">{copy.emptySearch}</p>
                {activeFilterCount > 0 && (
                  <Button variant="link" className="mt-2 h-auto p-0 text-primary" onClick={clearFilters}>
                    {copy.filterClear}
                  </Button>
                )}
              </div>
            ) : (
              <>

                {rest.length > 0 && (
                  <section className="space-y-3">
                    <h2
                      className={cn(
                        headingFont,
                        "text-sm font-semibold text-muted-foreground uppercase tracking-wide",
                      )}
                    >
                      {copy.sectionRest}
                    </h2>
                    <div
                      className={cn(
                        "rounded-lg border divide-y divide-border/30",
                        isVintage ? "glass-card border-border/45" : "bg-card/55 border-border/35",
                      )}
                    >
                      {rest.map((item) => {
                        const daysAgo = dayDiff(item.dateISO);
                        return (
                          <div key={item.id} className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.barbershop}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.service} · {item.date}
                                  {item.professional ? ` · ${copy.withProfessional(item.professional)}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm tabular-nums text-foreground/90">
                                  R$ {item.pricePaid.toFixed(2).replace(".", ",")}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs text-primary hover:text-primary"
                                  onClick={() => handleRebook(item)}
                                >
                                  {copy.compactRebook}
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <span>{copy.daysAgo(daysAgo)}</span>
                              <span aria-hidden>·</span>
                              {item.rated && item.rating != null ? (
                                <span className="flex items-center gap-1">
                                  <StarRating rating={item.rating} size={11} />
                                  {copy.compactRated}
                                </span>
                              ) : (
                                <span>{copy.compactNoRating}</span>
                              )}
                              {item.resultPhotoUrl ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span>{copy.compactHasPhoto}</span>
                                </>
                              ) : null}
                              {!item.rated ? (
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-[11px] text-primary"
                                  onClick={() => openRatingForm(item)}
                                >
                                  {copy.ctaRatePhoto}
                                </Button>
                              ) : null}
                            </div>
                            {renderRatingForm(item)}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {recommendationLines.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <h2 className={cn(headingFont, "text-base font-semibold text-foreground")}>
                      {copy.sectionRecommendations}
                    </h2>
                    <div
                      className={cn(
                        "rounded-xl border p-4 space-y-3",
                        isVintage
                          ? "glass-card border-border/50"
                          : "bg-card/65 border-border/35",
                      )}
                    >
                      <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
                        {recommendationLines.map((line, i) => (
                          <li key={`${i}-${line.slice(0, 48)}`} className="marker:text-primary/70">
                            {line}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={isVintage ? "gold-outline" : "gold"}
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={handleRecCta}
                      >
                        {copy.recCta}
                      </Button>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientHistory;
