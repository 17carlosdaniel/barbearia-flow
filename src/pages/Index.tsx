import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Scissors,
  Calendar,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Menu,
  X,
  LogIn,
  Sparkles,
  CalendarCheck,
  Wallet,
  Award,
  LayoutGrid,
  CheckCircle2,
  MessageCircle,
  Bell,
  BellRing,
  TrendingUp,
  UserPlus,
  LayoutPanelTop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParallaxContainer } from "@/hooks/useMouseParallax";
import { useTheme } from "@/contexts/ThemeContext";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import FirstVisitPopup from "@/components/FirstVisitPopup";
import { getLandingHeroCopy } from "@/content/landingByIdentity";
import SystemPreview from "@/components/landing/SystemPreview";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const fadeUpModern = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.18, ease: "easeOut" as const },
  }),
};

/** Alinhado ao scroll-padding-top da landing (~5rem) */
const LANDING_HEADER_OFFSET_PX = 80;

/**
 * Rolagem suave repetível: scrollIntoView costuma “morrer” no 2º clique se já estiver na seção
 * ou com rolagem anterior em andamento. Usamos coordenadas explícitas no window.
 */
const scrollToSection = (id: string, onDone?: () => void) => {
  const el = document.getElementById(id);
  if (!el) {
    onDone?.();
    return;
  }
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rect = el.getBoundingClientRect();
  const targetY = Math.max(0, rect.top + window.scrollY - LANDING_HEADER_OFFSET_PX);
  const currentY = window.scrollY;
  const delta = Math.abs(currentY - targetY);

  const runScroll = (behavior: ScrollBehavior) => {
    window.scrollTo({ top: targetY, left: 0, behavior });
    onDone?.();
  };

  if (reduceMotion) {
    runScroll("auto");
    return;
  }

  // Já colado na seção: micro-ajuste para o browser animar de novo (feedback visual)
  if (delta < 4) {
    window.scrollTo({ top: Math.max(0, targetY - 6), left: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => runScroll("smooth"));
    });
    return;
  }

  runScroll("smooth");
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { identity, setIdentity } = useTheme();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      // Esconde ao descer, mostra ao subir. Ignora os primeiros 60px.
      if (current > lastScrollY.current && current > 60) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchor =
    (id: string) =>
    (e: ReactMouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      scrollToSection(id, () => setOpen(false));
    };
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 glass-dark transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-gradient-gold">BarberFlow</span>
        </Link>
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-widest"
              onClick={handleAnchor("features")}
            >
              Recursos
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-widest"
              onClick={handleAnchor("how-it-works")}
            >
              Como Funciona
            </a>
            <Link
              to="/planos"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-200 uppercase tracking-widest"
            >
              Planos
            </Link>
          </div>
          
          <div className="h-4 w-px bg-border/40" />
          
          <div
            className="flex items-center gap-1 rounded-full bg-secondary/80 p-1 border border-border/40"
            role="group"
            aria-label="Identidade visual"
          >
            <button
              type="button"
              onClick={() => setIdentity("vintage")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${
                identity === "vintage"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Vintage
            </button>
            <button
              type="button"
              onClick={() => setIdentity("modern")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${
                identity === "modern"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              Moderno
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button variant="gold" size="sm" className="text-xs font-bold uppercase tracking-widest px-4 rounded-full">Cadastrar</Button>
            </Link>
          </div>
        </div>
        <div className="flex lg:hidden items-center gap-2">
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <>
          {/* Overlay escuro atrás */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[199] bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Painel — metade direita da tela */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 z-[200] flex flex-col md:hidden w-1/2 min-w-[220px] overflow-y-auto h-screen"
            style={{ backgroundColor: identity === "vintage" ? "#080800" : "#3C83f6" }}
          >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-10 pb-4">
            <span className="text-xl font-bold text-white">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full border-2 border-white/80 flex items-center justify-center text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col px-6 mt-2 gap-1">
            {[
              { label: "Recursos", action: () => { handleAnchor("features")(new MouseEvent("click") as unknown as React.MouseEvent<HTMLAnchorElement>); setOpen(false); } },
              { label: "Como Funciona", action: () => { handleAnchor("how-it-works")(new MouseEvent("click") as unknown as React.MouseEvent<HTMLAnchorElement>); setOpen(false); } },
              { label: "Planos", action: () => { setOpen(false); window.location.href = "/planos"; } },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="text-left text-lg font-bold text-white py-4 border-b border-white/20 active:opacity-70"
              >
                {item.label}
              </button>
            ))}

            {/* Tema */}
            <div className="flex gap-2 py-4 border-b border-white/20">
              <button
                type="button"
                onClick={() => { setIdentity("vintage"); setOpen(false); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  identity === "vintage" ? "bg-white text-primary" : "bg-white/20 text-white"
                }`}
              >
                Vintage
              </button>
              <button
                type="button"
                onClick={() => { setIdentity("modern"); setOpen(false); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  identity === "modern" ? "bg-white text-primary" : "bg-white/20 text-white"
                }`}
              >
                Moderno
              </button>
            </div>

            {/* Login */}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 text-base font-bold text-white py-3 px-4 mt-2 rounded-xl border border-white/30 bg-white/10 active:opacity-70"
            >
              <LogIn className="w-5 h-5" />
              Entrar / Login
            </Link>
          </div>
        </motion.div>
        </>
      )}
    </nav>
  );
};

const HERO_IMAGE_VINTAGE = "/hero-barbeshop.jpg";

/** Intensidade do movimento da imagem com o mouse (em %). */
const HERO_PARALLAX = 25;
/** Suavidade do acompanhamento: 0 = instantâneo, 0.08 = suave com pequeno “gap” atrás do mouse. */
const HERO_PARALLAX_SMOOTH = 0.08;

const HeroSection = () => {
  const { identity } = useTheme();
  const heroCopy = getLandingHeroCopy(identity);
  const heroFade = identity === "modern" ? fadeUpModern : fadeUp;
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef<number>(0);
  
  useEffect(() => {
    if (identity !== "vintage") {
      if (bgRef.current) bgRef.current.style.backgroundPosition = "50% 50%";
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const handleMove = (e: globalThis.MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * HERO_PARALLAX;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * HERO_PARALLAX;
      targetRef.current = { x: 50 + x, y: 50 + y };
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animate = () => {
      const smooth = HERO_PARALLAX_SMOOTH;
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, smooth);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, smooth);
      
      if (bgRef.current) {
        bgRef.current.style.backgroundPosition = `${currentRef.current.x}% ${currentRef.current.y}%`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [identity]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      <div className="absolute inset-0">
        {identity === "vintage" ? (
          <>
            <div
              ref={bgRef}
              className="absolute inset-0 bg-cover bg-no-repeat hero-bg hero-bg-vintage"
              style={{
                backgroundImage: `url(${HERO_IMAGE_VINTAGE})`,
                backgroundPosition: "50% 50%",
                willChange: "background-position",
              }}
            />
            <div className="absolute inset-0 bg-black/60" />
            <ParallaxContainer intensity={15} className="w-full h-full">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-accent/15 scale-110" />
            </ParallaxContainer>
            <div className="absolute inset-0 hero-glow" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-transparent to-primary/[0.06]" />
            <motion.div
              className="absolute -top-40 right-[-10%] h-[min(100vw,520px)] w-[min(100vw,520px)]
                rounded-full bg-primary/25 blur-[100px]"
              animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.div
              className="absolute bottom-[-20%] left-[-5%] h-[min(90vw,420px)] w-[min(90vw,420px)]
                rounded-full bg-primary/15 blur-[90px]"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent
              to-background opacity-90" />
            <div className="absolute inset-0 border-b border-border/40" aria-hidden />
          </>
        )}
      </div>
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          <motion.div initial="hidden" animate="visible" className={`max-w-5xl mx-auto ${identity === 'vintage' ? 'lg:text-left lg:mx-0' : 'text-center'}`}>
            <div className={`flex flex-col ${identity === 'vintage' ? 'lg:items-start items-center' : 'items-center'}`}>
              <motion.p
                variants={heroFade}
                custom={0}
                className="text-primary font-bold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-6 flex items-center gap-3"
              >
                <span className="w-8 h-[1px] bg-primary/40" />
                {heroCopy.eyebrow}
                <span className="w-8 h-[1px] bg-primary/40" />
              </motion.p>
              
              <motion.h1
                variants={heroFade}
                custom={1}
                className={`font-display text-3xl sm:text-6xl lg:text-[73px] font-bold leading-[1.1] mb-8 tracking-tight ${
                  identity === "vintage" ? "lg:text-[73px] text-white" : "text-foreground"
                }`}
              >
                {heroCopy.titleLead}
                <br className="hidden lg:block" />
                <span className="text-gradient-gold">{heroCopy.titleAccent}</span>
              </motion.h1>
              
              <motion.p
                variants={heroFade}
                custom={2}
                className={`text-muted-foreground text-sm sm:text-lg lg:text-xl mb-12 leading-relaxed ${
                  identity === "vintage" ? "max-w-2xl lg:mx-0 mx-auto" : "max-w-2xl mx-auto"
                }`}
              >
                {heroCopy.subtitle}
              </motion.p>
              
              <motion.div 
                variants={heroFade} 
                custom={3} 
                className={`flex flex-col sm:flex-row gap-5 ${identity === 'vintage' ? 'lg:justify-start justify-center' : 'justify-center'} w-full sm:w-auto mb-10`}
              >
                <Link to="/cadastro" className="w-full sm:w-auto">
                  <Button
                    variant="gold"
                    size="xl"
                    className="w-full sm:w-[220px] rounded-full px-8 shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 font-bold tracking-wide"
                  >
                    {heroCopy.ctaPrimary}
                  </Button>
                </Link>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("how-it-works");
                  }}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="gold-outline"
                    size="xl"
                    className="w-full sm:w-[220px] rounded-full px-8 transition-all duration-300 hover:bg-primary/5 hover:scale-[1.03] active:scale-[0.97] font-medium"
                  >
                    {heroCopy.ctaSecondary}
                  </Button>
                </a>
              </motion.div>
              
              <motion.div
                variants={heroFade}
                custom={4}
                className={`flex flex-wrap ${identity === 'vintage' ? 'lg:justify-start justify-center' : 'justify-center'} gap-3 sm:gap-4 text-xs sm:text-sm font-semibold`}
              >
                {heroCopy.chips.map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 text-foreground/90 backdrop-blur-sm shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary/80" />
                    {item}
                  </span>
                ))}
              </motion.div>
              
              <p className={`mt-10 text-sm sm:text-base text-muted-foreground ${identity === 'vintage' ? 'lg:text-left text-center' : 'text-center'} opacity-80`}>
                Acessar área:{" "}
                <Link to="/login" state={{ from: "/cliente" }} className="text-primary hover:text-primary/80 hover:underline font-extrabold transition-colors">
                  Cliente
                </Link>
                {" · "}
                <Link to="/login" state={{ from: "/barbeiro" }} className="text-primary hover:text-primary/80 hover:underline font-extrabold transition-colors">
                  Barbeiro
                </Link>
              </p>
            </div>

            <SystemPreview />
          </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const { identity } = useTheme();
  
  if (identity === "modern") {
    return (
      <section id="features" className="py-32 bg-background border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-16">
            <p className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-4">Capacidades</p>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground">
              Tudo que sua barbearia precisa para <br/>
              <span className="text-gradient-gold">operar melhor e crescer.</span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-8 group relative rounded-3xl bg-card border border-border/40 overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="p-8 lg:p-12 relative flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Operação Diária</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter text-foreground">Agenda sem conflito</h3>
                <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-10">
                  Minimize falhas humanas e otimize o fluxo de cadeiras. Confirmações automáticas e sincronização em tempo real entre toda a equipe.
                </p>
                <div className="mt-auto grid sm:grid-cols-3 gap-6 pt-8 border-t border-border/40">
                  <div>
                    <p className="font-bold text-foreground mb-1">Feedback Automático</p>
                    <p className="text-xs text-muted-foreground">Lembretes por WhatsApp reduzem o no-show em até 40%.</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-1">Múltiplas Cadeiras</p>
                    <p className="text-xs text-muted-foreground">Gerencie barbeiros e turnos sem sobreposição de horários.</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-1">Check-in Express</p>
                    <p className="text-xs text-muted-foreground">Agilidade total desde a chegada do cliente até o balcão.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 rounded-3xl bg-[#0a0a0a] border border-border/40 p-8 flex flex-col shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-8">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Caixa visível no dia</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-10">
                Saiba exatamente quanto entrou no dia, na semana e no mês. Fechamento de balcão sem dor de cabeça.
              </p>
              <div className="mt-auto space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Saldo Atual</p>
                  <p className="text-2xl font-mono font-bold text-emerald-500 tracking-tight">R$ 1.840,00</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Serviços Hoje</p>
                  <p className="text-2xl font-mono font-bold text-white tracking-tight">24 Atendimentos</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-12 rounded-3xl bg-secondary p-8 lg:p-12 border border-border/60 shadow-xl overflow-hidden relative group"
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-8">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 italic tracking-tight uppercase text-foreground">Mais retorno, menos horário vazio</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Ferramentas de retenção que mantêm sua base fiel e ativa. Identifique clientes inativos e preencha vagas de última hora com promoções cirúrgicas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Retenção de Clientes",
                    "CRM Integrado",
                    "Mapa de Calor de Horários",
                    "Gift Cards & Planos",
                    "Campanhas Ativas",
                    "SEO para Barbearias",
                  ].map((tag) => (
                    <span key={tag} className="px-5 py-3 rounded-full bg-background border border-border/60 text-sm font-bold tracking-tight group-hover:border-primary/40 transition-colors text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors" />
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="py-40 bg-[#0c0c0c] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl sm:text-7xl font-display italic text-white mb-10 leading-tight">
              O essencial para conduzir sua casa com <span className="text-gradient-gold">mais ritmo e constância.</span>
            </h2>
            <div className="h-px w-24 bg-primary/20 mx-auto" />
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              {[
                { 
                  title: "Confirmações sem atrito", 
                  desc: "Mantenha o balcão ocupado sem o ruído do telefone. Um fluxo silencioso e preciso de agendamentos." 
                },
                { 
                  title: "Presença na sua vizinhança", 
                  desc: "Seja encontrado por quem valoriza o clássico. Posicionamento digital que respeita a identidade da sua casa." 
                },
                { 
                  title: "Um menu à sua medida", 
                  desc: "Defina serviços, valores e profissionais com a clareza que uma barbearia boutique exige." 
                },
              ].map((item, i) => (
                <div key={i} className="group cursor-default">
                  <h3 className="text-2xl font-display italic text-white mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground/60 leading-relaxed italic pr-8">{item.desc}</p>
                </div>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/5 to-transparent flex flex-col items-center justify-center p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <Scissors className="w-12 h-12 text-primary/20" />
              </div>
              <p className="text-3xl font-display text-white italic text-center leading-tight mb-8">
                "Uma interface feita para quem preza pelos bastidores organizados."
              </p>
              <div className="h-px w-16 bg-primary/20 mb-8" />
              <div className="text-[10px] font-bold text-primary tracking-[0.4em] uppercase">Gestão Boutique</div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const { identity } = useTheme();
  
  if (identity === "modern") {
    return (
      <section id="how-it-works" className="py-32 bg-surface border-y border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight tracking-tighter text-foreground">Comece em menos de <span className="text-gradient-gold">5 minutos.</span></h2>
              <p className="text-muted-foreground text-base sm:text-lg">Sem burocracia, sem instalação. Sua barbearia online hoje.</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-px bg-border/60 hidden lg:block -translate-y-1/2 scale-x-[0.9] origin-center" />
            
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
              {[
                { 
                  step: "01", 
                  title: "Crie sua base", 
                  desc: "Cadastro rápido para barbeiro ou dono de barbearia.",
                  icon: UserPlus 
                },
                { 
                  step: "02", 
                  title: "Organize sua rotina", 
                  desc: "Defina seus barbeiros, serviços e grade de horários.",
                  icon: LayoutPanelTop 
                },
                { 
                  step: "03", 
                  title: "Agenda rodando", 
                  desc: "Comece a receber agendamentos e organizar seu caixa.",
                  icon: CheckCircle2 
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative flex flex-col items-center text-center group"
                  >
                    <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mb-8 relative z-10 group-hover:border-primary/40 transition-colors shadow-xl">
                      <span className="text-primary font-bold text-lg">{item.step}</span>
                    </div>
                    <div className="p-8 rounded-3xl bg-card border border-border/40 shadow-sm group-hover:shadow-xl transition-shadow w-full">
                      <Icon className="w-8 h-8 text-primary/40 mx-auto mb-6" />
                      <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <Link to="/cadastro">
              <Button variant="gold" size="lg" className="rounded-full px-10 h-14 font-bold uppercase tracking-widest text-xs">Começar conta agora</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="how-it-works" className="py-40 bg-[#080808] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mb-32"
          >
            <h2 className="text-5xl sm:text-7xl font-display italic text-white mb-10 leading-tight">
              Deixe a rotina seguir <span className="text-gradient-gold">com fluidez.</span>
            </h2>
            <div className="flex items-center justify-center gap-6">
              <div className="h-px w-12 bg-primary/20" />
              <span className="text-[10px] font-bold text-primary tracking-[0.4em] uppercase">Passo a Passo</span>
              <div className="h-px w-12 bg-primary/20" />
            </div>
          </motion.div>
          
          <div className="space-y-32">
            {[
              { 
                title: "Abra sua casa no sistema", 
                desc: "Um registro simples para começar a organizar sua experiência digital." 
              },
              { 
                title: "Ajuste seus serviços e horários", 
                desc: "Modele sua agenda de acordo com o ritmo da sua barbearia." 
              },
              { 
                title: "Dê vida ao seu balcão", 
                desc: "Sua agenda começa a se organizar sozinha, valorizando seu tempo." 
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group"
              >
                <div className="text-4xl font-display italic text-primary/20 mb-6 select-none group-hover:text-primary transition-colors">
                  Argumento 0{i+1}
                </div>
                <h3 className="text-3xl font-display italic text-white mb-4">{item.title}</h3>
                <p className="text-muted-foreground/60 max-w-lg italic text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-40 text-center">
            <Link to="/cadastro" className="group">
              <span className="text-xl font-display italic text-primary group-hover:text-white transition-colors border-b border-primary/20 pb-2">Iniciar a Experiência</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialProofSection = () => {
  const { identity } = useTheme();
  
  if (identity === "modern") {
    return (
      <section className="py-24 bg-background relative overflow-hidden border-y border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.02]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Operação em tempo real</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight tracking-tight">
                Sua barbearia rodando com <span className="text-gradient-gold">agenda cheia</span> e caixa previsível.
              </h2>
              
              <p className="text-muted-foreground text-lg mb-10 max-w-xl leading-relaxed">
                Organize atendimentos, equipe, balcão e faturamento em um fluxo simples, visível e totalmente automatizado. Menos improviso, mais resultado.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">+120</div>
                  <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-2">Barbearias ativas</div>
                  <p className="text-xs text-muted-foreground">Digitalizando a operação e aumentando a eficiência do dia a dia.</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">18k+</div>
                  <div className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mb-2">Atendimentos</div>
                  <p className="text-xs text-muted-foreground">Realizados com sucesso através da nossa gestão automatizada.</p>
                </div>
              </div>
              
              <div className="p-1 rounded-2xl bg-gradient-to-r from-primary/30 to-transparent">
                <div className="bg-card/90 backdrop-blur-xl p-6 rounded-[calc(1rem-1px)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-muted-foreground">KPI DE PERFORMANCE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">ALTA PRECISÃO</span>
                  </div>
                  <div className="flex gap-10">
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">+30%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Ocupação Médica</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">+20%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Retenção de Clientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative lg:translate-x-12"
            >
              <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full -z-10" />
              <div className="relative w-full max-w-[380px] mx-auto aspect-[9/18.5] rounded-[3rem] p-3 bg-zinc-900 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]">
                <div className="h-full w-full rounded-[2.5rem] bg-black overflow-hidden relative flex flex-col p-4">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="h-1.5 w-16 rounded-full bg-zinc-800 mx-auto" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-primary uppercase">Hoje · 14 Mar</p>
                        <div className="flex gap-1">
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />
                          <div className="h-1 w-1 rounded-full bg-zinc-700" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white leading-tight">Painel da<br/>Barbearia</h4>
                    </div>
                    
                    {[
                      { h: "09:00", n: "Lucas A.", s: "Corte & Barba", c: "active" },
                      { h: "10:30", n: "Rafael C.", s: "Degradê", c: "waiting" },
                      { h: "11:15", n: "Bruno L.", s: "Barba", c: "waiting" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        item.c === 'active' ? 'bg-primary/10 border-primary/30' : 'bg-zinc-900/30 border-white/5'
                      }`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          item.c === 'active' ? 'bg-primary text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {item.h}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${item.c === 'active' ? 'text-white' : 'text-zinc-400'}`}>{item.n}</p>
                          <p className="text-[10px] text-zinc-500">{item.s}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 mb-2">
                      <span>STATUS DO CAIXA</span>
                      <span className="text-emerald-500">R$ 1.250,00</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 bg-[#080808] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-[11px] font-bold text-primary tracking-[0.4em] uppercase mb-8">Editorial BarberFlow</span>
              <h2 className="text-5xl sm:text-7xl font-display font-medium text-white mb-10 leading-[1.05] italic">
                Uma rotina elegante também se constrói nos bastidores.
              </h2>
              <p className="text-muted-foreground/70 text-xl font-display italic leading-relaxed mb-12">
                "Do agendamento ao fechamento do caixa, organizamos o atendimento com o ritmo, a presença e o cuidado que uma casa premium exige."
              </p>
              
              <div className="flex items-baseline gap-10">
                <div className="text-center">
                  <div className="text-5xl font-display text-gradient-gold mb-2">4,9</div>
                  <div className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Excelência</div>
                </div>
                <div className="w-px h-16 bg-white/10" />
                <div className="text-center">
                  <div className="text-5xl font-display text-gradient-gold mb-2">120+</div>
                  <div className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Assinantes</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-20 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
              <div className="aspect-[4/5] bg-[#0c0c0c] rounded-[2rem] border border-white/5 p-1 relative group">
                <div className="h-full w-full rounded-[1.9rem] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden flex flex-col items-center justify-center p-12 text-center border border-white/5">
                  <Scissors className="w-16 h-16 text-primary/30 mb-8" />
                  <p className="text-2xl font-display italic text-white/50 leading-relaxed max-w-sm mb-12">
                    "Organize a casa, valorize o atendimento e transforme a experiência do seu balcão."
                  </p>
                  <div className="h-px w-24 bg-primary/20 mb-8" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 justify-center text-[11px] font-medium text-primary tracking-[0.2em] uppercase">
                      <span>Ritmo</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span>Presença</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      <span>Cuidado</span>
                    </div>
                  </div>
                </div>
                {/* Decorative corners */}
                <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-primary/20 rounded-tl-3xl lg:block hidden" />
                <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-primary/20 rounded-br-3xl lg:block hidden" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const differentiatorItems = [
  {
    icon: Calendar,
    title: "Abra vagas rapidamente",
    description: "Preencha horários vazios com poucos cliques.",
  },
  {
    icon: MessageCircle,
    title: "Atraia clientes na hora",
    description: "Divulgue vagas e aumente a ocupação da agenda.",
  },
  {
    icon: Clock,
    title: "Visualize sua agenda em tempo real",
    description: "Saiba exatamente o que está acontecendo no seu dia.",
  },
] as const;

const DifferentiatorSection = () => {
  const { identity } = useTheme();
  
  if (identity === "modern") {
    return (
      <section className="py-32 bg-surface relative overflow-hidden border-y border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Pare de deixar horários vazios <br/>
              <span className="text-gradient-gold text-5xl">virarem prejuízo.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Preencha lacunas da agenda, acompanhe o dia em tempo real e mantenha sua operação girando sem atrito com ferramentas feitas para o balcão.
            </p>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-px bg-border/40 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm">
            {[
              { 
                icon: Calendar, 
                title: "Vagas Instantâneas", 
                desc: "Abra horários livres com um clique e notifique clientes em potencial.",
                metric: "Setup < 1 min"
              },
              { 
                icon: MessageCircle, 
                title: "Ocupação Ativa", 
                desc: "Ferramentas de divulgação para transformar desistências em novos atendimentos.",
                metric: "+30% Fluxo"
              },
              { 
                icon: Clock, 
                title: "Visão de Comando", 
                desc: "Painel sincronizado para você saber exatamente o que acontece no balcão agora.",
                metric: "Real-time"
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card/80 p-8 sm:p-10 hover:bg-card transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{item.metric}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 bg-[#0c0c0c] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl sm:text-7xl font-display italic text-white mb-8 leading-tight">
              Horários livres não precisam virar <span className="text-gradient-gold">silêncio no balcão.</span>
            </h2>
            <p className="text-muted-foreground/60 text-xl font-display italic max-w-2xl mx-auto">
              "O BarberFlow ajuda sua rotina a manter o ritmo, a presença e a constância ao longo do dia, com elegância e precisão."
            </p>
          </motion.div>
          
          <div className="space-y-24">
            {[
              { 
                title: "Mantenha a casa em movimento", 
                desc: "Uma agenda que flui sem interrupções bruscas, valorizando o tempo de quem atende e de quem é atendido." 
              },
              { 
                title: "Preencha com naturalidade", 
                desc: "Abra vagas disponíveis de forma integrada à sua marca, mantendo a sofisticação do seu balcão." 
              },
              { 
                title: "Ritmo e Discrição", 
                desc: "Acompanhe o fluxo da sua barbearia em um painel que preza pela clareza visual e minimalismo." 
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'} items-start gap-8 lg:gap-16`}
              >
                <div className="text-6xl font-display font-bold text-white/5 select-none">0{i+1}</div>
                <div className="max-w-md">
                  <h3 className="text-2xl font-display italic text-white mb-4">{item.title}</h3>
                  <p className="text-muted-foreground/70 leading-relaxed italic">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ShowcaseSection = () => {
  const { identity } = useTheme();
  
  if (identity === "modern") {
    return (
      <section className="py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <p className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-4">Módulos Reais</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Veja como funciona <span className="text-gradient-gold">na prática.</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Componentes reais do painel administrativo, desenhados para performance e agilidade no balcão.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Principal Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 rounded-3xl bg-card border border-border/40 overflow-hidden group shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Agenda Inteligente</h3>
                    <p className="text-sm text-muted-foreground">Visão geral do dia em tempo real</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">PREVIEW REAL</span>
                </div>
                
                <div className="space-y-3 bg-background/50 rounded-t-2xl p-6 border-t border-x border-border/40 shadow-inner">
                  {[
                    { h: "14:00", n: "Carlos Mendes", s: "Corte & Barba", p: "R$ 85,00" },
                    { h: "15:00", n: "Bruno Silva", s: "Sombrancelha", p: "R$ 45,00" },
                  ].map((row, j) => (
                    <div key={j} className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card shadow-sm">
                      <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center text-xs font-bold text-primary">{row.h}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{row.n}</p>
                        <p className="text-[10px] text-muted-foreground">{row.s}</p>
                      </div>
                      <div className="text-sm font-mono font-bold">{row.p}</div>
                    </div>
                  ))}
                  <div className="h-20 bg-gradient-to-b from-transparent to-background/50 flex items-center justify-center">
                    <div className="animate-bounce p-2 rounded-full bg-primary/10 border border-primary/20">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl bg-card border border-border/40 p-8 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Relatório de Caixa</h4>
                    <p className="text-xl font-bold">R$ 4.250,50</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
                  <div className="h-full w-[80%] bg-emerald-500 rounded-full" />
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground uppercase">Meta do dia</span>
                  <span className="text-emerald-500">+12% vs Ontem</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl bg-card border border-border/40 p-8 shadow-xl overflow-hidden relative group"
              >
                <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-2">Setup em segundos</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Não instalamos nada. Sua barbearia online pelo navegador, em qualquer device.</p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/15 transition-colors" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-40 bg-[#080808] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <span className="text-[11px] font-bold text-primary tracking-[0.4em] uppercase mb-8 block">Atelier BarberFlow</span>
            <h2 className="text-5xl sm:text-7xl font-display italic text-white mb-10 leading-[1.1]">
              A excelência na gestão <br/>
              <span className="text-gradient-gold">é invisível aos olhos.</span>
            </h2>
            <p className="text-muted-foreground/60 text-xl font-display italic max-w-xl mx-auto">
              "Cada detalhe da interface foi pensado para não interromper a conversa entre o barbeiro e o cliente."
            </p>
          </motion.div>
          
          <div className="w-full grid lg:grid-cols-[1.2fr_1fr] gap-px bg-white/[0.03] border border-white/[0.03] rounded-[3rem] overflow-hidden">
            <div className="p-12 lg:p-20 flex flex-col justify-center text-left space-y-12">
              <div>
                <span className="text-5xl font-display text-primary/30 select-none">M</span>
                <h3 className="text-3xl font-display italic text-white mt-[-1rem] mb-4">Manifesto Operacional</h3>
                <p className="text-muted-foreground/60 italic leading-relaxed text-lg">
                  Nascemos para servir. Reduzimos a burocracia do agendamento à essência: um toque, um horário, um cliente satisfeito.
                </p>
              </div>
              <div className="h-px w-20 bg-primary/30" />
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-xs text-white uppercase tracking-[0.2em]">Caderno Digital de Presença</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-xs text-white uppercase tracking-[0.2em]">Gestão de Atendimento Boutique</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0c0c0c] p-12 lg:p-20 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
              <motion.div
                initial={{ opacity: 0, rotateY: -15 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true }}
                className="relative aspect-[3/4] w-full bg-[#111] rounded-[2rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] p-8 overflow-hidden"
              >
                <div className="h-2 w-12 bg-white/10 rounded-full mx-auto mb-8" />
                <div className="space-y-6">
                  <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-24 w-full bg-white/[0.02] rounded-xl border border-white/5" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/[0.03] rounded-xl" />
                    <div className="h-20 bg-white/[0.03] rounded-xl" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent flex items-end justify-center pb-8 p-4 text-center">
                  <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">A sofisticação da simplicidade</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ForWhoSection = () => (
  <section className="py-20 bg-surface border-y border-border/60">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-3xl bg-card/70 backdrop-blur-xl border border-border/70 p-8 lg:p-10"
      >
        <p className="text-primary font-medium text-xs tracking-[0.25em] uppercase mb-3">Para quem é</p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold mb-5">
          Feito para barbeiros que querem <span className="text-gradient-gold">faturar mais com organização</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          {[
            "Agenda sempre cheia",
            "Mais clientes recorrentes",
            "Operação sem planilhas",
            "Atendimento mais profissional",
          ].map((item) => (
            <p key={item} className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              {item}
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

const faqsLanding = [
  { q: "É gratuito para clientes?", a: "Sim. Clientes não pagam para agendar." },
  { q: "O barbeiro paga por agendamento?", a: "Não. Você paga um plano fixo e pode receber quantos agendamentos quiser." },
  { q: "Precisa instalar aplicativo?", a: "Não. Funciona direto no navegador." },
];

const FaqSection = () => (
  <section id="faq" className="py-24 bg-background border-t border-border/60">
    <div className="container mx-auto px-4 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <p className="text-primary font-medium text-sm tracking-widest uppercase mb-3">Dúvidas frequentes</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold">FAQ</h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl p-5 sm:p-6"
      >
        <div className="space-y-4">
          {faqsLanding.map((item) => (
            <div key={item.q} className="border-b border-border/40 pb-4 last:border-b-0 last:pb-0">
              <p className="text-sm font-medium text-foreground">{item.q}</p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

const ConversionSection = () => (
  <section className="py-16 border-t border-border/40">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-3 gap-4">
        <article className="glass-card p-6 space-y-3">
          <p className="text-xs uppercase tracking-wider text-primary">Clientes</p>
          <h3 className="text-xl font-semibold">Agende com menos fricção</h3>
          <p className="text-sm text-muted-foreground">
            Encontre barbearias, compare avaliações e confirme seu horário em poucos passos.
          </p>
          <Link to="/cliente/novo-agendamento" className="text-primary text-sm font-semibold">
            Começar agendamento
          </Link>
        </article>
        <article className="glass-card p-6 space-y-3">
          <p className="text-xs uppercase tracking-wider text-primary">Barbeiros</p>
          <h3 className="text-xl font-semibold">Aumente sua taxa de ocupação</h3>
          <p className="text-sm text-muted-foreground">
            Organize agenda, operação e relacionamento em um fluxo único.
          </p>
          <Link to="/planos" className="text-primary text-sm font-semibold">
            Ver planos e ROI
          </Link>
        </article>
        <article className="glass-card p-6 space-y-3">
          <p className="text-xs uppercase tracking-wider text-primary">Conteúdo e leads</p>
          <h3 className="text-xl font-semibold">Blog estratégico BarberFlow</h3>
          <p className="text-sm text-muted-foreground">
            Aprenda, aplique e receba novas oportunidades por conteúdo e newsletter.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/blog" className="text-primary text-sm font-semibold">
              Acessar blog
            </Link>
            <Link to="/suporte" className="text-primary text-sm font-semibold">
              Falar com time
            </Link>
          </div>
        </article>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const { identity } = useTheme();
  const LogoIcon = identity === "vintage" ? Scissors : Sparkles;
  return (
  <footer className="bg-card border-t border-border py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <LogoIcon className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-gradient-gold">BarberFlow</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Link to="/blog" className="hover:text-primary hover:underline">Blog</Link>
          <span>•</span>
          <Link to="/termos" className="hover:text-primary hover:underline">Termos de Uso</Link>
          <span>•</span>
          <Link to="/privacidade" className="hover:text-primary hover:underline">Politica de Privacidade</Link>
          <span>•</span>
          <Link to="/suporte" className="hover:text-primary hover:underline">Suporte</Link>
        </div>
        <p className="text-muted-foreground text-sm">© 2026 BarberFlow. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
  );
};

const Index = () => (
  <div className="min-h-screen min-h-[100vh] bg-background">
    <Navbar />
    <main>
      <HeroSection />
      <SocialProofSection />
      <DifferentiatorSection />
      <ShowcaseSection />
      <ForWhoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ConversionSection />
      <FaqSection />
    </main>
    <Footer />
    <WhatsAppFloat />
    <FirstVisitPopup />
  </div>
);

export default Index;
