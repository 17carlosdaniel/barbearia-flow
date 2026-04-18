import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  Scissors,
  Gift,
  Award,
  Star,
  Store,
  Calendar,
  ImagePlus,
  Home,
  MessageCircle,
  CheckCircle2,
  Heart,
  DollarSign,
  Timer,
  Wifi,
  Car,
  Snowflake,
  Coffee,
  Tv,
  CreditCard,
  Banknote,
  ExternalLink,
  X,
  ShoppingBag,
  MoreHorizontal,
  Flag,
  Share2,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { getOpeningStatus, getOpeningHours, DAY_NAMES } from "@/lib/openingHours";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getBarberCatalog } from "@/lib/barberCatalog";
import { getFirstVisitOffer } from "@/lib/loyalty";
import { getPointsForBarbershop } from "@/lib/loyalty";
import { getAverageRating, getReviews, type Review } from "@/lib/reviews";
import { getShopProductsByBarbershop } from "@/lib/shopProducts";
import { IconTikTok, IconInstagram, IconFacebook } from "@/components/icons/SocialIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  useBarbershopDetailQuery,
  useBarbershopReviewsQuery,
  useCreateReviewMutation,
} from "@/hooks/useClientQueries";

type TabId = "sobre" | "servicos" | "fotos" | "avaliacoes" | "produtos";
const FAVORITOS_STORAGE_KEY = "clientSearchFavoritos";

const ClientBarbershopDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useTheme();
  const shopId = Number(id);
  const detailQuery = useBarbershopDetailQuery(Number.isFinite(shopId) ? shopId : undefined);
  const reviewsQuery = useBarbershopReviewsQuery(Number.isFinite(shopId) ? shopId : undefined);
  const [activeTab, setActiveTab] = useState<TabId>("sobre");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBurst, setFavoriteBurst] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [reviewsState, setReviewsState] = useState<Review[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewPhoto, setNewReviewPhoto] = useState<string | null>(null);
  const [newReviewPhotoFileName, setNewReviewPhotoFileName] = useState<string | null>(null);

  const shop = detailQuery.data?.shop ?? null;
  const currentShopId = shop?.id ?? -1;

  const createReviewMutation = useCreateReviewMutation(currentShopId, user?.name);

  useEffect(() => {
    if (currentShopId === -1) return;
    try {
      const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
      const ids: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(ids)) setIsFavorite(ids.includes(currentShopId));
    } catch {}
  }, [currentShopId]);

  useEffect(() => {
    setGalleryLoading(true);
    const t = setTimeout(() => setGalleryLoading(false), 550);
    return () => clearTimeout(t);
  }, [detailQuery.data?.profile?.gallery]);

  useEffect(() => {
    if (currentShopId === -1) return;
    setReviewsState(reviewsQuery.data ?? getReviews(currentShopId));
  }, [reviewsQuery.data, currentShopId]);

  const ratingBuckets = useMemo(() => {
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviewsState) {
      const key = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    return buckets;
  }, [reviewsState]);

  if (!shop) {
    return (
      <DashboardLayout userType="cliente">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/cliente/buscar")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar à busca
          </Button>
          <p className="text-muted-foreground">Barbearia não encontrada.</p>
        </div>
      </DashboardLayout>
    );
  }

  const catalog = detailQuery.data?.catalog ?? getBarberCatalog(shop.id);
  const shopProducts = getShopProductsByBarbershop(shop.id);
  const offer = getFirstVisitOffer(shop.id);
  const points = user ? getPointsForBarbershop(user.id, shop.id) : 0;
  const openStatus = detailQuery.data?.openingStatus ?? getOpeningStatus(shop.id);
  const profile = detailQuery.data?.profile ?? getBarbershopProfile(shop.id);
  const schedule = getOpeningHours(shop.id);
  const { average, count } = getAverageRating(shop.id);
  const ratingDisplay = count > 0 ? average.toFixed(1) : shop.rating;
  const localDisplay = profile.endereco || shop.location;
  const desdeDisplay = profile.desde
    ? new Date(profile.desde + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleAgendar = () => {
    navigate("/cliente/buscar", { state: { agendarShopId: shop.id } });
  };

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const raw = localStorage.getItem(FAVORITOS_STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const nextIds = next ? Array.from(new Set([...(Array.isArray(ids) ? ids : []), shop.id])) : (Array.isArray(ids) ? ids : []).filter((id) => id !== shop.id);
      localStorage.setItem(FAVORITOS_STORAGE_KEY, JSON.stringify(nextIds));
    } catch {}
    if (next) {
      setFavoriteBurst(true);
      setTimeout(() => setFavoriteBurst(false), 600);
    }
  };

  const coverUrl = profile.coverPhotoUrl?.trim();
  const reviews = reviewsState;
  const todayIndex = new Date().getDay(); // 0 = domingo

  const handleSubmitReview = () => {
    if (!user) {
      toast({ title: "Faça login para avaliar", variant: "destructive" });
      return;
    }
    if (newReviewRating < 1) {
      toast({ title: "Selecione uma nota", description: "Escolha de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    createReviewMutation.mutate({
      rating: newReviewRating,
      comment: newReviewComment,
      photoUrl: newReviewPhoto ?? undefined,
    });
    setReviewsState(getReviews(shop.id));
    setNewReviewRating(0);
    setNewReviewComment("");
    setNewReviewPhoto(null);
    setNewReviewPhotoFileName(null);
    setReviewDialogOpen(false);
    toast({ title: "Avaliação enviada!", description: "Obrigado por compartilhar sua experiência." });
  };

  const handleNewPhotoChange = (file: File | null) => {
    if (!file) {
      setNewReviewPhoto(null);
      setNewReviewPhotoFileName(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewReviewPhoto(dataUrl);
      setNewReviewPhotoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const isModern = identity === "modern";
  const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
    { id: "sobre", label: isModern ? "Visão geral" : "A casa", icon: Home },
    {
      id: "servicos",
      label: `${isModern ? "Serviços" : "Cadeiras"} (${catalog.services.length})`,
      icon: Scissors,
    },
    {
      id: "fotos",
      label: `${isModern ? "Galeria" : "Ambiente"} (${profile.gallery?.length ?? 0})`,
      icon: ImagePlus,
    },
    {
      id: "avaliacoes",
      label: `${isModern ? "Avaliações" : "Clientes"} (${count})`,
      icon: Star,
    },
    {
      id: "produtos",
      label: `${isModern ? "Loja" : "Seleção"} (${shopProducts.length})`,
      icon: ShoppingBag,
    },
  ];

  const distanceDisplay = "2,4 km";
  const precoMedioDisplay = profile.precoMedio?.trim() || "R$ --";
  const tempoMedioDisplay = `${profile.tempoMedioMinutos ?? 45} min`;
  const enderecoCompleto = [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ");
  const mapQueryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto || shop.location)}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(enderecoCompleto || shop.location)}&output=embed`;

  return (
    <DashboardLayout userType="cliente">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 max-w-2xl mx-auto"
      >
        <button
          type="button"
          onClick={() => navigate("/cliente/buscar")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à busca
        </button>

        {/* Hero refatorado: identidade + prova social + ação */}
        <div className="relative rounded-2xl overflow-hidden mb-5 border border-border/50">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={shop.name}
              className={cn(
                "w-full object-cover",
                isModern ? "h-44 md:h-52" : "h-52 md:h-60",
              )}
            />
          ) : (
            <div
              className={cn(
                "w-full bg-gradient-to-br from-primary/20 via-card to-primary/10 flex items-center justify-center",
                isModern ? "h-44 md:h-52" : "h-52 md:h-60",
              )}
            >
              <Store className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          <div className={cn("absolute inset-0", isModern ? "bg-gradient-to-t from-black/75 via-black/35 to-black/10" : "bg-gradient-to-t from-black/80 via-black/45 to-black/15")} />
          <button
            type="button"
            onClick={toggleFavorite}
            className={`absolute top-4 left-4 z-20 rounded-full border backdrop-blur-md p-2 transition-colors ${
              isFavorite
                ? "border-primary/70 bg-primary/15 text-primary"
                : "border-border/70 bg-card/70 text-muted-foreground hover:text-foreground"
            }`}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary" : ""}`} />
          </button>
          <AnimatePresence>
            {favoriteBurst && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.8 }}
                className="absolute top-3 left-3 z-10 pointer-events-none"
              >
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 pb-4">
            {isModern ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                        {shop.name}
                      </h1>
                      {profile.ownerVerified && (
                        <span
                          className="inline-flex items-center gap-1 shrink-0 rounded-full border border-blue-500/45 bg-blue-500/12 px-2 py-0.5 text-[11px] font-semibold text-blue-400"
                          title="Barbearia verificada pela BarberFlow"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" aria-hidden />
                          Verificada
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {localDisplay || "Sem endereço"}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${
                          openStatus.status === "open"
                            ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                            : "border-destructive/50 bg-destructive/20 text-destructive-foreground"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {openStatus.status === "open" ? "Aberta agora" : "Fechada agora"}
                      </span>
                      {desdeDisplay && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Desde {desdeDisplay}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card/85 px-3 py-2 backdrop-blur-md text-right shrink-0">
                    <p className="font-display text-xl font-bold text-primary">{ratingDisplay || "–"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {count} avaliação{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-muted-foreground">
                    <MapPin className="w-3 h-3 text-primary" />
                    {distanceDisplay}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-muted-foreground">
                    <DollarSign className="w-3 h-3 text-primary" />
                    {precoMedioDisplay}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-muted-foreground">
                    <Timer className="w-3 h-3 text-primary" />
                    {tempoMedioDisplay}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl border border-primary/50 bg-card/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
                  {coverUrl ? (
                    <img src={coverUrl} alt={shop.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-muted-foreground/60" />
                  )}
                </div>
                <div className="max-w-xl">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary/90 mb-1">
                    {openStatus.status === "open" ? "Aberta neste momento" : "Fechada neste momento"}
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                    {shop.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    Atendimento em {localDisplay || "São Paulo, SP"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    {ratingDisplay} ({count})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-primary" />
                    Tempo médio de atendimento: {tempoMedioDisplay}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {(profile.promocoes?.length ?? 0) > 0 && (
          <div className="space-y-3 mb-2">
            {profile.promocoes?.slice(0, 2).map((promo, idx) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="rounded-2xl border border-primary/50 bg-gradient-to-r from-primary/10 via-card to-primary/5 p-4 shadow-[0_0_22px_rgba(212,163,115,0.2)]"
              >
                <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">Oferta especial</p>
                <p className="font-semibold text-foreground">{promo.titulo}</p>
                {promo.descricao && <p className="text-xs text-muted-foreground mt-0.5">{promo.descricao}</p>}
                <div className="mt-2 flex items-end gap-2">
                  {promo.precoOriginal ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground line-through">
                      R$ {promo.precoOriginal.toFixed(2)}
                    </motion.span>
                  ) : null}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-display text-xl font-bold text-primary"
                  >
                    R$ {promo.precoPromocional.toFixed(2)}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick actions (estilo BarbeariaDetalhe) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button variant="gold" onClick={handleAgendar} disabled={openStatus.status === "closed"} className="shrink-0 gap-2 rounded-full px-6">
            <Calendar className="w-4 h-4" />
            Agendar
          </Button>
          {profile.telefone && (
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => window.open(`https://wa.me/55${profile.telefone.replace(/\D/g, "")}`, "_blank")}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          )}
          {profile.instagram && (
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => window.open(`https://instagram.com/${profile.instagram.replace(/^@/, "")}`, "_blank")}
            >
              <IconInstagram className="w-4 h-4" />
              Instagram
            </Button>
          )}
          {profile.telefone && (
            <Button
              variant="outline"
              className="shrink-0 gap-2"
              onClick={() => window.open(`tel:${profile.telefone.replace(/\D/g, "")}`, "_self")}
            >
              <Phone className="w-4 h-4" />
              Ligar
            </Button>
          )}
        </div>

        {/* Abas com indicador animado */}
        <div className="relative mb-6">
          <div
            className={cn(
              "flex flex-wrap gap-1 p-1 rounded-xl border border-border/50 overflow-x-auto",
              isModern ? "bg-card" : "bg-gradient-to-r from-card via-card to-primary/5",
            )}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-[hsl(var(--gold))]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo da aba ativa (estilo referência: rounded-2xl border border-border/50 shadow-card) */}
        <div
          className={cn(
            "rounded-2xl border border-border/50 p-6 overflow-hidden shadow-lg",
            isModern ? "bg-card" : "bg-gradient-to-b from-card to-card/90",
          )}
        >
          <AnimatePresence mode="wait">
          {activeTab === "sobre" && (
            <motion.div
              key="sobre"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-lg font-display font-semibold text-foreground mb-3">
                {isModern ? "Visão geral da barbearia" : "Informações da casa"}
              </h2>
              {(profile.telefone ||
                profile.tiktok ||
                profile.instagram ||
                profile.facebook ||
                profile.outrasRedes ||
                profile.endereco) ? (
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  {profile.endereco && (
                    <li className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {profile.endereco}
                    </li>
                  )}
                  {profile.telefone && (
                    <li className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      {profile.telefone}
                    </li>
                  )}
                  {profile.instagram && (
                    <li className="flex items-center gap-2">
                      <IconInstagram className="w-4 h-4 shrink-0" />
                      @{profile.instagram.replace(/^@/, "")}
                    </li>
                  )}
                  {profile.facebook && (
                    <li className="flex items-center gap-2">
                      <IconFacebook className="w-4 h-4 shrink-0" />
                      {profile.facebook}
                    </li>
                  )}
                  {profile.tiktok && (
                    <li className="flex items-center gap-2">
                      <IconTikTok className="w-4 h-4 shrink-0" />
                      {profile.tiktok.replace(/^@/, "")}
                    </li>
                  )}
                  {profile.outrasRedes && <li>{profile.outrasRedes}</li>}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm mb-4">
                  {isModern
                    ? "Esta barbearia ainda não cadastrou canais de contato."
                    : "A casa ainda não publicou canais diretos de contato."}
                </p>
              )}

              {(profile.comodidades?.wifi ||
                profile.comodidades?.estacionamento ||
                profile.comodidades?.arCondicionado ||
                profile.comodidades?.cafe ||
                profile.comodidades?.tv) && (
                <section className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Comodidades</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "wifi", label: "Wi-Fi", icon: Wifi },
                      { key: "estacionamento", label: "Estacionamento", icon: Car },
                      { key: "arCondicionado", label: "Ar-condicionado", icon: Snowflake },
                      { key: "cafe", label: "Café", icon: Coffee },
                      { key: "tv", label: "TV", icon: Tv },
                    ]
                      .filter((it) => profile.comodidades?.[it.key as keyof typeof profile.comodidades])
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className="rounded-lg border border-border/50 bg-secondary/40 px-3 py-2 text-xs flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

              {(profile.pagamentos?.pix ||
                profile.pagamentos?.debito ||
                profile.pagamentos?.credito ||
                profile.pagamentos?.dinheiro ||
                (profile.pagamentos?.bandeiras?.length ?? 0) > 0) && (
                <section className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {isModern ? "Formas de pagamento" : "Formas de pagamento aceitas"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.pagamentos?.pix && (
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">Pix</span>
                    )}
                    {profile.pagamentos?.debito && (
                      <span className="px-2 py-1 rounded-full bg-secondary text-foreground text-xs inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Débito
                      </span>
                    )}
                    {profile.pagamentos?.credito && (
                      <span className="px-2 py-1 rounded-full bg-secondary text-foreground text-xs inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Crédito
                      </span>
                    )}
                    {profile.pagamentos?.dinheiro && (
                      <span className="px-2 py-1 rounded-full bg-secondary text-foreground text-xs inline-flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        Dinheiro
                      </span>
                    )}
                  </div>
                  {(profile.pagamentos?.bandeiras?.length ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Bandeiras: {profile.pagamentos?.bandeiras?.join(", ")}
                    </p>
                  )}
                </section>
              )}

              {profile.sobre && (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Sobre</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.sobre}</p>
                </>
              )}

              <section className="mt-4 pt-4 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Localização
                </h3>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <iframe
                    title="Mapa da barbearia"
                    src={mapEmbedUrl}
                    loading="lazy"
                    className="w-full h-48"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => window.open(mapQueryUrl, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-primary" />
                  Abrir no mapa
                </Button>
              </section>

              <section className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                    {isModern ? "Horários de atendimento" : "Horários da casa"}
                </h3>
                <ul className="text-sm space-y-1">
                  {DAY_NAMES.map(({ value, label }) => {
                    const slot = schedule[value];
                    const text = slot
                      ? slot.open2 && slot.close2
                        ? `${slot.open}–${slot.close} e ${slot.open2}–${slot.close2}`
                        : `${slot.open}–${slot.close}`
                      : "Fechado";
                    const isToday = value === todayIndex;
                    return (
                      <li
                        key={value}
                        className={`flex justify-between text-muted-foreground px-2 py-1 rounded ${
                          isToday ? "bg-primary/10 border border-primary/20" : ""
                        }`}
                      >
                        <span className={isToday ? "font-semibold text-foreground" : ""}>{label}</span>
                        <span className={isToday ? "text-primary font-medium" : "text-foreground"}>{text}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </motion.div>
          )}

          {activeTab === "servicos" && (
            <motion.div
              key="servicos"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {isModern ? "Serviços para agendar" : "Serviços da casa"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isModern
                    ? "Compare duração, preço e escolha o que faz sentido para hoje."
                    : "Escolha seu atendimento com foco em experiência e resultado."}
                </p>
              </div>
              {catalog.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catalog.services.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-border/60 bg-secondary/30 p-3 flex gap-3"
                    >
                      {s.photoUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-background/40 border border-border/60 shrink-0">
                          <img
                            src={s.photoUrl}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground truncate">{s.name}</p>
                          {idx === 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary shrink-0">
                              {isModern ? "Mais pedido" : "Destaque"}
                            </span>
                          ) : s.durationMinutes <= 30 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 shrink-0">
                              {isModern ? "Mais rápido" : "Express"}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {s.durationMinutes} min
                        </p>
                        <p className="font-display text-lg text-primary mt-2">
                          R$ {s.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Scissors className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>
                    {isModern
                      ? "Ainda não há serviços disponíveis para agendamento."
                      : "A casa ainda não publicou os serviços deste espaço."}
                  </p>
                </div>
              )}
              {catalog.packages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Pacotes</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {catalog.packages.map((p) => (
                      <li key={p.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="text-primary font-medium">R$ {(p.finalPrice ?? p.price).toFixed(2)}</span>
                        </div>
                        <p className="text-xs mt-1">
                          De R$ {(p.basePrice ?? p.price).toFixed(2)} por R$ {(p.finalPrice ?? p.price).toFixed(2)} · Economize R$ {(p.savingsValue ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs mt-1">
                          Itens: {(p.serviceIds?.length ?? 0)} serviço(s) + {(p.productIds?.length ?? 0)} produto(s)
                        </p>
                        {p.validUntil && (
                          <p className="text-xs mt-1">Válido até {new Date(p.validUntil).toLocaleDateString("pt-BR")}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "fotos" && (
            <motion.div
              key="fotos"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {galleryLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`sk-${i}`} className="rounded-lg bg-secondary/60 aspect-square animate-pulse" />
                  ))}
                </div>
              ) : (profile.gallery?.length ?? 0) > 0 ? (
                <div className="space-y-4">
                  {(profile.gallery?.some((g) => g.type === "corte") ?? false) && (
                    <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {isModern ? "Cortes mais recentes" : "Registros de cortes da casa"}
                    </h3>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {profile.gallery
                          ?.filter((g) => g.type === "corte")
                          .map((item, i) => (
                            <div key={`corte-${i}`} className="shrink-0 w-40 h-40 rounded-xl overflow-hidden border border-border/50 bg-secondary relative">
                              <img src={item.url} alt={item.caption || "Corte"} className="w-full h-full object-cover" />
                              {item.caption && (
                                <p className="absolute left-0 right-0 bottom-0 bg-black/45 text-[11px] text-white px-2 py-1 truncate">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      {isModern ? "Galeria da barbearia" : "Ambiente e detalhes"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {profile.gallery?.map((item, i) => (
                        <div key={i} className="rounded-lg overflow-hidden bg-secondary aspect-square relative">
                          <img src={item.url} alt={item.caption || ""} className="w-full h-full object-cover" />
                          {item.type && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] bg-card/80 backdrop-blur-md border border-border/60">
                              {item.type === "corte" ? "Corte" : "Ambiente"}
                            </span>
                          )}
                          {item.caption && <p className="text-xs text-muted-foreground p-2 truncate">{item.caption}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImagePlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-foreground">
                    {isModern ? "Sem fotos cadastradas ainda." : "Ainda não há registros visuais deste espaço."}
                  </p>
                  <p className="text-xs mt-1">
                    {isModern
                      ? "Enquanto isso, confira serviços e avaliações para decidir seu agendamento."
                      : "Você pode explorar serviços e opiniões dos clientes enquanto isso."}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "produtos" && (
            <motion.div
              key="produtos"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {isModern ? "Produtos da barbearia" : "Seleção da barbearia"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isModern
                    ? "Itens para manter seu corte e barba em casa."
                    : "Curadoria de itens para prolongar a experiência da casa."}
                </p>
              </div>
              {shopProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-60" />
                  <p className="font-medium text-foreground">
                    {isModern ? "Nenhum produto publicado na loja." : "A seleção da barbearia ainda não foi publicada."}
                  </p>
                  <p className="text-xs mt-1">
                    {isModern
                      ? "Veja os serviços disponíveis e agende diretamente pela página."
                      : "Enquanto isso, conheça os serviços e avaliações desta casa."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-border/60 bg-secondary/30 p-3 flex gap-3"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-background/40 border border-border/60 shrink-0">
                        <img
                          src={product.images?.[0] ?? product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            {index < 2 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary shrink-0">
                                {isModern ? "Popular" : "Escolha da casa"}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-lg text-primary">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="gold"
                            onClick={() =>
                              navigate(`/cliente/loja/produto/${product.id}`)
                            }
                          >
                            Comprar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "avaliacoes" && (
            <motion.div
              key="avaliacoes"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {isModern ? "O que os clientes dizem" : "Opiniões dos clientes"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isModern
                    ? "Feedbacks reais para apoiar sua decisão antes de agendar."
                    : "Relatos de quem já passou por esta barbearia."}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
                <div className="space-y-4 border border-border/60 rounded-xl p-4 bg-secondary/20">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {isModern ? "Resumo de avaliações" : "Percepção dos clientes"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-display font-bold text-foreground">
                        {ratingDisplay || "–"}
                      </p>
                      <div className="flex justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${n <= Math.round(average) ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {count} avaliação{count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const bucketCount = ratingBuckets[star] ?? 0;
                        const ratio = count > 0 ? bucketCount / count : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-right">{star}</span>
                            <div className="flex-1 h-2 rounded-full bg-secondary/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-yellow-400"
                                style={{ width: `${Math.max(ratio * 100, bucketCount > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[11px] text-muted-foreground">
                              {bucketCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    {isModern ? "Escrever avaliação" : "Compartilhar experiência"}
                  </Button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {reviews.length > 0 ? (
                    reviews.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border/60 bg-secondary/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                              {r.authorName
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground leading-tight">
                                {r.authorName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                                aria-label="Mais opções"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toast({
                                    title: "Denúncia enviada",
                                    description: "Obrigado por nos avisar. Vamos analisar esta avaliação.",
                                  })
                                }
                                className="flex items-center gap-2"
                              >
                                <Flag className="w-4 h-4" />
                                Denunciar avaliação
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const text = `${r.authorName} avaliou ${shop.name} com ${r.rating} estrelas: "${r.comment || "Sem comentário"}"`;
                                  navigator.clipboard.writeText(text).catch(() => undefined);
                                  toast({ title: "Link copiado", description: "Você pode colar em qualquer lugar para compartilhar." });
                                }}
                                className="flex items-center gap-2"
                              >
                                <Share2 className="w-4 h-4" />
                                Compartilhar avaliação
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex mb-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-4 h-4 ${
                                n <= r.rating ? "text-primary fill-primary" : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                        {r.photoUrl && (
                          <div className="mt-2 mb-2 w-full h-32 rounded-lg overflow-hidden bg-background/40 border border-border/60">
                            <img
                              src={r.photoUrl}
                              alt="Foto da experiência"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {r.comment ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {r.comment}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Cliente avaliou sem comentário.
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium text-foreground">
                        {isModern ? "Ainda não há avaliações." : "Esta casa ainda não recebeu avaliações."}
                      </p>
                      <p className="text-xs mt-1">
                        {isModern
                          ? "Se você já foi atendido, compartilhe sua experiência."
                          : "Se você já foi atendido, deixe sua opinião e ajude outros clientes."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Avaliar {shop.name}</DialogTitle>
              <DialogDescription>
                Compartilhe como foi sua experiência. Sua avaliação ajuda outros clientes.
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
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 rounded hover:bg-secondary transition-colors"
                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= newReviewRating ? "text-primary fill-primary" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {newReviewRating > 0 ? `${newReviewRating}/5 estrelas` : "Escolha de 1 a 5 estrelas"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-sm">Comentário</Label>
                <Textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Fale sobre atendimento, ambiente, qualidade do corte..."
                  className="bg-secondary border-border min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-sm">Foto (opcional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="review-photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleNewPhotoChange(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs"
                    onClick={() => document.getElementById("review-photo-input")?.click()}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Escolher imagem
                  </Button>
                  {newReviewPhotoFileName && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {newReviewPhotoFileName}
                    </span>
                  )}
                </div>
                {newReviewPhoto && (
                  <div className="mt-2 w-full h-28 rounded-lg overflow-hidden bg-background/40 border border-border/60">
                    <img src={newReviewPhoto} alt="Prévia da foto" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                onClick={handleSubmitReview}
                disabled={newReviewRating < 1}
              >
                Publicar avaliação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {offer && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3">
            <Gift className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">
                Oferta 1ª visita: {offer.discountPercent}% de desconto
              </p>
              {offer.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{offer.description}</p>
              )}
            </div>
          </div>
        )}

        {points > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4 text-primary" />
            <span>
              Seus pontos nesta barbearia: <strong className="text-foreground">{points}</strong>
            </span>
          </div>
        )}

        {/* CTA fixo para agendar no mobile */}
        <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-sm">
          <Button
            variant="gold"
            onClick={handleAgendar}
            disabled={openStatus.status === "closed"}
            className="w-full h-11 rounded-xl shadow-lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar agora
          </Button>
        </div>

        {/* Chat flutuante */}
        <div className="fixed bottom-16 sm:bottom-6 right-4 z-50">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="mb-2 w-56 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl p-2"
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm flex items-center gap-2"
                  onClick={() => {
                    if (!profile.telefone) {
                      toast({ title: "WhatsApp indisponível", description: "Esta barbearia não informou telefone.", variant: "destructive" });
                      return;
                    }
                    window.open(`https://wa.me/55${profile.telefone.replace(/\D/g, "")}`, "_blank");
                    setChatOpen(false);
                  }}
                >
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Conversar no WhatsApp
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm flex items-center gap-2"
                  onClick={() => {
                    toast({ title: "Chat interno em breve", description: "Estamos finalizando essa funcionalidade." });
                    setChatOpen(false);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Chat interno
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="h-11 w-11 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            aria-label="Abrir opções de chat"
          >
            {chatOpen ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientBarbershopDetail;

