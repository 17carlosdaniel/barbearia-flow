import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, UserPlus, Scissors, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { getInviteByShortCode } from "@/lib/team";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const BARBER_LOGIN_INTRO_KEY = "barberflow_barber_login_intro";
const OAUTH_AUTO_REDIRECT_KEY = "barberflow_oauth_auto_redirect";

const inputFocusClass =
  "focus-visible:border-primary/70 focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]/35 focus-visible:ring-offset-0";

const Login = () => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codigoConvite, setCodigoConvite] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const [heroParallax, setHeroParallax] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    const savedEmail = localStorage.getItem("barberflow_login_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const heroImagesVintage = ["/hero-barbeshop.jpg"];

  useEffect(() => {
    setHeroIndex(0);
  }, [identity]);

  useEffect(() => {
    if (identity !== "vintage" || heroImagesVintage.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImagesVintage.length);
    }, 7000);
    return () => clearInterval(id);
  }, [identity, heroImagesVintage.length]);

  useEffect(() => {
    if (!user) return;
    let shouldAutoRedirect = false;
    try {
      shouldAutoRedirect = sessionStorage.getItem(OAUTH_AUTO_REDIRECT_KEY) === "1";
      if (shouldAutoRedirect) {
        sessionStorage.removeItem(OAUTH_AUTO_REDIRECT_KEY);
      }
    } catch {
      shouldAutoRedirect = false;
    }
    if (!shouldAutoRedirect) return;

    const entry =
      from && (from.startsWith("/barbeiro") || from.startsWith("/cliente") || from.startsWith("/aceitar-convite"))
        ? from
        : user.role === "barbeiro"
          ? "/barbeiro"
          : "/cliente";
    navigate(entry, { replace: true });
  }, [user, from, navigate]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroPanelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 12;
    setHeroParallax({ x: px, y: py });
  };

  const handleHeroMouseLeave = () => setHeroParallax({ x: 0, y: 0 });

  const handleCodigoConvite = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = codigoConvite.trim();
    if (!raw) {
      toast({ title: "Cole o código ou o link do convite", variant: "destructive" });
      return;
    }
    const soNumeros = raw.replace(/\D/g, "");
    if (soNumeros.length >= 6 && soNumeros.length <= 8) {
      const invite = getInviteByShortCode(soNumeros);
      if (invite) {
        navigate(`/aceitar-convite/${invite.token}`, { replace: true });
        return;
      }
      toast({ title: "Código inválido ou expirado", variant: "destructive" });
      return;
    }
    const token = raw.includes("aceitar-convite/")
      ? raw.split("aceitar-convite/")[1]?.split("?")[0]?.trim() ?? raw
      : raw;
    navigate(`/aceitar-convite/${token}`, { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem("barberflow_login_email", email);
        } else {
          localStorage.removeItem("barberflow_login_email");
        }
        const entry =
          from && (from.startsWith("/barbeiro") || from.startsWith("/cliente") || from.startsWith("/aceitar-convite"))
            ? from
            : result.user?.role === "barbeiro"
              ? "/barbeiro"
              : "/cliente";
        if (entry.startsWith("/barbeiro")) {
          try {
            sessionStorage.setItem(BARBER_LOGIN_INTRO_KEY, "1");
          } catch {
            // noop
          }
        }
        navigate(entry, { replace: true });
      } else {
        toast({ title: "Erro ao entrar", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginWithGoogleCliente = async () => {
    try {
      sessionStorage.setItem(OAUTH_AUTO_REDIRECT_KEY, "1");
    } catch {
      // ignore
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      try {
        sessionStorage.removeItem(OAUTH_AUTO_REDIRECT_KEY);
      } catch {
        // ignore
      }
      toast({
        title: "Erro ao conectar com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <motion.div
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col pt-24 pb-12 px-6 sm:px-12 lg:px-20 max-w-xl mx-auto w-full"
      >
        {user && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-foreground">
              Você já está conectado como <strong>{user.name}</strong>.
            </p>
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  const entry =
                    from &&
                    (from.startsWith("/barbeiro") || from.startsWith("/cliente") || from.startsWith("/aceitar-convite"))
                      ? from
                      : user.role === "barbeiro"
                        ? "/barbeiro"
                        : "/cliente";
                  navigate(entry, { replace: true });
                }}
              >
                Ir ao painel
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sair
              </Button>
            </div>
          </div>
        )}
        {user && <div className="mb-4 border-t border-border" />}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-10 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Scissors className="h-6 w-6 text-primary" />
          <span className={cn("text-xl font-bold text-gradient-gold", isVintage ? "font-vintage-heading" : "font-display")}>
            BarberFlow
          </span>
        </div>
        <h1
          className={cn(
            "mb-2 mt-6 text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl",
            isVintage ? "font-vintage-heading" : "font-dm-serif",
          )}
        >
          Tudo pronto para mais um dia de agenda cheia
        </h1>
        <p className="text-muted-foreground mb-2 text-sm sm:text-base leading-relaxed">
          Acesse seu painel para acompanhar horários, clientes e atendimentos em tempo real.
        </p>
        <p className="text-sm text-muted-foreground/95 mb-8 leading-relaxed">
          Organize seu dia, preencha horários vagos e atenda com mais controle.
        </p>
        {from && (from.startsWith("/cliente") || from.startsWith("/barbeiro")) && (
          <p className="text-sm text-primary -mt-4 mb-4">
            Após o login você será redirecionado para a {from.startsWith("/barbeiro") ? "área do barbeiro" : "área do cliente"}.
          </p>
        )}

        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-lg border-border bg-background flex items-center justify-center gap-2 text-sm hover:border-primary/50 hover:bg-secondary/40 transition-colors"
            onClick={handleLoginWithGoogleCliente}
            disabled={isSubmitting}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              className="w-5 h-5"
            />
            <span>Continuar com Google</span>
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground px-1 text-center max-w-[11rem] sm:max-w-none">
            ou entre com seu e-mail
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoFocus
                placeholder="voce@barbearia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn("pl-10 h-12 bg-card border-border transition-shadow", inputFocusClass)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground text-sm">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("pl-10 pr-10 h-12 bg-card border-border transition-shadow", inputFocusClass)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded-md border-border bg-background text-primary accent-primary"
                disabled={isSubmitting}
              />
              <span>Lembrar acesso neste dispositivo</span>
            </label>
            <Link to="/esqueci-senha" className="text-sm text-primary hover:underline transition-colors shrink-0">
              Esqueceu a senha?
            </Link>
          </div>

          <div className="relative group w-full pt-2">
            <Button
              variant="gold"
              size="lg"
              className={cn(
                "relative z-10 h-12 w-full text-xs uppercase shadow-none transition-all duration-500",
                isVintage ? "font-semibold tracking-[0.12em]" : "font-black tracking-[0.2em]",
                "border-2 border-primary bg-primary text-primary-foreground",
                "group-hover:w-[calc(100%-55px)] group-hover:border-primary group-hover:bg-transparent group-hover:text-primary",
                isSubmitting && "pointer-events-none opacity-80",
              )}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Acessando…
                </span>
              ) : (
                "Acessar minha agenda"
              )}
            </Button>
            <div className="absolute right-0 top-2 w-12 h-12 border-2 border-transparent transform rotate-45 z-0 transition-all duration-500 group-hover:right-[-10px] group-hover:border-primary flex items-center justify-center overflow-hidden">
              <Scissors className="w-5 h-5 text-primary transform -rotate-45 transition-all duration-500 opacity-0 group-hover:opacity-100" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            Seus dados protegidos em uma conexão segura
          </p>
        </motion.form>

        <p className="mt-6 text-sm text-muted-foreground">
          Ainda não usa o BarberFlow?{" "}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Crie sua conta
          </Link>
        </p>

        <div className="mt-8 mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="mt-2 p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">Entrar com convite da equipe</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cole abaixo o código ou link enviado pelo administrador da barbearia.
          </p>
          <form onSubmit={handleCodigoConvite} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="Cole o código ou link do convite"
              value={codigoConvite}
              onChange={(e) => setCodigoConvite(e.target.value)}
              className={cn("flex-1 bg-background border-border h-10 text-sm", inputFocusClass)}
            />
            <Button type="submit" variant="secondary" className="shrink-0 h-10 sm:px-5">
              Entrar com convite
            </Button>
          </form>
        </div>

        <div className="mt-8 rounded-xl border border-border/80 bg-card/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setDemoOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
            aria-expanded={demoOpen}
          >
            <span>Acesso de demonstração</span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", demoOpen && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {demoOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mt-3 mb-3 leading-relaxed">
                    Crie uma conta real no cadastro para conhecer o painel com o Supabase Auth.
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("cliente@exemplo.com");
                        setPassword("");
                      }}
                      className="w-full text-left text-xs text-foreground/90 hover:text-primary transition-colors px-3 py-2 rounded-lg border border-border/60 bg-background/50 hover:bg-secondary/40"
                    >
                      <span className="font-medium text-foreground">Cliente:</span> cliente@exemplo.com
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail("barbeiro@exemplo.com");
                        setPassword("");
                      }}
                      className="w-full text-left text-xs text-foreground/90 hover:text-primary transition-colors px-3 py-2 rounded-lg border border-border/60 bg-background/50 hover:bg-secondary/40"
                    >
                      <span className="font-medium text-foreground">Barbeiro:</span> barbeiro@exemplo.com
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 text-[11px] text-muted-foreground flex flex-wrap gap-3">
          <Link to="/termos" className="hover:text-primary hover:underline">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link to="/privacidade" className="hover:text-primary hover:underline">
            Política de Privacidade
          </Link>
          <span>•</span>
          <Link to="/suporte" className="hover:text-primary hover:underline">
            Suporte
          </Link>
        </div>
      </motion.div>

      <div
        ref={identity === "vintage" ? heroPanelRef : undefined}
        onMouseMove={identity === "vintage" ? handleHeroMouseMove : undefined}
        onMouseLeave={identity === "vintage" ? handleHeroMouseLeave : undefined}
        className={cn(
          "hidden lg:flex flex-1 items-center justify-center relative overflow-hidden min-h-screen",
          identity === "vintage" ? "bg-black" : "bg-background",
        )}
      >
        {identity === "vintage" ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={heroImagesVintage[heroIndex] ?? "hero-fallback"}
                className="absolute inset-0 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <div
                  className="absolute inset-[-8%] bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${heroImagesVintage[heroIndex] ?? heroImagesVintage[0]}')`,
                    transform: `translate(${heroParallax.x}px, ${heroParallax.y}px) scale(1.06)`,
                  }}
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-primary/10 pointer-events-none" />

            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-1/2 top-1/3 h-[min(90vw,28rem)] w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[100px]" />
              <motion.div
                className="absolute left-1/2 top-1/3 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--gold))]/12 blur-3xl"
                animate={{ opacity: [0.28, 0.42, 0.28], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.12] via-transparent to-primary/[0.06]" />
            <motion.div
              className="absolute -top-40 right-[-10%] h-[min(100vw,520px)] w-[min(100vw,520px)] rounded-full bg-primary/25 blur-[100px]"
              animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.div
              className="absolute bottom-[-20%] left-[-5%] h-[min(90vw,420px)] w-[min(90vw,420px)] rounded-full bg-primary/15 blur-[90px]"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background opacity-90" />
            <div className="absolute inset-0 border-b border-border/40 pointer-events-none" aria-hidden />
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: identity === "modern" ? 0.35 : 0.65, delay: identity === "modern" ? 0.06 : 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="text-center relative z-10 px-8 max-w-md"
        >
          <div className="relative inline-block mb-6">
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-primary/30 blur-2xl"
              animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <Scissors
              className={cn(
                "relative mx-auto h-20 w-20 text-primary sm:h-24 sm:w-24",
                identity === "modern"
                  ? "drop-shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                  : "drop-shadow-[0_0_16px_hsl(var(--gold)/0.22)]",
              )}
            />
          </div>
          <h2
            className={cn(
              "mb-4 text-4xl font-bold tracking-tight text-gradient-gold sm:text-5xl",
              identity === "modern" ? "font-display" : "font-vintage-heading",
            )}
          >
            BarberFlow
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {identity === "modern"
              ? "Gerencie horários, clientes e atendimentos em um só painel."
              : "Organize sua operação e transforme horários livres em faturamento."}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 font-medium">
            +120 barbearias ativas • 4,9 de avaliação
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
