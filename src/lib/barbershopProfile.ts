const STORAGE_KEY = "barbeflow_barbershop_profile";

export type CnpjOption = "sim" | "nao" | "nao_tenho";

export type PlanoAssinatura = "basico" | "profissional" | "premium";

export type GalleryCategory = "cortes" | "barba" | "degrade" | "infantil" | "ambiente" | "equipe" | "antes-depois";

export interface GalleryItem {
  url: string;
  caption: string;
  /** @deprecated use category */
  type?: "corte" | "ambiente";
  category?: GalleryCategory;
  tags?: string[];
  isHighlight?: boolean;
  beforeAfter?: { beforeUrl: string; afterUrl: string };
  createdAt?: string;
  viewCount?: number;
  clickCount?: number;
}

export interface PromotionItem {
  id: string;
  titulo: string;
  descricao?: string;
  precoOriginal?: number;
  precoPromocional: number;
  serviceId?: string;
  validoAte?: string;
}

export interface BarbershopAmenities {
  wifi?: boolean;
  estacionamento?: boolean;
  arCondicionado?: boolean;
  cafe?: boolean;
  tv?: boolean;
}

export interface BarbershopPayments {
  pix?: boolean;
  debito?: boolean;
  credito?: boolean;
  dinheiro?: boolean;
  bandeiras?: string[];
}

export interface BarbershopProfileData {
  telefone: string;
  tiktok: string;
  instagram: string;
  facebook: string;
  outrasRedes: string;
  endereco: string;
  sobre: string;
  cnpjOption: CnpjOption;
  cnpjValue: string;
  desde: string;
  barberName: string;
  /** Plano de assinatura (limite de agendamentos). */
  plano: PlanoAssinatura;
  nomeBarbearia?: string;
  cidade?: string;
  estado?: string;
  coverPhotoUrl?: string;
  gallery?: GalleryItem[];
  /** Chave Pix (e-mail, telefone, CPF ou chave aleatória) para recebimentos. */
  pixChave?: string;
  precoMedio?: string;
  tempoMedioMinutos?: number;
  comodidades?: BarbershopAmenities;
  pagamentos?: BarbershopPayments;
  promocoes?: PromotionItem[];
  /** Comissão fixa (%) para venda de produtos. */
  productCommissionRate?: number;
  /** Controle simples de assinatura ativa/cancelada. */
  subscriptionActive?: boolean;
  subscriptionCanceledAt?: string;
  /**
   * Selo "verificado" concedido manualmente pelo dono da plataforma (`VITE_PLATFORM_OWNER_EMAIL`).
   * Não pode ser ativado pelo barbeiro.
   */
  ownerVerified?: boolean;
}

const defaults: BarbershopProfileData = {
  telefone: "",
  tiktok: "",
  instagram: "",
  facebook: "",
  outrasRedes: "",
  endereco: "",
  sobre: "",
  cnpjOption: "nao_tenho",
  cnpjValue: "",
  desde: "",
  barberName: "",
  plano: "profissional",
  precoMedio: "",
  tempoMedioMinutos: 45,
  comodidades: {
    wifi: false,
    estacionamento: false,
    arCondicionado: false,
    cafe: false,
    tv: false,
  },
  pagamentos: {
    pix: true,
    debito: false,
    credito: false,
    dinheiro: false,
    bandeiras: [],
  },
  promocoes: [],
  productCommissionRate: 10,
  subscriptionActive: true,
  subscriptionCanceledAt: "",
};

function loadAll(): Record<number, BarbershopProfileData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, BarbershopProfileData>) {
  const trySave = (payload: Record<number, BarbershopProfileData>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  try {
    trySave(data);
    return;
  } catch (error) {
    // localStorage em navegadores tem um limite pequeno (~5-10MB). Se o usuario colar imagens/base64
    // na capa/galeria, estoura rapidamente. Tentamos "enxugar" e salvar o maximo possivel.
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") throw error;
  }

  const isTooLargeInlineAsset = (value?: string) =>
    typeof value === "string" && (value.startsWith("data:") || value.length > 32_000);

  const sanitizeProfile = (profile: BarbershopProfileData): BarbershopProfileData => {
    const next: BarbershopProfileData = { ...profile };

    if (isTooLargeInlineAsset(next.coverPhotoUrl)) {
      next.coverPhotoUrl = undefined;
    }

    if (Array.isArray(next.gallery)) {
      const cleaned = next.gallery
        .map((item) => {
          const copied: GalleryItem = { ...item };
          if (isTooLargeInlineAsset(copied.url)) copied.url = "";
          if (copied.beforeAfter) {
            const beforeUrl = copied.beforeAfter.beforeUrl;
            const afterUrl = copied.beforeAfter.afterUrl;
            copied.beforeAfter = {
              beforeUrl: isTooLargeInlineAsset(beforeUrl) ? "" : beforeUrl,
              afterUrl: isTooLargeInlineAsset(afterUrl) ? "" : afterUrl,
            };
          }
          return copied;
        })
        .filter((item) => !!item.url);

      // Evita listas gigantes no storage (mantem os mais recentes no final, se houver).
      next.gallery = cleaned.slice(-24);
    }

    return next;
  };

  try {
    const pruned: Record<number, BarbershopProfileData> = {};
    for (const [id, profile] of Object.entries(data)) {
      pruned[Number(id)] = sanitizeProfile(profile);
    }
    trySave(pruned);
    console.warn("[barbershopProfile] localStorage quota exceeded; saved pruned profile payload.");
    return;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") throw error;
  }

  // Ultimo recurso: remove campos potencialmente grandes (galeria/promocoes/textos longos).
  try {
    const minimal: Record<number, BarbershopProfileData> = {};
    for (const [id, profile] of Object.entries(data)) {
      minimal[Number(id)] = {
        ...profile,
        coverPhotoUrl: undefined,
        gallery: [],
        promocoes: [],
        sobre: profile.sobre?.slice(0, 800) ?? "",
      };
    }
    trySave(minimal);
    console.warn("[barbershopProfile] localStorage quota exceeded; saved minimal profile payload.");
  } catch (error) {
    console.error("[barbershopProfile] localStorage quota exceeded; unable to persist profile.", error);
  }
}

export function getBarbershopProfile(barbershopId: number): BarbershopProfileData {
  const all = loadAll();
  return { ...defaults, ...all[barbershopId] };
}

export function setBarbershopProfile(
  barbershopId: number,
  data: Partial<BarbershopProfileData>
): void {
  const all = loadAll();
  all[barbershopId] = { ...defaults, ...all[barbershopId], ...data };
  saveAll(all);
}
