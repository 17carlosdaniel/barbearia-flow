/**
 * Utilitários de segurança: validação de senha, sanitização de entrada e limites.
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_TEXT_FIELD_LENGTH = 500;
const PROFANITY_MASK = "***";
const PT_BR_PROFANITY = [
  "porra",
  "caralho",
  "cacete",
  "merda",
  "foda",
  "fdp",
  "filho da puta",
  "desgraca",
  "desgraça",
  "arrombado",
  "otario",
  "otário",
  "babaca",
];

/** Valida força da senha no cadastro. */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== "string") return { valid: false, error: "Senha inválida" };
  const p = password.trim();
  if (p.length < MIN_PASSWORD_LENGTH)
    return { valid: false, error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` };
  if (p.length > MAX_PASSWORD_LENGTH)
    return { valid: false, error: `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres` };
  return { valid: true };
}

/** Remove caracteres perigosos e limita tamanho (evita payloads enormes no localStorage). */
export function sanitizeString(value: string, maxLength: number = MAX_TEXT_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/** Sanitiza nome de pessoa (ex.: perfil). */
export function sanitizeName(name: string): string {
  return sanitizeString(name, MAX_NAME_LENGTH);
}

/** Valida formato básico de e-mail. */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string" || email.length > MAX_EMAIL_LENGTH) return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** Sanitiza e-mail (trim + limite). */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email, MAX_EMAIL_LENGTH);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Sanitiza xingamentos usando dicionário básico PT-BR e aplica máscara. */
export function sanitizeProfanity(value: string, mask: string = PROFANITY_MASK): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return PT_BR_PROFANITY.reduce((acc, curse) => {
    const regex = new RegExp(escapeRegex(curse), "gi");
    return acc.replace(regex, mask);
  }, value);
}
