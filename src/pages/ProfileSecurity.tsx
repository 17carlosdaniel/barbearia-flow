import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageCircle,
  Monitor,
  MapPin,
  Clock,
  LogOut,
  KeyRound,
  Fingerprint,
  Bell,
  Eye,
  Lock,
  HelpCircle,
  ChevronRight,
  Smartphone as DeviceIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLogoutFlow } from "@/contexts/LogoutFlowContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/security";

type UserType = "cliente" | "barbeiro";

const PROFILE_PATH: Record<UserType, string> = {
  cliente: "/cliente/perfil",
  barbeiro: "/barbeiro/perfil",
};

const MOCK_DEVICES = [
  { id: "1", name: "Chrome no Windows", location: "São Paulo, BR", lastAccess: "18 Mar 2025, 14:32", current: true },
  { id: "2", name: "iPhone 14", location: "São Paulo, BR", lastAccess: "17 Mar 2025, 09:15", current: false },
];

const MOCK_ACTIVITY = [
  { type: "login", label: "Login realizado", detail: "Chrome no Windows · São Paulo", time: "18 Mar 2025, 14:32" },
  { type: "password", label: "Senha alterada", detail: "Alteração de senha da conta", time: "10 Mar 2025, 11:00" },
  { type: "login", label: "Login realizado", detail: "iPhone 14 · São Paulo", time: "17 Mar 2025, 09:15" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 },
  }),
};

const headerVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

interface ProfileSecurityProps {
  userType: UserType;
}

const ProfileSecurity = ({ userType }: ProfileSecurityProps) => {
  const { user, changePassword } = useAuth();
  const { beginLogout, beginAccountDeletion } = useLogoutFlow();
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [alertNewLogin, setAlertNewLogin] = useState(true);
  const [alertCredentials, setAlertCredentials] = useState(true);
  const [alertFailedAttempts, setAlertFailedAttempts] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<"always" | "usage" | "never">("usage");
  const [anonData, setAnonData] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword) return;
    if (!currentPassword.trim()) {
      toast({ title: "Erro", description: "Informe a senha atual.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "A nova senha e a confirmação não coincidem.", variant: "destructive" });
      return;
    }
    const validated = validatePassword(newPassword);
    if (!validated.valid) {
      toast({ title: "Senha inválida", description: validated.error, variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    beginLogout();
  };

  if (!user) return null;

  const profilePath = PROFILE_PATH[userType];

  return (
    <DashboardLayout userType={userType}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-3xl"
      >
        <motion.div className="flex items-center gap-3" variants={headerVariants}>
          <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="inline-flex">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to={profilePath} aria-label="Voltar ao perfil">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          </motion.span>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Segurança e privacidade</h1>
            <p className="text-sm text-muted-foreground">Proteja sua conta e gerencie seus dados.</p>
          </div>
        </motion.div>

        {/* Alterar senha */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="config-icon-badge bg-amber-500/15 text-amber-300"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <KeyRound className="w-4 h-4" />
            </motion.div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Alterar senha</h2>
              <p className="text-sm text-muted-foreground">Mantenha sua conta segura com uma senha forte.</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">Senha atual</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Digite sua senha atual"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex w-full sm:w-auto">
              <Button type="submit" disabled={isChangingPassword} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg w-full sm:w-auto">
                {isChangingPassword ? "Alterando..." : "Alterar senha"}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Autenticação em duas etapas (2FA) */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <motion.div className="config-icon-badge bg-emerald-500/15 text-emerald-300" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
              <ShieldCheck className="w-4 h-4" />
            </motion.div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Autenticação em duas etapas (2FA)</h2>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança ao fazer login.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: MessageCircle, iconClass: "bg-sky-500/15 text-sky-300", title: "SMS", desc: "Código enviado para o telefone cadastrado", toastDesc: "2FA por SMS estará disponível em breve." },
              { icon: Smartphone, iconClass: "bg-violet-500/15 text-violet-300", title: "Aplicativo autenticador", desc: "Google Authenticator, Authy, etc.", toastDesc: "2FA por app estará disponível em breve." },
              { icon: Mail, iconClass: "bg-amber-500/15 text-amber-300", title: "E-mail", desc: "Código enviado para o e-mail cadastrado", toastDesc: "2FA por e-mail estará disponível em breve." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
              <motion.div
                key={item.title}
                custom={i}
                variants={itemVariants}
                className="config-item-row"
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <span className={`config-icon-badge ${item.iconClass}`}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex">
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Em breve", description: item.toastDesc })}>
                    Ativar
                  </Button>
                </motion.span>
              </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Dispositivos conectados */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="config-icon-badge bg-blue-500/15 text-blue-300">
              <DeviceIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Dispositivos conectados</h2>
              <p className="text-sm text-muted-foreground">Gerencie onde sua conta está logada.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {MOCK_DEVICES.map((device, i) => (
              <motion.li
                key={device.id}
                custom={i}
                variants={itemVariants}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-secondary/35 px-3 py-3"
                whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
              >
                <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{device.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {device.location} · <Clock className="w-3 h-3 inline" /> {device.lastAccess}
                  </p>
                </div>
                {device.current ? (
                  <span className="text-xs text-emerald-400">Este dispositivo</span>
                ) : (
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Dispositivo deslogado" })}>
                      Deslogar
                    </Button>
                  </motion.span>
                )}
              </motion.li>
            ))}
          </ul>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex w-full">
            <Button variant="outline" className="w-full" onClick={() => toast({ title: "Em breve", description: "Deslogar todos os dispositivos estará disponível em breve." })}>
              Deslogar todos os outros dispositivos
            </Button>
          </motion.div>
        </motion.div>

        {/* Histórico de atividade */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="config-icon-badge bg-cyan-500/15 text-cyan-300">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Histórico de atividade</h2>
              <p className="text-sm text-muted-foreground">Logins e alterações de segurança recentes.</p>
            </div>
          </div>
          <ul className="space-y-2">
            {MOCK_ACTIVITY.map((event, i) => (
              <motion.li
                key={i}
                custom={i}
                variants={itemVariants}
                className="flex gap-3 rounded-lg border border-border/60 bg-secondary/35 px-3 py-2.5"
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.detail}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">{event.time}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Biometria */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <motion.div
            className="config-item-row"
            whileHover={{ x: 4, transition: { duration: 0.15 } }}
          >
            <div className="config-icon-badge bg-fuchsia-500/15 text-fuchsia-300">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Login biométrico</p>
              <p className="text-xs text-muted-foreground">Impressão digital ou reconhecimento facial (app móvel)</p>
            </div>
            <Switch
              checked={biometricsEnabled}
              onCheckedChange={(v) => {
                setBiometricsEnabled(v);
                toast({ title: v ? "Biometria ativada" : "Biometria desativada", description: "Em dispositivos compatíveis." });
              }}
            />
          </motion.div>
        </motion.div>

        {/* Alertas de segurança */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="config-icon-badge bg-orange-500/15 text-orange-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Alertas de segurança</h2>
              <p className="text-sm text-muted-foreground">Notificações sobre acessos e alterações na conta.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: AlertTriangle, label: "Novos logins", desc: "Aviso quando sua conta for acessada de novo dispositivo ou local", checked: alertNewLogin, set: setAlertNewLogin },
              { icon: Lock, label: "Alteração de credenciais", desc: "Aviso quando senha ou e-mail forem alterados", checked: alertCredentials, set: setAlertCredentials },
              { icon: AlertTriangle, label: "Tentativas de acesso falhas", desc: "Aviso após várias tentativas de login incorretas", checked: alertFailedAttempts, set: setAlertFailedAttempts },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                custom={i}
                variants={itemVariants}
                className="config-item-row"
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
              >
                <row.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.desc}</p>
                </div>
                <Switch checked={row.checked} onCheckedChange={row.set} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacidade */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="config-icon-badge bg-indigo-500/15 text-indigo-300">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Privacidade e dados</h2>
              <p className="text-sm text-muted-foreground">Controle de permissões e uso de dados (LGPD).</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground/80 text-sm">Localização</Label>
              <select
                value={locationPermission}
                onChange={(e) => setLocationPermission(e.target.value as "always" | "usage" | "never")}
                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
              >
                <option value="usage">Apenas durante o uso do app</option>
                <option value="always">Sempre</option>
                <option value="never">Nunca</option>
              </select>
            </div>
            <motion.div
              className="config-item-row"
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Dados anonimizados para análise</p>
                <p className="text-xs text-muted-foreground">Permitir uso de dados anonimizados para melhorar o serviço</p>
              </div>
              <Switch checked={anonData} onCheckedChange={setAnonData} />
            </motion.div>
          </div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex w-full">
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteAccountOpen(true)}
            >
              Solicitar exclusão de dados ou conta
            </Button>
          </motion.div>
          <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                <AlertDialogDescription className="text-left space-y-2">
                  <span className="block">
                    Esta ação é <strong className="text-foreground">irreversível</strong>. Seus dados de perfil, agendamentos e preferências serão
                    removidos conforme a política de privacidade e a LGPD.
                  </span>
                  <span className="block text-destructive font-medium">Você perderá o acesso imediato ao BarberFlow.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    setDeleteAccountOpen(false);
                    beginAccountDeletion();
                  }}
                >
                  Sim, excluir minha conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Recuperação de conta */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-3"
        >
          <h2 className="text-lg font-display font-semibold text-foreground">Recuperação de conta</h2>
          <p className="text-sm text-muted-foreground">
            Em caso de perda de acesso, use seu e-mail ou telefone para redefinir a senha. Mantenha seus dados de contato atualizados no perfil.
          </p>
          <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex">
            <Button variant="outline" asChild>
              <Link to="/esqueci-senha" className="inline-flex items-center gap-2">
                Redefinir senha por e-mail
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.span>
        </motion.div>

        {/* Dicas de segurança */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="config-icon-badge bg-emerald-500/15 text-emerald-300">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Dicas de segurança</h2>
              <p className="text-sm text-muted-foreground">Boas práticas para proteger sua conta.</p>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tip1" className="border-border/60">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Como criar uma senha forte?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Use pelo menos 8 caracteres, misture letras, números e símbolos. Evite datas e palavras óbvias. Não reuse a mesma senha em outros sites.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tip2" className="border-border/60">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Como reconhecer phishing?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Desconfie de e-mails ou mensagens pedindo senha ou dados pessoais. O Barbeflow nunca pede sua senha por e-mail. Sempre verifique o endereço do site antes de digitar credenciais.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tip3" className="border-border/60">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                Cuidado com links suspeitos
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Não clique em links recebidos por e-mail ou mensagem sem confirmar a origem. Acesse o app sempre pelo site oficial ou aplicativo instalado.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Sair da conta */}
        <motion.div
          variants={cardVariants}
          className="glass-card rounded-2xl p-5 sm:p-6 space-y-3"
        >
          <motion.div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Conta verificada e protegida
          </motion.div>
          <motion.button
            type="button"
            onClick={handleLogout}
            className="config-logout-button w-full justify-center flex items-center gap-2"
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </motion.button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProfileSecurity;
