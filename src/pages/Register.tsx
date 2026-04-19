import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  MapPin,
  Building,
  ArrowLeft,
  ArrowRight,
  Phone,
  Eye,
  EyeOff,
  CreditCard,
  ShieldCheck,
  Scissors,
  Check,
  Zap,
  Star,
  Crown,
  QrCode,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ESTADOS } from "@/lib/constants";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

type UserType = "cliente" | "barbeiro" | null;

type PlanoAssinatura = "basico" | "profissional" | "premium" | null;

type PaymentMethod = "card" | "pix";
type BarberDataStep = 1 | 2 | 3;

const PLAN_OPTIONS = [
  {
    id: "basico",
    nome: "Básico",
    precoValor: "R$ 49,90",
    precoSufixo: "/mês",
    destaque: undefined,
    linhas: ["Até 50 agend./mês", "1 barbeiro", "Suporte por e-mail"],
    icon: Zap,
  },
  {
    id: "profissional",
    nome: "Profissional",
    precoValor: "R$ 99,90",
    precoSufixo: "/mês",
    destaque: "MAIS POPULAR",
    linhas: ["Agendamentos ilimitados", "Até 5 barbeiros", "Pix integrado", "Relatórios"],
    icon: Star,
  },
  {
    id: "premium",
    nome: "Premium",
    precoValor: "R$ 179,90",
    precoSufixo: "/mês",
    destaque: undefined,
    linhas: ["Tudo do Profissional", "Barbeiros ilimitados", "Múltiplas unid.", "Suporte 24/7"],
    icon: Crown,
  },
] as const;

const PIX_CODE_MOCK = "00020126330014BR.GOV.BCB.PIX0114barberflow@pix5204000053039865802BR5925BARBERFLOW ASSINATURA6009SAO PAULO62070503***6304ABCD";
const TERMS_VERSION = "v1_2026_03";
const OAUTH_AUTO_REDIRECT_KEY = "barberflow_oauth_auto_redirect";

const Register = () => {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const isAcceptInvite = from?.startsWith("/aceitar-convite") ?? false;
  const [userType, setUserType] = useState<UserType>(() => (isAcceptInvite ? "barbeiro" : "cliente"));
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [plano, setPlano] = useState<PlanoAssinatura>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, register, logout } = useAuth();
  const { identity } = useTheme();

  const [verificationStep, setVerificationStep] = useState<"none" | "pending" | "verified">("none");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [verificationChannel, setVerificationChannel] = useState<"email" | "telefone">("email");

  type RegisterStep = 1 | 2 | 3;
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [barberDataStep, setBarberDataStep] = useState<BarberDataStep>(1);
  const [barberDataStepDirection, setBarberDataStepDirection] = useState<1 | -1>(1);
  const ACCENT = identity === "modern" ? "hsl(var(--primary))" : "hsl(var(--gold))";
  const accentCtaTextClass = identity === "modern" ? "text-primary-foreground" : "text-gray-900";
  const isVintage = identity === "vintage";

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };
  const formatTelefone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d ? `(${d})` : "";
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };
  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };
  const formatCardExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };
  const normalizeEmailInput = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._%+-@]/g, "")
      .slice(0, 254);
  const isEmailFormatValid = (value: string) =>
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
  const normalizeBirthDateInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    if (!isoMatch) return "";
    const parsed = new Date(`${trimmed}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return "";
    return trimmed;
  };
  const maxBirthDateIso = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  })();
  const goToStep = (nextStep: RegisterStep) => {
    setStepDirection(nextStep > registerStep ? 1 : -1);
    setRegisterStep(nextStep);
  };
  const goToBarberDataStep = (nextStep: BarberDataStep) => {
    setBarberDataStepDirection(nextStep > barberDataStep ? 1 : -1);
    setBarberDataStep(nextStep);
  };

  // Auto-preenchimento de endereço a partir do CEP (somente barbeiro)
  useEffect(() => {
    if (userType !== "barbeiro") return;
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let cancelled = false;

    const fetchAddress = async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          uf?: string;
          localidade?: string;
          bairro?: string;
          logradouro?: string;
          erro?: boolean;
        };
        if (cancelled || data.erro) return;
        if (data.uf) setEstado(data.uf);
        const parts = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean);
        if (parts.length && !endereco) {
          setEndereco(parts.join(" - "));
        }
      } catch {
        // silêncio em caso de erro de rede; o usuário ainda pode preencher manualmente
      }
    };

    fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [cep, userType, endereco]);

  useEffect(() => {
    if (userType === "cliente") {
      setRegisterStep(1);
      setBarberDataStep(1);
    }
  }, [userType]);

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

    const target = from?.startsWith("/aceitar-convite") ? from : user.role === "barbeiro" ? "/barbeiro" : "/cliente";
    navigate(target, { replace: true });
  }, [user, from, navigate]);

  const doRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await register({
        name: nome,
        email,
        password,
        role: userType!,
        estado: userType === "barbeiro" ? estado : undefined,
        cidade: undefined,
        endereco: userType === "barbeiro" ? endereco : undefined,
        cep: userType === "barbeiro" ? cep : undefined,
        plano: userType === "barbeiro" ? plano ?? undefined : undefined,
        acceptingInvite: from?.startsWith("/aceitar-convite") ?? false,
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: new Date().toISOString(),
      });
      if (result.success) {
        if (result.requiresEmailConfirmation) {
          toast({
            title: "Confirme seu e-mail",
            description: result.message ?? "Enviamos um link para confirmar seu cadastro.",
          });
          navigate("/login", { replace: true });
          return;
        }

        toast({ title: "Conta criada!", description: "Bem-vindo ao BarberFlow" });
        const target = from?.startsWith("/aceitar-convite") ? from : userType === "barbeiro" ? "/barbeiro" : "/cliente";
        navigate(target, { replace: true });
      } else {
        toast({ title: "Erro ao criar conta", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailFormatValid(email)) {
      toast({
        title: "E-mail inválido",
        description: "Informe um e-mail válido para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Confirme os termos",
        description: "Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.",
        variant: "destructive",
      });
      return;
    }

    if (userType === "barbeiro") {
      if (!dataNascimento) {
        toast({
          title: "Informe sua data de nascimento",
          description: "Precisamos da data para confirmar que você tem pelo menos 18 anos.",
          variant: "destructive",
        });
        return;
      }
      const nascimento = new Date(dataNascimento);
      if (Number.isNaN(nascimento.getTime())) {
        toast({
          title: "Data de nascimento inválida",
          description: "Verifique o dia, mês e ano informados.",
          variant: "destructive",
        });
        return;
      }
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      if (idade < 18) {
        toast({
          title: "Idade mínima não atingida",
          description: "É preciso ter pelo menos 18 anos para criar uma conta de barbeiro.",
          variant: "destructive",
        });
        return;
      }
      if (!plano) {
        toast({
          title: "Escolha um plano",
          description: "Selecione um tipo de assinatura para continuar.",
          variant: "destructive",
        });
        return;
      }
      if (paymentMethod === "card") {
        if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
          toast({
            title: "Dados de pagamento incompletos",
            description: "Preencha os dados do cartão para processar sua assinatura.",
            variant: "destructive",
          });
          return;
        }
        if (cardCvv.length < 3 || cardCvv.length > 4) {
          toast({
            title: "CVV inválido",
            description: "Informe um CVV válido com 3 ou 4 dígitos.",
            variant: "destructive",
          });
          return;
        }
      } else if (!pixConfirmed) {
        toast({
          title: "Confirme o pagamento via Pix",
          description: "Marque a confirmação do Pix para continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    // Se veio de convite, não exige verificação extra (já veio de link seguro).
    if (!from?.startsWith("/aceitar-convite")) {
      if (verificationStep !== "verified") {
        const canal: "email" | "telefone" =
          userType === "barbeiro" && telefone.trim() ? "telefone" : "email";
        const code = String(Math.floor(100000 + Math.random() * 900000));
        setGeneratedCode(code);
        setVerificationCode("");
        setVerificationChannel(canal);
        setVerificationStep("pending");
        const destino = canal === "email" ? email || "seu e-mail" : telefone || "seu telefone";
        toast({
          title: "Código de verificação gerado",
          description: `Enviamos um código para ${destino}. (Demo: código ${code})`,
        });
        return;
      }
    }

    void doRegister();
  };

  const handleRegisterWithGoogleCliente = async () => {
    try {
      sessionStorage.setItem(OAUTH_AUTO_REDIRECT_KEY, "1");
    } catch {
      // ignore
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/cadastro`,
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
        title: "Erro ao criar conta com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Não redirecionar automaticamente: quem clica em "Comece Gratuitamente" deve ver a página de cadastro.
  // Se já estiver logado, mostramos aviso com opção de ir ao painel ou sair.

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Bolas amareladas de fundo (glow) – animadas */}
      <div
        className="absolute pointer-events-none opacity-[0.14]"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        aria-hidden
      >
        <motion.div
          className="rounded-full"
          style={{
            width: "min(80vw, 520px)",
            height: "min(80vw, 520px)",
            background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.2) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 18, 0],
            y: [0, -22, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.div
        className="absolute w-[min(50vw,320px)] h-[min(50vw,320px)] rounded-full opacity-[0.11] pointer-events-none hidden sm:block"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
          filter: "blur(50px)",
          bottom: "10%",
          right: "15%",
        }}
        animate={{
          scale: [1, 1.12, 1],
          x: [0, 15, 0],
          y: [0, -12, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Coluna esquerda - Formulário */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col justify-center px-5 sm:px-8 py-10 sm:py-14 lg:px-20 max-w-2xl mx-auto w-full"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
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
                  const target = from?.startsWith("/cliente") || from?.startsWith("/barbeiro")
                    ? from
                    : user.role === "barbeiro"
                      ? "/barbeiro"
                      : "/cliente";
                  navigate(target, { replace: true });
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
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Voltar ao início
          </Link>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold text-gradient-gold", isVintage ? "font-vintage-heading" : "font-display")}>
              BarberFlow
            </span>
            <Scissors className="h-7 w-7 text-primary" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
          <h1
            className={cn(
              "text-2xl font-bold leading-tight text-foreground sm:text-3xl",
              isVintage ? "font-vintage-heading" : "font-display",
            )}
          >
            Cadastre-se:
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2 mb-5">
          </p>
        </motion.div>

        {/* Alternativa: criar conta como cliente com Google (demo) */}
        {userType === "cliente" && (
          <div className="mb-8">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg border-border bg-background flex items-center justify-center gap-2 text-sm"
              onClick={handleRegisterWithGoogleCliente}
              disabled={isSubmitting}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continuar com Google</span>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
            </p>
          </div>
        )}

        {isAcceptInvite && (
          <p className="text-sm text-primary font-medium mb-5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5">
            Você está aceitando um convite para a equipe. Crie sua conta como barbeiro — você não paga assinatura, usa o plano de quem te convidou.
          </p>
        )}

        {/* Seletor de tipo de conta */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-xl bg-background/60 border border-border/70 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.65)]" />
          <div className="relative grid grid-cols-2 gap-1 p-1">
            <motion.div
              layoutId="userTypeToggleHighlight"
              className="absolute top-1 bottom-1 w-1/2 rounded-lg bg-[hsl(var(--gold))]/14 border border-[hsl(var(--gold))]/55 shadow-[0_18px_40px_rgba(0,0,0,0.75)]"
              animate={{ x: userType === "cliente" ? "0%" : "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            />
            <button
              type="button"
              onClick={() => setUserType("cliente")}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                userType === "cliente"
                  ? "text-[hsl(var(--gold))] drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              Sou cliente
            </button>
            <button
              type="button"
              onClick={() => setUserType("barbeiro")}
              className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                userType === "barbeiro"
                  ? "text-[hsl(var(--gold))] drop-shadow-[0_0_10px_rgba(0,0,0,0.9)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              Sou barbeiro
            </button>
          </div>
        </div>

        {/* Indicador de etapas (só para barbeiro) */}
        {userType === "barbeiro" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 w-full"
          >
            <div className="grid w-full grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-0">
              {[
                { step: 1 as RegisterStep, label: "Dados" },
                { step: 2 as RegisterStep, label: "Plano" },
                { step: 3 as RegisterStep, label: "Pagamento" },
              ].map(({ step, label }, i) => {
                const completed = registerStep > step;
                const current = registerStep === step;
                return (
                  <div key={step} className="contents">
                    {/* Coluna: círculo e rótulo embaixo */}
                    <div className="flex flex-col items-center justify-center min-w-0 px-0.5">
                      <motion.span
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          completed
                            ? "bg-[hsl(var(--gold))] text-gray-900"
                            : current
                              ? "border-2 border-[hsl(var(--gold))] text-[hsl(var(--gold))] bg-transparent"
                              : "border-2 border-border text-muted-foreground"
                        }`}
                        whileHover={completed || current ? { scale: 1.05 } : {}}
                      >
                        {completed ? <Check className="w-4 h-4" /> : step}
                      </motion.span>
                      <span
                        className={`mt-1.5 text-xs sm:text-sm font-medium text-center leading-tight ${
                          current ? "text-[hsl(var(--gold))]" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {/* Barra conectora entre as colunas (maior e mais visível) */}
                    {i < 2 && (
                      <div className="w-16 sm:w-24 md:w-32 h-1.5 sm:h-2 rounded-full bg-border overflow-hidden relative mt-[1.1rem] sm:mt-[1.25rem] mx-1 sm:mx-2 shrink-0">
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full bg-[hsl(var(--gold))]"
                          initial={false}
                          animate={{ width: completed ? "100%" : "0%" }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-2 rounded-2xl bg-background/80 backdrop-blur-2xl border border-border/70 shadow-[0_24px_80px_rgba(0,0,0,0.85)] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.form
              key={userType ?? "form"}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegister}
              className="space-y-6"
            >
            <motion.div
              key={`${userType}-${registerStep}-${userType === "barbeiro" && registerStep === 1 ? barberDataStep : "base"}`}
              initial={{ opacity: 0, x: registerStep === 1 && userType === "barbeiro" ? (barberDataStepDirection > 0 ? 24 : -24) : (stepDirection > 0 ? 28 : -28) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: registerStep === 1 && userType === "barbeiro" ? (barberDataStepDirection > 0 ? -24 : 24) : (stepDirection > 0 ? -28 : 28) }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6"
            >
            {(registerStep === 1 || userType === "cliente") && (
            <>
            {userType === "cliente" || barberDataStep === 1 ? (
              <>
                {userType === "barbeiro" && (
                  <p className="text-xs font-medium text-[hsl(var(--gold))]">
                    Etapa {barberDataStep} de 3 - Dados basicos
                  </p>
                )}
                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10 bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder={userType === "barbeiro" ? "voce@barbearia.com" : "seu@email.com"}
                      value={email}
                      onChange={(e) => {
                        setEmail(normalizeEmailInput(e.target.value));
                        setVerificationStep("none");
                        setGeneratedCode(null);
                        setVerificationCode("");
                      }}
                      className="pl-10 bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-secondary border-border h-11 rounded-lg text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                  <p className="text-xs text-muted-foreground mt-2">Mínimo de 8 caracteres.</p>
                </div>
              </>
            ) : null}

            {userType === "barbeiro" && barberDataStep === 2 && (
              <>
                <p className="text-xs font-medium text-[hsl(var(--gold))]">
                  Etapa {barberDataStep} de 3 - Dados pessoais
                </p>
                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formatTelefone(telefone)}
                      onChange={(e) => {
                        setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11));
                        setVerificationStep("none");
                        setGeneratedCode(null);
                        setVerificationCode("");
                      }}
                      className="pl-10 bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Usado para confirmações de agendamento e avisos importantes.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label className="text-foreground text-sm font-medium">CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formatCPF(cpf)}
                      onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className="bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Usado apenas para faturamento da assinatura.</p>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-foreground text-sm font-medium">Data de nascimento</Label>
                    <Input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(normalizeBirthDateInput(e.target.value))}
                      max={maxBirthDateIso}
                      min="1900-01-01"
                      className="bg-secondary border-border h-11 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {userType === "barbeiro" && barberDataStep === 3 && (
              <>
                <p className="text-xs font-medium text-[hsl(var(--gold))]">
                  Etapa {barberDataStep} de 3 - Endereco
                </p>
                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">CEP</Label>
                  <Input
                    placeholder="00000-000"
                    value={formatCEP(cep)}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Informe o CEP para preenchimento automatico quando disponivel.</p>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">Estado</Label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm text-foreground h-11 focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]/50 transition-shadow"
                    required
                  >
                    <option value="">Selecione</option>
                    {ESTADOS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-foreground text-sm font-medium">Endereco da barbearia</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rua, numero, bairro"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="pl-10 bg-secondary border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/50"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {verificationStep === "pending" && (
              <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
                <Label className="text-foreground text-sm font-medium">Código de verificação</Label>
                <p className="text-sm text-muted-foreground">
                  Digite o código que você recebeu por{" "}
                  {verificationChannel === "email" ? "e-mail" : "telefone"} para confirmar seus dados.
                </p>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="bg-background border-border h-11 max-w-[180px] text-sm"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 px-3 text-sm"
                    onClick={() => {
                      if (!generatedCode) {
                        toast({
                          title: "Nenhum código gerado",
                          description: "Clique em Criar conta grátis novamente para gerar um novo código.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (verificationCode.trim() !== generatedCode) {
                        toast({
                          title: "Código incorreto",
                          description: "Verifique o código digitado e tente novamente.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setVerificationStep("verified");
                      toast({
                        title: "Contato verificado",
                        description: "Agora vamos concluir a criação da sua conta.",
                      });
                      void doRegister();
                    }}
                    disabled={isSubmitting}
                  >
                    Confirmar código
                  </Button>
                </div>
              </div>
            )}

            </>)}
            

            {userType === "barbeiro" && registerStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className={cn("text-xl font-bold text-foreground", isVintage ? "font-vintage-heading" : "font-display")}>
                    Escolha seu plano
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Você pode alterar o plano depois em <span className="text-[hsl(var(--gold))] font-medium underline underline-offset-2">Assinatura</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Assinatura mensal com ativação imediata para começar a receber agendamentos.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PLAN_OPTIONS.map((p) => {
                    const ativo = plano === p.id;
                    const Icon = p.icon;
                    return (
                      <motion.button
                        key={p.id}
                        type="button"
                        onClick={() => setPlano(p.id as PlanoAssinatura)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: 0.06 * PLAN_OPTIONS.findIndex((item) => item.id === p.id) }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex flex-col items-start text-left rounded-xl p-4 bg-card/70 transition-all duration-200 min-h-[245px] ${
                          ativo
                            ? "border-2 border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold))]/30 shadow-lg shadow-[hsl(var(--gold))]/10"
                            : "border-2 border-border hover:border-[hsl(var(--gold))]/55"
                        }`}
                      >
                        {p.destaque && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-md bg-[hsl(var(--gold))] px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wide">
                            {p.destaque}
                          </span>
                        )}
                        {ativo && (
                          <motion.span
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 240, damping: 16 }}
                            className="absolute top-3 right-3 rounded-full bg-[hsl(var(--gold))] p-0.5"
                          >
                            <Check className="w-4 h-4 text-gray-900" />
                          </motion.span>
                        )}
                        <Icon className={`w-4 h-4 mt-0.5 ${ativo ? "text-[hsl(var(--gold))]" : "text-muted-foreground"}`} />
                        <span className="text-[13px] font-semibold font-sans tracking-tight text-foreground mt-2">{p.nome}</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span
                            className="text-[17px] sm:text-[18px] font-bold font-sans tracking-tight leading-none text-[hsl(var(--gold))] whitespace-nowrap"
                          >
                            {p.precoValor}
                          </span>
                          <span
                            className="text-[10px] font-medium font-sans tracking-tight leading-none text-[hsl(var(--gold))] whitespace-nowrap"
                          >
                            {p.precoSufixo}
                          </span>
                        </div>
                        <ul className="mt-3 space-y-1.5">
                          {p.linhas.map((linha) => (
                            <li key={linha} className="text-[11px] font-sans tracking-tight text-muted-foreground flex items-start gap-2 leading-snug">
                              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[hsl(var(--gold))]" />
                              {linha}
                            </li>
                          ))}
                        </ul>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {userType === "barbeiro" && registerStep === 3 && plano && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-xl border border-border bg-secondary/40 p-5"
              >
                    {(() => {
                      const selectedPlan = PLAN_OPTIONS.find((p) => p.id === plano);
                      return selectedPlan ? (
                        <div className="rounded-xl border border-[hsl(var(--gold))]/40 bg-background/70 p-4 space-y-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo da assinatura</p>
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-foreground">{selectedPlan.nome}</p>
                              <p className="text-2xl font-bold text-[hsl(var(--gold))] leading-none mt-1">
                                {selectedPlan.precoValor}
                                <span className="text-sm font-medium ml-1">{selectedPlan.precoSufixo}</span>
                              </p>
                            </div>
                            <span className="text-xs rounded-full border border-[hsl(var(--gold))]/40 px-2.5 py-1 text-[hsl(var(--gold))]">
                              Comece a usar agora
                            </span>
                          </div>
                          <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                            {selectedPlan.linhas.slice(0, 4).map((linha) => (
                              <li key={linha} className="inline-flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
                                {linha}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                    <div className="flex items-center gap-3 mb-1">
                      <CreditCard className="w-4 h-4 text-[hsl(var(--gold))]" />
                      <p className="text-sm font-semibold text-foreground">Pagamento</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ambiente de demonstracao. Nao informe dados reais de cartao.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                          paymentMethod === "card"
                            ? "border-[hsl(var(--gold))] text-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" />
                          Cartão
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                          paymentMethod === "pix"
                            ? "border-[hsl(var(--gold))] text-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <QrCode className="w-4 h-4" />
                          Pix
                        </span>
                      </button>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                    {paymentMethod === "card" ? (
                      <motion.div
                        key="card-method"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.22 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-sm text-muted-foreground">Número do cartão</Label>
                          <Input
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            className="bg-background border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/40"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-sm text-muted-foreground">Nome no cartão</Label>
                          <Input
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Nome completo"
                            maxLength={40}
                            className="bg-background border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Validade</Label>
                          <Input
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="bg-background border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">CVV</Label>
                          <Input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="***"
                            maxLength={4}
                            className="bg-background border-border h-11 rounded-lg text-sm max-w-[140px] focus-visible:ring-[hsl(var(--gold))]/40"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-sm text-muted-foreground">E-mail para faturas</Label>
                          <Input
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            placeholder={email || "seu@email.com"}
                            maxLength={60}
                            className="bg-background border-border h-11 rounded-lg text-sm focus-visible:ring-[hsl(var(--gold))]/40"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pix-method"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-xl border border-border bg-background/60 p-4 space-y-3"
                      >
                        <p className="text-sm text-foreground font-medium">Pix copia e cola</p>
                        <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground break-all">
                          {PIX_CODE_MOCK}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(PIX_CODE_MOCK);
                                toast({ title: "Código Pix copiado", description: "Cole no app do seu banco para pagar." });
                              } catch {
                                toast({ title: "Não foi possível copiar", description: "Copie manualmente o código Pix." });
                              }
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar código
                          </Button>
                          <Button
                            type="button"
                            variant={pixConfirmed ? "gold" : "outlineGold"}
                            size="sm"
                            onClick={() => {
                              setPixConfirmed(true);
                              toast({ title: "Pagamento Pix confirmado", description: "Agora você já pode concluir a assinatura." });
                            }}
                          >
                            {pixConfirmed ? "Pix confirmado" : "Confirmar pagamento"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    <div className="flex items-start gap-3 pt-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                      <ShieldCheck className="w-4 h-4 text-[hsl(var(--gold))] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground font-medium">Pagamento seguro</p>
                        <p className="text-xs text-muted-foreground">Versao de teste sem criptografia de pagamento em producao.</p>
                      </div>
                    </div>
              </motion.div>
            )}

            </motion.div>

            <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5">
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-background text-primary"
                  required
                />
                <span>
                  Ao criar sua conta, você aceita os{" "}
                  <Link to="/termos" className="text-[hsl(var(--gold))] hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link to="/privacidade" className="text-[hsl(var(--gold))] hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Botões por etapa */}
            {userType === "cliente" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full pt-4">
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSubmitting || !termsAccepted}
                  className="w-full font-semibold py-4 text-base rounded-lg min-h-[48px] h-12 transition-transform hover:scale-[1.02] hover:shadow-[0_0_28px_hsl(var(--gold)/0.35)] active:scale-[0.99]"
                >
                  {isSubmitting ? "Criando conta..." : "Criar conta grátis"}
                </Button>
              </motion.div>
            )}
            {userType === "barbeiro" && registerStep === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-4 pt-4">
                {barberDataStep > 1 && (
                  <Button
                    type="button"
                    onClick={() => goToBarberDataStep((barberDataStep - 1) as BarberDataStep)}
                    variant="ghost"
                    className="flex-1 rounded-xl h-12 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={!termsAccepted}
                  onClick={() => {
                    if (barberDataStep === 1) {
                      if (!nome.trim() || !email.trim() || !password.trim()) {
                        toast({ title: "Preencha os dados básicos", description: "Nome, e-mail e senha são obrigatórios.", variant: "destructive" });
                        return;
                      }
                      if (!isEmailFormatValid(email)) {
                        toast({ title: "E-mail inválido", description: "Informe um e-mail válido para continuar.", variant: "destructive" });
                        return;
                      }
                      goToBarberDataStep(2);
                      return;
                    }

                    if (barberDataStep === 2) {
                      if (!telefone.trim() || !cpf.trim() || !dataNascimento) {
                        toast({ title: "Preencha os dados pessoais", description: "Telefone, CPF e data de nascimento são obrigatórios.", variant: "destructive" });
                        return;
                      }
                      goToBarberDataStep(3);
                      return;
                    }

                    if (!estado.trim() || !cep.trim() || !endereco.trim()) {
                      toast({ title: "Preencha os dados de endereço", description: "Estado, CEP e endereço são obrigatórios.", variant: "destructive" });
                      return;
                    }
                    goToStep(2);
                  }}
                  className={cn(
                    "flex-1 font-semibold py-4 text-base rounded-lg min-h-[48px] h-12 px-8 border-0 transition-transform hover:scale-[1.02] active:scale-[0.98]",
                    accentCtaTextClass,
                  )}
                  style={{ background: ACCENT, boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
                >
                  {barberDataStep === 3 ? "Ir para plano" : "Continuar"}
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Button>
              </motion.div>
            )}
            {userType === "barbeiro" && registerStep === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  disabled={!termsAccepted}
                  onClick={() => {
                    goToStep(1);
                    goToBarberDataStep(1);
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl h-12 text-sm font-medium border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!plano) {
                      toast({ title: "Escolha um plano", description: "Selecione um tipo de assinatura para continuar.", variant: "destructive" });
                      return;
                    }
                    goToStep(3);
                  }}
                  className={cn(
                    "flex-1 rounded-lg h-12 text-base font-semibold border-0 transition-transform hover:scale-[1.02] active:scale-[0.98]",
                    accentCtaTextClass,
                  )}
                  style={{ background: ACCENT, boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Button>
              </motion.div>
            )}
            {userType === "barbeiro" && registerStep === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Você poderá cancelar quando quiser. Sem taxas escondidas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  onClick={() => goToStep(2)}
                  variant="ghost"
                  className="flex-1 rounded-xl h-12 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={isSubmitting || !termsAccepted}
                  className="flex-1 font-semibold py-4 text-base rounded-lg min-h-[48px] h-12 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? "Processando..." : "Assinar e começar a usar"}
                </Button>
                </div>
              </motion.div>
            )}
            
            <p className="mt-4 text-sm text-muted-foreground text-center w-full">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-[hsl(var(--gold))] font-medium hover:underline underline-offset-2 transition-colors text-base">
                Entrar
              </Link>
            </p>
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-2">
          <Link to="/termos" className="hover:text-[hsl(var(--gold))] hover:underline">Termos de Uso</Link>
          <span>•</span>
          <Link to="/privacidade" className="hover:text-[hsl(var(--gold))] hover:underline">Política de Privacidade</Link>
        </div>
      </motion.div>

      {/* Coluna direita - Benefícios e prova social */}
      <div className="relative z-10 hidden lg:flex flex-1 flex-col items-center justify-center overflow-hidden min-h-screen px-10 xl:px-16 gap-8">
        {identity === "modern" && (
          <>
            <div className="absolute inset-0 bg-background" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-transparent to-primary/[0.05]" aria-hidden />
            <motion.div
              className="absolute -top-32 right-[-8%] h-[min(90vw,480px)] w-[min(90vw,480px)] rounded-full bg-primary/20 blur-[90px] pointer-events-none"
              animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.04, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.div
              className="absolute bottom-[-15%] left-[-6%] h-[min(85vw,380px)] w-[min(85vw,380px)] rounded-full bg-primary/12 blur-[80px] pointer-events-none"
              animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
            <div className="absolute inset-0 border-l border-border/50 pointer-events-none" aria-hidden />
          </>
        )}
        <motion.div
          className="relative z-[1] text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Scissors className="w-20 h-20 text-primary mb-4 mx-auto" />
          <h2 className={cn("mb-3 text-4xl font-bold text-gradient-gold xl:text-5xl", isVintage ? "font-vintage-heading" : "font-display")}>
            BarberFlow
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            Agenda cheia, menos horário vazio e operação no controle — em minutos.
          </p>
        </motion.div>

        <div className="relative z-[1] w-full max-w-md space-y-4">
          <motion.div
            className={cn(
              "glass-card rounded-2xl border border-primary/25 p-5",
              identity === "modern" ? "shadow-sm" : "shadow-md",
            )}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <p className={cn("mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--gold))]", isVintage && "tracking-[0.14em]")}>
              Por que usar o BarberFlow?
            </p>
            <ul className="space-y-2.5 text-sm text-foreground/90">
              <li className="flex items-start gap-2">
                <span className={cn("mt-0.5", isVintage ? "text-primary/85" : "text-green-400")}>✓</span>
                <span>
                  <strong>Agenda automática</strong> para evitar conflitos e horários vazios.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className={cn("mt-0.5", isVintage ? "text-primary/85" : "text-green-400")}>✓</span>
                <span>
                  <strong>Mais clientes</strong> com agendamento online direto.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className={cn("mt-0.5", isVintage ? "text-primary/85" : "text-green-400")}>✓</span>
                <span>
                  <strong>Controle total da barbearia</strong> em um só lugar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className={cn("mt-0.5", isVintage ? "text-primary/85" : "text-green-400")}>✓</span>
                <span>
                  <strong>Comece em menos de 5 minutos.</strong>
                </span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 shadow-card max-w-md"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <p className={cn("mb-3 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--gold))]", isVintage && "tracking-[0.14em]")}>
              Confiança
            </p>
            <p className="text-sm font-medium text-foreground mb-2">
              +120 barbearias ativas <span className="text-muted-foreground font-normal">•</span> 4,9 de avaliação
            </p>
            <p className="text-sm text-foreground/90">
              Teste grátis <span className="text-muted-foreground">•</span> Sem compromisso <span className="text-muted-foreground">•</span>{" "}
              Cancele quando quiser
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
