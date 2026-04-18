export type SavedPaymentCard = {
  id: string;
  holder: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
  createdAt: string;
};

const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getPaymentCardsStorageKey = (userId?: string) => `client-saved-cards-${userId ?? "guest"}`;

export const detectCardBrand = (digits: string) => {
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6(?:011|5)/.test(digits)) return "Elo/Discover";
  return "Cartao";
};

export const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();

export const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const isExpiryValid = (value: string) => {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [mm, yy] = value.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const currentYY = now.getFullYear() % 100;
  const currentMM = now.getMonth() + 1;
  if (yy < currentYY) return false;
  if (yy === currentYY && mm < currentMM) return false;
  return true;
};

export const loadSavedPaymentCards = (userId?: string): SavedPaymentCard[] => {
  const key = getPaymentCardsStorageKey(userId);
  const parsed = safeJsonParse<SavedPaymentCard[]>(localStorage.getItem(key), []);
  if (!Array.isArray(parsed)) return [];
  return parsed;
};

export const saveSavedPaymentCards = (userId: string | undefined, cards: SavedPaymentCard[]) => {
  const key = getPaymentCardsStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(cards));
};

export const addSavedPaymentCard = (
  userId: string | undefined,
  input: { holder: string; digits: string; expiry: string },
) => {
  const current = loadSavedPaymentCards(userId);
  const nextCard: SavedPaymentCard = {
    id: crypto.randomUUID(),
    holder: input.holder.trim(),
    last4: input.digits.slice(-4),
    brand: detectCardBrand(input.digits),
    expiry: input.expiry,
    isDefault: current.length === 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [nextCard, ...current.map((card) => ({ ...card, isDefault: false }))];
  saveSavedPaymentCards(userId, updated);
  return updated;
};

export const updateSavedPaymentCard = (
  userId: string | undefined,
  cardId: string,
  patch: Partial<Pick<SavedPaymentCard, "holder" | "expiry">>,
) => {
  const current = loadSavedPaymentCards(userId);
  const updated = current.map((card) =>
    card.id === cardId
      ? {
          ...card,
          holder: patch.holder?.trim() ?? card.holder,
          expiry: patch.expiry ?? card.expiry,
        }
      : card,
  );
  saveSavedPaymentCards(userId, updated);
  return updated;
};

export const setDefaultSavedPaymentCard = (userId: string | undefined, cardId: string) => {
  const current = loadSavedPaymentCards(userId);
  const updated = current.map((card) => ({ ...card, isDefault: card.id === cardId }));
  saveSavedPaymentCards(userId, updated);
  return updated;
};

export const removeSavedPaymentCard = (userId: string | undefined, cardId: string) => {
  const current = loadSavedPaymentCards(userId);
  const updated = current.filter((card) => card.id !== cardId);
  if (updated.length > 0 && !updated.some((card) => card.isDefault)) {
    updated[0].isDefault = true;
  }
  saveSavedPaymentCards(userId, updated);
  return updated;
};

export const getDefaultSavedPaymentCard = (userId?: string) => {
  const cards = loadSavedPaymentCards(userId);
  return cards.find((card) => card.isDefault) ?? cards[0] ?? null;
};
