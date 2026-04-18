import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  ArrowLeft,
  Search,
  CalendarClock,
  Ban,
  CreditCard,
  Receipt,
  MessageCircle,
  Users,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

type FaqItem = {
  category: "Agendamentos" | "Pagamentos" | "Servicos" | "Conta";
  q: string;
  a: string;
};

const faqs: FaqItem[] = [
  {
    category: "Agendamentos",
    q: "Como agendar um corte?",
    a: "Acesse a busca de barbearias, escolha a barbearia e o servico. Depois confirme data e horario.",
  },
  {
    category: "Agendamentos",
    q: "Como cancelar um agendamento?",
    a: "Acesse a area de agendamentos e selecione o atendimento para cancelar ou reagendar.",
  },
  {
    category: "Pagamentos",
    q: "Quais formas de pagamento sao aceitas?",
    a: "Voce pode pagar com PIX, cartao e boleto, conforme disponibilidade do fluxo em cada tela.",
  },
  {
    category: "Pagamentos",
    q: "Como vejo meus pagamentos e cobrancas?",
    a: "Use o atalho de pagamentos para abrir sua area financeira ou historico de pedidos.",
  },
  {
    category: "Servicos",
    q: "Nao aparece horario disponivel. O que fazer?",
    a: "Tente outro profissional, altere a data/periodo e confira se a barbearia possui slots ativos.",
  },
  {
    category: "Conta",
    q: "Como alterar meus dados de conta?",
    a: "Acesse seu perfil para atualizar telefone, e-mail e demais informacoes da conta.",
  },
];

const Support = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [problemType, setProblemType] = useState("agendamento");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const backPath = user?.role === "barbeiro" ? "/barbeiro" : user?.role === "cliente" ? "/cliente" : "/";
  const whatsappLink = "https://wa.me/5511300000000?text=Ola%2C%20preciso%20de%20suporte%20no%20BarberFlow.";

  const iconBadgeClass = isModern 
    ? "w-8 h-8 rounded-xl border border-primary/10 bg-primary/5 flex items-center justify-center"
    : "w-10 h-10 rounded-full border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.05)] flex items-center justify-center";

  const sectionClass = isModern
    ? "rounded-2xl border border-border bg-card p-5 lg:p-6 shadow-sm"
    : "rounded-[2rem] border border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] p-8 lg:p-10 shadow-2xl";

  const accentColor = isModern ? "text-primary" : "text-[hsl(var(--gold))]";
  const accentBorder = isModern ? "border-primary/20" : "border-[hsl(var(--gold)/0.2)]";

  const quickActions = useMemo(() => {
    if (user?.role === "barbeiro") {
      return [
        { label: "Agendar corte", icon: CalendarClock, path: "/barbeiro/servicos" },
        { label: "Cancelar agendamento", icon: Ban, path: "/barbeiro/historico" },
        { label: "Ver pagamentos", icon: CreditCard, path: "/barbeiro/financeiro" },
        { label: "Ver pedidos", icon: Receipt, path: "/barbeiro/loja/pedidos" },
      ];
    }
    if (user?.role === "cliente") {
      return [
        { label: "Agendar corte", icon: CalendarClock, path: "/cliente/novo-agendamento" },
        { label: "Cancelar agendamento", icon: Ban, path: "/cliente/agendamentos" },
        { label: "Ver pagamentos", icon: CreditCard, path: "/cliente/historico" },
        { label: "Ver pedidos", icon: Receipt, path: "/cliente/loja" },
      ];
    }
    return [
      { label: "Agendar corte", icon: CalendarClock, path: "/login" },
      { label: "Cancelar agendamento", icon: Ban, path: "/login" },
      { label: "Ver pagamentos", icon: CreditCard, path: "/login" },
      { label: "Ver pedidos", icon: Receipt, path: "/login" },
    ];
  }, [user?.role]);

  const filteredFaqs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return faqs;
    return faqs.filter((faq) =>
      `${faq.category} ${faq.q} ${faq.a}`.toLowerCase().includes(normalized),
    );
  }, [search]);

  const groupedFaqs = useMemo(() => {
    const categories: FaqItem["category"][] = ["Agendamentos", "Pagamentos", "Servicos", "Conta"];
    return categories
      .map((category) => ({
        category,
        items: filteredFaqs.filter((faq) => faq.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredFaqs]);

  const commonIssues = [
    "Nao consigo pagar",
    "Nao aparece horario",
    "Erro no app",
  ];

  const problemTypeLabel = {
    agendamento: "Problema com agendamento",
    pagamento: "Problema com pagamento",
    conta: "Problema com conta",
    outro: "Outro",
  } as const;

  const handleProblemTypeChange = (value: keyof typeof problemTypeLabel) => {
    setProblemType(value);
    if (!assunto.trim()) {
      setAssunto(problemTypeLabel[value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto.trim() || !mensagem.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha assunto e mensagem.", variant: "destructive" });
      return;
    }
    // Simulação: em produção enviaria para API / abriria ticket
    toast({
      title: "Solicitacao enviada",
      description: "Seu ticket foi registrado. Normalmente respondemos em minutos e no maximo em 24h.",
    });
    setProblemType("agendamento");
    setAssunto("");
    setMensagem("");
  };

  return (
    <div className={`min-h-screen bg-background ${isModern ? "p-4 lg:p-6" : "p-6 lg:p-10"}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`max-w-3xl mx-auto ${isModern ? "space-y-6" : "space-y-10"}`}
      >
        <div className="flex items-center gap-4">
          <Link
            to={backPath}
            className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 -ml-2 ${isModern ? "" : "font-medium"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>

        {/* 1. Hero / Cabeçalho */}
        <motion.div
          className={`${sectionClass} relative overflow-hidden text-center`}
        >
          {!isModern && (
            <motion.div
              className="pointer-events-none absolute -top-24 -right-20 w-52 h-52 rounded-full"
              style={{
                background: "radial-gradient(circle, hsl(var(--gold) / 0.1), transparent 70%)",
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="relative z-10 flex flex-col items-center">
            <div className={`${iconBadgeClass} mb-4`}>
              <HelpCircle className={`w-6 h-6 ${accentColor}`} />
            </div>
            <h1 className={`${isModern ? "text-2xl lg:text-3xl" : "text-3xl lg:text-4xl"} font-display font-bold text-foreground`}>
              {isModern ? "Resolva rápido o que está travando sua rotina" : "Precisa de ajuda? A casa resolve"}
            </h1>
            <p className={`text-muted-foreground mt-2 leading-relaxed ${isModern ? "text-sm max-w-md" : "text-base max-w-lg"}`}>
              {isModern 
                ? "Busque respostas, use atalhos e acione o suporte quando necessário."
                : "Encontre respostas rápidas ou fale com a gente sem burocracia quando algo travar a rotina."}
            </p>
            <div className={`mt-4 rounded-full border ${accentBorder} bg-muted/20 px-4 py-1.5 inline-flex items-center gap-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isModern ? "bg-emerald-500" : "bg-[hsl(var(--gold))]"} animate-pulse`} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Time online • Resposta em minutos
              </p>
            </div>
          </div>
        </motion.div>

        {/* 2. Busca e Ações Rápidas */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isModern ? "" : "items-stretch"}`}>
          <div className={`${sectionClass} lg:col-span-5 space-y-4 flex flex-col justify-center`}>
            <div className="flex items-center gap-3">
              <div className={iconBadgeClass}>
                <Search className={`w-4 h-4 ${accentColor}`} />
              </div>
              <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
                Buscar ajuda
              </h2>
            </div>
            <p className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm"}`}>
              {isModern 
                ? "Encontre respostas por tema, problema ou área do sistema."
                : "Procure respostas por assunto, rotina ou problema."}
            </p>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isModern ? "Buscar no sistema..." : "Como podemos ajudar?"}
                className={`pl-9 bg-muted/20 border-border/60 focus:border-primary/40 ${isModern ? "h-10 text-sm" : "h-12 text-base rounded-xl"}`}
              />
            </div>
          </div>

          <div className={`${sectionClass} lg:col-span-7 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className={iconBadgeClass}>
                <CalendarClock className={`w-4 h-4 ${accentColor}`} />
              </div>
              <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
                {isModern ? "Ações rápidas" : "Atalhos da casa"}
              </h2>
            </div>
            <p className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm"}`}>
              {isModern 
                ? "Acesse rapidamente os fluxos mais usados do suporte."
                : "Acesse caminhos rápidos para resolver o que mais aparece no dia a dia."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    type="button"
                    variant="outline"
                    className={`justify-start border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all ${isModern ? "h-10 text-xs rounded-lg" : "h-12 text-sm rounded-xl font-medium"}`}
                    onClick={() => navigate(action.path)}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${accentColor}`} />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Problemas Comuns e FAQ */}
        <div className={isModern ? "space-y-6" : "space-y-8"}>
          <div className={sectionClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className={iconBadgeClass}>
                <MessageSquare className={`w-4 h-4 ${accentColor}`} />
              </div>
              <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
                {isModern ? "Problemas comuns" : "Problemas mais resolvidos"}
              </h2>
            </div>
            <p className={`text-muted-foreground mb-4 ${isModern ? "text-xs" : "text-sm"}`}>
              {isModern 
                ? "Veja os temas mais recorrentes e resolva sem abrir atendimento."
                : "Veja os temas que mais costumam travar agenda, pagamentos e atendimento."}
            </p>
            <div className="flex flex-wrap gap-2">
              {commonIssues.map((issue) => (
                <button
                  key={issue}
                  type="button"
                  className={`rounded-full border border-border/60 px-3 py-1.5 transition-all hover:text-foreground hover:border-primary/40 ${isModern ? "text-[10px] bg-muted/10" : "text-xs font-medium"}`}
                  onClick={() => setSearch(issue)}
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          <div className={isModern ? "space-y-4" : "space-y-6"}>
            <div className={`flex items-center gap-3 ${isModern ? "px-2" : ""}`}>
              <div className={iconBadgeClass}>
                <HelpCircle className={`w-4 h-4 ${accentColor}`} />
              </div>
              <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
                Perguntas frequentes
              </h2>
            </div>
            
            <p className={`text-muted-foreground ${isModern ? "text-xs px-2" : "text-sm"}`}>
              {isModern 
                ? "Consulte respostas rápidas sobre agenda, pagamentos, serviços e conta."
                : "Encontre respostas claras para dúvidas comuns da operação."}
            </p>

            <div className="space-y-4">
              {groupedFaqs.length === 0 ? (
                <div className={`${sectionClass} text-sm text-muted-foreground italic`}>
                  Nenhum resultado para sua busca. Tente outro termo ou abra um ticket abaixo.
                </div>
              ) : (
                groupedFaqs.map((group) => (
                  <div key={group.category} className="space-y-2">
                    <p className={`font-bold uppercase tracking-wider ${isModern ? "text-[10px] text-muted-foreground px-2" : "text-xs text-primary"}`}>
                      {group.category}
                    </p>
                    <Accordion type="single" collapsible className="space-y-2">
                      {group.items.map((faq, i) => (
                        <AccordionItem 
                          key={`${group.category}-${i}`} 
                          value={`${group.category}-${i}`} 
                          className={`border-none px-5 transition-all ${isModern ? "rounded-xl bg-card border border-border/40" : "rounded-2xl bg-muted/10 border border-[hsl(var(--gold)/0.1)]"}`}
                        >
                          <AccordionTrigger className={`text-foreground hover:no-underline ${isModern ? "text-xs py-3" : "text-sm py-4 font-medium"}`}>
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className={`text-muted-foreground leading-relaxed ${isModern ? "text-[11px]" : "text-sm"}`}>
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. Contato e Formulário */}
        <div className={sectionClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className={iconBadgeClass}>
              <Users className={`w-4 h-4 ${accentColor}`} />
            </div>
            <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
              {isModern ? "Contato" : "Canais de atendimento"}
            </h2>
          </div>
          
          <p className={`text-muted-foreground mb-6 ${isModern ? "text-xs" : "text-sm"}`}>
            {isModern 
              ? "Escolha o canal mais rápido para o tipo de suporte que você precisa ou abra um atendimento detalhado."
              : "Escolha o melhor canal para falar com a gente ou descreva sua dúvida para um acompanhamento próximo."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all ${isModern ? "text-xs" : "text-sm font-medium"}`}>
              <div className={iconBadgeClass}>
                <MessageCircle className={`w-4 h-4 ${accentColor}`} />
              </div>
              <span>WhatsApp</span>
            </a>
            <a href="mailto:suporte@barbeflow.com.br" className={`flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all ${isModern ? "text-xs" : "text-sm font-medium"}`}>
              <div className={iconBadgeClass}>
                <Mail className={`w-4 h-4 ${accentColor}`} />
              </div>
              <span>E-mail</span>
            </a>
            <a href="tel:+551130000000" className={`flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all ${isModern ? "text-xs" : "text-sm font-medium"}`}>
              <div className={iconBadgeClass}>
                <Phone className={`w-4 h-4 ${accentColor}`} />
              </div>
              <span>Telefone</span>
            </a>
          </div>

          <div className={`rounded-2xl ${isModern ? "bg-muted/10 border border-border/40 p-5 lg:p-6" : "bg-muted/20 border border-[hsl(var(--gold)/0.1)] p-6 lg:p-8"}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className={`${isModern ? "text-sm" : "text-lg"} font-display font-bold text-foreground mb-4`}>
                {isModern ? "Abrir atendimento" : "Fale com o suporte"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={`text-foreground/80 ${isModern ? "text-[10px] uppercase tracking-wider font-bold" : "text-sm"}`}>Tipo de problema</Label>
                  <select
                    value={problemType}
                    onChange={(e) => handleProblemTypeChange(e.target.value as keyof typeof problemTypeLabel)}
                    className={`w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:ring-1 focus:ring-primary/40 transition-all ${isModern ? "h-9" : "h-11"}`}
                  >
                    <option value="agendamento">Problema com agendamento</option>
                    <option value="pagamento">Pagamento</option>
                    <option value="conta">Conta</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className={`text-foreground/80 ${isModern ? "text-[10px] uppercase tracking-wider font-bold" : "text-sm"}`}>Assunto</Label>
                  <Input
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Resumo do problema"
                    className={`bg-background border-border focus:border-primary/40 transition-all ${isModern ? "h-9 text-xs" : "h-11 text-sm"}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={`text-foreground/80 ${isModern ? "text-[10px] uppercase tracking-wider font-bold" : "text-sm"}`}>Mensagem</Label>
                <Textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder={isModern ? "Descreva o problema..." : "Conte o que aconteceu para receber acompanhamento..."}
                  className={`bg-background border-border focus:border-primary/40 transition-all min-h-[120px] ${isModern ? "text-xs" : "text-sm"}`}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[10px] text-muted-foreground max-w-[200px]">
                  {isModern 
                    ? "Normalmente respondemos em minutos. Prazo máximo: 24h."
                    : "Cuidamos do seu caso com atenção. Prazo máximo de resposta: 24h."}
                </p>
                <Button type="submit" className={`w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all ${isModern ? "h-9 text-xs px-6 rounded-lg" : "h-12 text-sm px-8 rounded-xl font-bold"}`}>
                  <Send className="w-4 h-4 mr-2" />
                  {isModern ? "Enviar solicitação" : "Abrir chamado agora"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Support;
