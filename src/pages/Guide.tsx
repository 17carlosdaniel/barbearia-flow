import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  MapPin,
  PlayCircle,
  Scissors,
  Sparkles,
  Zap,
  LayoutDashboard,
  Activity,
  ArrowRight,
  CalendarPlus,
  Search,
  ShoppingBag,
  UserRound,
  History,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const Guide = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const navigate = useNavigate();
  const isCliente = user?.role === "cliente";
  const layoutRole = isCliente ? "cliente" : "barbeiro";

  const quickActions = useMemo(() => {
    if (isCliente) {
      return [
        {
          label: isModern ? "Novo agendamento" : "Agendar atendimento",
          path: "/cliente/novo-agendamento",
          icon: CalendarPlus,
        },
        {
          label: isModern ? "Buscar barbearias" : "Encontrar barbearias",
          path: "/cliente/buscar",
          icon: Search,
        },
        {
          label: isModern ? "Loja & produtos" : "Loja BarberFlow",
          path: "/cliente/loja",
          icon: ShoppingBag,
        },
        {
          label: isModern ? "Diagnóstico capilar" : "Descobrir meu cuidado",
          path: "/cliente/quiz",
          icon: Sparkles,
        },
        {
          label: isModern ? "Meus agendamentos" : "Minha agenda",
          path: "/cliente/agendamentos",
          icon: History,
        },
        {
          label: isModern ? "Meu perfil" : "Meus dados",
          path: "/cliente/perfil",
          icon: UserRound,
        },
      ];
    }
    return [
      { label: isModern ? "Gerenciar agenda" : "Gerenciar agenda", path: "/barbeiro", icon: Scissors },
      { label: isModern ? "Ver perfil" : "Ver minha barbearia", path: "/barbeiro/minha-barbearia", icon: MapPin },
      { label: isModern ? "Configurar serviços" : "Organizar serviços", path: "/barbeiro/servicos", icon: Sparkles },
      { label: isModern ? "Painel de controle" : "Acompanhar operação", path: "/barbeiro", icon: LayoutDashboard },
    ];
  }, [isModern, isCliente]);

  const threeSteps = useMemo(() => {
    if (isCliente) {
      return [
        {
          step: "1",
          modernTitle: "Encontre sua barbearia",
          vintageTitle: "Descubra quem cuida de você",
          desc: "Busque por local, avaliação e serviços que combinam com o que você procura.",
          icon: Search,
        },
        {
          step: "2",
          modernTitle: "Agende em poucos toques",
          vintageTitle: "Escolha data e serviço",
          desc: "Veja horários livres, confirme o pedido e receba tudo organizado na sua agenda.",
          icon: CalendarPlus,
        },
        {
          step: "3",
          modernTitle: "Acompanhe e volte",
          vintageTitle: "Histórico e próximos cortes",
          desc: "Consulte agendamentos, fila de espera quando disponível e volte quando quiser renovar o visual.",
          icon: CheckCircle2,
        },
      ];
    }
    return [
      {
        step: "1",
        modernTitle: "Organize sua agenda",
        vintageTitle: "Gerencie sua agenda",
        desc: "Controle seus horários com precisão.",
        icon: Zap,
      },
      {
        step: "2",
        modernTitle: "Acompanhe clientes",
        vintageTitle: "Acompanhe seus clientes",
        desc: "Histórico e preferências sempre à mão.",
        icon: Clapperboard,
      },
      {
        step: "3",
        modernTitle: "Conclua atendimentos",
        vintageTitle: "Finalize e fidelize",
        desc: "Garanta o retorno com um serviço premium.",
        icon: CheckCircle2,
      },
    ];
  }, [isCliente]);

  const header = useMemo(() => {
    if (isCliente) {
      return {
        title: isModern ? "Guia do cliente" : "Seu guia BarberFlow",
        subtitle: isModern
          ? "Do agendamento à loja: veja como aproveitar o app como cliente."
          : "Um caminho simples para marcar, comprar e cuidar do seu visual com calma.",
      };
    }
    return {
      title: isModern ? "Guia do barbeiro" : "Guia da operação",
      subtitle: isModern
        ? "Passos e atalhos para mandar na agenda, serviços e rotina do salão."
        : "Comece pelo essencial e encontre os atalhos mais importantes da casa.",
    };
  }, [isModern, isCliente]);

  const stepsSectionTitle = isCliente
    ? isModern
      ? "Seu fluxo em 3 passos"
      : "Como aproveitar o app em 3 passos"
    : isModern
      ? "Comece em 3 passos"
      : "Como usar o app em 3 passos";

  const videoLead = isCliente
    ? isModern
      ? "Veja como agendar e acompanhar seus horários em poucos minutos."
      : "Um passeio rápido pelo que você pode fazer como cliente no BarberFlow."
    : isModern
      ? "Veja o fluxo principal do sistema em poucos segundos."
      : "Veja o fluxo principal do app em poucos segundos.";

  const quickSectionTitle = isCliente
    ? isModern
      ? "Atalhos para você"
      : "Atalhos do cliente"
    : isModern
      ? "Ações rápidas"
      : "Atalhos da casa";

  const statusSection = useMemo(() => {
    if (isCliente) {
      return {
        title: isModern ? "Seus agendamentos" : "Entenda seus agendamentos",
        lead: isModern
          ? "Resumo dos estados que você vê na lista de horários marcados."
          : "Cada status ajuda você a saber onde está o seu próximo cuidado.",
        items: [
          { color: "bg-emerald-500", modern: "Confirmado", vintage: "Confirmado — tudo certo para o dia" },
          { color: "bg-sky-500", modern: "Pendente", vintage: "Pendente — aguardando confirmação da barbearia" },
          { color: "bg-amber-500", modern: "Em andamento", vintage: "No salão — chegou a hora do atendimento" },
          { color: "bg-zinc-500", modern: "Concluído", vintage: "Concluído — já pode avaliar ou agendar de novo" },
        ],
      };
    }
    return {
      title: isModern ? "Status da agenda" : "Legenda de cores da agenda",
      lead: isModern
        ? "Use as cores para identificar rapidamente a situação dos atendimentos."
        : "Use as cores para identificar rapidamente o ritmo dos próximos atendimentos.",
      items: [
        { color: "bg-emerald-500", modern: "Em atendimento", vintage: "Em atendimento agora" },
        { color: "bg-sky-500", modern: "Próximo", vintage: "Próximo da fila" },
        { color: "bg-amber-500", modern: "Imediato", vintage: "Atendimento imediato" },
        { color: "bg-red-500", modern: "Atrasado", vintage: "Atrasado" },
      ],
    };
  }, [isCliente, isModern]);

  const tip = isCliente
    ? isModern
      ? "Ative lembretes, confira endereço e horário um dia antes; use o diagnóstico capilar para escolher produtos na loja com mais confiança."
      : "Reservar com antecedência e revisar o endereço da barbearia evita surpresas. A loja e o quiz ajudam a manter cabelo e barba alinhados ao seu estilo."
    : isModern
      ? "Revise agenda e serviços com frequência para manter a operação atualizada."
      : "Revisar agenda e serviços com frequência ajuda a manter a casa alinhada e evita ajustes urgentes.";

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mx-auto max-w-4xl", isModern ? "space-y-6 py-2" : "space-y-10 py-6")}
    >
      <div className={cn("text-center", isModern ? "space-y-1" : "space-y-3")}>
        <div
          className={cn(
            "mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border",
            isModern ? "border-primary/20 bg-primary/10" : "h-14 w-14 border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.1)]",
          )}
        >
          {isModern ? (
            <Activity className="h-5 w-5 text-primary" />
          ) : (
            <BookOpen className="h-7 w-7 text-[hsl(var(--gold))]" />
          )}
        </div>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-widest text-primary/80",
            !isModern && "text-[hsl(var(--gold))]",
          )}
        >
          {isCliente ? "Cliente" : "Barbeiro & equipe"}
        </p>
        <h1
          className={cn(
            "font-display font-bold tracking-tight",
            isModern ? "text-2xl lg:text-3xl" : "text-4xl lg:text-5xl",
          )}
        >
          {header.title}
        </h1>
        <p className={cn("mx-auto text-muted-foreground", isModern ? "max-w-xl text-sm" : "max-w-2xl text-lg")}>
          {header.subtitle}
        </p>
      </div>

      <section
        className={cn(
          "relative overflow-hidden",
          isModern
            ? "rounded-2xl border border-border bg-card p-5 shadow-sm"
            : "rounded-2xl border border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] p-8 shadow-2xl lg:p-12",
        )}
      >
        {!isModern && (
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
        )}

        <h2
          className={cn(
            "mb-6 font-display font-semibold",
            isModern ? "text-lg" : "mb-10 text-center text-2xl",
          )}
        >
          {stepsSectionTitle}
        </h2>

        <div className={cn("grid grid-cols-1 md:grid-cols-3", isModern ? "gap-4" : "gap-8")}>
          {threeSteps.map((item) => (
            <div
              key={item.step}
              className={cn(
                "flex rounded-2xl border border-border/40 transition-all hover:border-primary/20",
                isModern ? "flex-row items-start gap-4 bg-muted/20 p-3" : "flex-col items-center space-y-4 bg-[hsl(var(--muted)/0.2)] p-6 text-center",
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-xl border",
                  isModern
                    ? "h-10 w-10 border-primary/10 bg-primary/5 text-primary"
                    : "h-12 w-12 border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] shadow-sm",
                )}
              >
                <item.icon className={isModern ? "h-5 w-5" : "h-6 w-6"} />
              </div>
              <div className={isModern ? "text-left" : ""}>
                <p
                  className={cn(
                    "mb-1 font-bold uppercase tracking-widest",
                    isModern ? "text-[9px] text-primary/70" : "text-[11px] text-[hsl(var(--gold))]",
                  )}
                >
                  Passo {item.step}
                </p>
                <p className={cn("font-semibold", isModern ? "mb-0.5 text-sm" : "mb-2 text-base")}>
                  {isModern ? item.modernTitle : item.vintageTitle}
                </p>
                <p className={cn("leading-relaxed text-muted-foreground", isModern ? "text-xs" : "text-sm")}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={cn("grid grid-cols-1 lg:grid-cols-12", isModern ? "gap-4" : "gap-10")}>
        <section
          className={cn(
            "border transition-all lg:col-span-5",
            isModern
              ? "rounded-2xl border-border bg-card p-5"
              : "rounded-2xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-8 shadow-lg",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className={cn("font-display font-semibold", isModern ? "text-base" : "text-xl")}>
              {isModern ? "Vídeo rápido" : "Vídeo demonstrativo"}
            </h2>
            <PlayCircle className={cn("h-6 w-6", isModern ? "text-primary/40" : "text-[hsl(var(--gold))]")} />
          </div>
          <p className={cn("mb-6 text-muted-foreground", isModern ? "text-xs" : "text-sm")}>{videoLead}</p>
          <div
            className={cn(
              "group flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition-colors",
              isModern
                ? "border-border bg-muted/20 hover:bg-muted/30"
                : "border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.03)] hover:bg-[hsl(var(--gold)/0.05)]",
            )}
          >
            <PlayCircle
              className={cn(
                "mb-3 transition-transform group-hover:scale-110",
                isModern ? "h-12 w-12 text-primary/20" : "h-12 w-12 text-[hsl(var(--gold)/0.3)]",
              )}
            />
            <p
              className={cn(
                "font-medium",
                isModern ? "text-xs text-muted-foreground" : "text-sm text-[hsl(var(--gold)/0.6)]",
              )}
            >
              Clique para assistir
            </p>
          </div>
        </section>

        <section
          className={cn(
            "border transition-all lg:col-span-7",
            isModern
              ? "rounded-2xl border-border bg-card p-5"
              : "rounded-2xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-8 shadow-lg",
          )}
        >
          <h2 className={cn("mb-6 font-display font-semibold", isModern ? "text-base" : "text-xl")}>
            {quickSectionTitle}
          </h2>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2", isModern ? "gap-2" : "gap-4")}>
            {quickActions.map((action) => (
              <Button
                key={action.path + action.label}
                variant="outline"
                className={cn(
                  "group justify-between rounded-xl border-border transition-all",
                  isModern
                    ? "h-11 px-4 text-xs hover:border-primary/30 hover:bg-primary/5"
                    : "h-14 px-6 text-sm hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold)/0.03)]",
                )}
                onClick={() => navigate(action.path)}
              >
                <div className="flex items-center">
                  <action.icon
                    className={cn(
                      "text-muted-foreground transition-colors group-hover:text-primary",
                      isModern ? "mr-2.5 h-4 w-4" : "mr-3 h-5 w-5",
                    )}
                  />
                  <span className="font-medium">{action.label}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Button>
            ))}
          </div>
        </section>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-12", isModern ? "gap-4" : "gap-10")}>
        <section
          className={cn(
            "border transition-all lg:col-span-8",
            isModern
              ? "rounded-2xl border-border bg-card p-5"
              : "rounded-2xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] p-8 shadow-lg",
          )}
        >
          <h2 className={cn("mb-2 font-display font-semibold", isModern ? "text-base" : "text-xl")}>
            {statusSection.title}
          </h2>
          <p className={cn("mb-6 text-muted-foreground", isModern ? "text-xs" : "text-sm")}>{statusSection.lead}</p>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2", isModern ? "gap-2" : "gap-4")}>
            {statusSection.items.map((status) => (
              <div
                key={status.modern}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 transition-colors hover:bg-muted/20",
                  isModern ? "p-3" : "p-4",
                )}
              >
                <div
                  className={cn("h-3 w-3 shrink-0 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]", status.color)}
                />
                <p className={cn("font-medium", isModern ? "text-xs" : "text-sm")}>
                  {isModern ? status.modern : status.vintage}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className={cn(
            "relative overflow-hidden transition-all lg:col-span-4",
            isModern
              ? "flex flex-col justify-center rounded-2xl border border-border bg-card p-5"
              : "rounded-[2rem] border border-[hsl(var(--gold)/0.2)] bg-gradient-to-br from-[hsl(var(--gold)/0.08)] to-transparent p-8 shadow-lg",
          )}
        >
          {!isModern && (
            <Sparkles className="absolute -right-4 -top-4 h-16 w-16 rotate-12 text-[hsl(var(--gold)/0.05)]" />
          )}

          <h2
            className={cn(
              "mb-4 flex items-center gap-2 font-display font-semibold",
              isModern ? "text-base" : "text-xl",
            )}
          >
            <Sparkles className={cn("h-5 w-5", isModern ? "text-primary/60" : "text-[hsl(var(--gold))]")} />
            {isModern ? "Dica de uso" : "Dica rápida"}
          </h2>
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              isModern ? "text-xs" : "text-sm font-medium italic",
            )}
          >
            {tip}
          </p>
        </section>
      </div>
    </motion.div>
  );

  return <DashboardLayout userType={layoutRole}>{content}</DashboardLayout>;
};

export default Guide;
