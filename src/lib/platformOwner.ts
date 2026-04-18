/**
 * E-mail(s) do dono da plataforma que podem conceder o selo "verificado" às barbearias.
 * Defina no `.env`: VITE_PLATFORM_OWNER_EMAIL=seu@email.com
 * Vários: VITE_PLATFORM_OWNER_EMAIL=a@x.com,b@y.com
 */
export function isPlatformOwnerEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  const raw = import.meta.env.VITE_PLATFORM_OWNER_EMAIL as string | undefined;
  if (!raw?.trim()) return false;
  const normalized = email.trim().toLowerCase();
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
