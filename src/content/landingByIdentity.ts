import type { Identity } from "@/contexts/ThemeContext";

export type LandingHeroCopy = {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  chips: readonly string[];
};

const vintageHero: LandingHeroCopy = {
  eyebrow: "Gestão com Identidade",
  titleLead: "Mais controle para a operação. ",
  titleAccent: "Mais presença para a sua barbearia.",
  subtitle:
    "Agenda, equipe, serviços e atendimento reunidos em uma experiência mais elegante, editorial e profissional.",
  ctaPrimary: "Conhecer BarberFlow",
  ctaSecondary: "Ver como funciona",
  chips: ["Rotina da casa organizada", "Atendimento mais fluido", "Serviços e equipe no mesmo painel", "Presença de marca no detalhe"],
} as const;

const modernHero: LandingHeroCopy = {
  eyebrow: "Operação Digital",
  titleLead: "Gerencie agenda, equipe e caixa em ",
  titleAccent: "um só fluxo",
  subtitle: "Organize horários, clientes, serviços e pagamentos com clareza operacional e performance.",
  ctaPrimary: "Testar grátis",
  ctaSecondary: "Ver produto",
  chips: ["Agenda, equipe e caixa", "Setup rápido", "PDV integrado", "Confirmações automáticas"],
} as const;

export function getLandingHeroCopy(identity: Identity): LandingHeroCopy {
  return identity === "modern" ? modernHero : vintageHero;
}
