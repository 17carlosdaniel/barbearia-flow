import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Scissors, Copy, QrCode, Clock, RefreshCw, CheckCircle2, Loader2, MessageSquare, Info, SlidersHorizontal, Store, Sparkles, ChevronRight, X, Navigation, Tag, DollarSign, Moon, Heart, ShieldCheck, Zap, ChevronDown, Calendar as CalendarIcon, Globe, Package as PackageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAverageRating, addReview } from "@/lib/reviews";
import { getOpeningStatus } from "@/lib/openingHours";
import { addClientPoints } from "@/lib/loyalty";
import { getGoogleCalendarUrl, downloadIcal } from "@/lib/calendarExport";
import { mockBarbershops, getBarbershopById, type Barbershop } from "@/lib/mockBarbershops";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { canAddAppointment, addAppointment } from "@/lib/appointments";
import { getBarberCatalog } from "@/lib/barberCatalog";
import { pushNotification } from "@/lib/notifications";

const TAXA_AGENDAMENTO = 12;
const TEMPO_PAGAMENTO_SEGUNDOS = 5 * 60; // 5 minutos

const SERVICE_OPTIONS = [
  { name: "Corte clássico", icon: Scissors },
  { name: "Corte degradê", icon: Sparkles },
  { name: "Corte + barba", icon: Star },
  { name: "Pacote premium", icon: QrCode },
];

const SERVICE_FILTERS = [
  { key: "corte", label: "Corte", icon: Scissors },
  { key: "barba", label: "Barba", icon: Star },
  { key: "degrad", label: "Degradê", icon: Sparkles },
  { key: "sobrancelha", label: "Sobrancelha", icon: Sparkles },
];

/** Gera um código Pix copia e cola simulado (formato BRCode simplificado para demonstração). */
function gerarPixCopiaECola(chavePix: string, valorCentavos: number): string {
  const valorStr = (valorCentavos / 100).toFixed(2).replace(".", "");
  return `00020126580014br.gov.bcb.pix0136${chavePix.replace(/\D/g, "").padEnd(36, "0")}520400005303986540${valorStr.length}${valorStr}5802BR5925BARBEFLOW TAXA AGENDAM6009SAO PAULO62070503***6304`;
}

function formatarTimer(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const FAVORITOS_STORAGE_KEY = "clientSearchFavoritos";

function getEstadoFromLocation(loc: string): string | null {
  const parts = loc.split(",").map((p) => p.trim());
  const uf = parts[parts.length - 1];
  return uf && uf.length === 2 ? uf : null;
}

type EstadoFiltro = "todos" | "SP" | "RJ" | "MG" | "BA";
type StatusFiltro = "todos" | "aberta" | "fechada";
type OrdenacaoFiltro = "distancia" | "rating" | "preco" | "popularidade";
type DistanceBucket = 5 | 10 | 20 | null;

const ESTADO_CHIPS: { id: EstadoFiltro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "SP", label: "SP" },
  { id: "RJ", label: "RJ" },
  { id: "MG", label: "MG" },
  { id: "BA", label: "BA" },
];

function loadFavoritos(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "number") : [];
    }
  } catch (error) {
    console.error("loadFavoritos failed", error);
  }
  return [];
}

function parsePrice(value?: string): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function distanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): number {
  const r = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "sao paulo": { lat: -23.5505, lon: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
  "belo horizonte": { lat: -19.9167, lon: -43.9345 },
  "salvador": { lat: -12.9714, lon: -38.5014 },
};

const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
  SP: { lat: -23.5505, lon: -46.6333 },
  RJ: { lat: -22.9068, lon: -43.1729 },
  MG: { lat: -19.9167, lon: -43.9345 },
  BA: { lat: -12.9714, lon: -38.5014 },
};

function resolveShopCoords(locationLabel: string, cidade?: string, estado?: string) {
  const cityKey = (cidade ?? locationLabel).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (cityKey.includes(city)) return coords;
  }
  const uf = (estado || getEstadoFromLocation(locationLabel) || "").toUpperCase();
  return STATE_COORDS[uf] ?? null;
}

const ClientSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [selectedShop, setSelectedShop] = useState<Barbershop | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<"confirmar" | "pagamento">("confirmar");
  const [segundosRestantes, setSegundosRestantes] = useState(TEMPO_PAGAMENTO_SEGUNDOS);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [autoVerifyActive, setAutoVerifyActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const verifyIntervalRef = useRef<number | null>(null);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [shopToReview, setShopToReview] = useState<Barbershop | null>(null);
  const [avaliarDialogOpen, setAvaliarDialogOpen] = useState(false);
  const [avaliarRating, setAvaliarRating] = useState(0);
  const [avaliarComment, setAvaliarComment] = useState("");
  const [somenteAbertas, setSomenteAbertas] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [ordenacaoDropdownOpen, setOrdenacaoDropdownOpen] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [ratingMin, setRatingMin] = useState<number>(0);
  const [precoMin, setPrecoMin] = useState<string>("");
  const [precoMax, setPrecoMax] = useState<string>("");
  const [distanceLimitKm, setDistanceLimitKm] = useState<DistanceBucket>(null);
  const [somentePromocoes, setSomentePromocoes] = useState(false);
  const [somenteFavoritos, setSomenteFavoritos] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoFiltro>("distancia");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [favoritos, setFavoritos] = useState<number[]>(loadFavoritos);
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [payCtaLoading, setPayCtaLoading] = useState(false);

  const { user } = useAuth();

  const toggleFavorito = (shopId: number) => {
    setFavoritos((prev) => {
      const next = prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId];
      try {
        localStorage.setItem(FAVORITOS_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("save favorito failed", error);
      }
      return next;
    });
  };

  useEffect(() => {
    const agendarId = (location.state as { agendarShopId?: number })?.agendarShopId;
    if (agendarId) {
      const shop = getBarbershopById(agendarId);
      if (shop) {
        setSelectedShop(shop);
        setStep("confirmar");
        setDialogOpen(true);
        setSegundosRestantes(TEMPO_PAGAMENTO_SEGUNDOS);
        setTempoEsgotado(false);
      }
      window.history.replaceState({}, "", location.pathname);
    }
  }, [location.state, location.pathname]);

  useEffect(() => {
    const introState = (location.state as { fromClientIntro?: boolean; introGeoStatus?: "granted" | "denied" | "unavailable" | "skipped" } | null);
    if (!introState?.fromClientIntro) return;
    if (introState.introGeoStatus === "granted") {
      toast({
        title: "Localização ativada",
        description: "Perfeito. Já estamos priorizando barbearias próximas de você.",
      });
    } else if (introState.introGeoStatus === "denied" || introState.introGeoStatus === "unavailable") {
      toast({
        title: "Localização não ativada",
        description: "Sem problemas. Você ainda pode buscar barbearias manualmente.",
      });
    }
    navigate(location.pathname, { replace: true });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    let cancelled = false;

    const applyBlocked = () => {
      if (!cancelled) setGeoBlocked(true);
    };

    const applyCoords = (lat: number, lon: number) => {
      if (cancelled) return;
      setUserCoords({ lat, lon });
      setGeoBlocked(false);
    };

    if (!navigator.geolocation) {
      applyBlocked();
      return () => {
        cancelled = true;
      };
    }

    const tryResolve = async () => {
      try {
        const permissions = (navigator as Navigator & { permissions?: Permissions }).permissions;
        if (permissions?.query) {
          const status = await permissions.query({ name: "geolocation" as PermissionName });
          if (status.state === "denied") {
            applyBlocked();
            return;
          }
        }
      } catch {
        applyBlocked();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => applyCoords(position.coords.latitude, position.coords.longitude),
        () => applyBlocked(),
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
      );
    };

    void tryResolve();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedServiceFilters = useMemo(
    () => servicosSelecionados.map((s) => normalizeText(s)),
    [servicosSelecionados],
  );

  const hasActiveFilters = useMemo(() => (
    somenteAbertas ||
    statusFiltro !== "todos" ||
    ratingMin > 0 ||
    precoMin.trim() !== "" ||
    precoMax.trim() !== "" ||
    distanceLimitKm !== null ||
    somentePromocoes ||
    somenteFavoritos ||
    estadoFiltro !== "todos" ||
    servicosSelecionados.length > 0
  ), [
    somenteAbertas,
    statusFiltro,
    ratingMin,
    precoMin,
    precoMax,
    distanceLimitKm,
    somentePromocoes,
    somenteFavoritos,
    estadoFiltro,
    servicosSelecionados.length,
  ]);

  const enrichedShops = useMemo(() => {
    return mockBarbershops.map((shop) => {
      const profile = getBarbershopProfile(shop.id);
      const rating = getAverageRating(shop.id).count > 0 ? getAverageRating(shop.id).average : shop.rating;
      const status = getOpeningStatus(shop.id).status;
      const precoNumero = parsePrice(profile.precoMedio);
      const temPromocao = (profile.promocoes?.length ?? 0) > 0;
      const catalog = getBarberCatalog(shop.id);
      const servicesCatalog = catalog.services.map((s) => normalizeText(s.name));
      const coords = resolveShopCoords(shop.location, profile.cidade, profile.estado);
      const distance = userCoords && coords ? distanceKm(userCoords, coords) : null;
      return {
        shop,
        profile,
        rating,
        status,
        precoNumero,
        temPromocao,
        servicesCatalog,
        distance,
      };
    });
  }, [reviewVersion, userCoords]);

  const displayList = useMemo(() => {
    const queryLower = query.toLowerCase().trim();
    const filtered = enrichedShops
      .filter(({ shop, profile }) => {
        if (!queryLower) return true;
        return (
          shop.name.toLowerCase().includes(queryLower) ||
          shop.location.toLowerCase().includes(queryLower) ||
          (profile.cidade ?? "").toLowerCase().includes(queryLower)
        );
      })
      .filter(({ status }) => !somenteAbertas || status === "open")
      .filter(({ status }) => {
        if (statusFiltro === "todos") return true;
        return statusFiltro === "aberta" ? status === "open" : status === "closed";
      })
      .filter(({ rating }) => rating >= ratingMin)
      .filter(({ precoNumero }) => {
        const min = parsePrice(precoMin);
        const max = parsePrice(precoMax);
        if (precoNumero == null) return !(min || max);
        if (min != null && precoNumero < min) return false;
        if (max != null && precoNumero > max) return false;
        return true;
      })
      .filter(({ temPromocao }) => (somentePromocoes ? temPromocao : true))
      .filter(({ distance }) => (distanceLimitKm === null ? true : distance !== null && distance <= distanceLimitKm))
      .filter(({ shop }) => {
        if (estadoFiltro === "todos") return true;
        const uf = getEstadoFromLocation(shop.location);
        return uf === estadoFiltro;
      })
      .filter(({ shop }) => (!somenteFavoritos ? true : favoritos.includes(shop.id)))
      .filter(({ servicesCatalog }) => {
        if (!normalizedServiceFilters.length) return true;
        return normalizedServiceFilters.every((wanted) =>
          servicesCatalog.some((name) => name.includes(wanted))
        );
      });

    filtered.sort((a, b) => {
      if (ordenacao === "distancia") {
        const ad = a.distance ?? Number.MAX_SAFE_INTEGER;
        const bd = b.distance ?? Number.MAX_SAFE_INTEGER;
        return ad - bd;
      }
      if (ordenacao === "rating") return b.rating - a.rating;
      if (ordenacao === "preco") {
        const ap = a.precoNumero ?? Number.MAX_SAFE_INTEGER;
        const bp = b.precoNumero ?? Number.MAX_SAFE_INTEGER;
        return ap - bp;
      }
      return b.shop.services - a.shop.services;
    });

    return filtered;
  }, [
    query,
    enrichedShops,
    somenteAbertas,
    statusFiltro,
    ratingMin,
    precoMin,
    precoMax,
    somentePromocoes,
    somenteFavoritos,
    distanceLimitKm,
    estadoFiltro,
    normalizedServiceFilters,
    ordenacao,
  ]);

  const clearAllFilters = () => {
    setSomenteAbertas(false);
    setStatusFiltro("todos");
    setRatingMin(0);
    setPrecoMin("");
    setPrecoMax("");
    setDistanceLimitKm(null);
    setSomentePromocoes(false);
    setSomenteFavoritos(false);
    setEstadoFiltro("todos");
    setServicosSelecionados([]);
    setOrdenacao("distancia");
  };

  const pixCopiaECola = selectedShop
    ? gerarPixCopiaECola(selectedShop.pixChave, TAXA_AGENDAMENTO * 100)
    : "";
  const podePagar = selectedShop?.pixChave && selectedShop.pixChave.trim() !== "";

  const selectedCatalog = selectedShop ? getBarberCatalog(selectedShop.id) : { services: [], packages: [] };
  const selectedServiceFromCatalog =
    selectedCatalog.services.find((s) => s.name.toLowerCase() === selectedServiceName.toLowerCase()) ??
    selectedCatalog.services.find((s) => s.name.toLowerCase().includes(selectedServiceName.toLowerCase())) ??
    null;
  const estimatedTotal = selectedServiceFromCatalog?.price ?? null;
  const remainingAtShop = estimatedTotal !== null ? Math.max(estimatedTotal - TAXA_AGENDAMENTO, 0) : null;

  const iniciarTimer = useCallback(() => {
    setTempoEsgotado(false);
    setSegundosRestantes(TEMPO_PAGAMENTO_SEGUNDOS);
  }, []);

  useEffect(() => {
    if (step !== "pagamento" || tempoEsgotado) return;
    if (segundosRestantes <= 0) {
      setTempoEsgotado(true);
      return;
    }
    const t = setInterval(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, segundosRestantes, tempoEsgotado]);

  const handleAgendar = (shop: Barbershop) => {
    const openStatus = getOpeningStatus(shop.id);
    if (openStatus.status === "closed") {
      toast({
        title: "Barbearia fechada",
        description: openStatus.detail
          ? `Não é possível agendar agora. ${openStatus.detail}`
          : "Agendamentos só quando a barbearia estiver aberta.",
        variant: "destructive",
      });
      return;
    }
    const profile = getBarbershopProfile(shop.id);
    const { ok, count, limit } = canAddAppointment(shop.id, profile.plano);
    if (!ok && limit !== null) {
      toast({
        title: "Limite de agendamentos",
        description: `Esta barbearia atingiu o limite do plano (${limit} agendamentos/mês). Tente no próximo mês ou escolha outra barbearia.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedShop(shop);
    setStep("confirmar");
    setDialogOpen(true);
    setTempoEsgotado(false);
    setSegundosRestantes(TEMPO_PAGAMENTO_SEGUNDOS);
  };

  const handleIrParaPagamento = () => {
    if (!selectedServiceName.trim()) {
      toast({
        title: "Escolha um serviço",
        description: "Selecione qual serviço ou pacote você quer agendar antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    if (!podePagar) {
      toast({
        title: "Pix não disponível",
        description: "Esta barbearia ainda não configurou o recebimento por Pix.",
        variant: "destructive",
      });
      return;
    }
    setPayCtaLoading(true);
    window.setTimeout(() => {
      setPayCtaLoading(false);
      setStep("pagamento");
      iniciarTimer();
    }, 380);
  };

  const handleCopiarCodigo = () => {
    if (!pixCopiaECola) return;
    navigator.clipboard.writeText(pixCopiaECola);
    setPixCopiado(true);
    window.setTimeout(() => setPixCopiado(false), 1800);
    toast({ title: "Código copiado!", description: "Cole no app do seu banco para pagar via Pix." });
  };

  const handleFechar = () => {
    setDialogOpen(false);
    setSelectedShop(null);
    setStep("confirmar");
    setTempoEsgotado(false);
    setSegundosRestantes(TEMPO_PAGAMENTO_SEGUNDOS);
    setPagamentoConfirmado(false);
  };

  const handleVerificarPagamento = async (options?: { silent?: boolean; source?: "manual" | "auto" }) => {
    if (!selectedShop) return;
    const profile = getBarbershopProfile(selectedShop.id);
    const catalog = getBarberCatalog(selectedShop.id);
    const { ok, limit } = canAddAppointment(selectedShop.id, profile.plano);
    if (!ok && limit !== null) {
      toast({
        title: "Limite de agendamentos",
        description: `Esta barbearia atingiu o limite do plano (${limit} agendamentos/mês).`,
        variant: "destructive",
      });
      return;
    }
    if (!autoVerifyActive) setAutoVerifyActive(true);
    setVerificandoPagamento(true);
    await new Promise((r) => setTimeout(r, 2000));
    setVerificandoPagamento(false);
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dateStr = `${String(amanha.getDate()).padStart(2, "0")}/${String(amanha.getMonth() + 1).padStart(2, "0")}/${amanha.getFullYear()}`;
    const selectedService =
      catalog.services.find((s) => s.name.toLowerCase() === selectedServiceName.toLowerCase()) ??
      catalog.services.find((s) => s.name.toLowerCase().includes(selectedServiceName.toLowerCase()));
    const location = [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ") || selectedShop.location;
    const nowIso = new Date().toISOString();
    addAppointment(selectedShop.id, {
      clientId: user?.id,
      client: user?.name ?? "Cliente",
      barbershopName: profile.nomeBarbearia || selectedShop.name,
      service: selectedServiceName || "Corte",
      date: dateStr,
      time: "10:00",
      location,
      price: selectedService?.price ?? undefined,
      durationMinutes: selectedService?.durationMinutes ?? profile.tempoMedioMinutos ?? 45,
      thumbnailUrl: profile.coverPhotoUrl ?? undefined,
      whatsAppPhone: profile.telefone ?? undefined,
      status: "confirmed",
      createdAt: nowIso,
      confirmedAt: nowIso,
    });
    setPagamentoConfirmado(true);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1400);
    if (user && selectedShop) addClientPoints(user.id, selectedShop.id, 10);
    if (user) {
      void pushNotification(user.id, "cliente", {
        type: "appointment",
        title: "Agendamento confirmado",
        message: `${profile.nomeBarbearia || selectedShop.name} • ${selectedServiceName || "Corte"} às 10:00`,
        priority: "high",
        pinned: true,
        actionType: "confirm_presence",
        actionLabel: "Ver agendamento",
        actionPayload: "/cliente/agendamentos",
      });
      void pushNotification(user.id, "cliente", {
        type: "loyalty",
        title: "Pontos creditados",
        message: "Você recebeu +10 pontos pelo agendamento.",
        priority: "normal",
        actionType: "open_loyalty",
        actionLabel: "Ver fidelidade",
        actionPayload: "/cliente/fidelidade",
      });
    }
    if (!options?.silent) {
      toast({ title: "Pagamento confirmado!", description: "Sua taxa foi recebida. +10 pontos nesta barbearia!" });
    }
  };

  const handleNovoCodigo = () => {
    iniciarTimer();
    toast({ title: "Novo código", description: "Tempo renovado. Pague dentro de 5 minutos." });
  };

  useEffect(() => {
    if (step !== "pagamento" || tempoEsgotado || pagamentoConfirmado || !autoVerifyActive) return;
    if (verifyIntervalRef.current) window.clearInterval(verifyIntervalRef.current);
    verifyIntervalRef.current = window.setInterval(() => {
      if (verificandoPagamento || pagamentoConfirmado || tempoEsgotado) return;
      void handleVerificarPagamento({ silent: true, source: "auto" });
    }, 8000);
    return () => {
      if (verifyIntervalRef.current) window.clearInterval(verifyIntervalRef.current);
      verifyIntervalRef.current = null;
    };
  }, [autoVerifyActive, pagamentoConfirmado, step, tempoEsgotado, verificandoPagamento]);

  const timerColorClass =
    segundosRestantes <= 20 ? "text-destructive" : segundosRestantes <= 60 ? "text-yellow-400" : "text-foreground";

  const handleAbrirAvaliar = (shop: Barbershop) => {
    setShopToReview(shop);
    setAvaliarRating(0);
    setAvaliarComment("");
    setAvaliarDialogOpen(true);
  };

  const handleEnviarAvaliacao = () => {
    if (!shopToReview || !user) return;
    if (avaliarRating < 1) {
      toast({ title: "Selecione uma nota", description: "Escolha de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    addReview(shopToReview.id, user.name, avaliarRating, avaliarComment);
    void pushNotification(user.id, "cliente", {
      type: "system",
      title: "Avaliação registrada",
      message: "Seu feedback foi enviado com sucesso.",
      priority: "normal",
      actionType: "open_system",
      actionLabel: "Ver notificações",
      actionPayload: "/cliente/notificacoes",
    });
    toast({ title: "Avaliação enviada!", description: "Obrigado por avaliar a barbearia." });
    setReviewVersion((v) => v + 1);
    setAvaliarDialogOpen(false);
    setShopToReview(null);
  };

  return (
    <DashboardLayout userType="cliente">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-24 md:pb-12">
        {/* Bloco 1 — Hero de descoberta (Design Autoral) */}
        <div className="relative pt-8 pb-16 px-4 overflow-hidden rounded-3xl bg-gradient-to-b from-primary/10 via-background to-background border border-primary/5 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_70%)] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-lg shadow-primary/5">
                <Sparkles className="w-3 h-3" />
                Curadoria BarberFlow
              </div>
              <h1 className="text-4xl md:text-6xl font-vintage-display font-bold tracking-tight text-foreground leading-[1.1]">
                Encontre sua <span className="text-gradient-gold">próxima barbearia</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
                Pesquise, compare e agende com as melhores casas de estilo perto de você.
                Uma seleção premium pronta para o seu próximo corte.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative max-w-2xl mx-auto group"
            >
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-1.5 shadow-2xl transition-all duration-300 group-hover:border-primary/40">
                <div className="flex-1 flex items-center px-4">
                  <Search className="w-5 h-5 text-primary/60 mr-3 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome, cidade ou região..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full bg-transparent border-none focus:ring-0 text-base py-3.5 h-auto placeholder:text-muted-foreground/30 font-medium text-foreground"
                  />
                </div>
                
                <div className="flex items-center gap-1 pr-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lon = pos.coords.longitude;
                            setQuery(`Localizando... (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
                          },
                          () => toast({ title: "Localização não disponível", variant: "destructive" })
                        );
                      }
                    }}
                    className="h-11 w-11 p-0 rounded-xl border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                    title="Usar localização"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    type="button"
                    variant="gold"
                    onClick={() => setFilterSheetOpen(true)}
                    className="h-11 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>

                {searchFocused && !query.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 right-0 top-full mt-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl overflow-hidden z-50 p-2"
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-3 group/item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setQuery("abertas agora")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">Barbearias abertas agora</span>
                        <span className="text-[10px] text-muted-foreground">Prontas para te atender agora</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-3 group/item mt-1"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setQuery("melhor avaliadas")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">Mais bem avaliadas</span>
                        <span className="text-[10px] text-muted-foreground">O que há de melhor na região</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              <div className="flex items-center gap-2">
                <span className="text-primary">+1.200</span> barbearias
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <div className="flex items-center gap-2">
                <span className="text-primary">+10.000</span> agendamentos realizados
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <div className="flex items-center gap-2">
                Curadoria <span className="text-primary">Premium</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2 — Refino da busca (Filtros e Ordenação) */}
        <div className="space-y-8 px-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-primary/10">
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">Recortes rápidos</h3>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: "open", label: "Abertas agora", icon: Clock, active: somenteAbertas, onClick: () => setSomenteAbertas(!somenteAbertas) },
                  { id: "stars", label: "4+ estrelas", icon: Star, active: ratingMin >= 4, onClick: () => setRatingMin(ratingMin >= 4 ? 0 : 4) },
                  { id: "dist", label: "Mais próximas", icon: Navigation, active: distanceLimitKm === 10, onClick: () => setDistanceLimitKm(distanceLimitKm === 10 ? null : 10) },
                  { id: "promo", label: "Promoções", icon: Tag, active: somentePromocoes, onClick: () => setSomentePromocoes(!somentePromocoes) },
                ].map((f) => (
                  <motion.button
                    key={f.id}
                    onClick={f.onClick}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border",
                      f.active 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "bg-card/40 border-primary/10 text-muted-foreground hover:border-primary/30 hover:bg-card"
                    )}
                  >
                    <f.icon className={cn("w-3.5 h-3.5", f.active ? "text-primary-foreground" : "text-primary/60")} />
                    {f.label}
                    {f.active && <X className="w-3.5 h-3.5 ml-1 opacity-60" />}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 md:text-right">Região e Ordem</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-card/40 border border-primary/10 rounded-xl p-1">
                  {ESTADO_CHIPS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setEstadoFiltro(id)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        estadoFiltro === id 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground/60 hover:text-muted-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="h-10 w-px bg-primary/10" />

                <div className="relative">
                  <motion.button
                    onClick={() => setOrdenacaoDropdownOpen(!ordenacaoDropdownOpen)}
                    className="h-10 px-4 rounded-xl border border-primary/10 bg-card/40 text-[10px] font-black uppercase tracking-widest text-foreground hover:border-primary/30 transition-all flex items-center gap-3"
                  >
                    {ordenacao === "distancia" && <MapPin className="w-3.5 h-3.5 text-primary" />}
                    {ordenacao === "rating" && <Star className="w-3.5 h-3.5 text-primary" />}
                    {ordenacao === "preco" && <DollarSign className="w-3.5 h-3.5 text-primary" />}
                    {ordenacao === "popularidade" && <Zap className="w-3.5 h-3.5 text-primary" />}
                    <span>{ordenacao === "distancia" ? "Proximidade" : ordenacao === "rating" ? "Avaliação" : ordenacao === "preco" ? "Preço" : "Popularidade"}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 opacity-40 transition-transform", ordenacaoDropdownOpen && "rotate-180")} />
                  </motion.button>
                  <AnimatePresence>
                    {ordenacaoDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-card border border-primary/20 shadow-2xl z-50 overflow-hidden"
                      >
                        {[
                          { id: "distancia", label: "Proximidade", icon: MapPin },
                          { id: "rating", label: "Melhor Avaliadas", icon: Star },
                          { id: "preco", label: "Mais Baratas", icon: DollarSign },
                          { id: "popularidade", label: "Mais Populares", icon: Zap },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setOrdenacao(opt.id as OrdenacaoFiltro);
                              setOrdenacaoDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all text-left"
                          >
                            <opt.icon className="w-3.5 h-3.5" />
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3 — Resultados com curadoria (Vitrine Editorial) */}
        <div className="space-y-8 px-1">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-vintage-display font-bold italic tracking-tight text-foreground">
              {displayList.length === 0
                ? "Nenhuma barbearia encontrada"
                : displayList.length === 1
                  ? "Uma descoberta próxima"
                  : `${displayList.length} barbearias prontas para você`}
            </h2>
            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Limpar refino
              </button>
            )}
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {displayList.map((entry, i) => {
                const { shop, profile, rating, status, temPromocao, precoNumero, distance } = entry;
                const { count } = getAverageRating(shop.id);
                const ratingNum = rating.toFixed(1);
                const enderecoDisplay = profile.endereco?.trim() || profile.cidade || "Endereço não informado";
                const isFav = favoritos.includes(shop.id);
                const coverUrl = profile.coverPhotoUrl?.trim();

                return (
                  <motion.div
                    key={shop.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/cliente/barbearia/${shop.id}`)}
                    className="group relative flex flex-col rounded-3xl border border-primary/10 bg-card/40 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/30 hover:shadow-[0_0_60px_rgba(var(--primary-rgb),0.1)] cursor-pointer"
                  >
                    {/* Bloco 4 — Card de barbearia (Refatorado) */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {coverUrl ? (
                        <img 
                          src={coverUrl} 
                          alt={shop.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-card to-primary/10 flex items-center justify-center">
                          <Store className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                      
                      <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border shadow-xl",
                          status === "open"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                          {status === "open" ? "Aberta" : "Fechada"}
                        </div>
                        {profile.plano === "premium" && (
                          <div className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-xl flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Elite
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(shop.id); }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
                      >
                        <Heart className={cn("w-3.5 h-3.5 transition-colors", isFav ? "fill-primary text-primary" : "text-white/60")} />
                      </button>

                      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-primary px-2 py-0.5 rounded-lg shadow-lg">
                          <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                          <span className="text-[10px] font-black text-primary-foreground">{ratingNum}</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/60 tracking-wider">({count})</span>
                      </div>

                      {typeof distance === "number" && (
                        <div className="absolute bottom-3 right-4 z-20 text-[9px] font-black text-white/70 uppercase tracking-widest flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg">
                          <Navigation className="w-2.5 h-2.5" />
                          {distance.toFixed(1)}km
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="space-y-0.5">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-gradient-gold transition-all duration-500 line-clamp-1">
                            {shop.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-medium line-clamp-1">
                            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
                            {enderecoDisplay}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground">
                            <Scissors className="w-2.5 h-2.5 text-primary/60" />
                            {shop.services} serviços
                          </div>
                          {precoNumero != null && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-muted-foreground">
                              <DollarSign className="w-2.5 h-2.5 text-emerald-500/60" />
                              R$ {precoNumero.toFixed(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-primary/5 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5 group/btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cliente/barbearia/${shop.id}`);
                          }}
                        >
                          Ver
                          <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                        <Button
                          type="button"
                          variant="gold"
                          className="h-10 px-4 flex-1 rounded-xl font-black uppercase tracking-[0.1em] text-[9px] shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgendar(shop);
                          }}
                        >
                          Agendar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {displayList.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/20">
                <Search className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-vintage-display font-bold italic text-foreground">Nada por aqui hoje</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Tente ajustar seus filtros ou buscar por outro termo para encontrar a barbearia ideal.
                </p>
              </div>
              <Button variant="outlineGold" onClick={clearAllFilters} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
                Limpar todos os filtros
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="border-border bg-card sm:max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom h-[90vh] flex flex-col"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-foreground text-lg">Filtros</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Encontre a barbearia perfeita para você
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-4">
            {/* STATUS */}
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1"><CalendarIcon className="w-3.5 h-3.5 inline mr-1" />Status</p>
                <p className="text-[10px] text-muted-foreground">Veja quem pode te atender agora</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                  onClick={() => setStatusFiltro((prev) => (prev === "aberta" ? "todos" : "aberta"))}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`search-filter-card transition-all ${statusFiltro === "aberta" ? "search-filter-card-active" : ""}`}
                >
                  <span className="text-lg"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Aberta</span>
                    <span className="text-[10px] text-muted-foreground">Agora</span>
                  </div>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setStatusFiltro((prev) => (prev === "fechada" ? "todos" : "fechada"))}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`search-filter-card transition-all ${statusFiltro === "fechada" ? "search-filter-card-active" : ""}`}
                >
                  <span className="text-lg">🌙</span>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Fechada</span>
                    <span className="text-[10px] text-muted-foreground">Mais tarde</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* AVALIAÇÃO */}
            <div className="space-y-2 pb-3 border-b border-border/30">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1"><Star className="w-3.5 h-3.5 inline mr-1" />Avaliação</p>
                <p className="text-[10px] text-muted-foreground">Escolha pelos melhores avaliados</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { min: 3, label: "3+", stars: <><Star className="w-3 h-3 inline" /></> },
                  { min: 4, label: "4+", stars: <><Star className="w-3 h-3 inline" /> <Star className="w-3 h-3 inline" /></> },
                  { min: 4.5, label: "4.5+", stars: <><Star className="w-3 h-3 inline" /> <Star className="w-3 h-3 inline" /> <Star className="w-3 h-3 inline" /></> },
                ].map(({ min, label, stars }) => (
                  <motion.button
                    key={min}
                    type="button"
                    onClick={() => setRatingMin((v) => (v === min ? 0 : min))}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`search-filter-card transition-all ${ratingMin === min ? "search-filter-card-active" : ""}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs">{stars}</span>
                      <span className="text-xs font-semibold">{label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* PREÇO */}
            <div className="space-y-2 pb-3 border-b border-border/30">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1"><DollarSign className="w-3.5 h-3.5 inline mr-1" />Preço</p>
                <p className="text-[10px] text-muted-foreground">Encontre opções dentro do seu orçamento</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="search-filter-card flex flex-col items-start gap-1.5 bg-background/40">
                  <span className="text-[10px] font-semibold text-muted-foreground">Mínimo</span>
                  <input
                    value={precoMin}
                    onChange={(e) => setPrecoMin(e.target.value)}
                    placeholder="R$ 40"
                    className="w-full bg-background border border-primary/20 rounded-md px-2.5 py-2 text-xs font-medium placeholder:text-muted-foreground/50 focus:border-primary outline-0"
                  />
                </div>
                <div className="search-filter-card flex flex-col items-start gap-1.5 bg-background/40">
                  <span className="text-[10px] font-semibold text-muted-foreground">Máximo</span>
                  <input
                    value={precoMax}
                    onChange={(e) => setPrecoMax(e.target.value)}
                    placeholder="R$ 120"
                    className="w-full bg-background border border-primary/20 rounded-md px-2.5 py-2 text-xs font-medium placeholder:text-muted-foreground/50 focus:border-primary outline-0"
                  />
                </div>
              </div>
            </div>

            {/* DISTÂNCIA */}
            <div className="space-y-2 pb-3 border-b border-border/30">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1"><MapPin className="w-3.5 h-3.5 inline mr-1" />Distância</p>
                <p className="text-[10px] text-muted-foreground">Busque perto de você</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { km: 5, Icon: MapPin, label: "Perto", desc: "até 5km" },
                  { km: 10, Icon: Navigation, label: "Região", desc: "até 10km" },
                  { km: 20, Icon: Globe, label: "Amplo", desc: "até 20km" },
                ].map(({ km, Icon, label, desc }) => (
                  <motion.button
                    key={km}
                    type="button"
                    onClick={() => setDistanceLimitKm((v) => (v === km ? null : (km as DistanceBucket)))}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`search-filter-card transition-all ${distanceLimitKm === km ? "search-filter-card-active" : ""}`}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
              {geoBlocked && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1.5 flex items-center gap-1.5"
                >
                  <span>
                    <Info className="w-4 h-4" />
                  </span>
                  <span>Ative localização para resultados mais próximos</span>
                </motion.div>
              )}
            </div>

            {/* SERVIÇOS */}
            <div className="space-y-2 pb-3 border-b border-border/30">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1"><Scissors className="w-3.5 h-3.5 inline mr-1" />Serviços</p>
                <p className="text-[10px] text-muted-foreground">Escolha o que você precisa</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_FILTERS.map((service) => {
                  const Icon = service.icon;
                  const active = servicosSelecionados.includes(service.key);
                  return (
                    <motion.button
                      key={service.key}
                      type="button"
                      onClick={() => {
                        setServicosSelecionados((prev) =>
                          prev.includes(service.key)
                            ? prev.filter((k) => k !== service.key)
                            : [...prev, service.key]
                        );
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className={`search-filter-card transition-all ${active ? "search-filter-card-active" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{service.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* CHECKBOXES COM TOGGLE VISUAL */}
            <div className="space-y-4 pb-3 border-b border-border/30">
              <motion.label
                whileHover={{ x: 2 }}
                className={`search-filter-card cursor-pointer transition-all ${somentePromocoes ? "search-filter-card-active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={somentePromocoes}
                  onChange={(e) => setSomentePromocoes(e.target.checked)}
                  className="rounded border-border accent-primary w-4 h-4"
                />
                <span className="text-foreground inline-flex items-center gap-2 font-medium">
                  <Tag className="w-4 h-4 text-primary/70" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Apenas promoções</span>
                    <span className="text-[10px] text-muted-foreground">Economize mais</span>
                  </div>
                </span>
              </motion.label>

              <motion.label
                whileHover={{ x: 2 }}
                className={`search-filter-card cursor-pointer transition-all ${somenteFavoritos ? "search-filter-card-active" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={somenteFavoritos}
                  onChange={(e) => setSomenteFavoritos(e.target.checked)}
                  className="rounded border-border accent-primary w-4 h-4"
                />
                <span className="text-foreground inline-flex items-center gap-2 font-medium">
                  <Heart className="w-4 h-4 text-primary/70" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold">Apenas favoritos</span>
                    <span className="text-[10px] text-muted-foreground">Seus favoritos</span>
                  </div>
                </span>
              </motion.label>
            </div>
          </div>

          <div className="shrink-0 mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            {hasActiveFilters && (
              <motion.button
                type="button"
                onClick={clearAllFilters}
                whileHover={{ x: 2 }}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Limpar
              </motion.button>
            )}
            <div className="flex-1" />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex w-full"
            >
              <Button
                onClick={() => setFilterSheetOpen(false)}
                className="w-full rounded-lg bg-gradient-gold hover:opacity-95 font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ver {displayList.length} resultado{displayList.length === 1 ? "" : "s"}
              </Button>
            </motion.div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleFechar()}>
        <DialogContent className="w-[95vw] sm:w-auto sm:max-w-2xl border border-primary/25 bg-card/80 backdrop-blur-2xl shadow-[0_20px_80px_-28px_hsl(var(--primary)/0.5)]">
          {step === "confirmar" && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-gradient-gold">
                  Finalize seu Agendamento
                </DialogTitle>
                <DialogDescription>
                  Você está reservando seu horário em <strong>{selectedShop?.name}</strong>. A taxa paga agora é
                  abatida do valor final do serviço e garante seu horário.
                </DialogDescription>
              </DialogHeader>

              <div className="glass-card rounded-xl border border-primary/35 bg-primary/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <QrCode className="w-5 h-5 text-primary" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Taxa de reserva</p>
                      <p className="text-xs text-muted-foreground">
                        Pagamento via Pix • valor abatido do serviço
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold text-gradient-gold">R$ {TAXA_AGENDAMENTO},00</p>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Garante seu horário • <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Evita faltas sem aviso • <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Valor descontado do total na barbearia
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="bg-card/80 border border-border/60 rounded-2xl p-4 space-y-3">
                  <Label className="text-sm text-foreground/80">
                    Qual serviço ou pacote você quer agendar?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCatalog.services.map((service, index) => {
                    const active = selectedServiceName === service.name;
                    const isPopular = index === 0;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedServiceName(service.name)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary shadow-[0_12px_32px_-20px_hsl(var(--primary)/0.8)] scale-[1.02]"
                            : "border-border bg-background/85 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-11 h-11 rounded-md bg-secondary/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {service.photoUrl ? (
                              <img
                                src={service.photoUrl}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Scissors className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">{service.name}</span>
                              <span className="text-xs font-semibold text-primary whitespace-nowrap ml-2">
                                R$ {service.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.durationMinutes} min
                              </p>
                              {isPopular && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/12 text-[10px] text-primary whitespace-nowrap">
                                  <Zap className="w-2.5 h-2.5" />
                                  Mais escolhido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {selectedCatalog.packages.map((pkg) => {
                    const active = selectedServiceName === pkg.name;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedServiceName(pkg.name)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary shadow-[0_12px_32px_-20px_hsl(var(--primary)/0.8)] scale-[1.02]"
                            : "border-border bg-background/85 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-11 h-11 rounded-md bg-secondary/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <PackageIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">{pkg.name}</span>
                              <span className="text-xs font-semibold text-primary whitespace-nowrap ml-2">
                                R$ {pkg.price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Pacote • {pkg.discountPercent}% off em serviços combinados
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Resumo</p>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">Serviço</span>
                  <span className="text-muted-foreground">
                    {selectedServiceName || "Não selecionado"}
                  </span>
                </div>
                {selectedServiceFromCatalog && (
                  <>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-foreground">Duração estimada</span>
                      <span className="text-muted-foreground">
                        {selectedServiceFromCatalog.durationMinutes ?? 45} min
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-foreground">Valor total estimado</span>
                      <span className="font-semibold text-foreground">
                        R$ {selectedServiceFromCatalog.price.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="mt-2 h-px bg-border/60" />
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">Pago agora (taxa)</span>
                  <span className="font-semibold text-primary">R$ {TAXA_AGENDAMENTO},00</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">Restante na barbearia</span>
                  <span className="font-semibold text-foreground">
                    {remainingAtShop !== null ? `R$ ${remainingAtShop.toFixed(2)}` : "A definir"}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleFechar}>
                  Cancelar
                </Button>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="inline-flex">
                  <Button
                    className="bg-gradient-gold text-primary-foreground hover:opacity-95 rounded-lg shadow-gold relative overflow-hidden"
                    onClick={handleIrParaPagamento}
                    disabled={!podePagar || payCtaLoading}
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      animate={{ x: ["0%", "300%"] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
                    />
                    <span className="relative inline-flex items-center">
                      {payCtaLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Garantindo horário...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Pagar R$ {TAXA_AGENDAMENTO},00 com Pix e garantir horário
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              </DialogFooter>
            </motion.div>
          )}

          {step === "pagamento" && selectedShop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Pagamento Pix — R$ {TAXA_AGENDAMENTO},00
                </DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code ou copie o código no app do seu banco. Taxa para {selectedShop.name}.
                </DialogDescription>
              </DialogHeader>

              {pagamentoConfirmado ? (
                <div className="space-y-4 py-4">
                  {showConfetti && (
                    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
                      {Array.from({ length: 26 }).map((_, i) => (
                        <motion.div
                          key={`c-${i}`}
                          initial={{ opacity: 0, y: -40, x: (i % 13) * 30 - 180, rotate: 0 }}
                          animate={{ opacity: [0, 1, 1, 0], y: [0, 520], rotate: [0, 240] }}
                          transition={{ duration: 1.2, delay: i * 0.015, ease: "easeOut" }}
                          className="absolute left-1/2 top-0 w-2 h-3 rounded-sm"
                          style={{ background: i % 2 === 0 ? "hsl(var(--gold))" : "hsl(var(--primary))" }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-primary/50 bg-primary/10 p-6 text-center">
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 240, damping: 18 }}
                    >
                      <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
                    </motion.div>
                    <p className="font-semibold text-foreground text-lg">Pagamento confirmado!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua taxa de R$ {TAXA_AGENDAMENTO},00 foi recebida. O agendamento na {selectedShop.name} está confirmado.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground text-center">Adicione ao seu calendário:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const start = new Date();
                          start.setDate(start.getDate() + 1);
                          start.setHours(10, 0, 0, 0);
                          const end = new Date(start);
                          end.setMinutes(end.getMinutes() + 30);
                          window.open(getGoogleCalendarUrl({
                            title: `Barbeflow - ${selectedShop.name}`,
                            description: `Agendamento confirmado. Taxa paga.`,
                            location: selectedShop.location,
                            start,
                            end,
                          }), "_blank");
                        }}
                      >
                        Google Calendar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const start = new Date();
                          start.setDate(start.getDate() + 1);
                          start.setHours(10, 0, 0, 0);
                          const end = new Date(start);
                          end.setMinutes(end.getMinutes() + 30);
                          downloadIcal({
                            title: `Barbeflow - ${selectedShop.name}`,
                            description: "Agendamento confirmado. Taxa paga.",
                            location: selectedShop.location,
                            start,
                            end,
                          });
                          toast({ title: "Download iniciado", description: "Arquivo .ics para iCal/Outlook." });
                        }}
                      >
                        iCal / Outlook
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg" onClick={handleFechar}>
                    Concluir
                  </Button>
                </div>
              ) : tempoEsgotado ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                    <Clock className="w-10 h-10 text-destructive mx-auto mb-2" />
                    <p className="font-medium text-foreground">Tempo esgotado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O código expirou. Gere um novo para tentar novamente.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleFechar}>
                      Fechar
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg" onClick={handleNovoCodigo}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Gerar novo código
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative rounded-xl bg-white p-4 overflow-hidden">
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                        animate={{ x: ["0%", "300%"] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                      />
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCopiaECola)}`}
                        alt="QR Code Pix"
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Abra o app do seu banco, escaneie o QR Code ou use o código abaixo.
                    </p>

                    <div className="w-full space-y-2">
                      <Label className="text-foreground/80 text-xs">Código Pix (copia e cola)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={pixCopiaECola}
                          className="bg-secondary border-border text-xs font-mono truncate"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopiarCodigo}
                          title="Copiar código"
                          className="shrink-0"
                        >
                          {pixCopiado ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Nubank", "Itaú", "Bradesco", "Santander", "Caixa"].map((b) => (
                          <span key={b} className="text-[10px] px-2 py-1 rounded-full border border-border/60 bg-background/60 text-muted-foreground">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 w-full">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className={`text-sm font-medium ${timerColorClass}`}>
                        Tempo para pagar: {formatarTimer(segundosRestantes)}
                      </span>
                    </div>

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                      onClick={() => void handleVerificarPagamento({ source: "manual" })}
                      disabled={verificandoPagamento}
                    >
                      {verificandoPagamento ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verificando pagamento...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Já paguei — Verificar pagamento
                        </>
                      )}
                    </Button>
                    <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        Ambiente criptografado
                      </span>
                      <button
                        type="button"
                        className="underline hover:text-foreground transition-colors"
                        onClick={() => toast({ title: "Dúvidas com o pagamento?", description: "Copie o código Pix e cole na área Pix copia e cola do seu banco. Se precisar, fale com o suporte." })}
                      >
                        Dúvidas com o pagamento?
                      </button>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={handleFechar}>
                      Cancelar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNovoCodigo}
                      className="text-muted-foreground"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renovar tempo
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Avaliar barbearia */}
      <Dialog open={avaliarDialogOpen} onOpenChange={setAvaliarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar {shopToReview?.name}</DialogTitle>
            <DialogDescription>
              Deixe sua nota de 1 a 5 estrelas e, se quiser, um comentário sobre sua experiência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-foreground/80 text-sm">Sua nota</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAvaliarRating(star)}
                    className="p-1 rounded hover:bg-secondary transition-colors"
                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= avaliarRating ? "text-primary fill-primary" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{avaliarRating}/5 estrelas</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">Comentário (opcional)</Label>
              <Textarea
                value={avaliarComment}
                onChange={(e) => setAvaliarComment(e.target.value)}
                placeholder="Conte como foi seu atendimento..."
                className="bg-secondary border-border min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvaliarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
              onClick={handleEnviarAvaliacao}
              disabled={avaliarRating < 1}
            >
              Enviar avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientSearch;
