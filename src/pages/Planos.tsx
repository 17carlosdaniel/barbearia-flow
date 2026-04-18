import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Minus, Zap, Star, Crown, Scissors, ArrowRight, ArrowLeft, Flame, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type PlanoId = "basico" | "profissional" | "premium";

interface Plano {
  id: PlanoId;
  nome: string;
  icone: typeof Zap;
  /** Rótulo de público — “por que este plano” */
  publicoAlvo: string;
  precoMensal: number;
  incluidos: string[];
  naoIncluidos: string[];
  /** Faixa acima do card (ex.: plano destaque) */
  badgeTopo?: string;
  /** Linha extra sob o nome (ex.: melhor custo-benefício) */
  destaqueSecundario?: string;
  cta: string;
  /** Premium: link opcional para suporte */
  ctaSuporte?: boolean;
}

const TRUST_PILLS = ["Teste grátis", "Sem contrato", "Cancele quando quiser"] as const;

const PLANOS: Plano[] = [
  {
    id: "basico",
    nome: "Básico",
    icone: Zap,
    publicoAlvo: "Ideal para quem está começando",
    precoMensal: 49.9,
    incluidos: ["Até 50 agendamentos/mês", "1 barbeiro na equipe", "Agenda simples e organizada"],
    naoIncluidos: ["Pix e visão financeira", "Equipe com vários barbeiros"],
    cta: "Começar com básico",
  },
  {
    id: "profissional",
    nome: "Profissional",
    icone: Star,
    publicoAlvo: "Recomendado para crescer",
    precoMensal: 99.9,
    badgeTopo: "Mais escolhido pelas barbearias",
    destaqueSecundario: "Melhor custo-benefício",
    incluidos: [
      "Agendamentos ilimitados",
      "Até 5 barbeiros na equipe",
      "Controle financeiro e relatórios",
      "Notificações automáticas para clientes",
      "Chave Pix e pagamento no fluxo do app",
    ],
    naoIncluidos: ["Barbeiros ilimitados"],
    cta: "Começar grátis",
  },
  {
    id: "premium",
    nome: "Premium",
    icone: Crown,
    publicoAlvo: "Para quem quer escalar",
    precoMensal: 179.9,
    incluidos: ["Tudo do Profissional", "Barbeiros ilimitados na equipe", "Gestão completa da operação"],
    naoIncluidos: [],
    cta: "Começar premium",
    ctaSuporte: true,
  },
];

const Planos = () => {
  const [periodo, setPeriodo] = useState<"mensal" | "anual">("mensal");

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const precoPorDia = (mensal: number) => (mensal / 30).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <motion.div
      className="min-h-screen bg-background relative overflow-hidden"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-32 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 right-[-80px] w-80 h-80 rounded-full bg-[hsl(var(--gold))/0.18] blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container relative flex items-center justify-between h-14 sm:h-16 px-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 py-2 pr-2 -ml-1 rounded-md hover:bg-muted/50"
            aria-label="Voltar à página inicial"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Voltar
          </Link>
          <Link
            to="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 min-w-0"
          >
            <Scissors className="h-9 w-9 sm:h-10 sm:w-10 text-primary shrink-0" />
            <span className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold truncate hidden sm:inline">
              BarberFlow
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/login">
              <Button variant="outlineGold" size="sm" className="rounded-lg h-9 text-sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="rounded-lg h-9 text-sm bg-gradient-gold-horizontal text-black hover:opacity-90">
                Cadastrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container px-4 py-12 sm:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-display font-bold text-foreground leading-tight">
            Comece grátis e veja sua{" "}
            <span className="text-primary">agenda encher</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-sm sm:text-base max-w-xl mx-auto">
            Sem fidelidade. Sem complicação. Cancele quando quiser.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 max-w-2xl mx-auto"
        >
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--gold))] shrink-0" />
              {pill}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-2 mb-8"
        >
          <div className="relative inline-flex items-center gap-1 rounded-full bg-card/80 border border-border/60 px-1 py-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setPeriodo("mensal")}
              className={`relative z-10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                periodo === "mensal"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodo === "mensal" && (
                <motion.span
                  layoutId="planos-periodo-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-gold"
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                />
              )}
              <span className="relative z-10">Mensal</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodo("anual")}
              className={`relative z-10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                periodo === "anual"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodo === "anual" && (
                <motion.span
                  layoutId="planos-periodo-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-gold"
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                />
              )}
              <span className="relative z-10">
                Anual <span className="ml-1 text-[10px] uppercase tracking-wide">2 meses grátis</span>
              </span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            No plano anual você paga 10 meses e usa o ano inteiro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {PLANOS.map((plano, i) => {
            const Icon = plano.icone;
            const isPopular = plano.id === "profissional";
            const mensal = plano.precoMensal;
            const valor = periodo === "mensal" ? mensal : mensal * 10;
            return (
              <motion.div
                key={plano.id}
                initial={{ opacity: 0, y: 24, scale: isPopular ? 0.96 : 0.94 }}
                animate={{ opacity: 1, y: 0, scale: isPopular ? 1.02 : 0.98 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, type: "spring", stiffness: 120 }}
                whileHover={{ y: -8, scale: isPopular ? 1.05 : 1.02 }}
                className={`relative rounded-2xl border flex flex-col p-6 sm:p-7 backdrop-blur-xl bg-card/80 ${
                  isPopular
                    ? "border-[hsl(var(--gold))]/80 shadow-[0_0_40px_hsl(var(--gold)/0.55)] z-10"
                    : "border-border/60 shadow-card"
                }`}
              >
                {plano.badgeTopo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-[hsl(var(--gold-light))] to-[hsl(var(--gold))] pl-2.5 pr-3 py-1 text-[10px] font-bold tracking-wide uppercase text-gray-900 shadow-[0_0_18px_hsl(var(--gold)/0.85)] max-w-[calc(100%-1rem)]">
                    <Flame className="w-3 h-3 shrink-0" aria-hidden />
                    <span className="truncate">{plano.badgeTopo}</span>
                  </div>
                )}
                <div className={plano.badgeTopo ? "pt-4" : ""}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-display font-semibold text-foreground">{plano.nome}</h2>
                  </div>
                  <div className="mb-3 space-y-1">
                    <p className="text-sm font-semibold text-[hsl(var(--gold))] leading-snug">{plano.publicoAlvo}</p>
                    {plano.destaqueSecundario && (
                      <p className="text-sm font-medium text-foreground">{plano.destaqueSecundario}</p>
                    )}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${plano.id}-${periodo}`}
                      initial={{ opacity: 0, y: 6, filter: "blur(1px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, filter: "blur(1px)" }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      <p className="text-3xl font-display font-bold text-foreground mb-1">
                        {formatCurrency(valor)}
                        <span className="text-sm font-normal text-muted-foreground">
                          {periodo === "mensal" ? "/mês" : "/ano"}
                        </span>
                      </p>
                      {periodo === "mensal" && isPopular && (
                        <p className="text-sm text-muted-foreground mb-1">
                          ou <span className="font-semibold text-foreground">{precoPorDia(mensal)}</span> por dia
                        </p>
                      )}
                      {periodo === "anual" && (
                        <p className="text-xs text-emerald-400 font-medium mb-2">
                          Equivalente a {formatCurrency(mensal)} por mês.
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <ul className="space-y-2 mt-4 mb-5">
                    {plano.incluidos.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/90">
                        <Check className="w-4 h-4 text-[hsl(var(--gold))] shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plano.naoIncluidos.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Minus className="w-4 h-4 shrink-0 opacity-60" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-2">
                    <Button
                      asChild
                      size="lg"
                      className={`w-full rounded-lg ${
                        isPopular
                          ? "bg-gradient-to-r from-[hsl(var(--gold-light))] to-[hsl(var(--gold))] text-gray-900 hover:opacity-95"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      <Link to="/cadastro">{plano.cta}</Link>
                    </Button>
                    {plano.ctaSuporte && (
                      <Button asChild variant="ghost" size="sm" className="w-full text-primary hover:text-primary">
                        <Link to="/suporte">Falar com suporte</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14 max-w-xl mx-auto space-y-5"
        >
          <p className="text-[11px] sm:text-xs text-muted-foreground tracking-wide uppercase">
            {TRUST_PILLS.join(" · ")}
          </p>
          <p className="text-foreground font-display font-semibold text-lg sm:text-xl">
            Vale a pena: você testa sem risco e decide com a agenda na mão.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Link to="/cadastro" className="inline-flex">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-[hsl(var(--gold-light))] to-[hsl(var(--gold))] text-gray-900 hover:opacity-95 font-semibold px-8"
              >
                Criar conta grátis
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Button>
            </Link>
            <Link to="/login" className="inline-flex">
              <Button size="lg" variant="outlineGold" className="w-full sm:w-auto rounded-lg">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border py-6 mt-12 text-center">
        <p className="text-muted-foreground text-sm">© 2026 BarberFlow. Todos os direitos reservados.</p>
      </footer>
    </motion.div>
  );
};

export default Planos;
