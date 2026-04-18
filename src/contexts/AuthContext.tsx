import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import type { AuthError, User as SupabaseUser } from "@supabase/supabase-js";
import { setBarbershopProfile } from "@/lib/barbershopProfile";
import { initTeam, getTeamByUserId } from "@/lib/team";
import { validatePassword, sanitizeName, sanitizeEmail, isValidEmail } from "@/lib/security";
import { supabase } from "@/lib/supabaseClient";
import {
  loginWithAuthApi,
  logoutWithAuthApi,
  meWithAuthApi,
  refreshWithAuthApi,
  registerWithAuthApi,
} from "@/lib/authApi";

const LOGIN_LOCKOUT_KEY = "barbeflow_login_lockout";
const LOGIN_ATTEMPTS_KEY = "barbeflow_login_attempts";
const BARBER_LOGIN_INTRO_KEY = "barberflow_barber_login_intro";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;
const INACTIVITY_LOGOUT_MS = 30 * 60 * 1000;

export type UserRole = "cliente" | "barbeiro";

export type PlanoAssinatura = "basico" | "profissional" | "premium";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  estado?: string;
  cidade?: string;
  endereco?: string;
  cep?: string;
  barbershopId?: number;
  plano?: PlanoAssinatura;
  subscriptionPlanId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due";
  isBarbershopOwner?: boolean;
  termsAccepted?: boolean;
  termsVersion?: string;
  termsAcceptedAt?: string;
}

export type MockUser = User;

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  logoutWithRefreshToken: (refreshToken: string) => Promise<AuthResult>;
  deleteAccount: () => void;
  register: (data: RegisterData) => Promise<AuthResult>;
  updateUser: (data: Partial<User>) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  refreshAccessToken: () => Promise<AuthResult>;
  getAuthenticatedUser: () => Promise<{ success: boolean; error?: string; user?: Pick<User, "id" | "email"> }>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  estado?: string;
  cidade?: string;
  endereco?: string;
  cep?: string;
  plano?: PlanoAssinatura;
  acceptingInvite?: boolean;
  termsAccepted?: boolean;
  termsVersion?: string;
  termsAcceptedAt?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readString(value: unknown, maxLength: number): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}

function readRole(value: unknown): UserRole {
  return value === "barbeiro" || value === "cliente" ? value : "cliente";
}

function readPlan(value: unknown): PlanoAssinatura | undefined {
  return value === "basico" || value === "profissional" || value === "premium"
    ? value
    : undefined;
}

function readSubscriptionStatus(value: unknown): User["subscriptionStatus"] | undefined {
  return value === "active" || value === "canceled" || value === "past_due" ? value : undefined;
}

function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const meta = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;
  const role = readRole(meta.role);
  const barbershopId = readNumber(meta.barbershopId) ?? readNumber(meta.barbershop_id);

  return {
    id: supabaseUser.id,
    name: readString(meta.name, 120) ?? supabaseUser.email ?? "Usuario",
    email: (supabaseUser.email ?? "").toLowerCase(),
    role,
    estado: readString(meta.estado, 2),
    cidade: readString(meta.cidade, 120),
    endereco: readString(meta.endereco, 500),
    cep: readString(meta.cep, 20),
    barbershopId,
    plano: readPlan(meta.plano),
    subscriptionPlanId: readString(meta.subscriptionPlanId, 80) ?? readString(meta.subscription_plan_id, 80),
    subscriptionStatus: readSubscriptionStatus(meta.subscriptionStatus) ?? readSubscriptionStatus(meta.subscription_status),
    isBarbershopOwner: meta.isBarbershopOwner === true || meta.is_barbershop_owner === true,
    termsAccepted: meta.termsAccepted === true || meta.terms_accepted === true,
    termsVersion: readString(meta.termsVersion, 30) ?? readString(meta.terms_version, 30),
    termsAcceptedAt: readString(meta.termsAcceptedAt, 60) ?? readString(meta.terms_accepted_at, 60),
  };
}

function toUserMetadata(data: Partial<User>): Record<string, unknown> {
  return {
    name: data.name,
    role: data.role,
    estado: data.estado,
    cidade: data.cidade,
    endereco: data.endereco,
    cep: data.cep,
    barbershopId: data.barbershopId,
    plano: data.plano,
    subscriptionPlanId: data.subscriptionPlanId,
    subscriptionStatus: data.subscriptionStatus,
    isBarbershopOwner: data.isBarbershopOwner,
    termsAccepted: data.termsAccepted,
    termsVersion: data.termsVersion,
    termsAcceptedAt: data.termsAcceptedAt,
  };
}

function pruneUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function getAuthErrorMessage(error: AuthError | Error | null | undefined): string {
  if (!error) return "Nao foi possivel concluir a autenticacao. Tente novamente.";
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (message.includes("already registered") || message.includes("user already registered"))
    return "Este e-mail ja esta cadastrado.";
  if (message.includes("password") && (message.includes("weak") || message.includes("should be")))
    return "A senha nao atende aos requisitos de seguranca.";
  if (message.includes("unable to validate email") || message.includes("invalid email"))
    return "Informe um e-mail valido.";
  if (message.includes("signup") && message.includes("disabled"))
    return "Cadastro desativado no Supabase. Verifique as configuracoes de autenticacao.";

  return error.message || "Nao foi possivel concluir a autenticacao. Tente novamente.";
}

function getLockoutError(): string | null {
  try {
    const lockoutUntil = sessionStorage.getItem(LOGIN_LOCKOUT_KEY);
    if (!lockoutUntil) return null;
    const until = parseInt(lockoutUntil, 10);
    if (until > Date.now()) {
      const minutes = Math.ceil((until - Date.now()) / 60000);
      return `Muitas tentativas. Aguarde ${minutes} minuto(s) e tente novamente.`;
    }
    sessionStorage.removeItem(LOGIN_LOCKOUT_KEY);
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return null;
  } catch {
    return null;
  }
}

function incrementLoginAttempts() {
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const count = (raw ? parseInt(raw, 10) : 0) + 1;
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, String(count));
    if (count >= MAX_LOGIN_ATTEMPTS) {
      sessionStorage.setItem(LOGIN_LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
    }
  } catch {
    // ignore storage failures
  }
}

function clearLoginAttempts() {
  try {
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    sessionStorage.removeItem(LOGIN_LOCKOUT_KEY);
  } catch {
    // ignore storage failures
  }
}

function resolveUserWithTeam(user: User): User {
  if (user.role !== "barbeiro") return user;
  const teamInfo = getTeamByUserId(user.id);
  if (!teamInfo) return user;
  return {
    ...user,
    barbershopId: teamInfo.barbershopId,
    isBarbershopOwner: teamInfo.isOwner,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());

  const setMappedUser = useCallback((supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    const mapped = resolveUserWithTeam(mapSupabaseUser(supabaseUser));
    if (mapped.role === "barbeiro") {
      try {
        sessionStorage.setItem(BARBER_LOGIN_INTRO_KEY, "1");
      } catch {
        // ignore storage failures
      }
    }
    setUser(mapped);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    void logoutWithAuthApi();
  }, []);

  const logoutWithRefreshToken = useCallback(async (refreshToken: string): Promise<AuthResult> => {
    if (!refreshToken?.trim()) {
      return { success: false, error: "Refresh token obrigatório." };
    }

    const result = await logoutWithAuthApi(refreshToken);
    if (!result.success) return { success: false, error: result.error };
    setUser(null);
    return { success: true, message: result.message };
  }, []);

  const deleteAccount = useCallback(() => {
    setUser(null);
    void supabase.auth.signOut();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          setUser(null);
          return;
        }
        setMappedUser(data.session?.user ?? null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void syncSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setMappedUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.subscription?.unsubscribe();
    };
  }, [setMappedUser]);

  useEffect(() => {
    if (!user) return;
    lastActivityRef.current = Date.now();
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_LOGOUT_MS) {
        setUser(null);
        void supabase.auth.signOut();
        clearInterval(interval);
      }
    }, 60 * 1000);
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      clearInterval(interval);
    };
  }, [user]);

  const login = useCallback(async (emailRaw: string, password: string): Promise<AuthResult> => {
    const email = sanitizeEmail(emailRaw).toLowerCase();
    if (!email || !isValidEmail(email)) return { success: false, error: "Informe um e-mail valido." };
    if (!password) return { success: false, error: "Informe sua senha." };

    const lockoutError = getLockoutError();
    if (lockoutError) return { success: false, error: lockoutError };

    const apiResult = await loginWithAuthApi(email, password);
    if (!apiResult.success || !apiResult.user || !apiResult.session) {
      incrementLoginAttempts();
      return {
        success: false,
        error: apiResult.error
          ? getAuthErrorMessage(new Error(apiResult.error))
          : "Não foi possível concluir a autenticação.",
      };
    }

    clearLoginAttempts();
    const mapped = resolveUserWithTeam(mapSupabaseUser(apiResult.user));
    setMappedUser(apiResult.user);
    return {
      success: true,
      user: mapped,
      accessToken: apiResult.session.access_token,
      refreshToken: apiResult.session.refresh_token,
      accessTokenExpiresAt: apiResult.session.expires_at ?? undefined,
    };
  }, [setMappedUser]);

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    const email = sanitizeEmail(data.email).toLowerCase();
    if (!email) return { success: false, error: "E-mail invalido." };
    if (!isValidEmail(email)) return { success: false, error: "Informe um e-mail valido." };

    const pw = validatePassword(data.password);
    if (!pw.valid) return { success: false, error: pw.error };

    const name = sanitizeName(data.name) || email;
    const barbershopId = data.role === "barbeiro" && !data.acceptingInvite ? 1 : undefined;
    const metadata = pruneUndefined(toUserMetadata({
      name,
      email,
      role: data.role,
      estado: data.estado,
      cidade: data.cidade,
      endereco: data.endereco,
      cep: data.cep,
      barbershopId,
      plano: data.role === "barbeiro" ? data.plano ?? "profissional" : undefined,
      subscriptionPlanId: data.role === "barbeiro" ? data.plano ?? "profissional" : undefined,
      subscriptionStatus: data.role === "barbeiro" ? "active" : undefined,
      isBarbershopOwner: data.role === "barbeiro" && !data.acceptingInvite,
      termsAccepted: data.termsAccepted === true,
      termsVersion: data.termsVersion,
      termsAcceptedAt: data.termsAcceptedAt,
    }));

    const authData = await registerWithAuthApi({
      email,
      password: data.password,
      metadata,
    });

    if (!authData.success || !authData.user) {
      return {
        success: false,
        error: authData.error
          ? getAuthErrorMessage(new Error(authData.error))
          : "Não foi possível concluir o cadastro.",
      };
    }

    if (data.role === "barbeiro" && data.plano && !data.acceptingInvite && authData.user) {
      setBarbershopProfile(1, { plano: data.plano });
      initTeam(1, {
        userId: authData.user.id,
        email,
        name,
      });
    }

    if (authData.session && authData.user) {
      const mapped = resolveUserWithTeam(mapSupabaseUser(authData.user));
      setMappedUser(authData.user);
      return { success: true, user: mapped };
    }

    return {
      success: true,
      requiresEmailConfirmation: true,
      message:
        authData.message ?? "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
    };
  }, [setMappedUser]);

  const updateUser = useCallback(async (data: Partial<User>): Promise<AuthResult> => {
    if (!user) return { success: false, error: "Sessao invalida." };

    const teamInfo = getTeamByUserId(user.id);
    const safe = { ...data };

    if (safe.role !== undefined || safe.barbershopId !== undefined || safe.isBarbershopOwner !== undefined) {
      if (!teamInfo) {
        delete (safe as Record<string, unknown>).role;
        delete (safe as Record<string, unknown>).barbershopId;
        delete (safe as Record<string, unknown>).isBarbershopOwner;
      } else {
        if (safe.barbershopId !== undefined && safe.barbershopId !== teamInfo.barbershopId) {
          delete (safe as Record<string, unknown>).barbershopId;
        }
        if (safe.isBarbershopOwner !== undefined && safe.isBarbershopOwner !== teamInfo.isOwner) {
          delete (safe as Record<string, unknown>).isBarbershopOwner;
        }
        if (safe.role !== undefined && safe.role !== "barbeiro") {
          delete (safe as Record<string, unknown>).role;
        }
      }
    }

    const nextUser = { ...user, ...safe };
    setUser(nextUser);

    const { data: updated, error } = await supabase.auth.updateUser({
      data: pruneUndefined(toUserMetadata(nextUser)),
    });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    setMappedUser(updated.user);
    return { success: true };
  }, [setMappedUser, user]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    if (!user?.email) return { success: false, error: "Sessao invalida." };

    const validated = validatePassword(newPassword);
    if (!validated.valid) return { success: false, error: validated.error };

    const verification = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verification.error) {
      return { success: false, error: "Senha atual incorreta." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    return { success: true };
  }, [user?.email]);

  const refreshAccessToken = useCallback(async (): Promise<AuthResult> => {
    const result = await refreshWithAuthApi();
    if (!result.success || !result.session) {
      return {
        success: false,
        error: result.error ? getAuthErrorMessage(new Error(result.error)) : "Não foi possível renovar sessão.",
      };
    }
    if (result.user) setMappedUser(result.user);
    return {
      success: true,
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      accessTokenExpiresAt: result.session.expires_at ?? undefined,
    };
  }, [setMappedUser]);

  const getAuthenticatedUser = useCallback(async () => {
    const result = await meWithAuthApi();
    if (!result.success || !result.user) {
      return {
        success: false as const,
        error: result.error ? getAuthErrorMessage(new Error(result.error)) : "Usuário não autenticado.",
      };
    }
    return {
      success: true as const,
      user: {
        id: result.user.id,
        email: (result.user.email ?? "").toLowerCase(),
      },
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        logoutWithRefreshToken,
        deleteAccount,
        register,
        updateUser,
        changePassword,
        refreshAccessToken,
        getAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
