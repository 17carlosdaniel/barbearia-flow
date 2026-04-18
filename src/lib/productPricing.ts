/**
 * Sugestão de preço de venda a partir do custo (markup ~100%, arredondamento comercial .90).
 * Teto de UI: varejo de barbearia — valores acima exigem ajuste de constante.
 */
export const MAX_BRL_VALUE = 999_999.99;

const MAX_CENTS = Math.round(MAX_BRL_VALUE * 100);

/** Texto curto para explicar a sugestão ao usuário (regra interna, sem dados de mercado externos). */
export const SUGGESTED_PRICE_EXPLANATION =
  "Referência interna: ~100% sobre o custo, arredondamento comercial (.90) e piso de 1,5× o custo — margem saudável para varejo de barbearia.";

export function suggestedSalePriceFromCost(cost: number): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const doubled = cost * 2;
  const rounded = Math.ceil(doubled);
  const withCents = Math.floor(rounded) + 0.9;
  const raw = Math.max(withCents, Number((cost * 1.5).toFixed(2)));
  return Math.min(raw, MAX_BRL_VALUE);
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Converte reais para centavos inteiros (com arredondamento). */
export function toCents(reais: number): number {
  if (!Number.isFinite(reais)) return 0;
  return Math.round(reais * 100);
}

/** Converte centavos para reais. */
export function fromCents(cents: number): number {
  return cents / 100;
}

function formatIntPtBRFromDigits(intDigits: string): string {
  if (!intDigits) return "";
  const trimmed = intDigits.replace(/^0+(?=\d)/, "") || "0";
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Sanitiza digitação em pt-BR: vírgula decimal, ponto como milhar, teto MAX_BRL_VALUE.
 */
export function sanitizeMoneyInput(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, "");
  const fc = s.indexOf(",");
  if (fc !== -1) {
    s = s.slice(0, fc + 1) + s.slice(fc + 1).replace(/,/g, "");
  }
  const hasComma = s.includes(",");
  const [intSection, decSection = ""] = hasComma ? s.split(",", 2) : [s, ""];
  let intDigits = intSection.replace(/\./g, "").replace(/\D/g, "");
  const decDigits = decSection.replace(/\D/g, "").slice(0, 2);
  intDigits = intDigits.slice(0, 6);

  let out: string;
  if (hasComma) {
    const intFormatted = intDigits ? formatIntPtBRFromDigits(intDigits) : "";
    out = (intFormatted || "0") + "," + decDigits;
  } else {
    out = intDigits ? formatIntPtBRFromDigits(intDigits) : "";
  }

  const p = parsePriceInput(out);
  if (Number.isFinite(p) && p > MAX_BRL_VALUE) {
    return formatMoneyInputFromNumber(MAX_BRL_VALUE);
  }
  return out;
}

/**
 * Máscara monetária em tempo real com formatação automática.
 * Formata: 1000 -> 1.000, 100000 -> 1.000,00, 1000.50 -> 1.000,50
 * Limite: até R$ 999.999,99
 */
export function currencyMask(value: string): { formatted: string; raw: number; isValid: boolean; error?: string } {
  // Remove tudo exceto números
  const digitsOnly = value.replace(/\D/g, "");
  
  // Converte para centavos (máximo 999.999,99 = 99.999.999 centavos)
  const maxCents = 99999999;
  const cents = Math.min(parseInt(digitsOnly || "0", 10), maxCents);
  
  // Calcula reais e centavos
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  
  // Formata reais com pontos de milhar
  const reaisFormatted = reais.toLocaleString("pt-BR");
  
  // Formata centavos com 2 dígitos
  const centavosFormatted = centavos.toString().padStart(2, "0");
  
  // Valor final formatado
  const formatted = reais > 0 ? `${reaisFormatted},${centavosFormatted}` : centavos > 0 ? `0,${centavosFormatted}` : "";
  
  // Valor numérico
  const raw = cents / 100;
  
  // Verifica se atingiu o limite
  const isAtLimit = cents >= maxCents;
  
  return {
    formatted,
    raw,
    isValid: raw > 0 && raw <= MAX_BRL_VALUE,
    error: isAtLimit ? `Limite máximo: ${formatBRL(MAX_BRL_VALUE)}` : undefined
  };
}

/** Formata número (reais) para o mesmo padrão dos inputs do wizard. */
export function formatMoneyInputFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  const cents = Math.min(Math.round(value * 100), MAX_CENTS);
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Interpreta valores monetários em pt-BR (ex.: "25,00", "1.234,56") ou formato simples (ex.: "49.90").
 * Rejeita negativos e valores acima de MAX_BRL_VALUE.
 */
export function parsePriceInput(raw: string): number {
  const s = String(raw).trim();
  if (!s) return NaN;
  let n: number;
  if (s.includes(",")) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    n = Number(normalized);
  } else {
    // Sem vírgula: em pt-BR o ponto costuma ser milhar (ex.: 1.234); exceção: decimal estilo "12.50"
    if (/^\d+\.\d{1,2}$/.test(s)) {
      n = Number(s);
    } else {
      n = Number(s.replace(/\./g, ""));
    }
  }
  if (!Number.isFinite(n)) return NaN;
  if (n < 0) return NaN;
  if (n > MAX_BRL_VALUE) return NaN;
  return Math.round(n * 100) / 100;
}
