import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Timer,
  Sparkles,
  Search,
  SlidersHorizontal,
  Flame,
  Star,
  Zap,
  Truck,
  Droplets,
  UserRound,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/shop/ProductCard";
import CartDrawer from "@/components/shop/CartDrawer";
import CheckoutModal from "@/components/shop/CheckoutModal";
import { getShopProducts, registerCouponUsage, validateShopCouponAdvanced } from "@/lib/shopProducts";
import type { ShopCartItem } from "@/types/shop";
import { toast } from "@/hooks/use-toast";
import ShopHeroCarousel from "@/components/shop/ShopHeroCarousel";
import CategoryNav from "@/components/shop/CategoryNav";
import ProductCardSkeleton from "@/components/shop/ProductCardSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientCommerceCopy } from "@/lib/clientCommerceCopy";
import { cn } from "@/lib/utils";
import { createOrder } from "@/lib/shopOrders";
import { getBarbershopById } from "@/lib/mockBarbershops";
import { generateItemPurchaseCode, generateOrderPublicCode } from "@/lib/orderCodes";
import { getBarberCatalog } from "@/lib/barberCatalog";
import type { ShopProduct } from "@/types/shop";

const CART_KEY = "barberflow_shop_cart";

type QuickFilterKey =
  | "none"
  | "promo"
  | "rating"
  | "under50"
  | "fast"
  | "dryHair"
  | "beard"
  | "finish"
  | "bestsellers"
  | "barbershopChoice";

function productHaystack(p: ShopProduct) {
  return [p.name, p.description, p.category, p.brand ?? "", ...(p.tags ?? [])].join(" ").toLowerCase();
}

function matchesDryHair(p: ShopProduct) {
  return /seco|frizz|hidrata|nutri|óleo|oleo|cacho|ressec|máscara|úmido|umido/.test(productHaystack(p));
}

function matchesFinishIntent(p: ShopProduct) {
  if (p.category === "Pomadas") return true;
  return /matte|fixa|pomada|wax|cera|finaliz|modela|acabamento/.test(productHaystack(p));
}

const ClientStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const commerce = useMemo(() => getClientCommerceCopy(identity), [identity]);
  const s = commerce.store;
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [category, setCategory] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [cartBounce, setCartBounce] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"relevancia" | "vendas" | "precoAsc" | "precoDesc" | "rating">(
    "relevancia",
  );
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<number | "all">("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>("none");
  const [usageType, setUsageType] = useState<"all" | "hair" | "beard" | "finish">("all");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingValue] = useState(19.9);
  const [offerSeconds, setOfferSeconds] = useState(24 * 60 * 60);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProducts(getShopProducts());
      try {
        const raw = localStorage.getItem(CART_KEY);
        if (raw) setCart(JSON.parse(raw));
      } catch {
        setCart([]);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setOfferSeconds((prev) => (prev > 0 ? prev - 1 : 24 * 60 * 60));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isModern) {
      setQuickFilter("none");
      setUsageType("all");
    }
  }, [isModern]);

  const productsByBarbershop = useMemo(
    () =>
      products.reduce<Record<number, string>>((acc, product) => {
        if (typeof product.barbershopId !== "number") return acc;
        if (!acc[product.barbershopId]) {
          acc[product.barbershopId] = product.barbershopName || `Barbearia #${product.barbershopId}`;
        }
        return acc;
      }, {}),
    [products],
  );

  const scopedProducts = useMemo(() => {
    if (selectedBarbershopId === "all") return products;
    return products.filter((p) => p.barbershopId === selectedBarbershopId);
  }, [products, selectedBarbershopId]);

  const filteredProducts = useMemo(() => {
    if (category === "Todos") return scopedProducts;
    if (category === "CuidadosDiarios") return scopedProducts.filter((p) => p.category === "Cuidados");
    if (category === "Essenciais") return scopedProducts.filter((p) => p.featured);
    return scopedProducts.filter((p) => p.category === category);
  }, [scopedProducts, category]);

  const searchableProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return filteredProducts;
    return filteredProducts.filter((p) => {
      const haystack = [
        p.name,
        p.description,
        p.category,
        p.brand ?? "",
        p.tags?.join(" ") ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [filteredProducts, searchTerm]);

  const finalProducts = useMemo(() => {
    let list = [...searchableProducts];

    if (onlyInStock) {
      list = list.filter((p) => p.stock > 0);
    }
    if (onlyDiscount) {
      list = list.filter((p) => typeof p.originalPrice === "number" && p.originalPrice > p.price);
    }
    if (typeof maxPrice === "number") {
      list = list.filter((p) => p.price <= maxPrice);
    }
    if (quickFilter === "promo") {
      list = list.filter((p) => typeof p.originalPrice === "number" && p.originalPrice > p.price);
    }
    if (quickFilter === "rating") {
      list = list.filter((p) => (p.rating ?? 0) >= 4.5);
    }
    if (quickFilter === "under50") {
      list = list.filter((p) => p.price <= 50);
    }
    if (quickFilter === "fast") {
      list = list.filter((p) => p.stock > 0);
    }
    if (quickFilter === "dryHair") {
      list = list.filter(matchesDryHair);
    }
    if (quickFilter === "beard") {
      list = list.filter((p) => p.category === "Barba" || /barba/i.test(productHaystack(p)));
    }
    if (quickFilter === "finish") {
      list = list.filter(matchesFinishIntent);
    }
    if (quickFilter === "bestsellers") {
      list = list.filter((p) => p.featured || (p.soldCount ?? 0) >= 40);
    }
    if (quickFilter === "barbershopChoice") {
      list = list.filter((p) => p.featured);
    }

    if (usageType === "beard") {
      list = list.filter((p) => p.category === "Barba" || /barba/i.test(productHaystack(p)));
    } else if (usageType === "hair") {
      list = list.filter((p) => ["Cuidados", "Kits"].includes(p.category));
    } else if (usageType === "finish") {
      list = list.filter((p) => p.category === "Pomadas");
    }

    if (sortBy === "precoAsc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "precoDesc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "vendas") {
      list.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    }

    return list;
  }, [searchableProducts, onlyInStock, onlyDiscount, maxPrice, sortBy, quickFilter, usageType]);

  const crossSelling = useMemo(() => products.slice(0, 8), [products]);
  const featured = useMemo(() => products.filter((p) => p.featured), [products]);
  const flashOffers = useMemo(
    () =>
      products
        .filter((p) => typeof p.originalPrice === "number" && p.originalPrice > p.price)
        .slice(0, 4),
    [products],
  );
  const recommended = useMemo(
    () =>
      [...products]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 4),
    [products],
  );
  const offerTime = `${Math.floor(offerSeconds / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((offerSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0")}:${(offerSeconds % 60).toString().padStart(2, "0")}`;

  const packageOffers = useMemo(() => {
    const ids =
      selectedBarbershopId === "all"
        ? Object.keys(productsByBarbershop).map((id) => Number(id))
        : [selectedBarbershopId];
    const offers: ShopProduct[] = [];
    ids.forEach((shopId) => {
      const catalog = getBarberCatalog(shopId);
      const shop = getBarbershopById(shopId);
      (catalog.packages ?? []).forEach((pkg) => {
        const finalPrice = Number(pkg.finalPrice ?? pkg.price ?? 0);
        const basePrice = Number(pkg.basePrice ?? finalPrice);
        offers.push({
          id: `PKG-${shopId}-${pkg.id}`,
          barbershopId: shopId,
          barbershopName: shop?.name,
          pickupLocation: shop?.location,
          name: pkg.name,
          description: pkg.description || "Pacote promocional com serviços e produtos.",
          price: finalPrice,
          originalPrice: basePrice > finalPrice ? basePrice : undefined,
          image: pkg.imageUrl || "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
          category: "Pacotes",
          stock: 999,
          featured: true,
          type: "pacote",
          tags: ["pacote", ...(pkg.tags ?? [])],
          createdAt: pkg.validUntil || new Date().toISOString(),
        });
      });
    });
    return offers;
  }, [selectedBarbershopId, productsByBarbershop]);

  const addToCart = (product: ShopProduct, options?: { selectedSize?: string; selectedColor?: string; selectedMaterial?: string }) => {
    if (typeof product.barbershopId !== "number") {
      toast({
        title: "Produto indisponível",
        description: "Este produto não está vinculado a uma barbearia de retirada.",
        variant: "destructive",
      });
      return;
    }
    setCart((prev) => {
      const existingBarbershop = prev[0]?.product.barbershopId;
      if (typeof existingBarbershop === "number" && existingBarbershop !== product.barbershopId) {
        toast({
          title: "Carrinho por barbearia",
          description: "Finalize ou limpe o carrinho para comprar em outra barbearia.",
          variant: "destructive",
        });
        return prev;
      }
      const lineId = `${product.id}::${options?.selectedSize ?? ""}::${options?.selectedColor ?? ""}::${options?.selectedMaterial ?? ""}`;
      const existing = prev.find(
        (i) => i.id === lineId
      );
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.stock);
        return prev.map((i) => (i.id === lineId ? { ...i, quantity: newQty } : i));
      }
      return [
        ...prev,
        {
          id: lineId,
          product,
          quantity: 1,
          selectedSize: options?.selectedSize,
          selectedColor: options?.selectedColor,
          selectedMaterial: options?.selectedMaterial,
        },
      ];
    });
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);
    setCartOpen(true);
  };

  const updateQuantity = (lineId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === lineId);
      if (!item) return prev;
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty === 0) return prev.filter((i) => i.id !== lineId);
      return prev.map((i) => (i.id === lineId ? { ...i, quantity: newQty } : i));
    });
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== lineId));
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const applyCoupon = () => {
    const cartBarbershopId = cart[0]?.product.barbershopId;
    const subtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    if (!couponCode.trim()) {
      setDiscountValue(0);
      setAppliedCouponCode("");
      return;
    }
    const validation = validateShopCouponAdvanced({
      code: couponCode.trim(),
      total: subtotal,
      barbershopId: typeof cartBarbershopId === "number" ? cartBarbershopId : undefined,
      userId: user?.id,
      items: cart,
    });
    if (!validation.ok || !validation.coupon) {
      toast({
        title: "Cupom inválido",
        description: validation.reason || "Verifique o código e as regras de uso.",
        variant: "destructive",
      });
      return;
    }
    setDiscountValue(validation.discountValue);
    setAppliedCouponCode(validation.coupon.code);
    toast({ title: "Cupom aplicado", description: "Desconto promocional aplicado com sucesso." });
  };

  const handleConfirmOrder = (data: {
    name: string;
    email: string;
    phone: string;
    method: "pix" | "card" | "boleto";
    pickupInStore: boolean;
    address?: {
      cep: string;
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    shipping: number;
  }) => {
    const cartBarbershopId = cart[0]?.product.barbershopId;
    if (typeof cartBarbershopId !== "number") {
      toast({
        title: "Erro ao finalizar pedido",
        description: "Não foi possível identificar a barbearia de retirada.",
        variant: "destructive",
      });
      return;
    }
    const subtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    const total = subtotal + data.shipping - discountValue;
    const barbershopId = cartBarbershopId;
    const pickupShop = getBarbershopById(barbershopId);
    const itemsWithCodes = cart.map((item) => ({
      ...item,
      purchaseCode: item.purchaseCode ?? generateItemPurchaseCode(item.product.id),
    }));
    const orderPublicCode = generateOrderPublicCode();
    const orderPayload = {
      id: `OR-${Date.now()}`,
      orderPublicCode,
      userId: user?.id,
      barbershopId,
      items: itemsWithCodes,
      subtotal,
      shipping: data.shipping,
      total,
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      paymentMethod: data.method,
      status: data.method === "pix" ? "pendente" : "pago",
      pickupInStore: data.pickupInStore,
      pickupLocation: pickupShop?.location,
      address: data.address,
      createdAt: new Date().toISOString(),
      coupon: appliedCouponCode || undefined,
      discount: discountValue || 0,
    } as const;

    void createOrder(orderPayload).then((result) => {
      if (appliedCouponCode) {
        registerCouponUsage(appliedCouponCode, user?.id);
      }
      const codePreview = itemsWithCodes.slice(0, 2).map((item) => item.purchaseCode).filter(Boolean).join(" · ");
      toast({
        title: result.ok ? "Pedido confirmado" : "Pedido registrado localmente",
        description: `Código ${orderPublicCode}. ${codePreview ? `Itens: ${codePreview}.` : ""} Total de R$ ${total.toFixed(2)}.`,
      });
    });
    setCart([]);
    setCouponCode("");
    setAppliedCouponCode("");
    setDiscountValue(0);
    localStorage.removeItem(CART_KEY);
  };

  const subtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const total = subtotal + shippingValue - discountValue;

  return (
    <DashboardLayout userType="cliente">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1
              className={cn(
                "text-2xl lg:text-3xl font-bold text-gradient-gold",
                isModern ? "font-manrope tracking-tight" : "font-display",
              )}
            >
              {s.pageTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{s.pageSubtitle}</p>
          </div>
          <Button
            variant="outline"
            className={`relative flex items-center gap-2 rounded-lg transition-transform ${
              cartBounce ? "scale-110 shadow-gold" : ""
            }`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            Carrinho ({cart.reduce((acc, i) => acc + i.quantity, 0)})
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shadow-gold">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </Button>
        </div>

        {!isModern && <ShopHeroCarousel />}

        <div className={cn("glass-card space-y-3 rounded-xl p-4", isModern && "py-3")}>
          <h2
            className={cn(
              "font-semibold text-foreground",
              isModern ? "font-manrope text-base tracking-tight" : "font-display text-lg",
            )}
          >
            {s.discoveryTitle}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.discoveryLead}</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={s.searchPlaceholder}
              className={cn("h-10 pl-9", isModern && "h-9 text-sm")}
            />
          </div>
          {isModern ? (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "dryHair" as const, label: s.quickDryHair, Icon: Droplets },
                  { key: "beard" as const, label: s.quickBeard, Icon: UserRound },
                  { key: "finish" as const, label: s.quickFinish, Icon: Sparkles },
                  { key: "under50" as const, label: s.quickUnder50, Icon: Zap },
                  { key: "bestsellers" as const, label: s.quickBestsellers, Icon: Flame },
                ] as const
              ).map(({ key, label, Icon }) => {
                const active = quickFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setQuickFilter(active ? "none" : key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.quickSelectionsTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "promo" as const, label: s.chipPromo, Icon: Flame },
                    { key: "rating" as const, label: s.chipRating, Icon: Star },
                    { key: "under50" as const, label: s.chipUnder50, Icon: Zap },
                    { key: "fast" as const, label: s.chipFast, Icon: Truck },
                    { key: "barbershopChoice" as const, label: s.chipBarbershopChoice, Icon: Sparkles },
                  ] as const
                ).map(({ key, label, Icon }) => {
                  const active = quickFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setQuickFilter(active ? "none" : key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2
            className={cn(
              "mb-2 text-sm font-semibold text-foreground",
              isModern ? "font-manrope" : "font-display text-base",
            )}
          >
            {s.categoriesSectionTitle}
          </h2>
          <CategoryNav category={category} onChange={setCategory} items={s.categoryItems} />
        </div>

        <div className={cn("glass-card space-y-3 rounded-xl p-4", isModern && "py-3")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              className={cn(
                "font-semibold text-foreground",
                isModern ? "font-manrope text-sm" : "font-display text-base",
              )}
            >
              {s.filterSectionTitle}
            </h2>
            <span className="text-xs text-muted-foreground">{s.resultsCount(finalProducts.length)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={selectedBarbershopId === "all" ? "all" : String(selectedBarbershopId)}
              onChange={(e) =>
                setSelectedBarbershopId(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="h-9 rounded-md border border-border/60 bg-background px-3 text-xs text-foreground"
            >
              <option value="all">{s.allBarbershops}</option>
              {Object.entries(productsByBarbershop).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                <SlidersHorizontal className={cn("h-4 w-4 transition-transform", filterOpen && "rotate-12")} />
                {s.filterLabel}
              </button>
              {(onlyInStock ||
                onlyDiscount ||
                maxPrice !== null ||
                sortBy !== "relevancia" ||
                quickFilter !== "none" ||
                usageType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setOnlyInStock(false);
                    setOnlyDiscount(false);
                    setMaxPrice(null);
                    setSortBy("relevancia");
                    setQuickFilter("none");
                    setUsageType("all");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {s.clearFilters}
                </button>
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <button
                    type="button"
                    onClick={() => setOnlyInStock((v) => !v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      onlyInStock
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {s.filterInStock}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlyDiscount((v) => !v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      onlyDiscount
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {s.filterOnSale}
                  </button>
                  <select
                    value={maxPrice === null ? "todos" : String(maxPrice)}
                    onChange={(e) => setMaxPrice(e.target.value === "todos" ? null : Number(e.target.value))}
                    className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
                  >
                    <option value="todos">{s.priceAll}</option>
                    <option value="40">Até R$ 40</option>
                    <option value="60">Até R$ 60</option>
                    <option value="100">Até R$ 100</option>
                  </select>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {s.usageTypeLabel}
                    </label>
                    <select
                      value={usageType}
                      onChange={(e) => setUsageType(e.target.value as "all" | "hair" | "beard" | "finish")}
                      className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground"
                    >
                      <option value="all">{s.usageAll}</option>
                      <option value="hair">{s.usageHair}</option>
                      <option value="beard">{s.usageBeard}</option>
                      <option value="finish">{s.usageFinish}</option>
                    </select>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "relevancia" | "vendas" | "precoAsc" | "precoDesc" | "rating")
                    }
                    className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground sm:col-span-2 lg:col-span-1 xl:col-span-2"
                  >
                    <option value="relevancia">{s.sortRelevance}</option>
                    <option value="vendas">{s.sortBestsellers}</option>
                    <option value="rating">{s.sortRating}</option>
                    <option value="precoAsc">{s.sortPriceAsc}</option>
                    <option value="precoDesc">{s.sortPriceDesc}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section id="store-vitrine" className="scroll-mt-6 space-y-3">
          <div className="flex items-end justify-between gap-2">
            <h2
              className={cn(
                "text-lg font-semibold text-foreground",
                isModern ? "font-manrope tracking-tight" : "font-display",
              )}
            >
              {s.vitrineTitle}
            </h2>
          </div>
          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
              isModern ? "gap-3 xl:grid-cols-5" : "gap-4 xl:grid-cols-4",
            )}
          >
            {loading
              ? Array.from({ length: isModern ? 10 : 8 }).map((_, idx) => <ProductCardSkeleton key={`sk-${idx}`} />)
              : finalProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} onAddToCart={addToCart} />)}
          </div>
          {!loading && products.length > 0 && finalProducts.length === 0 && (
            <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para <strong className="text-foreground">"{searchTerm}"</strong>.
            </div>
          )}
        </section>

        <div id="store-highlights" className="scroll-mt-6 space-y-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.highlightsEyebrow}</p>

          {recommended.length > 0 && (
            <div className="space-y-3">
              <h2
                className={cn(
                  "font-semibold text-foreground",
                  isModern ? "font-manrope text-base" : "font-display text-lg",
                )}
              >
                {s.recommendedTitle}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">{s.recommendedLead}</p>
              <Button type="button" variant="outlineGold" size="sm" onClick={() => navigate("/cliente/quiz")}>
                {s.recommendedCta}
              </Button>
              <div className={cn("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4", isModern ? "gap-3" : "gap-4")}>
                {recommended.map((p, i) => (
                  <ProductCard key={`rec-${p.id}`} product={p} index={i} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          )}

          {featured.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2
                  className={cn(
                    "font-semibold text-foreground",
                    isModern ? "font-manrope text-base" : "font-display text-lg",
                  )}
                >
                  {s.bestsellersTitle}
                </h2>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">{s.bestsellersLead}</p>
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
                  isModern ? "gap-3" : "gap-4",
                )}
              >
                {featured.map((p, i) => (
                  <ProductCard key={`featured-${p.id}`} product={p} index={i} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          )}

          {flashOffers.length > 0 && (
            <div className="space-y-3">
              <h2
                className={cn(
                  "font-semibold text-foreground",
                  isModern ? "font-manrope text-base" : "font-display text-lg",
                )}
              >
                {s.flashTitle}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">{s.offersLead}</p>
              <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Timer className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {s.timerEndsLabel}{" "}
                    <span className="font-mono font-semibold tabular-nums text-primary">{offerTime}</span>
                  </span>
                </div>
              </div>
              <div className={cn("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4", isModern ? "gap-3" : "gap-4")}>
                {flashOffers.map((p, i) => (
                  <ProductCard key={`flash-${p.id}`} product={p} index={i} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          )}

          {packageOffers.length > 0 && (
            <div className="space-y-3">
              <h2
                className={cn(
                  "font-semibold text-foreground",
                  isModern ? "font-manrope text-base" : "font-display text-lg",
                )}
              >
                {s.packagesTitle}
              </h2>
              <div className={cn("grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4", isModern ? "gap-3" : "gap-4")}>
                {packageOffers.map((p, i) => (
                  <ProductCard key={`pkg-${p.id}`} product={p} index={i} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2
            className={cn(
              "font-semibold text-foreground",
              isModern ? "font-manrope text-base" : "font-display text-lg",
            )}
          >
            {s.crossSellTitle}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{s.crossSellLead}</p>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {crossSelling.map((p, i) => (
                <div key={`cross-${p.id}`} className="w-64">
                  <ProductCard product={p} index={i} onAddToCart={addToCart} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {products.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          </div>
        )}
      </motion.div>

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        couponCode={couponCode}
        discountValue={discountValue}
        shippingValue={shippingValue}
        onCouponCodeChange={setCouponCode}
        onApplyCoupon={applyCoupon}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart}
        subtotal={subtotal}
        shipping={shippingValue}
        discount={discountValue}
        couponCode={appliedCouponCode}
        total={total}
        barbershop={getBarbershopById(
          typeof cart[0]?.product.barbershopId === "number" ? cart[0].product.barbershopId : 1,
        )}
        onConfirm={handleConfirmOrder}
      />
    </DashboardLayout>
  );
};

export default ClientStore;
