import { supabase } from "@/lib/supabaseClient";
import type {
  StockMovement,
  StockMovementReason,
  StockMovementType,
  StoreProduct,
  StoreProductAttributes,
  StoreProductType,
  StoreProductVariant,
  StoreSale,
  StoreSaleSource,
} from "@/types/store";
import type { ShopOrder } from "@/types/shop";
import { getBarbershopProfile } from "@/lib/barbershopProfile";

const PRODUCTS_FB = "barberflow_store_v2_products_fallback";
const MOVEMENTS_FB = "barberflow_store_v2_stock_movements_fallback";
const SALES_FB = "barberflow_store_v2_sales_fallback";
const VARIANTS_FB = "barberflow_store_v2_product_variants_fallback";

type AnyRow = Record<string, unknown>;

const nowIso = () => new Date().toISOString();

const mapProductRow = (row: AnyRow): StoreProduct => ({
  id: String(row.id ?? ""),
  barbershopId: Number(row.barbershop_id ?? row.barbershopId ?? 0),
  name: String(row.name ?? ""),
  description: String(row.description ?? ""),
  category: String(row.category ?? "Produtos"),
  productType: String(row.product_type ?? row.productType ?? "barbearia") as StoreProductType,
  attributes: ((row.attributes ?? {}) as StoreProductAttributes) ?? {},
  costPrice: Number(row.cost_price ?? row.costPrice ?? 0),
  salePrice: Number(row.sale_price ?? row.salePrice ?? 0),
  stock: Number(row.stock ?? 0),
  minStock: Number(row.min_stock ?? row.minStock ?? 3),
  isActive: Boolean(row.is_active ?? row.isActive ?? true),
  isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? false),
  tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map(String) : [],
  imageUrl: String(row.image_url ?? row.imageUrl ?? ""),
  createdAt: String(row.created_at ?? row.createdAt ?? nowIso()),
  updatedAt: String(row.updated_at ?? row.updatedAt ?? nowIso()),
});

const mapMovementRow = (row: AnyRow): StockMovement => ({
  id: String(row.id ?? ""),
  productId: String(row.product_id ?? row.productId ?? ""),
  barbershopId: Number(row.barbershop_id ?? row.barbershopId ?? 0),
  type: String(row.type ?? "IN") as StockMovementType,
  quantity: Number(row.quantity ?? 0),
  reason: String(row.reason ?? "ADJUSTMENT") as StockMovementReason,
  referenceId: typeof row.reference_id === "string" ? row.reference_id : typeof row.referenceId === "string" ? row.referenceId : undefined,
  purchaseCode: typeof row.purchase_code === "string" ? row.purchase_code : typeof row.purchaseCode === "string" ? row.purchaseCode : undefined,
  orderPublicCode:
    typeof row.order_public_code === "string" ? row.order_public_code : typeof row.orderPublicCode === "string" ? row.orderPublicCode : undefined,
  createdAt: String(row.created_at ?? row.createdAt ?? nowIso()),
});

const mapVariantRow = (row: AnyRow): StoreProductVariant => ({
  id: String(row.id ?? ""),
  productId: String(row.product_id ?? row.productId ?? ""),
  sku: typeof row.sku === "string" && row.sku ? row.sku : undefined,
  attrsKey: (typeof row.attrs_key === "object" && row.attrs_key !== null
    ? (row.attrs_key as Record<string, string>)
    : typeof row.attrsKey === "object" && row.attrsKey !== null
      ? (row.attrsKey as Record<string, string>)
      : {}) as Record<string, string>,
  stock: Number(row.stock ?? 0),
  minStock: Number(row.min_stock ?? row.minStock ?? 0),
  createdAt: String(row.created_at ?? row.createdAt ?? nowIso()),
  updatedAt: String(row.updated_at ?? row.updatedAt ?? nowIso()),
});

const mapSaleRow = (row: AnyRow): StoreSale => ({
  id: String(row.id ?? row.sale_id ?? ""),
  productId: String(row.product_id ?? row.productId ?? ""),
  barbershopId: Number(row.barbershop_id ?? row.barbershopId ?? 0),
  barberId: typeof row.barber_id === "string" ? row.barber_id : typeof row.barberId === "string" ? row.barberId : undefined,
  sellerName: typeof row.seller_name === "string" ? row.seller_name : typeof row.sellerName === "string" ? row.sellerName : undefined,
  purchaseCode: typeof row.purchase_code === "string" ? row.purchase_code : typeof row.purchaseCode === "string" ? row.purchaseCode : undefined,
  orderPublicCode:
    typeof row.order_public_code === "string" ? row.order_public_code : typeof row.orderPublicCode === "string" ? row.orderPublicCode : undefined,
  quantity: Number(row.quantity ?? 0),
  unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
  total: Number(row.total ?? 0),
  commissionRate: Number(row.commission_rate ?? row.commissionRate ?? 0),
  commissionAmount: Number(row.commission_amount ?? row.commissionAmount ?? 0),
  paymentMethod: String(row.payment_method ?? row.paymentMethod ?? "pix") as StoreSale["paymentMethod"],
  source: String(row.source ?? "store") as StoreSaleSource,
  createdAt: String(row.created_at ?? row.createdAt ?? nowIso()),
});

const loadFallback = <T>(key: string, mapper: (row: AnyRow) => T): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((row) => mapper((row ?? {}) as AnyRow)) : [];
  } catch {
    return [];
  }
};

const saveFallback = <T>(key: string, rows: T[]) => {
  localStorage.setItem(key, JSON.stringify(rows));
};

const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const isUuid = (value?: string) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function getStoreProductsByBarbershop(barbershopId: number) {
  try {
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row) => mapProductRow((row ?? {}) as AnyRow));
  } catch {
    return loadFallback(PRODUCTS_FB, mapProductRow).filter((p) => p.barbershopId === barbershopId);
  }
}

export async function upsertStoreProduct(
  barbershopId: number,
  payload: Omit<StoreProduct, "id" | "barbershopId" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const normalized = {
    barbershop_id: barbershopId,
    name: payload.name,
    description: payload.description,
    category: payload.category,
    product_type: payload.productType ?? "barbearia",
    attributes: payload.attributes ?? {},
    cost_price: payload.costPrice,
    sale_price: payload.salePrice,
    stock: payload.stock,
    min_stock: payload.minStock,
    is_active: payload.isActive,
    is_featured: payload.isFeatured,
    tags: payload.tags,
    image_url: payload.imageUrl,
  };
  try {
    const validId = isUuid(payload.id) ? payload.id : undefined;
    const query = validId
      ? supabase.from("store_products").update(normalized).eq("id", validId).select("*").single()
      : supabase.from("store_products").insert(normalized).select("*").single();
    const { data, error } = await query;
    if (error) throw error;
    return mapProductRow((data ?? {}) as AnyRow);
  } catch {
    const list = loadFallback(PRODUCTS_FB, mapProductRow);
    const existingIdx = payload.id ? list.findIndex((p) => p.id === payload.id) : -1;
    const now = nowIso();
    if (existingIdx >= 0) {
      const current = list[existingIdx];
      list[existingIdx] = {
        ...current,
        barbershopId,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        productType: payload.productType ?? "barbearia",
        attributes: payload.attributes ?? {},
        costPrice: payload.costPrice,
        salePrice: payload.salePrice,
        stock: payload.stock,
        minStock: payload.minStock,
        isActive: payload.isActive,
        isFeatured: payload.isFeatured,
        tags: payload.tags,
        imageUrl: payload.imageUrl,
        updatedAt: now,
      };
      saveFallback(PRODUCTS_FB, list);
      return list[existingIdx];
    }
    const created: StoreProduct = {
      id: payload.id || genId("prod"),
      barbershopId,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      productType: payload.productType ?? "barbearia",
      attributes: payload.attributes ?? {},
      costPrice: payload.costPrice,
      salePrice: payload.salePrice,
      stock: payload.stock,
      minStock: payload.minStock,
      isActive: payload.isActive,
      isFeatured: payload.isFeatured,
      tags: payload.tags,
      imageUrl: payload.imageUrl,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(created);
    saveFallback(PRODUCTS_FB, list);
    return created;
  }
}

function loadVariantsFallbackMap(): Record<string, StoreProductVariant[]> {
  try {
    const raw = localStorage.getItem(VARIANTS_FB);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, StoreProductVariant[]> = {};
    for (const [pid, rows] of Object.entries(parsed)) {
      if (Array.isArray(rows)) {
        out[pid] = rows.map((r) => mapVariantRow((r ?? {}) as AnyRow));
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveVariantsFallbackMap(map: Record<string, StoreProductVariant[]>) {
  try {
    localStorage.setItem(VARIANTS_FB, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Lista variações/SKU de um produto da loja. */
export async function getStoreProductVariants(productId: string): Promise<StoreProductVariant[]> {
  if (!productId) return [];
  if (!isUuid(productId)) {
    const map = loadVariantsFallbackMap();
    return map[productId] ?? [];
  }
  try {
    const { data, error } = await supabase
      .from("store_product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row) => mapVariantRow((row ?? {}) as AnyRow));
  } catch {
    const map = loadVariantsFallbackMap();
    return map[productId] ?? [];
  }
}

export type ReplaceVariantInput = {
  id?: string;
  sku?: string;
  attrsKey: Record<string, string>;
  stock: number;
  minStock: number;
};

/**
 * Substitui todas as variações do produto (delete + insert).
 * Atualiza `store_products.stock` com a soma das variações quando `rows.length > 0`.
 */
export async function replaceStoreProductVariants(
  productId: string,
  rows: ReplaceVariantInput[],
  barbershopId: number,
): Promise<StoreProductVariant[]> {
  const sumStock = rows.reduce((s, r) => s + Math.max(0, Math.floor(Number(r.stock) || 0)), 0);
  const sumMin = rows.reduce((s, r) => s + Math.max(0, Math.floor(Number(r.minStock) || 0)), 0);
  const nextMin = rows.length > 0 ? Math.max(1, sumMin) : undefined;

  try {
    if (!isUuid(productId)) {
      throw new Error("invalid-product-id");
    }
    const { error: delErr } = await supabase.from("store_product_variants").delete().eq("product_id", productId);
    if (delErr) throw delErr;

    if (rows.length > 0) {
      const payload = rows.map((r) => ({
        product_id: productId,
        sku: r.sku ?? null,
        attrs_key: r.attrsKey,
        stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
        min_stock: Math.max(0, Math.floor(Number(r.minStock) || 0)),
      }));
      const { data, error } = await supabase.from("store_product_variants").insert(payload).select("*");
      if (error) throw error;
      const mapped = (Array.isArray(data) ? data : []).map((row) => mapVariantRow((row ?? {}) as AnyRow));

      const products = await getStoreProductsByBarbershop(barbershopId);
      const p = products.find((x) => x.id === productId);
      if (p) {
        await upsertStoreProduct(barbershopId, {
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.category,
          productType: p.productType ?? "barbearia",
          attributes: p.attributes ?? {},
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          stock: sumStock,
          minStock: nextMin ?? p.minStock,
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          tags: p.tags,
          imageUrl: p.imageUrl,
        });
      }
      return mapped;
    }

    const map = loadVariantsFallbackMap();
    delete map[productId];
    saveVariantsFallbackMap(map);
    return [];
  } catch {
    if (rows.length === 0) {
      const map = loadVariantsFallbackMap();
      delete map[productId];
      saveVariantsFallbackMap(map);
      return [];
    }
    const mappedRows: StoreProductVariant[] = rows.map((r, i) => ({
      id: r.id || genId(`var_${i}`),
      productId,
      sku: r.sku,
      attrsKey: r.attrsKey,
      stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
      minStock: Math.max(0, Math.floor(Number(r.minStock) || 0)),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }));
    const map = loadVariantsFallbackMap();
    map[productId] = mappedRows;
    saveVariantsFallbackMap(map);

    const products = await getStoreProductsByBarbershop(barbershopId);
    const p = products.find((x) => x.id === productId);
    if (p && rows.length > 0) {
      await upsertStoreProduct(barbershopId, {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        productType: p.productType ?? "barbearia",
        attributes: p.attributes ?? {},
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        stock: sumStock,
        minStock: nextMin ?? p.minStock,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        tags: p.tags,
        imageUrl: p.imageUrl,
      });
    }
    return mappedRows;
  }
}

export async function getStockMovementsByBarbershop(barbershopId: number) {
  try {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row) => mapMovementRow((row ?? {}) as AnyRow));
  } catch {
    return loadFallback(MOVEMENTS_FB, mapMovementRow).filter((m) => m.barbershopId === barbershopId);
  }
}

export async function recordStockMovement(params: {
  productId: string;
  barbershopId: number;
  type: StockMovementType;
  quantity: number;
  reason: StockMovementReason;
  referenceId?: string;
  purchaseCode?: string;
  orderPublicCode?: string;
}) {
  const payload = {
    product_id: params.productId,
    barbershop_id: params.barbershopId,
    type: params.type,
    quantity: params.quantity,
    reason: params.reason,
    reference_id: params.referenceId ?? null,
    purchase_code: params.purchaseCode ?? null,
    order_public_code: params.orderPublicCode ?? null,
  };
  try {
    const { data, error } = await supabase.from("stock_movements").insert(payload).select("*").single();
    if (error) throw error;
    return mapMovementRow((data ?? {}) as AnyRow);
  } catch {
    const list = loadFallback(MOVEMENTS_FB, mapMovementRow);
    const movement: StockMovement = {
      id: genId("mov"),
      productId: params.productId,
      barbershopId: params.barbershopId,
      type: params.type,
      quantity: params.quantity,
      reason: params.reason,
      referenceId: params.referenceId,
      purchaseCode: params.purchaseCode,
      orderPublicCode: params.orderPublicCode,
      createdAt: nowIso(),
    };
    list.unshift(movement);
    saveFallback(MOVEMENTS_FB, list);
    return movement;
  }
}

export async function adjustStoreProductStock(params: {
  productId: string;
  barbershopId: number;
  quantity: number;
  reason: StockMovementReason;
  note?: string;
  purchaseCode?: string;
  orderPublicCode?: string;
}) {
  const products = await getStoreProductsByBarbershop(params.barbershopId);
  const target = products.find((p) => p.id === params.productId);
  if (!target) return null;
  const nextStock = Math.max(0, target.stock + params.quantity);
  const updated = await upsertStoreProduct(params.barbershopId, {
    id: target.id,
    name: target.name,
    description: target.description,
    category: target.category,
    productType: target.productType ?? "barbearia",
    attributes: target.attributes ?? {},
    costPrice: target.costPrice,
    salePrice: target.salePrice,
    stock: nextStock,
    minStock: target.minStock,
    isActive: target.isActive,
    isFeatured: target.isFeatured,
    tags: target.tags,
    imageUrl: target.imageUrl,
  });
  await recordStockMovement({
    productId: target.id,
    barbershopId: target.barbershopId,
    type: params.quantity >= 0 ? "IN" : "OUT",
    quantity: Math.abs(params.quantity),
    reason: params.reason,
    referenceId: params.note,
    purchaseCode: params.purchaseCode,
    orderPublicCode: params.orderPublicCode,
  });
  return updated;
}

export async function getStoreSalesByBarbershop(barbershopId: number) {
  try {
    const { data, error } = await supabase
      .from("product_sales")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (Array.isArray(data) ? data : []).map((row) => mapSaleRow((row ?? {}) as AnyRow));
  } catch {
    return loadFallback(SALES_FB, mapSaleRow).filter((s) => s.barbershopId === barbershopId);
  }
}

export async function registerProductSale(params: {
  productId: string;
  barbershopId: number;
  barberId?: string;
  sellerName?: string;
  purchaseCode?: string;
  orderPublicCode?: string;
  quantity: number;
  paymentMethod: StoreSale["paymentMethod"];
  source: StoreSaleSource;
  commissionRate?: number;
}) {
  const products = await getStoreProductsByBarbershop(params.barbershopId);
  const product = products.find((item) => item.id === params.productId);
  if (!product || params.quantity <= 0 || product.stock < params.quantity) return null;
  const profile = getBarbershopProfile(params.barbershopId);
  const effectiveCommissionRate = Math.max(0, Number(params.commissionRate ?? profile.productCommissionRate ?? 10));
  const total = Number((product.salePrice * params.quantity).toFixed(2));
  let sale: StoreSale;
  try {
    const { data, error } = await supabase.rpc("register_product_sale_tx", {
      p_product_id: params.productId,
      p_barbershop_id: params.barbershopId,
      p_barber_id: params.barberId ?? null,
      p_seller_name: params.sellerName ?? null,
      p_purchase_code: params.purchaseCode ?? null,
      p_order_public_code: params.orderPublicCode ?? null,
      p_quantity: params.quantity,
      p_payment_method: params.paymentMethod,
      p_source: params.source,
      p_commission_rate: effectiveCommissionRate,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    sale = mapSaleRow((row ?? {}) as AnyRow);
  } catch {
    const list = loadFallback(SALES_FB, mapSaleRow);
    const commissionAmount = Number((total * (effectiveCommissionRate / 100)).toFixed(2));
    sale = {
      id: genId("sale"),
      productId: params.productId,
      barbershopId: params.barbershopId,
      barberId: params.barberId,
      sellerName: params.sellerName,
      purchaseCode: params.purchaseCode,
      orderPublicCode: params.orderPublicCode,
      quantity: params.quantity,
      unitPrice: product.salePrice,
      total,
      commissionRate: effectiveCommissionRate,
      commissionAmount,
      paymentMethod: params.paymentMethod,
      source: params.source,
      createdAt: nowIso(),
    };
    list.unshift(sale);
    saveFallback(SALES_FB, list);
    await adjustStoreProductStock({
      productId: params.productId,
      barbershopId: params.barbershopId,
      quantity: -params.quantity,
      reason: "SALE",
      note: sale.id,
      purchaseCode: params.purchaseCode,
      orderPublicCode: params.orderPublicCode,
    });
  }
  return sale;
}

export async function getStoreV2Dashboard(barbershopId: number) {
  const [products, sales] = await Promise.all([
    getStoreProductsByBarbershop(barbershopId),
    getStoreSalesByBarbershop(barbershopId),
  ]);
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const salesByProduct = new Map<string, number>();
  sales.forEach((sale) => {
    salesByProduct.set(sale.productId, (salesByProduct.get(sale.productId) ?? 0) + sale.quantity);
  });
  const topProducts = [...products]
    .map((product) => ({ product, sold: salesByProduct.get(product.id) ?? 0 }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 3);
  const staleProductsCount = products.filter((product) => {
    const sold = salesByProduct.get(product.id) ?? 0;
    if (sold > 0) return false;
    const days = (Date.now() - new Date(product.createdAt).getTime()) / 86400000;
    return days >= 7;
  }).length;
  const highMarginCount = products.filter((product) => {
    if (product.salePrice <= 0) return false;
    const margin = ((product.salePrice - product.costPrice) / product.salePrice) * 100;
    return margin >= 70;
  }).length;
  return { products, sales, revenue, lowStockCount, topProducts, staleProductsCount, highMarginCount };
}

export async function registerOrderItemsAsSales(order: ShopOrder) {
  const products = await getStoreProductsByBarbershop(order.barbershopId);
  const productByName = new Map(products.map((product) => [product.name.trim().toLowerCase(), product]));
  const productById = new Map(products.map((product) => [product.id, product]));

  for (const item of order.items) {
    const quantity = Number(item.quantity ?? 0);
    if (!quantity || quantity <= 0) continue;
    const byId = item.product?.id ? productById.get(item.product.id) : undefined;
    const byName = item.product?.name ? productByName.get(item.product.name.trim().toLowerCase()) : undefined;
    const matched = byId ?? byName;
    if (!matched) continue;
    await registerProductSale({
      productId: matched.id,
      barbershopId: order.barbershopId,
      barberId: order.barberId,
      sellerName: order.barberName,
      purchaseCode: item.purchaseCode,
      orderPublicCode: order.orderPublicCode,
      quantity,
      paymentMethod: order.paymentMethod,
      source: "store",
    });
  }
}

export function getStoreRevenueSeriesByDay(
  sales: StoreSale[],
  days = 14,
): Array<{ day: string; product: number }> {
  const today = new Date();
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  sales.forEach((sale) => {
    const key = sale.createdAt.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, Number((buckets.get(key)! + sale.total).toFixed(2)));
    }
  });
  return Array.from(buckets.entries()).map(([day, product]) => ({ day, product }));
}

export function getStoreCommissionBySeller(
  sales: StoreSale[],
): Array<{ seller: string; commission: number; revenue: number }> {
  const map = new Map<string, { commission: number; revenue: number }>();
  sales.forEach((sale) => {
    const seller = sale.sellerName?.trim() || sale.barberId?.trim() || "Sem vendedor";
    const current = map.get(seller) ?? { commission: 0, revenue: 0 };
    current.commission += sale.commissionAmount ?? 0;
    current.revenue += sale.total ?? 0;
    map.set(seller, current);
  });
  return Array.from(map.entries())
    .map(([seller, data]) => ({
      seller,
      commission: Number(data.commission.toFixed(2)),
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => b.commission - a.commission);
}
