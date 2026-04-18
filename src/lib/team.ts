/**
 * Área de equipe: administrador (dono) + membros da barbearia.
 * Convites por e-mail, limites por plano (Básico=1, Profissional=5, Premium=ilimitado).
 */

const STORAGE_KEY = "barbeflow_team";

export type PlanoId = "basico" | "profissional" | "premium";

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
}

export interface PendingInvite {
  email: string;
  token: string;
  /** Data de envio no formato DD/MM/YYYY (opcional, para exibição). */
  sentAt?: string;
  /** Código numérico de 6–8 dígitos para acesso na tela de Login (opcional). */
  shortCode?: string;
}

export interface TeamData {
  owner: TeamMember;
  members: TeamMember[];
  pendingInvites: PendingInvite[];
}

function loadAll(): Record<number, TeamData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<number, TeamData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLimitByPlan(plano: PlanoId | string | undefined): number {
  if (plano === "basico") return 1;
  if (plano === "profissional") return 5;
  return 999;
}

export function getTeam(barbershopId: number): TeamData | null {
  return loadAll()[barbershopId] ?? null;
}

/** Retorna a barbearia e se o usuário é dono (para aplicar no login). */
export function getTeamByUserId(userId: string): { barbershopId: number; isOwner: boolean } | null {
  const all = loadAll();
  for (const [idStr, team] of Object.entries(all)) {
    const id = Number(idStr);
    if (team.owner.userId === userId) return { barbershopId: id, isOwner: true };
    if (team.members.some((m) => m.userId === userId)) return { barbershopId: id, isOwner: false };
  }
  return null;
}

export function initTeam(
  barbershopId: number,
  owner: TeamMember
): void {
  const all = loadAll();
  if (all[barbershopId]) return;
  all[barbershopId] = {
    owner,
    members: [],
    pendingInvites: [],
  };
  saveAll(all);
}

function randomToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SHORT_CODE_LENGTH = 8;

function randomShortCode(): string {
  const min = 10 ** (SHORT_CODE_LENGTH - 1);
  const max = 10 ** SHORT_CODE_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

function isShortCodeTaken(all: Record<number, TeamData>, code: string): boolean {
  for (const team of Object.values(all)) {
    if (team.pendingInvites.some((i) => i.shortCode === code)) return true;
  }
  return false;
}

/** Cria um convite com código de acesso numérico (6–8 dígitos). Quem tiver o código pode usar na tela de Login. */
export function createInviteWithShortCode(
  barbershopId: number,
  plano: PlanoId | string | undefined
): { success: boolean; shortCode?: string; token?: string; link?: string; error?: string } {
  const all = loadAll();
  const team = all[barbershopId];
  if (!team) return { success: false, error: "Barbearia não encontrada." };
  const limit = getLimitByPlan(plano);
  const total = 1 + team.members.length + team.pendingInvites.length;
  if (total >= limit) {
    return {
      success: false,
      error: `Limite do plano atingido (${limit} ${limit === 1 ? "pessoa" : "pessoas"}). Faça upgrade em Assinatura.`,
    };
  }
  let shortCode = randomShortCode();
  for (let i = 0; i < 10 && isShortCodeTaken(all, shortCode); i++) shortCode = randomShortCode();
  if (isShortCodeTaken(all, shortCode)) return { success: false, error: "Tente gerar o código novamente." };
  const token = randomToken();
  const now = new Date();
  const sentAt = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  team.pendingInvites.push({
    email: `codigo-${shortCode}@convite.barberflow`,
    token,
    sentAt,
    shortCode,
  });
  saveAll(all);
  return {
    success: true,
    shortCode,
    token,
    link: typeof window !== "undefined" ? `${window.location.origin}/aceitar-convite/${token}` : "",
  };
}

/** Busca convite pelo código numérico. Retorna o token para redirecionar para /aceitar-convite/{token}. */
export function getInviteByShortCode(shortCode: string): { barbershopId: number; token: string } | null {
  const code = (shortCode ?? "").trim().replace(/\D/g, "");
  if (code.length < 6 || code.length > 8) return null;
  const all = loadAll();
  for (const [idStr, team] of Object.entries(all)) {
    const invite = team.pendingInvites.find((i) => i.shortCode === code);
    if (invite) return { barbershopId: Number(idStr), token: invite.token };
  }
  return null;
}

export function inviteMember(
  barbershopId: number,
  email: string,
  plano: PlanoId | string | undefined
): { success: boolean; token?: string; error?: string } {
  const all = loadAll();
  const team = all[barbershopId];
  if (!team) return { success: false, error: "Barbearia não encontrada." };
  const limit = getLimitByPlan(plano);
  const total = 1 + team.members.length + team.pendingInvites.length;
  if (total >= limit) {
    return {
      success: false,
      error: `Limite do plano atingido (${limit} ${limit === 1 ? "pessoa" : "pessoas"}). Faça upgrade em Assinatura.`,
    };
  }
  const normalized = email.trim().toLowerCase();
  if (team.owner.email.toLowerCase() === normalized) {
    return { success: false, error: "Este e-mail já é do administrador." };
  }
  if (team.members.some((m) => m.email.toLowerCase() === normalized)) {
    return { success: false, error: "Este e-mail já faz parte da equipe." };
  }
  if (team.pendingInvites.some((i) => i.email.toLowerCase() === normalized)) {
    return { success: false, error: "Já existe um convite pendente para este e-mail." };
  }
  const token = randomToken();
  const now = new Date();
  const sentAt = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  team.pendingInvites.push({ email: normalized, token, sentAt });
  saveAll(all);
  return { success: true, token };
}

export function cancelInvite(barbershopId: number, email: string): void {
  const all = loadAll();
  const team = all[barbershopId];
  if (!team) return;
  const norm = email.trim().toLowerCase();
  team.pendingInvites = team.pendingInvites.filter((i) => i.email !== norm);
  saveAll(all);
}

export function removeMember(
  barbershopId: number,
  userId: string
): void {
  const all = loadAll();
  const team = all[barbershopId];
  if (!team) return;
  // Só filtra members; o dono está em team.owner e não é removido por aqui.
  // Se o mesmo userId aparecer em members (ex.: duplicata), deve ser removível.
  team.members = team.members.filter((m) => m.userId !== userId);
  saveAll(all);
}

export function getInviteByToken(token: string): { barbershopId: number; email: string } | null {
  const t = (token ?? "").trim();
  if (!t) return null;
  let decoded = t;
  try {
    if (t.includes("%")) decoded = decodeURIComponent(t);
  } catch {
    // keep decoded = t
  }
  const all = loadAll();
  for (const [idStr, team] of Object.entries(all)) {
    const invite = team.pendingInvites.find(
      (i) => (i.token ?? "").trim() === t || (i.token ?? "").trim() === decoded
    );
    if (invite) return { barbershopId: Number(idStr), email: invite.email };
  }
  return null;
}

/** Aceita o convite: adiciona o usuário à equipe e remove o convite. Retorna barbershopId ou null. */
export function acceptInvite(
  token: string,
  user: { id: string; email: string; name: string },
  plano: PlanoId | string | undefined
): number | null {
  const all = loadAll();
  for (const [idStr, team] of Object.entries(all)) {
    const idx = team.pendingInvites.findIndex((i) => i.token === token);
    if (idx === -1) continue;
    const limit = getLimitByPlan(plano);
    if (1 + team.members.length >= limit) return null;
    team.members.push({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    team.pendingInvites.splice(idx, 1);
    saveAll(all);
    return Number(idStr);
  }
  return null;
}

export function canAddMember(barbershopId: number, plano: PlanoId | string | undefined): boolean {
  const team = getTeam(barbershopId);
  if (!team) return false;
  const limit = getLimitByPlan(plano);
  const total = 1 + team.members.length + team.pendingInvites.length;
  return total < limit;
}
