import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getInviteByToken, acceptInvite, getTeamByUserId } from "@/lib/team";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { toast } from "@/hooks/use-toast";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "invalid" | "need-login" | "success" | "error">("loading");
  const processed = useRef(false);

  useEffect(() => {
    const rawToken = (token ?? "").trim();
    if (!rawToken) {
      setStatus("invalid");
      return;
    }
    const invite = getInviteByToken(rawToken);
    if (!invite) {
      // Convite já foi consumido (ex.: remount). Se o usuário já está na equipe, só redirecionar sem alterar perfil.
      if (user) {
        const teamInfo = getTeamByUserId(user.id);
        if (teamInfo) {
          setStatus("success");
          toast({ title: "Você entrou na equipe!", description: "Redirecionando para o painel do barbeiro." });
          setTimeout(() => navigate("/barbeiro", { replace: true }), 1500);
          return;
        }
      }
      setStatus("invalid");
      return;
    }
    if (!user) {
      setStatus("need-login");
      return;
    }
    if (processed.current) {
      return;
    }
    processed.current = true;
    const profile = getBarbershopProfile(invite.barbershopId);
    const plano = profile?.plano;
    const barbershopId = acceptInvite(rawToken, { id: user.id, email: user.email, name: user.name }, plano);
    if (barbershopId == null) {
      setStatus("error");
      return;
    }
    // Preservar isBarbershopOwner se o usuário já for dono desta barbearia (ex.: abriu o próprio link em outra aba).
    const teamInfo = getTeamByUserId(user.id);
    const isOwner = teamInfo?.barbershopId === barbershopId && teamInfo?.isOwner === true;
    updateUser({
      barbershopId,
      isBarbershopOwner: isOwner,
      role: "barbeiro",
    });
    setStatus("success");
    toast({ title: "Você entrou na equipe!", description: "Redirecionando para o painel do barbeiro." });
    setTimeout(() => navigate("/barbeiro", { replace: true }), 1500);
  }, [token, user]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Verificando convite…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-4"
        >
          <h1 className="text-xl font-semibold text-foreground">Convite inválido ou expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este link não existe ou já foi utilizado. Peça um novo convite ao administrador da barbearia.
          </p>
          <Button asChild>
            <Link to="/">Ir para o início</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (status === "need-login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-6"
        >
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Convite para a equipe</h1>
          <p className="text-muted-foreground text-sm">
            Você foi convidado para trabalhar como barbeiro nesta barbearia. Quem aceita <strong>não paga assinatura</strong> — usa o plano do administrador. Faça login ou crie uma conta para aceitar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gap-2">
              <Link to="/login" state={{ from: `/aceitar-convite/${token}` }}>
                <LogIn className="w-4 h-4" />
                Entrar
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/cadastro" state={{ from: `/aceitar-convite/${token}` }}>
                <UserPlus className="w-4 h-4" />
                Criar conta
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md space-y-4"
        >
          <h1 className="text-xl font-semibold text-foreground">Não foi possível entrar na equipe</h1>
          <p className="text-muted-foreground text-sm">
            A equipe pode ter atingido o limite do plano. Tente novamente mais tarde ou fale com o administrador.
          </p>
          <Button asChild>
            <Link to="/barbeiro">Ir para o painel</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-4"
      >
        <h1 className="text-xl font-semibold text-foreground">Você entrou na equipe!</h1>
        <p className="text-muted-foreground text-sm">Redirecionando para o painel do barbeiro…</p>
      </motion.div>
    </div>
  );
};

export default AcceptInvite;
