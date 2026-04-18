import { BARBER_OPERACAO_ENTRY } from "@/lib/barberOperacaoNav";

/** Agrupamentos da navegação lateral — títulos distintos Vintage (calor) vs Modern (utilitário). */
export type DashboardNavGroupDef = {
  id: string;
  titleVintage: string;
  titleModern: string;
  paths: string[];
};

export const CLIENT_NAV_GROUPS: DashboardNavGroupDef[] = [
  {
    id: "client-main",
    titleVintage: "Principal",
    titleModern: "Principal",
    paths: ["/cliente", "/cliente/buscar", "/cliente/agendamentos", "/cliente/historico"],
  },
  {
    id: "client-relationship",
    titleVintage: "Benefícios e descoberta",
    titleModern: "Loja e benefícios",
    paths: [
      "/cliente/fidelidade",
      "/cliente/gift-cards",
      "/cliente/loja",
    ],
  },
  {
    id: "client-account",
    titleVintage: "Conta e suporte",
    titleModern: "Conta",
    paths: ["/cliente/notificacoes", "/guia", "/cliente/perfil", "/privacidade", "/suporte"],
  },
];

export const BARBER_NAV_GROUPS: DashboardNavGroupDef[] = [
  {
    id: "barber-main",
    titleVintage: "A casa",
    titleModern: "Principal",
    paths: [
      "/barbeiro",
      "/barbeiro/minha-barbearia",
      "/barbeiro/equipe",
      "/barbeiro/servicos",
      BARBER_OPERACAO_ENTRY,
    ],
  },
  {
    id: "barber-presence",
    titleVintage: "Presença",
    titleModern: "Comunicação",
    paths: ["/barbeiro/notificacoes", "/barbeiro/avaliacoes", "/guia"],
  },
  {
    id: "barber-account",
    titleVintage: "Conta e plano",
    titleModern: "Conta",
    paths: ["/barbeiro/assinatura", "/barbeiro/perfil", "/privacidade", "/suporte"],
  },
];
