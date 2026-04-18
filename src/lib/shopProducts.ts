import type { ShopProduct, ShopCoupon, ShopCartItem } from "@/types/shop";
import { getBarbershopById, mockBarbershops } from "@/lib/mockBarbershops";
import { getPointsForBarbershop } from "@/lib/loyalty";

const SHOP_PRODUCTS_KEY = "barberflow_shop_products";
const SHOP_COUPONS_KEY = "barberflow_shop_coupons";
const FALLBACK_ORDERS_KEY = "barberflow_shop_orders_fallback";

const defaultProducts: ShopProduct[] = [
  {
    id: "BF-1001",
    barbershopId: 1,
    name: "Pomada Matte Premium",
    description:
      "Pomada de alta fixação com acabamento matte natural. Ideal para cortes modernos e clássicos.",
    price: 49.9,
    originalPrice: 69.9,
    image:
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Pomadas",
    stock: 24,
    featured: true,
    brand: "BarberFlow",
    weight: "120g",
    sizes: ["P", "M", "G", "GG"],
    colors: [
      { name: "Preto", hex: "#111111" },
      { name: "Grafite", hex: "#444444" },
    ],
    sku: "POM-MATT-120",
    tags: ["pomada", "matte", "fixação forte"],
    rating: 4.7,
    soldCount: 342,
    reviews: [
      {
        id: "r1",
        userName: "Carlos",
        rating: 5,
        comment: "Fixação ótima o dia inteiro.",
        date: "2026-03-10",
      },
      {
        id: "r2",
        userName: "João",
        rating: 4,
        comment: "Muito boa, rende bastante.",
        date: "2026-03-05",
      },
    ],
    createdAt: "2026-01-15",
  },
  {
    id: "BF-1002",
    barbershopId: 1,
    name: "Óleo para Barba Cedro & Menta",
    description:
      "Óleo hidratante que amacia a barba, elimina a coceira e traz brilho natural.",
    price: 39.9,
    image:
      "https://images.unsplash.com/photo-1528701800489-20be3c30c1d5?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1528701800489-20be3c30c1d5?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1607006483225-7e120f9d2b43?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Barba",
    stock: 18,
    brand: "BarberFlow",
    weight: "30ml",
    sku: "OLB-CED-30",
    tags: ["óleo", "barba", "hidratação"],
    rating: 4.5,
    soldCount: 198,
    reviews: [
      {
        id: "r3",
        userName: "Pedro",
        rating: 5,
        comment: "Barba macia e com perfume leve.",
        date: "2026-03-12",
      },
    ],
    createdAt: "2026-01-20",
  },
  {
    id: "BF-1003",
    barbershopId: 1,
    name: "Shampoo Anticaspa Barbearia",
    description:
      "Shampoo específico para couro cabeludo e barba. Controla oleosidade e descamação.",
    price: 34.9,
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Cuidados",
    stock: 32,
    brand: "BarberFlow",
    weight: "200ml",
    sku: "SHP-ANT-200",
    tags: ["shampoo", "anticaspa", "barba"],
    rating: 4.3,
    soldCount: 156,
    reviews: [],
    createdAt: "2026-02-01",
  },
  {
    id: "BF-1004",
    barbershopId: 1,
    name: "Kit Completo Barbearia",
    description:
      "Kit com pomada, óleo para barba e shampoo. Tudo que precisa para cuidar do visual.",
    price: 99.9,
    originalPrice: 129.9,
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1621605816054-00ff6d6f08ab?auto=format&fit=crop&w=600&q=80",
    ],
    category: "Kits",
    stock: 12,
    featured: true,
    brand: "BarberFlow",
    weight: "350g",
    sku: "KIT-CMP-001",
    tags: ["kit", "completo", "barbearia"],
    rating: 4.8,
    soldCount: 89,
    reviews: [
      {
        id: "r4",
        userName: "Ricardo",
        rating: 5,
        comment: "Excelente custo-benefício. Produtos de qualidade.",
        date: "2026-03-14",
      },
    ],
    createdAt: "2026-02-10",
  },
];

const defaultCoupons: ShopCoupon[] = [
  { code: "BARBER10", discount: 10, active: true, minOrderValue: 80 },
  { code: "PRIMEIRA", discount: 15, active: true, minOrderValue: 60 },
];

function loadProductsRaw(): ShopProduct[] {
  try {
    const raw = localStorage.getItem(SHOP_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(SHOP_PRODUCTS_KEY, JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultProducts;
  } catch {
    return defaultProducts;
  }
}

function saveProductsRaw(list: ShopProduct[]) {
  localStorage.setItem(SHOP_PRODUCTS_KEY, JSON.stringify(list));
}

function withBarbershopContext(product: ShopProduct): ShopProduct {
  const shop = typeof product.barbershopId === "number" ? getBarbershopById(product.barbershopId) : undefined;
  return {
    ...product,
    barbershopName: product.barbershopName || shop?.name,
    pickupLocation: product.pickupLocation || shop?.location,
  };
}

function loadCouponsRaw(): ShopCoupon[] {
  try {
    const raw = localStorage.getItem(SHOP_COUPONS_KEY);
    if (!raw) {
      localStorage.setItem(SHOP_COUPONS_KEY, JSON.stringify(defaultCoupons));
      return defaultCoupons;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultCoupons;
  } catch {
    return defaultCoupons;
  }
}

function saveCouponsRaw(list: ShopCoupon[]) {
  localStorage.setItem(SHOP_COUPONS_KEY, JSON.stringify(list));
}

export function getShopProducts(): ShopProduct[] {
  return loadProductsRaw()
    .filter((p) => typeof p.barbershopId === "number")
    .map(withBarbershopContext);
}

export function getShopProductsByBarbershop(_barbershopId?: number): ShopProduct[] {
  const all = getShopProducts();
  if (!_barbershopId) return all;
  return all.filter((p) => p.barbershopId === _barbershopId);
}

export function saveShopProducts(products: ShopProduct[]) {
  saveProductsRaw(products);
}

export function addShopProduct(product: ShopProduct) {
  if (typeof product.barbershopId !== "number") return loadProductsRaw();
  const products = loadProductsRaw();
  products.push(withBarbershopContext(product));
  saveProductsRaw(products);
  return getShopProducts();
}

export function updateShopProduct(updated: ShopProduct) {
  const products = loadProductsRaw().map((p) => (p.id === updated.id ? withBarbershopContext(updated) : p));
  saveProductsRaw(products);
  return getShopProducts();
}

export function deleteShopProduct(id: string) {
  const products = loadProductsRaw().filter((p) => p.id !== id);
  saveProductsRaw(products);
  return getShopProducts();
}

export function getShopProductById(id: string): ShopProduct | undefined {
  return getShopProducts().find((p) => p.id === id);
}

export function generateShopProductId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `BF-${num}`;
}

export function getShopCoupons(): ShopCoupon[] {
  return loadCouponsRaw();
}

export function getShopCouponsByBarbershop(barbershopId?: number): ShopCoupon[] {
  if (typeof barbershopId !== "number") return getShopCoupons();
  return getShopCoupons().filter((coupon) => {
    if (typeof coupon.barbershopId !== "number") return false;
    return coupon.barbershopId === barbershopId;
  });
}

export function saveShopCoupons(coupons: ShopCoupon[]) {
  saveCouponsRaw(coupons);
}

export function addShopCoupon(coupon: ShopCoupon) {
  const coupons = loadCouponsRaw();
  const exists = coupons.some((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
  if (exists) return coupons;
  coupons.push(coupon);
  saveCouponsRaw(coupons);
  return coupons;
}

export function updateShopCoupon(updated: ShopCoupon) {
  const coupons = loadCouponsRaw().map((c) =>
    c.code.toUpperCase() === updated.code.toUpperCase() ? updated : c
  );
  saveCouponsRaw(coupons);
  return coupons;
}

export function deleteShopCoupon(code: string) {
  const coupons = loadCouponsRaw().filter((c) => c.code.toUpperCase() !== code.toUpperCase());
  saveCouponsRaw(coupons);
  return coupons;
}

export function validateShopCoupon(
  code: string,
  total = 0,
  barbershopId?: number
): ShopCoupon | null {
  const coupons = loadCouponsRaw().filter((coupon) => {
    if (typeof barbershopId !== "number") return true;
    return typeof coupon.barbershopId === "number" ? coupon.barbershopId === barbershopId : false;
  });
  const current = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active);
  if (!current) return null;
  if (typeof barbershopId === "number" && typeof current.barbershopId === "number" && current.barbershopId !== barbershopId) {
    return null;
  }
  if (typeof current.minOrderValue === "number" && total < current.minOrderValue) return null;
  if (current.validUntil) {
    const validDate = new Date(current.validUntil);
    if (!Number.isNaN(validDate.getTime()) && validDate.getTime() < Date.now()) return null;
  }
  if (typeof current.maxUses === "number" && (current.usedCount ?? 0) >= current.maxUses) return null;
  return current;
}

export interface CouponValidationContext {
  code: string;
  total: number;
  barbershopId?: number;
  userId?: string;
  items?: ShopCartItem[];
}

export interface CouponValidationResult {
  ok: boolean;
  coupon?: ShopCoupon;
  discountValue: number;
  reason?: string;
}

function getEligibleSubtotal(coupon: ShopCoupon, items: ShopCartItem[] | undefined, total: number): number {
  if (!Array.isArray(items) || items.length === 0) return total;
  if (!coupon.scopeType || coupon.scopeType === "todos") return total;
  if (coupon.scopeType === "categoria" && coupon.scopeCategory) {
    return items
      .filter((item) => item.product.category === coupon.scopeCategory)
      .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }
  if (coupon.scopeType === "produto" && Array.isArray(coupon.scopeProductIds) && coupon.scopeProductIds.length > 0) {
    const ids = new Set(coupon.scopeProductIds);
    return items
      .filter((item) => ids.has(item.product.id))
      .reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }
  return total;
}

function isNewCustomer(userId: string | undefined, barbershopId: number | undefined): boolean {
  if (!userId || typeof barbershopId !== "number") return false;
  try {
    const raw = localStorage.getItem(FALLBACK_ORDERS_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(orders)) return true;
    return !orders.some((order) => order?.userId === userId && Number(order?.barbershopId ?? 0) === barbershopId);
  } catch {
    return false;
  }
}

function isVipCustomer(userId: string | undefined, barbershopId: number | undefined): boolean {
  if (!userId || typeof barbershopId !== "number") return false;
  return getPointsForBarbershop(userId, barbershopId) >= 200;
}

export function validateShopCouponAdvanced(context: CouponValidationContext): CouponValidationResult {
  const { code, total, barbershopId, userId, items } = context;
  const coupon = validateShopCoupon(code, total, barbershopId);
  if (!coupon) return { ok: false, discountValue: 0, reason: "Cupom inválido ou inativo." };

  if (coupon.targetAudience === "novos" && !isNewCustomer(userId, barbershopId)) {
    return { ok: false, discountValue: 0, reason: "Este cupom é exclusivo para novos clientes." };
  }
  if (coupon.targetAudience === "vip" && !isVipCustomer(userId, barbershopId)) {
    return { ok: false, discountValue: 0, reason: "Este cupom é exclusivo para clientes VIP." };
  }

  const customerUsage = userId ? Number(coupon.usageByCustomer?.[userId] ?? 0) : 0;
  if (typeof coupon.maxUsesPerCustomer === "number" && userId && customerUsage >= coupon.maxUsesPerCustomer) {
    return { ok: false, discountValue: 0, reason: "Limite de uso por cliente atingido para este cupom." };
  }

  const eligibleSubtotal = getEligibleSubtotal(coupon, items, total);
  if (eligibleSubtotal <= 0) {
    return { ok: false, discountValue: 0, reason: "Este cupom não se aplica aos itens do carrinho." };
  }

  const discountType = coupon.discountType ?? "percentual";
  const discountValueBase = Number(coupon.discountValue ?? coupon.discount ?? 0);
  const discountValue =
    discountType === "valor_fixo"
      ? Math.min(Math.max(discountValueBase, 0), eligibleSubtotal)
      : eligibleSubtotal * (Math.max(discountValueBase, 0) / 100);

  if (discountValue <= 0) {
    return { ok: false, discountValue: 0, reason: "Cupom sem desconto válido." };
  }

  return { ok: true, coupon, discountValue: Number(discountValue.toFixed(2)) };
}

export function registerCouponUsage(code: string, userId?: string): ShopCoupon | null {
  const coupons = loadCouponsRaw();
  const idx = coupons.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
  if (idx < 0) return null;
  const current = coupons[idx];
  const usageByCustomer = { ...(current.usageByCustomer ?? {}) };
  if (userId) usageByCustomer[userId] = Number(usageByCustomer[userId] ?? 0) + 1;
  const updated: ShopCoupon = {
    ...current,
    usedCount: Number(current.usedCount ?? 0) + 1,
    usageByCustomer,
  };
  coupons[idx] = updated;
  saveCouponsRaw(coupons);
  return updated;
}

export function getRelatedProducts(productId: string, limit = 4): ShopProduct[] {
  const current = getShopProductById(productId);
  if (!current) return [];
  const all = getShopProducts().filter((p) => p.id !== productId);
  const currentTags = new Set((current.tags ?? []).map((tag) => tag.toLowerCase()));

  const scored = all.map((candidate) => {
    let score = 0;
    if (candidate.category === current.category) score += 3;
    if (candidate.brand && current.brand && candidate.brand === current.brand) score += 2;
    const tagOverlap = (candidate.tags ?? []).reduce(
      (acc, tag) => (currentTags.has(tag.toLowerCase()) ? acc + 1 : acc),
      0,
    );
    score += tagOverlap;
    score += (candidate.rating ?? 0) * 0.1;
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getNearbyBarbershopProducts(product: ShopProduct, limit = 6): ShopProduct[] {
  if (typeof product.barbershopId !== "number") return [];
  const currentShop = getBarbershopById(product.barbershopId);
  if (!currentShop) return [];

  const nearbyIds = mockBarbershops
    .filter((shop) => shop.id !== currentShop.id)
    .filter((shop) => {
      const currentCity = currentShop.location.split(",")[0]?.trim().toLowerCase();
      const candidateCity = shop.location.split(",")[0]?.trim().toLowerCase();
      return currentCity && candidateCity ? currentCity === candidateCity : true;
    })
    .map((shop) => shop.id);

  return getShopProducts()
    .filter((entry) => typeof entry.barbershopId === "number" && nearbyIds.includes(entry.barbershopId))
    .slice(0, limit);
}

export function hasPurchasedProduct(userId: string | undefined, productId: string | undefined): boolean {
  if (!userId || !productId) return false;
  try {
    const raw = localStorage.getItem(FALLBACK_ORDERS_KEY);
    if (!raw) return false;
    const orders = JSON.parse(raw);
    if (!Array.isArray(orders)) return false;
    
    // Procura por qualquer pedido do usuário que contenha o produto
    return orders.some((order) => {
      if (order.userId !== userId) return false;
      const items = order.items || [];
      return items.some((item: any) => item.product?.id === productId || item.productId === productId);
    });
  } catch {
    return false;
  }
}

export function addProductReview(params: {
  productId: string;
  userName: string;
  userId?: string;
  rating: number;
  comment: string;
  photos?: string[];
}): ShopProduct | null {
  const products = loadProductsRaw();
  const index = products.findIndex((product) => product.id === params.productId);
  if (index < 0) return null;

  const product = products[index];
  const reviews = Array.isArray(product.reviews) ? [...product.reviews] : [];
  reviews.unshift({
    id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userName: params.userName,
    userId: params.userId,
    rating: params.rating,
    comment: params.comment,
    date: new Date().toISOString().slice(0, 10),
    photos: params.photos ?? [],
  });

  const rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const updated: ShopProduct = {
    ...product,
    reviews,
    rating: Number(rating.toFixed(1)),
  };

  products[index] = withBarbershopContext(updated);
  saveProductsRaw(products);
  return withBarbershopContext(updated);
}

