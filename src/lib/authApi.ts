import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const AUTH_API_BASE_URL = (import.meta.env.VITE_AUTH_API_BASE_URL as string | undefined)?.trim();

function getApiUrl(path: string): string {
  if (!AUTH_API_BASE_URL) return path;
  return `${AUTH_API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), init);
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    const message =
      (payload as { error?: string; message?: string }).error ||
      (payload as { error?: string; message?: string }).message ||
      "Erro de autenticação.";
    throw new Error(message);
  }
  return payload;
}

export type AuthApiResult = {
  success: boolean;
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
  session?: Session | null;
  user?: SupabaseUser | null;
};

export async function registerWithAuthApi(params: {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}): Promise<AuthApiResult> {
  if (AUTH_API_BASE_URL) {
    try {
      const payload = await fetchJson<AuthApiResult>("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          metadata: params.metadata,
        }),
      });
      return { success: true, ...payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Falha ao registrar." };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: params.metadata ?? {} },
  });
  if (error || !data.user) return { success: false, error: error?.message ?? "Falha ao registrar." };
  return {
    success: true,
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: !data.session,
    message: data.session ? undefined : "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
  };
}

export async function loginWithAuthApi(email: string, password: string): Promise<AuthApiResult> {
  if (AUTH_API_BASE_URL) {
    try {
      const payload = await fetchJson<AuthApiResult>("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return { success: true, ...payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Falha ao autenticar." };
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) return { success: false, error: error?.message ?? "Falha ao autenticar." };
  return { success: true, user: data.user, session: data.session };
}

export async function logoutWithAuthApi(refreshToken?: string): Promise<AuthApiResult> {
  if (AUTH_API_BASE_URL) {
    try {
      const payload = await fetchJson<AuthApiResult>("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      return { success: true, ...payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Falha ao sair." };
    }
  }

  if (refreshToken) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return { success: false, error: "Sessão inválida ou expirada." };
    if (sessionData.session.refresh_token !== refreshToken.trim()) {
      return { success: false, error: "Refresh token inválido para a sessão atual." };
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function refreshWithAuthApi(refreshToken?: string): Promise<AuthApiResult> {
  if (AUTH_API_BASE_URL) {
    try {
      const payload = await fetchJson<AuthApiResult>("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      return { success: true, ...payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Falha ao renovar sessão." };
    }
  }

  if (refreshToken) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return { success: false, error: "Sessão inválida ou expirada." };
    if (sessionData.session.refresh_token !== refreshToken.trim()) {
      return { success: false, error: "Refresh token inválido para a sessão atual." };
    }
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return { success: false, error: error?.message ?? "Falha ao renovar sessão." };
  return { success: true, user: data.session.user, session: data.session };
}

export async function meWithAuthApi(accessToken?: string): Promise<AuthApiResult> {
  if (AUTH_API_BASE_URL) {
    try {
      const payload = await fetchJson<AuthApiResult>("/api/me", {
        method: "GET",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      return { success: true, ...payload };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Falha ao obter usuário." };
    }
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return { success: false, error: error?.message ?? "Usuário não autenticado." };
  return { success: true, user: data.user };
}

