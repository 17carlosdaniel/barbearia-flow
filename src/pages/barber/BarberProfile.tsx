import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Save,
  Bell,
  Gift,
  MapPin,
  User,
  UserCircle,
  ChevronRight,
  LifeBuoy,
  CreditCard,
  LogOut,
  ShieldCheck,
  Store,
  Keyboard,
  Star,
  BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { ESTADOS } from "@/lib/constants";
import { getNotificationPrefs, loadNotificationPrefs, setNotificationPrefs } from "@/lib/notifications";
import { getFirstVisitOfferRaw, setFirstVisitOffer } from "@/lib/loyalty";

const BarberProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const ProfileIcon = identity === "vintage" ? User : UserCircle;
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");
  const [lembretesAgendamento, setLembretesAgendamento] = useState(true);
  const [novasAvaliacoes, setNovasAvaliacoes] = useState(true);
  const [ofertaPrimeiraVisita, setOfertaPrimeiraVisita] = useState(false);
  const [ofertaDesconto, setOfertaDesconto] = useState(10);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const barbershopId = user?.barbershopId ?? 1;

  const COVER_STORAGE_KEY = `barber-profile-cover-${barbershopId}`;
  const PROFILE_STORAGE_KEY = `barber-profile-photo-${barbershopId}`;

  useEffect(() => {
    if (user) {
      setNomeBarbearia(user.name);
      setEmail(user.email);
      setEstado(user.estado ?? "");
      setEndereco(user.endereco ?? "");
      const localPrefs = getNotificationPrefs(user.id);
      setLembretesAgendamento(localPrefs.lembretesAgendamento);
      setNovasAvaliacoes(localPrefs.novasAvaliacoes);
      void loadNotificationPrefs(user.id).then((prefs) => {
        setLembretesAgendamento(prefs.lembretesAgendamento);
        setNovasAvaliacoes(prefs.novasAvaliacoes);
      });
      const offer = getFirstVisitOfferRaw(barbershopId);
      setOfertaPrimeiraVisita(offer?.enabled ?? false);
      setOfertaDesconto(offer?.discountPercent ?? 10);
    }
  }, [user, barbershopId]);

  useEffect(() => {
    try {
      const storedCover = localStorage.getItem(COVER_STORAGE_KEY);
      if (storedCover) setCoverImageUrl(storedCover);
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) setProfileImageUrl(storedProfile);
    } catch {
      // ignore
    }
  }, [barbershopId, COVER_STORAGE_KEY, PROFILE_STORAGE_KEY]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    if ("permissions" in navigator && navigator.permissions?.query) {
      void navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => setLocationPermission(status.state))
        .catch(() => {
          // ignore
        });
    }
  }, []);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCoverImageUrl(dataUrl);
        try {
          localStorage.setItem(COVER_STORAGE_KEY, dataUrl);
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setProfileImageUrl(dataUrl);
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, dataUrl);
        } catch {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUser({
      name: nomeBarbearia.trim() || user.name,
      email: email.trim() || user.email,
      estado: estado || undefined,
      endereco: endereco.trim() || undefined,
    });
    toast({ title: "Perfil atualizado", description: "As alterações foram salvas." });
  };


  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const requestNotificationsPermission = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Navegador sem suporte", description: "Notificacoes nao sao suportadas neste navegador.", variant: "destructive" });
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    toast({ title: result === "granted" ? "Notificacoes ativadas" : "Permissao de notificacoes negada" });
  };

  const requestLocationPermission = () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Navegador sem suporte", description: "Geolocalizacao nao e suportada neste navegador.", variant: "destructive" });
      return;
    }
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (!window.isSecureContext && !isLocalHost) {
      toast({
        title: "Ative HTTPS para localizacao",
        description: "O navegador so permite localizacao em HTTPS ou localhost.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission("granted");
        toast({ title: "Localizacao ativada" });
      },
      (error) => {
        if (error.code === 1) {
          setLocationPermission("denied");
          toast({
            title: "Permissao bloqueada",
            description: "Libere a localizacao nas configuracoes do site (icone de cadeado na barra de endereco).",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Nao foi possivel obter localizacao",
          description: "Verifique GPS/conexao e tente novamente.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  if (!user) return null;

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mx-auto ${isModern ? "max-w-4xl space-y-6" : "max-w-3xl space-y-10"}`}>
        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
        <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />

        {/* 1. Cabeçalho da página */}
        <div className={isModern ? "mb-2" : "mb-4"}>
          <h1 className={`${isModern ? "text-2xl" : "text-3xl lg:text-4xl"} font-display font-bold text-foreground`}>
            {isModern ? "Conta" : "Conta da casa"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isModern 
              ? "Gerencie os dados principais, permissões e segurança da sua conta." 
              : "Organize a presença, as preferências e a proteção da sua casa."}
          </p>
        </div>

        {/* 2. Bloco superior de identidade e status da conta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className={`relative overflow-hidden border ${
            isModern 
              ? "rounded-2xl border-border bg-card shadow-sm" 
              : "rounded-2xl border-[hsl(var(--gold)/0.2)] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--card)/0.95)] shadow-2xl"
          }`}
        >
          {!isModern && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.3)] to-transparent" />
          )}
          
          <div
            role="button"
            tabIndex={0}
            onClick={() => coverInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && coverInputRef.current?.click()}
            className={`relative cursor-pointer group ${isModern ? "h-32 sm:h-36" : "h-40 sm:h-48"} bg-secondary`}
          >
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="Capa da barbearia" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${isModern ? "bg-muted" : "bg-gradient-to-r from-primary/20 to-secondary/40"}`} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <Camera className="w-6 h-6 text-white" />
              <span className="ml-2 text-sm font-medium text-white">Alterar capa</span>
            </div>
          </div>

          <div className={`px-6 pb-6 relative z-10 ${isModern ? "-mt-12" : "-mt-14"}`}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex items-end gap-4">
                <div className="relative group/avatar">
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className={`rounded-full border-4 border-card overflow-hidden flex items-center justify-center bg-card shadow-xl transition-transform group-hover/avatar:scale-105 ${
                      isModern ? "w-24 h-24" : "w-28 h-28"
                    }`}
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Foto da barbearia" className="w-full h-full object-cover" />
                    ) : (
                      <ProfileIcon className={`${isModern ? "w-12 h-12" : "w-14 h-14"} text-muted-foreground`} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className={`absolute right-0 bottom-0 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                      isModern 
                        ? "w-8 h-8 bg-primary text-white" 
                        : "w-9 h-9 bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="pb-1 min-w-0">
                  <h2 className={`${isModern ? "text-xl" : "text-2xl lg:text-3xl"} font-display font-bold text-foreground truncate`}>
                    {nomeBarbearia || user.name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate mb-2">{email || user.email}</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                    isModern 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  } text-[10px] font-bold uppercase tracking-wider`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isModern ? "Conta protegida" : "Casa protegida e pronta"}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-2 ${isModern ? "sm:pb-1" : "sm:pb-2"}`}>
                <Button 
                  variant="outline" 
                  size={isModern ? "sm" : "default"}
                  className={`rounded-xl border-border ${isModern ? "h-9 text-xs" : "h-11 px-6"}`}
                  onClick={() => navigate("/barbeiro/minha-barbearia")}
                >
                  Ver perfil público
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className={`grid grid-cols-1 lg:grid-cols-12 ${isModern ? "gap-6" : "gap-10"}`}>
          <div className="lg:col-span-7 space-y-6">
            {/* 3. Dados principais da barbearia/conta */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className={`border ${
                isModern 
                  ? "rounded-2xl border-border bg-card p-5" 
                  : "rounded-2xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.3)] p-8"
              }`}
            >
              <div className="mb-6">
                <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-base" : "text-xl"}`}>
                  {isModern ? "Dados principais" : "Dados da casa"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isModern ? "Atualize as informações públicas e de contato." : "Atualize as informações públicas e o contato principal da barbearia."}
                </p>
              </div>
              
              <form onSubmit={handleSave} className={isModern ? "space-y-4" : "space-y-6"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Barbearia</Label>
                    <Input value={nomeBarbearia} onChange={(e) => setNomeBarbearia(e.target.value)} className="bg-muted/30 border-border rounded-xl h-11" placeholder="Nome da barbearia" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/30 border-border rounded-xl h-11" placeholder="contato@barbearia.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estado</Label>
                    <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full rounded-xl bg-muted/30 border border-border px-3 h-11 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">Selecione</option>
                      {ESTADOS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço</Label>
                    <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="bg-muted/30 border-border rounded-xl h-11" placeholder="Endereço completo da barbearia" />
                  </div>
                </div>
                <Button type="submit" className={`font-bold transition-all ${
                  isModern 
                    ? "bg-primary text-white hover:bg-primary/90 h-10 px-6 rounded-xl text-xs" 
                    : "bg-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold-light))] h-12 px-8 rounded-xl shadow-lg"
                }`}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar alterações
                </Button>
              </form>
            </motion.div>

            {/* 4. Preferências e permissões */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13 }}
              className={`border ${
                isModern 
                  ? "rounded-2xl border-border bg-card p-5" 
                  : "rounded-2xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.3)] p-8"
              }`}
            >
              <div className="mb-6">
                <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-base" : "text-xl"}`}>
                  {isModern ? "Preferências" : "Preferências da casa"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isModern ? "Gerencie permissões, alertas e comportamentos." : "Defina alertas, permissões e comportamentos importantes do dia a dia."}
                </p>
              </div>

              <div className="space-y-1">
                {[
                  { 
                    label: "Notificações", 
                    desc: notificationPermission === "granted" ? "Ativadas" : "Pendente", 
                    icon: Bell, 
                    color: "bg-sky-500",
                    action: requestNotificationsPermission,
                    type: "button"
                  },
                  { 
                    label: "Localização", 
                    desc: locationPermission === "granted" ? "Ativada" : "Pendente", 
                    icon: MapPin, 
                    color: "bg-emerald-500",
                    action: requestLocationPermission,
                    type: "button"
                  },
                  { 
                    label: "Lembretes", 
                    desc: "Avisos sobre agenda", 
                    icon: Bell, 
                    color: "bg-violet-500",
                    checked: lembretesAgendamento,
                    action: (v: boolean) => {
                      setLembretesAgendamento(v);
                      if (user) setNotificationPrefs(user.id, { lembretesAgendamento: v });
                    },
                    type: "switch"
                  },
                  { 
                    label: "Avaliações", 
                    desc: "Alertas de feedback", 
                    icon: Star, 
                    color: "bg-indigo-500",
                    checked: novasAvaliacoes,
                    action: (v: boolean) => {
                      setNovasAvaliacoes(v);
                      if (user) setNotificationPrefs(user.id, { novasAvaliacoes: v });
                    },
                    type: "switch"
                  },
                  { 
                    label: "Oferta inicial", 
                    desc: "Desconto para novos clientes", 
                    icon: Gift, 
                    color: "bg-amber-500",
                    checked: ofertaPrimeiraVisita,
                    action: (v: boolean) => {
                      setOfertaPrimeiraVisita(v);
                      setFirstVisitOffer(barbershopId, { enabled: v, discountPercent: ofertaDesconto });
                    },
                    type: "switch"
                  }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 py-3 border-b border-border/40 last:border-0`}>
                    <div className={`w-9 h-9 rounded-xl ${item.color}/10 flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4.5 h-4.5 text-${item.color.split('-')[1]}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    {item.type === "button" ? (
                      <Button variant="outline" size="sm" onClick={item.action} className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Configurar
                      </Button>
                    ) : (
                      <Switch checked={item.checked} onCheckedChange={item.action} />
                    )}
                  </div>
                ))}
              </div>

              {ofertaPrimeiraVisita && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Desconto (%)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={ofertaDesconto}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n)) {
                        const finalDiscount = Math.max(5, Math.min(50, n));
                        setOfertaDesconto(finalDiscount);
                        setFirstVisitOffer(barbershopId, { enabled: true, discountPercent: finalDiscount });
                      }
                    }}
                    className="w-20 bg-muted/30 border-border h-9 rounded-lg text-sm"
                  />
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* 5. Gestão da conta (Agrupado) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className={`border ${
                isModern 
                  ? "rounded-2xl border-border bg-card p-5" 
                  : "rounded-3xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.3)] p-8"
              }`}
            >
              <div className="mb-6">
                <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-base" : "text-xl"}`}>
                  {isModern ? "Gestão da conta" : "Gestão da casa"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isModern ? "Acesse pagamentos, suporte e recursos." : "Acompanhe pagamentos, suporte e recursos da conta."}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Configurar Pix", icon: CreditCard, path: "/barbeiro/financeiro", color: "text-amber-400" },
                  { label: "Histórico financeiro", icon: BarChart2, path: "/barbeiro/financeiro", color: "text-yellow-400" },
                  { label: "Atalhos de teclado", icon: Keyboard, path: "/barbeiro/atalhos", color: "text-primary" },
                  { label: "Ajuda e Suporte", icon: LifeBuoy, path: "/suporte", color: "text-cyan-400" },
                  { label: "Sobre o BarberFlow", icon: Store, path: "/guia", color: "text-fuchsia-400" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/40 group border border-transparent hover:border-border/40`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50 group-hover:border-primary/20`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 6. Segurança (Agrupado) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.23 }}
              className={`border ${
                isModern 
                  ? "rounded-2xl border-border bg-card p-5" 
                  : "rounded-3xl border-[hsl(var(--border))] bg-[hsl(var(--card)/0.3)] p-8"
              }`}
            >
              <div className="mb-6">
                <h3 className={`font-display font-semibold text-foreground ${isModern ? "text-base" : "text-xl"}`}>
                  {isModern ? "Segurança" : "Proteção e privacidade"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isModern ? "Proteja a conta e revise acessos." : "Revise acessos, proteja a conta e mantenha a casa segura."}
                </p>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                  isModern 
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                }`}>
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-widest">Verificada e protegida</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/barbeiro/seguranca")}
                  className="w-full h-11 rounded-xl border-border hover:bg-muted/50 justify-between group"
                >
                  <span className="text-sm">Configurações de segurança</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 justify-start"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sair da conta
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberProfile;
