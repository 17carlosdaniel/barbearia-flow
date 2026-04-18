import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Eye,
  Database,
  FileText,
  CheckCircle2,
  Download,
  PencilLine,
  Trash2,
  Bell,
  LocateFixed,
  Sparkles,
  Megaphone,
  History,
  HelpCircle,
  Cookie,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

type PrivacyControls = {
  notifications: boolean;
  locationSharing: boolean;
  personalizedRecommendations: boolean;
  promoCommunications: boolean;
};

type PrivacyRequestType = "exportar" | "corrigir" | "excluir";

type PrivacyRequest = {
  id: string;
  type: PrivacyRequestType;
  date: string;
  status: "recebida";
};

const PRIVACY_CONTROLS_KEY = "barberflow_privacy_controls_v1";
const PRIVACY_REQUESTS_KEY = "barberflow_privacy_requests_v1";

const DEFAULT_CONTROLS: PrivacyControls = {
  notifications: true,
  locationSharing: false,
  personalizedRecommendations: true,
  promoCommunications: false,
};

const REQUEST_LABELS: Record<PrivacyRequestType, string> = {
  exportar: "Exportação de dados",
  corrigir: "Correção de informações",
  excluir: "Exclusão de conta",
};

const FAQS = [
  {
    id: "faq-1",
    question: "Posso excluir minha conta?",
    answer:
      "Sim. Você pode iniciar a exclusão na área de Segurança e privacidade do seu perfil. O processo é irreversível.",
  },
  {
    id: "faq-2",
    question: "Como baixar meus dados?",
    answer:
      "Na seção de Solicitações, use 'Exportar meus dados'. Registramos o pedido e mostramos no histórico da tela.",
  },
  {
    id: "faq-3",
    question: "O BarberFlow compartilha dados com terceiros?",
    answer:
      "Compartilhamos apenas quando necessário para operação do serviço e obrigações legais, seguindo boas práticas de privacidade.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.03 },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

const Privacy = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const backPath = user?.role === "barbeiro" ? "/barbeiro" : user?.role === "cliente" ? "/cliente" : "/login";
  const securityPath = user?.role === "barbeiro" ? "/barbeiro/seguranca" : "/cliente/seguranca";
  const [controls, setControls] = useState<PrivacyControls>(DEFAULT_CONTROLS);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);

  const iconBadgeClass = isModern 
    ? "w-8 h-8 rounded-xl border border-primary/10 bg-primary/5 flex items-center justify-center"
    : "w-10 h-10 rounded-xl border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.05)] flex items-center justify-center";

  const sectionClass = isModern
    ? "rounded-2xl border border-border bg-card p-5 lg:p-6 shadow-sm"
    : "rounded-2xl border border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] p-8 lg:p-10 shadow-2xl";

  const accentColor = isModern ? "text-primary" : "text-[hsl(var(--gold))]";
  const accentBorder = isModern ? "border-primary/20" : "border-[hsl(var(--gold)/0.2)]";

  useEffect(() => {
    try {
      const rawControls = localStorage.getItem(PRIVACY_CONTROLS_KEY);
      if (rawControls) {
        const parsed = JSON.parse(rawControls) as Partial<PrivacyControls>;
        setControls({
          notifications: parsed.notifications ?? DEFAULT_CONTROLS.notifications,
          locationSharing: parsed.locationSharing ?? DEFAULT_CONTROLS.locationSharing,
          personalizedRecommendations:
            parsed.personalizedRecommendations ?? DEFAULT_CONTROLS.personalizedRecommendations,
          promoCommunications: parsed.promoCommunications ?? DEFAULT_CONTROLS.promoCommunications,
        });
      }

      const rawRequests = localStorage.getItem(PRIVACY_REQUESTS_KEY);
      if (rawRequests) {
        const parsedRequests = JSON.parse(rawRequests) as PrivacyRequest[];
        if (Array.isArray(parsedRequests)) {
          setRequests(parsedRequests.slice(0, 5));
        }
      }
    } catch {
      // noop
    }
  }, []);

  const updateControl = (key: keyof PrivacyControls, value: boolean) => {
    const next = { ...controls, [key]: value };
    setControls(next);
    try {
      localStorage.setItem(PRIVACY_CONTROLS_KEY, JSON.stringify(next));
    } catch {
      // noop
    }
    toast({
      title: "Preferência atualizada",
      description: "Seu controle de privacidade foi salvo.",
    });
  };

  const addRequest = (type: PrivacyRequestType) => {
    const nextRequest: PrivacyRequest = {
      id: `${Date.now()}_${type}`,
      type,
      date: new Date().toLocaleString("pt-BR"),
      status: "recebida",
    };
    const next = [nextRequest, ...requests].slice(0, 5);
    setRequests(next);
    try {
      localStorage.setItem(PRIVACY_REQUESTS_KEY, JSON.stringify(next));
    } catch {
      // noop
    }
    toast({
      title: "Solicitação registrada",
      description: `${REQUEST_LABELS[type]} enviada com sucesso.`,
    });
  };

  return (
    <div className={`min-h-screen bg-background ${isModern ? "p-4 lg:p-6" : "p-6 lg:p-10"}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`max-w-4xl mx-auto ${isModern ? "space-y-6" : "space-y-10"}`}
      >
        <Link
          to={backPath}
          className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 -ml-2 ${isModern ? "" : "font-medium"}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        {/* 1. Cabeçalho / Contexto */}
        <motion.div
          variants={sectionVariants}
          className={`${sectionClass} relative overflow-hidden`}
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
          <div className={`flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10 ${isModern ? "items-center text-center md:text-left" : ""}`}>
            <div className={`flex ${isModern ? "flex-col md:flex-row items-center md:items-start" : "items-start"} gap-4`}>
              <div className={iconBadgeClass}>
                <ShieldCheck className={`w-5 h-5 ${accentColor}`} />
              </div>
              <div>
                <h1 className={`${isModern ? "text-2xl" : "text-3xl lg:text-4xl"} font-display font-bold text-foreground`}>
                  Privacidade
                </h1>
                <p className={`text-muted-foreground mt-1.5 leading-relaxed ${isModern ? "text-sm max-w-md" : "text-base max-w-lg"}`}>
                  {isModern 
                    ? "Controle permissões, preferências e acesso aos seus dados em um só lugar."
                    : "Seus dados estão protegidos. Você pode revisar, atualizar e controlar preferências sempre que quiser."}
                </p>
              </div>
            </div>
            <div className={`rounded-xl border ${accentBorder} bg-muted/20 px-5 py-4 md:max-w-[280px] ${isModern ? "w-full md:w-auto" : ""}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transparência</p>
              <p className={`text-foreground mt-1.5 leading-snug ${isModern ? "text-xs" : "text-sm"}`}>
                Seguimos boas práticas de proteção de dados e foco em conformidade com a LGPD.
              </p>
              <p className="text-[10px] font-medium text-muted-foreground/60 mt-3 italic">Atualizado em Março de 2026</p>
            </div>
          </div>
        </motion.div>

        {/* 2. Resumo rápido */}
        <motion.div
          variants={sectionVariants}
          className={`${sectionClass} ${isModern ? "border-none bg-transparent shadow-none p-0" : ""}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={iconBadgeClass}>
              <History className={`w-5 h-5 ${accentColor}`} />
            </div>
            <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
              {isModern ? "Resumo rápido" : "Resumo em 1 minuto"}
            </h2>
          </div>
          <ul className={`grid grid-cols-1 md:grid-cols-2 ${isModern ? "gap-x-8 gap-y-3 bg-card border border-border rounded-2xl p-6" : "gap-x-10 gap-y-4"} text-muted-foreground`}>
            {[
              "Não vendemos seus dados pessoais.",
              isModern ? "Seus dados são usados para login, agenda e funcionamento da conta." : "Seus dados ajudam no login, na agenda e no funcionamento da conta.",
              isModern ? "Você pode excluir sua conta quando quiser." : "Você pode excluir sua conta a qualquer momento.",
              isModern ? "Você controla permissões e preferências de privacidade." : "Você decide permissões e preferências de privacidade."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${accentColor}`} />
                <span className={isModern ? "text-sm" : "text-sm font-medium"}>{text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* 3. Controles de privacidade */}
        <motion.div variants={sectionVariants} className={sectionClass}>
          <div className="flex items-center gap-3 mb-4">
            <div className={iconBadgeClass}>
              <Lock className={`w-5 h-5 ${accentColor}`} />
            </div>
            <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
              Controles de privacidade
            </h2>
          </div>
          <p className={`text-muted-foreground mb-6 ${isModern ? "text-xs" : "text-sm"}`}>
            {isModern 
              ? "Ajuste rapidamente notificações, localização e comunicações da conta."
              : "Ajuste notificações, localização e comunicações conforme o momento da sua casa."}
          </p>
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isModern ? "gap-3" : "gap-4"}`}>
            {[
              { id: "notifications", label: "Permitir notificações", desc: "Avisos de agendamento e segurança", icon: Bell },
              { id: "locationSharing", label: "Compartilhar localização", desc: "Melhora sugestões próximas", icon: LocateFixed },
              { id: "personalizedRecommendations", label: "Recomendações", desc: "Serviços e ofertas relevantes", icon: Sparkles },
              { id: "promoCommunications", label: "Comunicações promocionais", desc: "Novidades e campanhas", icon: Megaphone }
            ].map((item) => (
              <div key={item.id} className={`rounded-xl border border-border/40 bg-muted/10 p-4 flex items-center justify-between gap-4 transition-all hover:bg-muted/20 ${isModern ? "p-3" : "shadow-sm"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50`}>
                    <item.icon className={`w-4 h-4 ${accentColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-foreground truncate ${isModern ? "text-[13px]" : "text-sm"}`}>{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
                <Switch 
                  checked={controls[item.id as keyof PrivacyControls]} 
                  onCheckedChange={(v) => updateControl(item.id as keyof PrivacyControls, v)} 
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4. Dados e direitos */}
        <motion.div
          variants={sectionVariants}
          className={`${sectionClass} ${isModern ? "border-none bg-transparent shadow-none p-0" : ""}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={iconBadgeClass}>
              <Database className={`w-5 h-5 ${accentColor}`} />
            </div>
            <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
              {isModern ? "Dados e direitos" : "Seus dados e seus direitos"}
            </h2>
          </div>
          <p className={`text-muted-foreground mb-6 ${isModern ? "text-xs" : "text-sm"}`}>
            {isModern 
              ? "Consulte dados coletados, finalidade de uso, retenção e seus direitos."
              : "Veja com clareza quais dados guardamos, por que eles existem e quais direitos você pode exercer."}
          </p>
          
          <div className={isModern ? "bg-card border border-border rounded-2xl p-4 lg:p-6" : ""}>
            <Accordion type="multiple" className="w-full space-y-2">
              {[
                {
                  id: "dados-coletados",
                  label: "Dados coletados",
                  icon: Database,
                  items: ["Nome e contato", "Histórico de agendamentos", "Preferências de uso", "Dados de autenticação"],
                  actionLabel: "Ver meus dados",
                  action: () => addRequest("exportar")
                },
                {
                  id: "finalidade-uso",
                  label: "Finalidade de uso",
                  icon: Eye,
                  items: ["Autenticação segura", "Funcionamento dos agendamentos", "Notificações relevantes", "Personalização da experiência"],
                  actionLabel: "Entender como usamos",
                  link: "/suporte"
                },
                {
                  id: "protecao-retencao",
                  label: "Proteção e retenção",
                  icon: Lock,
                  items: ["Criptografia e proteção de sessão", "Controles de acesso por perfil", "Retenção pelo tempo necessário", "Base legal e obrigações"],
                  actionLabel: "Ver medidas de segurança",
                  link: "/suporte"
                },
                {
                  id: "seus-direitos",
                  label: "Seus direitos",
                  icon: FileText,
                  items: ["Corrigir e atualizar dados", "Solicitar exportação", "Revogar permissões", "Excluir conta permanentemente"],
                  actionLabel: "Gerenciar meus dados",
                  link: securityPath
                }
              ].map((section) => (
                <AccordionItem key={section.id} value={section.id} className="border-none">
                  <AccordionTrigger className={`flex gap-4 p-4 rounded-xl transition-all border border-border/40 hover:no-underline [&[data-state=open]]:border-primary/20 ${isModern ? "bg-muted/5 hover:bg-muted/10 [&[data-state=open]]:bg-muted/10" : "bg-muted/10 hover:bg-muted/20 [&[data-state=open]]:bg-muted/25"}`}>
                    <span className="flex items-center gap-3 text-left">
                      <section.icon className={`w-4.5 h-4.5 ${accentColor}`} />
                      <span className={`font-semibold text-foreground ${isModern ? "text-sm" : "text-base"}`}>{section.label}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-6 px-4">
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isModern ? "pl-0" : "pl-8"}`}>
                      <ul className="space-y-2">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${accentColor} opacity-40`} />
                            <span className="text-xs font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-end justify-end">
                        {section.link ? (
                          <Link to={section.link}>
                            <Button variant="outline" size="sm" className={`h-9 rounded-lg text-xs font-bold px-4 ${isModern ? "bg-background shadow-none" : ""}`}>
                              {section.actionLabel}
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" onClick={section.action} className={`h-9 rounded-lg text-xs font-bold px-4 ${isModern ? "bg-background shadow-none" : ""}`}>
                            {section.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>

        <motion.div variants={sectionVariants} className={`${sectionClass} ${isModern ? "border-none bg-transparent shadow-none p-0" : "space-y-4"}`}>
          <div className={isModern ? "bg-card border border-border rounded-2xl p-6 space-y-4" : "space-y-4"}>
            <div className="flex items-center gap-3">
              <div className={iconBadgeClass}>
                <HelpCircle className={`w-5 h-5 ${accentColor}`} />
              </div>
              <h2 className={`${isModern ? "text-base" : "text-xl"} font-display font-bold text-foreground`}>
                Dúvidas frequentes
              </h2>
            </div>
            
            <p className={`text-muted-foreground ${isModern ? "text-xs" : "text-sm"}`}>
              {isModern 
                ? "Veja respostas rápidas sobre conta, exclusão de dados e compartilhamento."
                : "Encontre respostas rápidas sobre seus dados, permissões e exclusão da conta."}
            </p>

            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                  <AccordionTrigger className={`text-foreground hover:no-underline ${isModern ? "text-xs py-3" : "text-sm py-4"}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className={`text-muted-foreground ${isModern ? "text-[11px]" : "text-sm"}`}>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className={`flex flex-col md:flex-row gap-4 ${isModern ? "mt-4" : "mt-6"}`}>
            <div className={`flex-1 rounded-2xl border ${accentBorder} bg-primary/5 px-6 py-5 flex flex-col justify-between`}>
              <div>
                <p className={`font-bold text-foreground ${isModern ? "text-sm" : "text-base"}`}>Precisa de ajuda com seus dados?</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Dúvidas sobre seus dados? Fale com nosso encarregado em: <span className="text-foreground font-medium">suporte@barberflow.com</span>
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant={isModern ? "outline" : "outlineGold"} size="sm" onClick={() => addRequest("exportar")} className={isModern ? "h-8 text-[11px] bg-background" : ""}>
                  Baixar meus dados
                </Button>
                <Link to="/suporte" className="inline-block">
                  <Button variant="outline" size="sm" className={isModern ? "h-8 text-[11px] bg-background" : ""}>
                    Falar com suporte
                  </Button>
                </Link>
              </div>
            </div>

            <div className={`flex-1 rounded-2xl border border-border/60 bg-secondary/35 px-6 py-5 flex flex-col`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={iconBadgeClass}>
                  <Cookie className={`w-4 h-4 ${accentColor}`} />
                </div>
                <p className={`font-bold text-foreground ${isModern ? "text-sm" : "text-base"}`}>Cookies</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isModern 
                  ? "Usamos cookies essenciais para manter login, preferências e funcionamento da conta."
                  : "Usamos cookies essenciais para manter sua conta conectada, lembrar preferências e melhorar a experiência."}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Privacy;
