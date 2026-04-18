import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, ShieldCheck, Store, ShoppingCart, Star, Sparkles, Leaf, Truck, CreditCard } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/shop/StarRating";
import SizeGuide from "@/components/shop/SizeGuide";
import ProductCard from "@/components/shop/ProductCard";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientCommerceCopy, getProductBenefitHint } from "@/lib/clientCommerceCopy";
import { cn } from "@/lib/utils";
import {
  addProductReview,
  getNearbyBarbershopProducts,
  getRelatedProducts,
  getShopProductById,
  hasPurchasedProduct,
} from "@/lib/shopProducts";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeProfanity } from "@/lib/security";
import type { ShopCartItem } from "@/types/shop";

const CART_KEY = "barberflow_shop_cart";

const ClientProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const p = useMemo(() => getClientCommerceCopy(identity).pdp, [identity]);
  const [refreshToken, setRefreshToken] = useState(0);
  const product = id ? getShopProductById(id) : undefined;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();
  const [selectedMaterial, setSelectedMaterial] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [descTab, setDescTab] = useState<"como-usar" | "ingredientes" | "beneficios">("como-usar");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const relatedProducts = product ? getRelatedProducts(product.id, 4) : [];
  const nearbyProducts = product
    ? getNearbyBarbershopProducts(product, 4).filter((candidate) => candidate.id !== product.id)
    : [];
  const crossSellProducts = nearbyProducts.slice(0, 2);

  const gallery = useMemo(
    () => (product?.images?.length ? product.images : product ? [product.image] : []),
    [product],
  );

  const badges = useMemo(() => {
    if (!product) return { offer: false, bestSeller: false, isNew: false, vegan: false };
    const offer = typeof product.originalPrice === "number" && product.originalPrice > product.price;
    const bestSeller = (product.soldCount ?? 0) >= 100;
    const isNew =
      typeof product.createdAt === "string" &&
      (() => {
        const created = new Date(product.createdAt);
        if (Number.isNaN(created.getTime())) return false;
        const diffMs = Date.now() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      })();
    const vegan = product.tags?.some((t) => t.toLowerCase().includes("vegano")) ?? false;
    return { offer, bestSeller, isNew, vegan };
  }, [product]);
  const savingValue =
    product && typeof product.originalPrice === "number" && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;
  const socialReviewCount = product ? Math.max(product.reviews?.length ?? 0, 128) : 0;
  const urgencyLabel = product
    ? product.stock <= 12
      ? `Restam apenas ${product.stock} unidades`
      : "Vendendo rápido"
    : "";

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    if (product.colors?.length && !selectedColor) {
      toast({ title: "Selecione uma cor", variant: "destructive" });
      return;
    }
    if (product.materials?.length && !selectedMaterial) {
      toast({ title: "Selecione um material", variant: "destructive" });
      return;
    }

    let current: ShopCartItem[] = [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) current = JSON.parse(raw);
    } catch {
      current = [];
    }
    const currentShopId = current[0]?.product.barbershopId;
    if (
      typeof currentShopId === "number" &&
      typeof product.barbershopId === "number" &&
      currentShopId !== product.barbershopId
    ) {
      toast({
        title: "Carrinho por barbearia",
        description: "Finalize ou limpe o carrinho para comprar em outra barbearia.",
        variant: "destructive",
      });
      return;
    }

    const lineId = `${product.id}::${selectedSize ?? ""}::${selectedColor ?? ""}::${selectedMaterial ?? ""}`;
    const existing = current.find((i) => i.id === lineId);
    if (existing) {
      const nextQty = Math.min(existing.quantity + quantity, product.stock);
      existing.quantity = nextQty;
    } else {
      current.push({ id: lineId, product, quantity: Math.min(quantity, product.stock), selectedColor, selectedSize, selectedMaterial });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(current));
    toast({ title: "Produto adicionado ao carrinho" });
  };

  const handleReviewPhoto = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const max = Math.min(3, files.length);
    const readers = Array.from(files)
      .slice(0, max)
      .map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("Falha ao ler imagem"));
            reader.readAsDataURL(file);
          }),
      );
    Promise.all(readers)
      .then((images) => setReviewPhotos(images.filter(Boolean)))
      .catch(() => toast({ title: "Não foi possível carregar a foto", variant: "destructive" }));
  };

  const handleSubmitReview = () => {
    if (!product) return;
    const comment = sanitizeProfanity(reviewComment.trim());
    if (!comment) {
      toast({ title: "Digite um comentário para avaliar", variant: "destructive" });
      return;
    }
    const updated = addProductReview({
      productId: product.id,
      userName: user?.name || "Cliente",
      userId: user?.id,
      rating: reviewRating,
      comment,
      photos: reviewPhotos,
    });
    if (!updated) {
      toast({ title: "Não foi possível salvar avaliação", variant: "destructive" });
      return;
    }
    setReviewComment("");
    setReviewRating(5);
    setReviewPhotos([]);
    setRefreshToken((prev) => prev + 1);
    toast({ title: "Avaliação enviada", description: "Obrigado pelo feedback!" });
  };

  if (!product) {
    return (
      <DashboardLayout userType="cliente">
        <div className="glass-card rounded-2xl p-10 text-center">
          <h1 className="text-xl font-display font-semibold text-foreground">Produto não encontrado</h1>
          <Button className="mt-4" onClick={() => navigate("/cliente/loja")}>
            {p.backToStore}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="cliente">
      <div className="space-y-6">
        <Button variant="ghost" className="px-0" onClick={() => navigate("/cliente/loja")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {p.backToStore}
        </Button>

        <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10")}>
          <div className="space-y-3">
            <div className="glass-card rounded-2xl overflow-hidden border border-border/60">
              <img src={gallery[selectedImage]} alt={product.name} className="w-full aspect-square object-cover transition-opacity duration-300" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  className={`rounded-lg overflow-hidden border ${idx === selectedImage ? "border-primary bg-primary/5" : "border-border/60"}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full aspect-square object-cover" />
                </button>
              ))}
            </div>

            {/* Nova seção lateral para preencher o espaço vazio no Desktop */}
            <div className="hidden lg:block space-y-4 pt-4">
              <div className="glass-card space-y-2 rounded-xl p-4 border border-border/40">
                <p className={cn("text-sm font-semibold text-foreground", isModern ? "font-manrope" : "font-display")}>
                  {p.deliverySectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">{p.nearbyLead}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Store className="h-4 w-4" /> {p.deliveryPickupLine}
                  </span>
                  <span className="text-foreground">R$ 0,00</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {product?.barbershopName ? `${product.barbershopName} · ` : ""}
                  {product?.pickupLocation || "Endereço da barbearia no checkout"}
                </p>
                <p className="text-xs text-muted-foreground">Estoque: {product?.stock} unidade(s)</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm text-foreground">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-primary/80">Segurança</span>
                    <span className="text-xs leading-tight text-muted-foreground">{p.trustSecure}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm text-foreground">
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-primary/80">Entrega</span>
                    <span className="text-xs leading-tight text-muted-foreground">{p.trustPickup}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm text-foreground">
                  <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-primary/80">Pagamento</span>
                    <span className="text-xs leading-tight text-muted-foreground">{p.trustPayment}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Garantia BarberFlow</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-emerald-200/70">
                      {p.satisfactionNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1
              className={cn(
                "text-2xl font-bold text-gradient-gold lg:text-3xl",
                isModern ? "font-manrope tracking-tight" : "font-display",
              )}
            >
              {product.name}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isModern
                ? `${p.productTaglinePrefix}${getProductBenefitHint(product.category)}${p.productTaglineSuffix}`
                : `${p.productTaglineVintagePrefix}${getProductBenefitHint(product.category)}${p.productTaglineVintageSuffix}`}
            </p>
            {product.rating && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} size={14} />
                <span className="text-xs text-muted-foreground">
                  {product.rating.toFixed(1)} ({socialReviewCount} avaliações)
                </span>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-end gap-2">
                {product.originalPrice && (
                  <span className="text-muted-foreground line-through">De R$ {product.originalPrice.toFixed(2)}</span>
                )}
                <span className="text-3xl font-display font-bold text-primary">Por R$ {product.price.toFixed(2)}</span>
              </div>
              {savingValue > 0 && (
                <p className="text-xs font-medium text-emerald-400">Economize R$ {savingValue.toFixed(2)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {badges.offer && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                  <Sparkles className="h-3 w-3" />
                  Oferta
                </span>
              )}
              {badges.bestSeller && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-amber-400">
                  Mais vendido
                </span>
              )}
              {product.featured && (
                <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-primary">
                  {isModern ? "Compatível com seu perfil" : "Combina com seu perfil"}
                </span>
              )}
              {badges.isNew && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-400">
                  Novo
                </span>
              )}
              {badges.vegan && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-2 py-1 text-emerald-400">
                  <Leaf className="h-3 w-3" />
                  Vegano
                </span>
              )}
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>

            {isModern ? (
              <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                <h3 className={cn("text-sm font-semibold text-foreground", isModern && "font-manrope")}>
                  {p.idealForSectionTitle}
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {p.idealForBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">{p.idealForSummary}</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                  <h3 className="font-display text-sm font-semibold text-foreground">{p.routineIntroTitle}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.routineIntroBody}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                  <h3 className="font-display text-sm font-semibold text-foreground">{p.whyChooseTitle}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {p.whyChooseBullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {(product.sizes?.length || product.colors?.length || product.materials?.length) && (
              <h3
                className={cn(
                  "text-sm font-semibold text-foreground",
                  isModern ? "font-manrope" : "font-display",
                )}
              >
                {p.choiceBlockTitle}
              </h3>
            )}

            {product.sizes?.length ? (
              <div className="space-y-2">
                <p className="text-sm text-foreground">Tamanho</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-md border text-sm ${selectedSize === s ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.colors?.length ? (
              <div className="space-y-2">
                <p className="text-sm text-foreground">Cor</p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === c.name ? "border-primary" : "border-border/60"}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {product.materials?.length ? (
              <div className="space-y-2">
                <p className="text-sm text-foreground">Material</p>
                <div className="flex gap-2 flex-wrap">
                  {product.materials.map((material) => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => setSelectedMaterial(material)}
                      className={`px-3 py-1.5 rounded-md border text-sm ${selectedMaterial === material ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-foreground">Quantidade</p>
                <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-md border border-border/60 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-7 h-7 rounded-md border border-border/60 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-destructive font-medium">{urgencyLabel}</p>
            </div>

            <div className="lg:hidden space-y-4">
              <div className="glass-card space-y-2 rounded-xl p-4">
                <p className={cn("text-sm font-semibold text-foreground", isModern ? "font-manrope" : "font-display")}>
                  {p.deliverySectionTitle}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Store className="h-4 w-4" /> {p.deliveryPickupLine}
                  </span>
                  <span className="text-foreground">R$ 0,00</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/40 p-2 text-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-[10px] leading-tight text-muted-foreground">Seguro</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/40 p-2 text-center">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-[10px] leading-tight text-muted-foreground">Entrega</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/40 p-2 text-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-[10px] leading-tight text-muted-foreground">Pagamento</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              <Button
                variant="gold"
                className="flex-1 h-12 text-base transition-transform hover:scale-[1.01] active:scale-[0.99]"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {p.primaryCta}
              </Button>
              <Button variant="outline" className="flex-1 h-12 text-base" onClick={handleAddToCart}>
                {p.secondaryAddToCart}
              </Button>
            </div>

            <div
              className={cn(
                "rounded-xl border border-primary/25 bg-primary/5 p-4",
                isModern ? "space-y-2" : "space-y-3 border-primary/20 bg-primary/[0.07]",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold text-foreground",
                  isModern ? "font-manrope" : "font-display",
                )}
              >
                {p.profileBlockTitle}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.profileBlockBody}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outlineGold" size="sm" onClick={() => navigate("/cliente/quiz")}>
                  {p.profileBlockCta}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/cliente/loja")}>
                  {p.profileRelatedCta}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-4">
              <h3 className={cn("text-sm font-semibold text-foreground", isModern && "font-manrope")}>
                {p.howToUseTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.howToUseBody}</p>
            </div>
          </div>
        </div>

        {product.sizes?.length ? <SizeGuide /> : null}

        <div className="glass-card space-y-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
            <button
              type="button"
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                descTab === "como-usar"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setDescTab("como-usar")}
            >
              {p.tabHowToUse}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                descTab === "ingredientes"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setDescTab("ingredientes")}
            >
              {p.tabIngredients}
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                descTab === "beneficios"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setDescTab("beneficios")}
            >
              {p.tabBenefits}
            </button>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            {descTab === "como-usar" && (
              <p className="leading-relaxed text-muted-foreground">{p.howToUseBody}</p>
            )}
            {descTab === "ingredientes" && (
              <ul className="list-disc pl-5 space-y-1">
                <li>Fórmula inspirada em barbearias profissionais.</li>
                <li>Ingredientes pensados para uso diário e acabamento limpo.</li>
                <li>Consulte a embalagem para composição completa.</li>
              </ul>
            )}
            {descTab === "beneficios" && (
              <ul className="list-disc pl-5 space-y-1">
                <li>Visual alinhado por mais tempo.</li>
                <li>Mais controle de textura e frizz.</li>
                <li>Rotina completa para manter o efeito de corte recém-feito.</li>
              </ul>
            )}
          </div>
        </div>

        <div className="glass-card mt-4 space-y-4 rounded-2xl p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className={cn(
                  "text-lg font-semibold text-foreground",
                  isModern ? "font-manrope" : "font-display",
                )}
              >
                {p.reviewsTitle}
              </h2>
              <p className="text-xs text-muted-foreground">{p.reviewsCommunitySubtitle}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Nota média {product.rating ? product.rating.toFixed(1) : "—"}{" "}
              {product.reviews?.length ? `(${product.reviews.length} avaliações)` : ""}
            </p>
          </div>
          {useMemo(() => hasPurchasedProduct(user?.id, product.id), [user?.id, product.id]) ? (
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Avalie este produto</p>
                  <p className="text-xs text-muted-foreground">
                    Sua opinião ajuda outros clientes a escolherem melhor.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>{reviewRating}.0</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const value = idx + 1;
                  const active = value <= reviewRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className={`rounded-full p-1.5 transition-transform hover:-translate-y-0.5 ${
                        active ? "text-amber-400" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-colors placeholder:text-muted-foreground/40 focus:placeholder:text-transparent"
                placeholder={p.reviewsPrompt}
              />
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Fotos (opcional)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Adicionar até 3 fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleReviewPhoto(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  {reviewPhotos.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {reviewPhotos.length} foto(s) selecionada(s)
                    </p>
                  )}
                </div>
                {reviewPhotos.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {reviewPhotos.map((photo) => (
                      <img
                        key={photo}
                        src={photo}
                        alt="Prévia da avaliação"
                        className="w-14 h-14 rounded-md object-cover border border-border/60"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  onClick={handleSubmitReview}
                  disabled={!reviewComment.trim()}
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {p.submitReviewCta}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 p-8 text-center">
              <Star className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Avaliação restrita</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Apenas clientes que adquiriram este produto podem deixar uma avaliação.
              </p>
            </div>
          )}
          {product.reviews?.length ? (
            product.reviews.map((review) => (
              <div key={review.id} className="border-b border-border/50 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{review.userName}</p>
                  <StarRating rating={review.rating} size={12} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {review.comment || "Produto top! Meu corte durou muito mais e a barba ficou alinhada."}
                </p>
                {review.photos?.length ? (
                  <div className="mt-2 flex gap-2">
                    {review.photos.map((photo) => (
                      <img key={photo} src={photo} alt="Foto da avaliação" className="w-14 h-14 rounded-md object-cover border border-border/60" />
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Este produto ainda não possui avaliações.</p>
          )}
        </div>

        <div className="space-y-3">
          <h2
            className={cn(
              "text-lg font-semibold text-foreground",
              isModern ? "font-manrope" : "font-display",
            )}
          >
            {p.relatedTitle}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{p.relatedLead}</p>
          {relatedProducts.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((item, idx) => (
                <ProductCard key={item.id} product={item} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem relacionados no momento.</p>
          )}
        </div>

        {crossSellProducts.length > 0 && (
          <div className="space-y-3">
            <h2
              className={cn(
                "text-lg font-semibold text-foreground",
                isModern ? "font-manrope" : "font-display",
              )}
            >
              {p.bundleTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crossSellProducts.map((item, idx) => (
                <div key={`upsell-${item.id}`} className="glass-card rounded-xl p-3 border border-border/60">
                  <ProductCard product={item} index={idx} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2
            className={cn(
              "text-lg font-semibold text-foreground",
              isModern ? "font-manrope" : "font-display",
            )}
          >
            {p.nearbyTitle}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{p.nearbyLead}</p>
          {nearbyProducts.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyProducts.map((item, idx) => (
                <ProductCard key={item.id} product={item} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem ofertas próximas para este produto.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientProductDetail;
