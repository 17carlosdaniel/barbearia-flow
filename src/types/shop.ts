export interface ShopProductColor {
  name: string;
  hex: string;
}

export interface ShopReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
  userId?: string;
}

export interface ShopProduct {
  id: string;
  barbershopId?: number;
  barbershopName?: string;
  pickupLocation?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  stock: number;
  featured?: boolean;
  sizes?: string[];
  colors?: ShopProductColor[];
  materials?: string[];
  type?: string;
  brand?: string;
  weight?: string;
  sku?: string;
  tags?: string[];
  reviews?: ShopReview[];
  rating?: number;
  soldCount?: number;
  createdAt?: string;
}

export interface ShopCartItem {
  id?: string;
  product: ShopProduct;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  purchaseCode?: string;
}

export interface ShopOrder {
  id: string;
  orderPublicCode?: string;
  userId?: string;
  barbershopId: number;
  items: ShopCartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  paymentMethod: "pix" | "card" | "boleto" | "cash";
  status: "pendente" | "pago" | "em_atendimento" | "finalizado";
  pickupInStore: boolean;
  pickupLocation?: string;
  barberId?: string;
  barberName?: string;
  attendedAt?: string;
  finalizedAt?: string;
  address?: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  createdAt: string;
  coupon?: string;
  discount?: number;
}

export interface ShopCoupon {
  code: string;
  discount: number;
  discountType?: "percentual" | "valor_fixo";
  discountValue?: number;
  active: boolean;
  minOrderValue?: number;
  maxUses?: number;
  usedCount?: number;
  maxUsesPerCustomer?: number;
  usageByCustomer?: Record<string, number>;
  targetAudience?: "todos" | "novos" | "vip";
  scopeType?: "todos" | "categoria" | "produto";
  scopeCategory?: string;
  scopeProductIds?: string[];
  validUntil?: string;
  barbershopId?: number;
  createdAt?: string;
}

