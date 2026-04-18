import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Scissors, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { isValidEmail, sanitizeEmail, validatePassword } from "@/lib/security";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, "?"));
    if (params.get("type") === "recovery") {
      setIsRecoveryMode(true);
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const safeEmail = sanitizeEmail(email).toLowerCase();
    if (!safeEmail) {
      toast({ title: "Campo obrigatorio", description: "Informe seu e-mail.", variant: "destructive" });
      return;
    }
    if (!isValidEmail(safeEmail)) {
      toast({ title: "E-mail invalido", description: "Informe um e-mail valido.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo: `${window.location.origin}/esqueci-senha`,
      });
      if (error) {
        toast({ title: "Nao foi possivel enviar", description: error.message, variant: "destructive" });
        return;
      }
      setEmail(safeEmail);
      setSent(true);
      toast({
        title: "Verifique seu e-mail",
        description: "Se existir uma conta com este e-mail, voce recebera as instrucoes para redefinir a senha.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "A nova senha e a confirmacao nao coincidem.", variant: "destructive" });
      return;
    }

    const validated = validatePassword(newPassword);
    if (!validated.valid) {
      toast({ title: "Senha invalida", description: validated.error, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Nao foi possivel alterar", description: error.message, variant: "destructive" });
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setIsRecoveryMode(false);
      toast({ title: "Senha redefinida", description: "Voce ja pode entrar com sua nova senha." });
      await supabase.auth.signOut();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 glow-gold">
          <div className="flex flex-col items-center mb-8">
            <Scissors className="w-12 h-12 text-primary mb-4" />
            <h1 className="text-4xl font-display font-bold text-gradient-gold">BarberFlow</h1>
            <p className="text-muted-foreground mt-2 font-body text-sm">Esqueceu sua senha?</p>
          </div>

          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground/80 text-sm">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:ring-primary"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground/80 text-sm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:ring-primary"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 text-base rounded-lg"
              >
                {isSubmitting ? "Salvando..." : "Redefinir senha"}
              </Button>
            </form>
          ) : sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Enviamos as instrucoes para <strong className="text-foreground">{email}</strong>.
                Verifique sua caixa de entrada e o spam.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Enviar para outro e-mail
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:ring-primary"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 text-base rounded-lg"
              >
                {isSubmitting ? "Enviando..." : "Enviar instrucoes"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
