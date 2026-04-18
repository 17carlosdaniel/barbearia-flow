/** Máximo: DDD (2) + número (8 fixo ou 9 celular) = 11 dígitos, sem código do país. */
const MAX_DIGITS = 11;

/**
 * Mantém só dígitos, remove código 55 inicial em colagens tipo +55 11 99999-9999.
 */
export function sanitizeBrazilPhoneDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > MAX_DIGITS) {
    d = d.slice(2);
  }
  return d.slice(0, MAX_DIGITS);
}

/**
 * Máscara dinâmica: fixo (XX) XXXX-XXXX ou celular (XX) XXXXX-XXXX quando o 1º dígito após DDD é 9.
 */
export function formatBrazilPhoneBr(digits: string): string {
  const d = sanitizeBrazilPhoneDigits(digits);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const dd = d.slice(0, 2);
  const rest = d.slice(2);
  const mobile = rest[0] === "9";
  const firstBlock = mobile ? 5 : 4;
  if (rest.length <= firstBlock) return `(${dd}) ${rest}`;
  return `(${dd}) ${rest.slice(0, firstBlock)}-${rest.slice(firstBlock)}`;
}

export function isBrazilPhoneComplete(digits: string): boolean {
  const d = sanitizeBrazilPhoneDigits(digits);
  return d.length === 10 || d.length === MAX_DIGITS;
}
