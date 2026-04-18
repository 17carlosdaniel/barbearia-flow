import type { ShopCartItem } from "@/types/shop";

const PRODUCTS_KEY = "barbeflow_products";
const ENTRIES_KEY = "barbeflow_product_entries";

export interface Product {
  id: number;
  barbershopId: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockEntry {
  id: number;
  productId: number;
  barbershopId: number;
  quantity: number;
  note?: string;
  createdAt: string;
}

function loadProductsRaw(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    // migração leve/retrocompatível (campos novos)
    return list.map((p: Partial<Product> & Record<string, unknown>) => ({
      id: Number(p.id ?? 0),
      barbershopId: Number(p.barbershopId ?? 0),
      name: String(p.name ?? ""),
      description: String(p.description ?? ""),
      category: String(p.category ?? "Produtos"),
      imageUrl: String(p.imageUrl ?? ""),
      costPrice: Number(p.costPrice ?? 0),
      salePrice: Number(p.salePrice ?? 0),
      stock: Number(p.stock ?? 0),
      lowStockThreshold: Number(p.lowStockThreshold ?? 3),
      active: Boolean(p.active ?? true),
      featured: Boolean(p.featured ?? false),
      tags: Array.isArray(p.tags) ? (p.tags as unknown[]).map(String) : [],
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      updatedAt: String(p.updatedAt ?? new Date().toISOString()),
    })).filter((p) => p.id > 0 && p.barbershopId > 0 && p.name);
  } catch {
    return [];
  }
}

function saveProductsRaw(list: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

function loadEntriesRaw(): StockEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntriesRaw(list: StockEntry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(list));
}

export function getProductsForBarbershop(barbershopId: number): Product[] {
  return loadProductsRaw().filter((p) => p.barbershopId === barbershopId);
}

export function getStockEntriesForBarbershop(barbershopId: number): StockEntry[] {
  return loadEntriesRaw()
    .filter((e) => e.barbershopId === barbershopId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addProduct(
  barbershopId: number,
  data: {
    name: string;
    costPrice: number;
    salePrice: number;
    stock: number;
    description?: string;
    category?: string;
    imageUrl?: string;
    lowStockThreshold?: number;
    active?: boolean;
    featured?: boolean;
    tags?: string[];
  }
): Product {
  const list = loadProductsRaw();
  const id = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  const now = new Date().toISOString();
  const product: Product = {
    id,
    barbershopId,
    name: data.name,
    description: data.description ?? "",
    category: data.category ?? "Produtos",
    imageUrl: data.imageUrl ?? "",
    costPrice: data.costPrice,
    salePrice: data.salePrice,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold ?? 3,
    active: data.active ?? true,
    featured: data.featured ?? false,
    tags: data.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  list.push(product);
  saveProductsRaw(list);
  if (data.stock > 0) {
    addStockEntry(barbershopId, product.id, data.stock, "Estoque inicial");
  }
  return product;
}

export function addStockEntry(
  barbershopId: number,
  productId: number,
  quantity: number,
  note?: string
): { product: Product | null; entry: StockEntry } {
  const products = loadProductsRaw();
  const idx = products.findIndex((p) => p.id === productId && p.barbershopId === barbershopId);
  const now = new Date().toISOString();
  let updated: Product | null = null;
  if (idx !== -1) {
    const current = products[idx];
    const nextStock = current.stock + quantity;
    const next: Product = { ...current, stock: nextStock, updatedAt: now };
    products[idx] = next;
    updated = next;
    saveProductsRaw(products);
  }

  const entries = loadEntriesRaw();
  const id = entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
  const entry: StockEntry = {
    id,
    productId,
    barbershopId,
    quantity,
    note,
    createdAt: now,
  };
  entries.push(entry);
  saveEntriesRaw(entries);

  return { product: updated, entry };
}

export function applySaleToInventory(
  barbershopId: number,
  items: ShopCartItem[],
  note = "Venda PDV"
): Product[] {
  if (!Array.isArray(items) || items.length === 0) {
    return getProductsForBarbershop(barbershopId);
  }
  const now = new Date().toISOString();
  const products = loadProductsRaw();
  const entries = loadEntriesRaw();
  let nextEntryId = entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1;

  items.forEach((line) => {
    const quantity = Math.max(0, Number(line.quantity ?? 0));
    if (!quantity) return;
    const byNameIndex = products.findIndex(
      (product) =>
        product.barbershopId === barbershopId &&
        product.name.trim().toLowerCase() === line.product.name.trim().toLowerCase()
    );
    if (byNameIndex === -1) return;
    const current = products[byNameIndex];
    const nextStock = Math.max(0, current.stock - quantity);
    products[byNameIndex] = {
      ...current,
      stock: nextStock,
      updatedAt: now,
    };
    entries.push({
      id: nextEntryId++,
      productId: current.id,
      barbershopId,
      quantity: -quantity,
      note,
      createdAt: now,
    });
  });

  saveProductsRaw(products);
  saveEntriesRaw(entries);
  return products.filter((product) => product.barbershopId === barbershopId);
}

