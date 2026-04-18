export function generateItemPurchaseCode(productId: string): string {
  const base = (productId || "PROD").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8) || "PROD";
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 8);
  return `${base}-${random}`;
}

export function generateOrderPublicCode(): string {
  const random = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 10);
  return `PED-${random}`;
}
