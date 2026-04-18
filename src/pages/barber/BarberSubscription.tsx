import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Minus, 
  Zap, 
  Star, 
  Crown, 
  Calendar, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  ArrowUpCircle, 
  Info,
  BarChart3,
  TrendingUp,
  LayoutGrid,
  Settings2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getBarbershopProfile, setBarbershopProfile } from "@/lib/barbershopProfile";
import { toast } from "@/hooks/use-toast";
import { getAppointmentsCountForMonth } from "@/lib/appointments";
import { getTeam } from "@/lib/team";

const PLANOS = [
  {
    id: "basico",
    nome: "Básico",
    preco: "R$ 49,90",
    slug_modern: "Básico",
    slug_vintage: "Básico",
    tagline_modern: "Estrutura essencial para sua operação inicial.",
    tagline_vintage: "Para começar com clareza",
    icone: Zap,
    destaques: false,
    beneficios_modern: [
      "Até 50 agendamentos/mês",
      "1 profissional ativo",
      "Perfil da barbearia",
      "Gestão básica"
    ],
    beneficios_vintage: [
      "Ideal para organizar o começo da casa",
      "Até 50 agendamentos por mês",
      "Perfil da barbearia",
      "1 barbeiro na equipe"
    ],
    papel_vintage: "Um plano de entrada"
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: "R$ 97,00",
    slug_modern: "Profissional",
    slug_vintage: "Profissional",
    tagline_modern: "O fôlego ideal para ampliar equipe e agenda.",
    tagline_vintage: "Para a casa em crescimento",
    icone: Star,
    destaques: true,
    beneficios_modern: [
      "Agendamentos ilimitados",
      "Até 5 profissionais",
      "Gestão completa",
      "Notificações automáticas"
    ],
    beneficios_vintage: [
      "Mais fôlego para crescer sem bloqueios",
      "Agendamentos ilimitados",
      "Até 5 barbeiros",
      "Visão financeira e notificações"
    ],
    papel_vintage: "Um plano de crescimento"
  },
  {
    id: "premium",
    nome: "Premium",
    preco: "R$ 147,00",
    slug_modern: "Premium",
    slug_vintage: "Premium",
    tagline_modern: "Potência total para escala e operação avançada.",
    tagline_vintage: "Para operação madura e expansão",
    icone: Crown,
    destaques: false,
    beneficios_modern: [
      "Tudo do Profissional",
      "Equipe ilimitada",
      "Escala de gestão",
      "Operação avançada"
    ],
    beneficios_vintage: [
      "Estrutura para equipe maior e operação expandida",
      "Tudo do Profissional",
      "Barbeiros ilimitados",
      "Mais escala para a casa"
    ],
    papel_vintage: "Um plano de maturidade"
  }
];

const BarberSubscription = () => {
  const { user, updateUser } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const profile = getBarbershopProfile(barbershopId);
  
  const [aba, setAba] = useState<"planos" | "faturas">("planos");
  const [agendamentosMes, setAgendamentosMes] = useState(0);
  const [equipeAtiva, setEquipeAtiva] = useState(0);
  const [upgradeLoadingPlan, setUpgradeLoadingPlan] = useState<string | null>(null);
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false);

  const planoAtualId = user?.subscriptionPlanId ?? "basico";
  const planoAtual = PLANOS.find(p => p.id === planoAtualId);
  const assinaturaAtiva = user?.subscriptionStatus === "active";
  const cardMasked = "**** **** **** 4455";
  const PROXIMA_COBRANCA = "15 de Abril, 2026";

  useEffect(() => {
    const now = new Date();
    setAgendamentosMes(getAppointmentsCountForMonth(barbershopId, now.getFullYear(), now.getMonth() + 1));
    const teamData = getTeam(barbershopId);
    if (teamData) {
      setEquipeAtiva(teamData.members.length + 1);
    }
  }, [barbershopId]);

  const handleAssinar = (planId: string) => {
    if (planId === planoAtualId && assinaturaAtiva) return;
    setUpgradeLoadingPlan(planId);
    setTimeout(() => {
      updateUser({ subscriptionPlanId: planId, subscriptionStatus: "active" });
      setUpgradeLoadingPlan(null);
      toast({ title: "Plano atualizado", description: `Você agora está no plano ${PLANOS.find(p => p.id === planId)?.nome}.` });
    }, 1500);
  };

  const limiteAgendaAtual = planoAtualId === "basico" ? 50 : null;
  const perdaPotencial = planoAtualId === "basico" && agendamentosMes > 40 ? (agendamentosMes - 40) * 45 : 0;
  const recomendadoPlano = perdaPotencial > 0 ? PLANOS[1] : PLANOS[0];
  const IconePlanoAtual = planoAtual?.icone ?? Zap;

  const faturasMock = [
    { id: "1", data: "15/03/2026", valor: planoAtual?.preco ?? "R$ 49,90", status: "Pago" },
    { id: "2", data: "15/02/2026", valor: planoAtual?.preco ?? "R$ 49,90", status: "Pago" },
  ];

  return (
    <DashboardLayout userType="barbeiro">
      <div className={`max-w-5xl mx-auto px-4 ${isModern ? "py-6 space-y-8" : "py-10 space-y-12"}`}>
        
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${isModern ? "mb-6" : "mb-10"}`}
        >
          <div className="space-y-1">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isModern ? "text-primary/70" : "text-[hsl(var(--gold)/0.6)]"}`}>
              {isModern ? "ASSINATURA" : "BARBERFLOW CONTROL"}
            </span>
            <h1 className={`${isModern ? "text-2xl" : "text-4xl font-display font-bold"} text-foreground`}>
              {isModern ? "Plano atual" : "Plano da casa"}
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              {isModern 
                ? "Gerencie seu plano, acompanhe capacidade e compare opções disponíveis." 
                : "Escolha o plano que acompanha o momento e o crescimento da sua casa."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!isModern && (
              <>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                  Painel premium
                </Button>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground">
                  Atalhos
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Bloco Plano Atual */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden ${
            isModern 
              ? "rounded-2xl border border-border bg-card p-6 shadow-sm" 
              : "rounded-2xl border border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] p-8 shadow-2xl"
          }`}
        >
          {!isModern && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
          )}
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 relative z-10">
            <div className="space-y-8 flex-1">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`rounded-lg flex items-center justify-center border ${
                    isModern 
                      ? "w-7 h-7 bg-primary/10 border-primary/20" 
                      : "w-8 h-8 bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]"
                  }`}>
                    <IconePlanoAtual className={`${isModern ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isModern ? "text-primary/70" : "text-[hsl(var(--gold))]"}`}>
                    {isModern ? "PLANO ATIVO" : "PLANO ATIVO"}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-baseline gap-4 mb-3">
                  <h2 className={`${isModern ? "text-3xl" : "text-5xl font-display font-bold"} text-foreground`}>{planoAtual?.nome}</h2>
                  <div className="flex flex-col">
                    <span className={`font-bold ${isModern ? "text-lg text-primary" : "text-2xl text-[hsl(var(--gold))]"}`}>
                      {planoAtual?.preco}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">por mês</span>
                  </div>
                </div>
                
                <p className={`text-muted-foreground leading-relaxed max-w-xl ${isModern ? "text-sm" : "text-base font-medium italic"}`}>
                  {isModern 
                    ? "Plano atual da operação."
                    : (planoAtualId === "premium" 
                        ? "Hoje sua casa opera com uma estrutura pronta para rotina madura, equipe maior e expansão."
                        : (planoAtualId === "profissional" 
                            ? "Sua casa opera com fôlego para equipe em crescimento e fluxo constante." 
                            : "Sua casa opera com a estrutura essencial para organização e clareza inicial."))}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Próxima cobrança</p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Calendar className={`w-3.5 h-3.5 ${isModern ? "text-primary/50" : "text-[hsl(var(--gold))]"}`} />
                    <span className="text-sm">{assinaturaAtiva ? PROXIMA_COBRANCA : "Assinatura cancelada"}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Forma de pagamento</p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <CreditCard className={`w-3.5 h-3.5 ${isModern ? "text-primary/50" : "text-[hsl(var(--gold))]"}`} />
                    <span className="text-sm">Cartão •••• 4455</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Agendamentos / mês</p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Calendar className={`w-3.5 h-3.5 ${isModern ? "text-primary/50" : "text-[hsl(var(--gold))]"}`} />
                    <span className="text-sm">{agendamentosMes} {limiteAgendaAtual !== null ? `/ ${limiteAgendaAtual}` : "(Ilimitado)"}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Equipe ativa</p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Users className={`w-3.5 h-3.5 ${isModern ? "text-primary/50" : "text-[hsl(var(--gold))]"}`} />
                    <span className="text-sm">{equipeAtiva}</span>
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Status da operação</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${perdaPotencial > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-sm font-semibold text-foreground">
                      {perdaPotencial > 0 ? "Requer atenção" : "Em conformidade"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-[260px] lg:pt-2">
              <Button
                type="button"
                className={`w-full font-bold transition-all h-12 rounded-xl shadow-lg ${
                  isModern 
                    ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                    : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))] shadow-[hsl(var(--gold)/0.2)]"
                }`}
                onClick={() => setDialogPagamentoOpen(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isModern ? "Alterar pagamento" : "Ajustar pagamento"}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAba("faturas")}
                  className={`h-10 rounded-xl text-xs font-bold border-border/50 hover:bg-muted/50 ${
                    isModern ? "text-primary" : "text-foreground/70"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Ver faturas
                </Button>
                
                {assinaturaAtiva && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDialogCancelarOpen(true)}
                    className="h-10 rounded-xl text-[10px] font-bold text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    {isModern ? "Cancelar plano" : "Cancelar assinatura"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Conteúdo Contextual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leitura do Momento / Capacidade */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 ${
              isModern 
                ? "rounded-2xl border border-border bg-card shadow-sm"
                : "rounded-2xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--gold)/0.03)]"
            }`}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`shrink-0 rounded-xl flex items-center justify-center border ${
                isModern 
                  ? "w-10 h-10 bg-primary/5 border-primary/10" 
                  : "w-10 h-10 bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]"
              }`}>
                <BarChart3 className={`${isModern ? "w-4.5 h-4.5 text-primary" : "w-5 h-5 text-[hsl(var(--gold))]"}`} />
              </div>
              <div className="space-y-1">
                <h3 className={`font-bold text-foreground ${isModern ? "text-sm" : "text-base font-display"}`}>
                  {isModern ? "Capacidade da operação" : "Seu momento atual"}
                </h3>
                <p className={`text-muted-foreground leading-relaxed ${isModern ? "text-xs" : "text-sm italic"}`}>
                  {isModern ? (
                    perdaPotencial > 0 
                      ? "Seu uso atual indica proximidade com uma etapa maior." 
                      : "Seu plano atual atende bem ao volume atual."
                  ) : (
                    perdaPotencial > 0 
                      ? "Sua casa já começou a encostar em capacidades maiores. Em breve, subir de etapa pode trazer mais fluidez para a operação."
                      : "O plano atual acompanha bem o ritmo da sua casa. O próximo passo passa a valer quando a equipe crescer ou quando a operação pedir mais fôlego."
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`text-xs font-bold rounded-xl h-9 ${isModern ? "" : "border-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold))]"}`}
              >
                {isModern ? "Ver recomendação" : "Ver próximo passo"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold rounded-xl h-9"
              >
                {isModern ? "Comparar planos" : "Comparar etapas"}
              </Button>
            </div>
          </motion.div>

          {/* Recomendação / Próximo Passo */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 ${
              isModern 
                ? "rounded-2xl border border-border bg-card shadow-sm"
                : "rounded-2xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--gold)/0.03)]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`shrink-0 rounded-xl flex items-center justify-center border ${
                isModern 
                  ? "w-10 h-10 bg-primary/5 border-primary/10" 
                  : "w-10 h-10 bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]"
              }`}>
                <TrendingUp className={`${isModern ? "w-4.5 h-4.5 text-primary" : "w-5 h-5 text-[hsl(var(--gold))]"}`} />
              </div>
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className={`font-bold text-foreground ${isModern ? "text-sm" : "text-base font-display"}`}>
                    {isModern ? "Plano recomendado" : "Próximo passo da casa"}
                  </h3>
                  {planoAtualId !== "premium" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isModern ? "bg-primary/10 text-primary" : "bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))]"}`}>
                          {recomendadoPlano.nome}
                        </span>
                        {!isModern && <span className="text-[10px] font-medium text-muted-foreground italic">— Recomendado para evolução</span>}
                      </div>
                      <p className={`text-muted-foreground leading-relaxed ${isModern ? "text-xs" : "text-sm"}`}>
                        {isModern 
                          ? `${recomendadoPlano.nome} é o próximo passo ideal para ampliar equipe, agenda e gestão sem perder fluidez.`
                          : "Quando a equipe crescer ou o volume de atendimentos começar a subir, essa etapa ajuda a manter a casa leve, com mais estrutura."}
                      </p>
                    </>
                  ) : (
                    <p className={`text-muted-foreground leading-relaxed ${isModern ? "text-xs" : "text-sm font-medium"}`}>
                      {isModern 
                        ? "Sua casa já está operando com capacidade total no nível Premium."
                        : "Sua casa já está na etapa mais alta. Explore os recursos de escala para maximizar sua operação."}
                    </p>
                  )}
                </div>

                {planoAtualId !== "premium" && (
                  <div className="space-y-3">
                    <p className={`text-[10px] uppercase font-bold tracking-widest text-muted-foreground ${isModern ? "" : "italic"}`}>
                      {isModern ? "Principais ganhos" : "O que sua casa ganha"}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {["Mais equipe", "Agenda ilimitada", "Gestão avançada"].map((item) => (
                        <div key={item} className="flex items-center gap-1.5">
                          <Check className={`w-3 h-3 ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`} />
                          <span className={`text-[11px] font-semibold text-foreground/80 ${isModern ? "" : "italic"}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {planoAtualId !== "premium" && (
                  <Button 
                    className={`h-9 px-6 rounded-xl text-xs font-bold shadow-lg transition-all ${
                      isModern 
                        ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                        : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))] shadow-[hsl(var(--gold)/0.1)]"
                    }`}
                  >
                    {isModern ? "Conhecer plano" : "Conhecer esta etapa"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
        {aba === "faturas" ? (
          <motion.div
            key="faturas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-foreground">Histórico de Cobrança</h3>
              <button onClick={() => setAba("planos")} className={`text-xs font-bold ${isModern ? "text-primary" : "text-[hsl(var(--gold))]"}`}>Voltar para planos</button>
            </div>
            <div className="space-y-3">
              {faturasMock.map((f, i) => (
                <div key={f.id} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">Fatura de {f.data}</p>
                      <p className="text-xs text-muted-foreground">{f.valor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {f.status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="planos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={isModern ? "space-y-8" : "space-y-12"}>
            
            {/* Comparação */}
            <div className={`transition-all ${
              isModern 
                ? "rounded-2xl border border-border bg-muted/20 p-8" 
                : "rounded-3xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--gold)/0.02)] p-10"
            }`}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-1">
                  <h3 className={`font-display font-bold text-foreground ${isModern ? "text-xl" : "text-3xl"}`}>
                    {isModern ? "Comparar planos" : "O que muda em cada etapa"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {isModern 
                      ? "Leitura funcional de recursos e capacidade." 
                      : "Acompanhe como cada plano sustenta um momento diferente da casa."}
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto hide-scrollbar">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="flex items-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Eixos de análise</p>
                    </div>
                    {PLANOS.map((p) => (
                      <div key={p.id} className="text-center">
                        <p className={`text-sm font-bold ${!isModern && p.id === "profissional" ? "text-[hsl(var(--gold))]" : "text-foreground"}`}>
                          {p.nome}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                          {isModern ? "Escopo" : p.papel_vintage}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: isModern ? "Agendamentos" : "Agendamentos", values: ["50 /mês", "Ilimitado", "Ilimitado"] },
                      { label: isModern ? "Equipe" : "Equipe", values: ["1 profissional", "Até 5", "Ilimitada"] },
                      { label: isModern ? "Gestão" : "Gestão", values: ["Básica", "Completa", "Escala"] },
                      { label: isModern ? "Recursos" : "Operação", values: ["Essencial", "Profissional", "Empresarial"] },
                      { label: isModern ? "Escala" : "Expansão", values: ["Inicial", "Em crescimento", "Madura"] },
                    ].map((row, i) => (
                      <div key={i} className={`grid grid-cols-4 gap-4 py-3 border-b border-border/10 last:border-0`}>
                        <div className="flex items-center">
                          <span className={`text-xs font-bold ${isModern ? "text-foreground/70" : "text-[hsl(var(--gold)/0.7)]"}`}>
                            {row.label}
                          </span>
                        </div>
                        {row.values.map((val, idx) => (
                          <div key={idx} className="text-center">
                            <span className="text-xs font-semibold text-foreground/80">{val}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de Planos */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className={`font-display font-bold text-foreground ${isModern ? "text-xl" : "text-3xl"}`}>
                  {isModern ? "Planos disponíveis" : "Etapas disponíveis"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isModern ? "Selecione a estrutura ideal para sua operação." : "Clique para evoluir o nível da sua casa."}
                </p>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-3 ${isModern ? "gap-6" : "gap-8"}`}>
                {PLANOS.map((plano, index) => {
                  const ehAtual = plano.id === planoAtualId;
                  const Icon = plano.icone;
                  return (
                    <motion.div
                      key={plano.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className={`relative flex flex-col transition-all duration-300 ${
                        isModern 
                          ? "rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md" 
                          : `rounded-2xl border p-8 ${
                            ehAtual 
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.02)] shadow-xl" 
                              : "border-border/40 bg-card hover:border-[hsl(var(--gold)/0.3)] shadow-sm"
                          }`
                      }`}
                    >
                      {plano.destaques && (
                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg whitespace-nowrap ${
                          isModern ? "bg-primary text-white" : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]"
                        }`}>
                          Recomendado
                        </div>
                      )}
                      
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`rounded-xl flex items-center justify-center border ${
                            isModern 
                              ? "w-8 h-8 bg-muted border-border/50" 
                              : `w-10 h-10 ${ehAtual ? "bg-[hsl(var(--gold)/0.1)] border-[hsl(var(--gold)/0.2)]" : "bg-muted border-border/50"}`
                          }`}>
                            <Icon className={`${isModern ? "w-4 h-4" : "w-5 h-5"} ${ehAtual && !isModern ? "text-[hsl(var(--gold))]" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex flex-col">
                            <h4 className={`${isModern ? "text-lg" : "text-xl font-display"} font-bold text-foreground`}>
                              {plano.nome}
                            </h4>
                            {!isModern && <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-[hsl(var(--gold)/0.6)]">{plano.papel_vintage}</span>}
                          </div>
                        </div>
                        
                        <p className={`font-medium text-muted-foreground mb-6 ${isModern ? "text-xs" : "text-sm italic"}`}>
                          {isModern ? plano.tagline_modern : plano.tagline_vintage}
                        </p>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className={`font-display font-bold text-foreground ${isModern ? "text-3xl" : "text-4xl"}`}>
                            {plano.preco}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">/ mês</span>
                        </div>
                      </div>

                      <ul className="space-y-4 mb-10 flex-1">
                        {(isModern ? plano.beneficios_modern : plano.beneficios_vintage).map((f) => (
                          <li key={f} className={`flex items-start gap-3 leading-snug ${isModern ? "text-xs text-foreground/70" : "text-sm text-foreground/80"}`}>
                            <div className={`shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${isModern ? "bg-primary" : "bg-[hsl(var(--gold))]"}`} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleAssinar(plano.id)}
                        className={`w-full font-bold transition-all h-12 rounded-xl ${
                          ehAtual && assinaturaAtiva
                            ? "bg-muted text-muted-foreground cursor-default"
                            : isModern 
                              ? "bg-foreground text-background hover:bg-foreground/90" 
                              : "bg-foreground text-background hover:shadow-lg"
                        }`}
                        disabled={(ehAtual && assinaturaAtiva) || upgradeLoadingPlan === plano.id}
                      >
                        {ehAtual && assinaturaAtiva ? (
                          "Plano atual"
                        ) : (
                          <>
                            {upgradeLoadingPlan === plano.id ? "Processando..." : (isModern ? "Selecionar plano" : "Desbloquear crescimento")}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Diálogos */}
        <Dialog open={dialogPagamentoOpen} onOpenChange={setDialogPagamentoOpen}>
          <DialogContent className="rounded-2xl sm:rounded-3xl">
            <DialogHeader>
              <DialogTitle>Forma de Pagamento</DialogTitle>
              <DialogDescription>
                Atualize seus dados de cobrança para manter sua operação ativa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Número do Cartão</Label>
                <Input id="card-number" placeholder="**** **** **** 4455" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Validade</Label>
                  <Input id="expiry" placeholder="MM/AA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="***" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogPagamentoOpen(false)}>Cancelar</Button>
              <Button onClick={() => { setDialogPagamentoOpen(false); toast({ title: "Dados atualizados" }); }}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
          <DialogContent className="rounded-2xl sm:rounded-3xl border-destructive/20">
            <DialogHeader>
              <DialogTitle className="text-destructive">Cancelar Assinatura?</DialogTitle>
              <DialogDescription>
                Sua barbearia voltará para os limites do plano gratuito e você perderá o acesso aos recursos profissionais.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDialogCancelarOpen(false)}>Manter Assinatura</Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  updateUser({ subscriptionStatus: "canceled" });
                  setDialogCancelarOpen(false);
                  toast({ title: "Assinatura cancelada", variant: "destructive" });
                }}
              >
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BarberSubscription;
