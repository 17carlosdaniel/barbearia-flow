import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Bell,
  Moon,
  MapPin,
  User,
  UserCircle,
  Camera,
  ChevronRight,
  CreditCard,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Globe,
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
import { ESTADOS, getCidades } from "@/lib/constants";
import { getNotificationPrefs, loadNotificationPrefs, setNotificationPrefs } from "@/lib/notifications";

const ClientProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { identity } = useTheme();
  const ProfileIcon = identity === "vintage" ? User : UserCircle;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [lembretesAgendamento, setLembretesAgendamento] = useState(true);
  const [promocoes, setPromocoes] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEnd] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const profileInputRef = useRef<HTMLInputElement>(null);

  const PROFILE_STORAGE_KEY = `client-profile-photo-${user?.id ?? "guest"}`;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setEstado(user.estado ?? "");
      setCidade(user.cidade ?? "");
      const localPrefs = getNotificationPrefs(user.id);
      setLembretesAgendamento(localPrefs.lembretesAgendamento);
      setPromocoes(localPrefs.promocoes);
      setQuietHoursStart(localPrefs.quietHoursStart);
      setQuietHoursEnd(localPrefs.quietHoursEnd);
      void loadNotificationPrefs(user.id).then((prefs) => {
        setLembretesAgendamento(prefs.lembretesAgendamento);
        setPromocoes(prefs.promocoes);
        setQuietHoursStart(prefs.quietHoursStart);
        setQuietHoursEnd(prefs.quietHoursEnd);
      });
    }
  }, [user]);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) setProfileImageUrl(storedProfile);
    } catch {
      // ignore
    }
  }, [PROFILE_STORAGE_KEY]);

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

  const cidades = estado ? getCidades(estado) : [];

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUser({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      estado: estado || undefined,
      cidade: cidade || undefined,
    });
    toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
  };

  if (!user) return null;

  const isVintage = identity === "vintage";

  return (
    <DashboardLayout userType="cliente">
      <div className="max-w-4xl mx-auto">
        {isVintage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
            {/* VINTAGE: BLOCO SUPERIOR DE IDENTIDADE */}
            <header className="relative py-8 px-6 sm:px-10 rounded-[2.5rem] bg-gradient-to-br from-card via-card/80 to-background border border-primary/10 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <ProfileIcon className="w-32 h-32" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="relative group/photo">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  <div className="w-28 h-28 rounded-3xl border-2 border-primary/20 overflow-hidden bg-primary/5 shadow-inner flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
                      ) : (
                        <ProfileIcon className="w-12 h-12 text-primary/30" />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute -right-2 -bottom-2 w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl font-vintage-heading font-black text-foreground tracking-tight leading-none mb-2">
                    {name || user.name}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground opacity-80 mb-4">{email || user.email}</p>
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary font-bold text-[11px] uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Conta protegida
                  </div>
                </div>
              </div>
            </header>

            {/* VINTAGE: BLOCO PRINCIPAL (DADOS) */}
            <section className="bg-card/40 backdrop-blur-sm rounded-[2rem] border border-primary/5 p-8 sm:p-10 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-32 bg-gradient-to-b from-primary/30 to-transparent" />
               <div className="mb-8">
                <h2 className="text-2xl font-vintage-heading font-bold text-foreground">Sua conta</h2>
                <p className="text-xs text-muted-foreground mt-1 opacity-70 italic tracking-wide">Gerencie seus dados e acesso básico</p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-primary/70 text-[11px] font-bold uppercase tracking-widest ml-1">Nome Completo</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="h-12 bg-transparent border-0 border-b border-primary/10 rounded-none focus-visible:ring-0 focus-visible:border-primary/40 px-1 text-base placeholder:opacity-30" 
                      placeholder="Identifique-se" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-primary/70 text-[11px] font-bold uppercase tracking-widest ml-1">E-mail</Label>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="h-12 bg-transparent border-0 border-b border-primary/10 rounded-none focus-visible:ring-0 focus-visible:border-primary/40 px-1 text-base placeholder:opacity-30" 
                      placeholder="como@falamos.com" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-primary/70 text-[11px] font-bold uppercase tracking-widest ml-1">Estado</Label>
                    <select
                      value={estado}
                      onChange={(e) => { setEstado(e.target.value); setCidade(""); }}
                      className="w-full h-12 bg-transparent border-0 border-b border-primary/10 rounded-none focus-visible:outline-none focus-visible:border-primary/40 px-1 text-base text-foreground appearance-none cursor-pointer"
                    >
                      <option value="">Onde você está?</option>
                      {ESTADOS.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-primary/70 text-[11px] font-bold uppercase tracking-widest ml-1">Cidade</Label>
                    <select
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full h-12 bg-transparent border-0 border-b border-primary/10 rounded-none focus-visible:outline-none focus-visible:border-primary/40 px-1 text-base text-foreground appearance-none cursor-pointer disabled:opacity-30"
                      disabled={!estado}
                    >
                      <option value="">Selecione sua cidade</option>
                      {cidades.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end sm:justify-start">
                  <Button type="submit" variant="gold" className="rounded-xl px-10 h-12 transition-all hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.4)]">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </section>

            {/* VINTAGE: PREFERÊNCIAS (EXPERIÊNCIA INTEGRADA) */}
            <section className="space-y-6">
              <div className="px-2">
                <h2 className="text-2xl font-vintage-heading font-bold text-foreground">Preferências da jornada</h2>
                <p className="text-sm text-muted-foreground opacity-70">Ajuste como você prefere receber avisos e acompanhar sua rotina</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Subgrupo 1: Permissões de Sistema */}
                 <div className="bg-card/30 border border-primary/5 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Acesso ao Web</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2 border-b border-primary/5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Notificações</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {notificationPermission === "granted" ? "Ativada" : "Pendente"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-[10px] uppercase font-black tracking-widest" onClick={requestNotificationsPermission}>
                        Configurar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Localização</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {locationPermission === "granted" ? "Ativada" : "Bloqueada"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-[10px] uppercase font-black tracking-widest" onClick={requestLocationPermission}>
                        Configurar
                      </Button>
                    </div>
                 </div>

                 {/* Subgrupo 2: Lembretes e Ofertas */}
                 <div className="bg-card/30 border border-primary/5 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                        <Bell className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">Avisos da Agenda</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1 border-b border-primary/5">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Avisos de horário</p>
                        <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">Lembretes proativos</p>
                      </div>
                      <Switch
                        checked={lembretesAgendamento}
                        onCheckedChange={(v) => {
                          setLembretesAgendamento(v);
                          if (user) setNotificationPrefs(user.id, { lembretesAgendamento: v });
                          toast({ title: "Preferência salva" });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Ofertas e Clube</p>
                        <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">Oportunidades únicas</p>
                      </div>
                      <Switch
                        checked={promocoes}
                        onCheckedChange={(v) => {
                          setPromocoes(v);
                          if (user) setNotificationPrefs(user.id, { promocoes: v });
                          toast({ title: "Preferência salva" });
                        }}
                      />
                    </div>
                 </div>

                 {/* Subgrupo 3: Horário Silencioso (Ocupando 2 colunas no MD) */}
                 <div className="md:col-span-2 bg-gradient-to-r from-card/30 to-background border border-primary/5 rounded-3xl p-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10">
                        <Moon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Horário silencioso</h3>
                        <p className="text-xs text-muted-foreground opacity-80 leading-relaxed max-w-xs">Escolha um intervalo para silenciar a jornada e focar no que importa</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-background/40 p-2 rounded-2xl border border-primary/5">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-black text-primary/40 mb-1">Início</span>
                        <select
                          value={quietHoursStart == null ? "" : String(quietHoursStart)}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setQuietHoursStart(value);
                            if (user) setNotificationPrefs(user.id, { quietHoursStart: value });
                          }}
                          className="bg-transparent text-sm font-black text-primary appearance-none cursor-pointer focus:outline-none"
                        >
                          <option value="">--:--</option>
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={`qhs-v-${h}`} value={h}>{String(h).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary/20" />
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-black text-primary/40 mb-1">Fim</span>
                        <select
                          value={quietHoursEnd == null ? "" : String(quietHoursEnd)}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setQuietHoursEnd(value);
                            if (user) setNotificationPrefs(user.id, { quietHoursEnd: value });
                          }}
                          className="bg-transparent text-sm font-black text-primary appearance-none cursor-pointer focus:outline-none"
                        >
                          <option value="">--:--</option>
                          {Array.from({ length: 24 }, (_, h) => (
                            <option key={`qhe-v-${h}`} value={h}>{String(h).padStart(2, "0")}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* VINTAGE: BLOCO "CONTA" (PAGAMENTOS + SUPORTE UNIFICADOS) */}
            <section className="bg-card/20 rounded-[2.5rem] p-8 border border-primary/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-vintage-heading font-black text-foreground">Cobranças e cartões</h2>
                    <p className="text-xs text-muted-foreground italic">Gerencie seu fluxo financeiro</p>
                  </div>
                  <div className="space-y-4">
                    <button onClick={() => navigate("/cliente/cartoes")} className="flex items-center gap-4 w-full group/btn text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/60 flex items-center justify-center border border-primary/5 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="flex-1 text-sm font-bold border-b border-primary/5 py-2 group-hover/btn:border-primary/20 transition-all">Cartões salvos</span>
                      <ChevronRight className="w-4 h-4 text-primary/30 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate("/cliente/historico")} className="flex items-center gap-4 w-full group/btn text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/60 flex items-center justify-center border border-primary/5 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="flex-1 text-sm font-bold border-b border-primary/5 py-2 group-hover/btn:border-primary/20 transition-all">Histórico de faturas</span>
                      <ChevronRight className="w-4 h-4 text-primary/30 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-vintage-heading font-black text-foreground">Ajuda e orientação</h2>
                    <p className="text-xs text-muted-foreground italic">Sempre que precisar de um guia</p>
                  </div>
                  <div className="space-y-4">
                    <button onClick={() => navigate("/suporte")} className="flex items-center gap-4 w-full group/btn text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/60 flex items-center justify-center border border-primary/5 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors">
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <span className="flex-1 text-sm font-bold border-b border-primary/5 py-2 group-hover/btn:border-primary/20 transition-all">Central de ajuda</span>
                      <ChevronRight className="w-4 h-4 text-primary/30 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate("/guia")} className="flex items-center gap-4 w-full group/btn text-left">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary/60 flex items-center justify-center border border-primary/5 group-hover/btn:bg-primary/10 group-hover/btn:text-primary transition-colors">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="flex-1 text-sm font-bold border-b border-primary/5 py-2 group-hover/btn:border-primary/20 transition-all">Guia do aplicativo</span>
                      <ChevronRight className="w-4 h-4 text-primary/30 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* VINTAGE: SEGURANÇA (MAIS DESTAQUE, MAIS PRESTÍGIO) */}
            <section className="relative px-8 py-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-900/10 via-card/40 to-card/20 border-2 border-primary/5 shadow-2xl overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-[0_15px_35px_-10px_rgba(16,185,129,0.3)] border border-emerald-500/20">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-vintage-heading font-black text-foreground">Proteção da conta</h2>
                  <p className="text-sm text-emerald-300 font-bold mb-4 tracking-tight">Status: Conta protegida e ativa</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-primary/20 bg-background/40 hover:bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px] h-11 px-6 shadow-sm"
                      onClick={() => navigate("/cliente/seguranca")}
                    >
                      Segurança e Privacidade
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair da conta
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
            {/* MODERN: CABEÇALHO FUNCIONAL */}
            <header className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
              <div className="relative group shrink-0">
                <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center relative">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
                  ) : (
                    <ProfileIcon className="w-8 h-8 text-muted-foreground/60" />
                  )}
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h1 className="text-2xl font-display font-bold text-foreground tracking-tight truncate leading-none">
                    {name || user.name}
                  </h1>
                  <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tight w-fit mx-auto sm:mx-0">
                    Conta protegida
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1 truncate">{email || user.email}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5 leading-none">Gerencie seus dados, avisos e acessos</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg h-9 hidden sm:flex text-destructive border-border hover:bg-destructive/5 hover:text-destructive active:bg-destructive/10 transition-colors" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* MODERN: DADOS PESSOAIS */}
              <div className="lg:col-span-12">
                <section className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground tracking-tight">Perfil</h2>
                      <p className="text-xs text-muted-foreground">Informações primárias da conta</p>
                    </div>
                    <Button onClick={handleSave} size="sm" className="hidden sm:flex rounded-lg shadow-sm">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Manualmente
                    </Button>
                  </div>
                  <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5 lg:col-span-2">
                      <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80">Nome</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 bg-muted/30 border-border/40 text-sm" />
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                      <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80">E-mail</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-muted/30 border-border/40 text-sm" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                      <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80">Estado</Label>
                      <select
                        value={estado}
                        onChange={(e) => { setEstado(e.target.value); setCidade(""); }}
                        className="w-full h-10 rounded-lg bg-muted/30 border border-border/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        <option value="">UF</option>
                        {ESTADOS.map((uf) => (<option key={uf} value={uf}>{uf}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                      <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/80">Cidade</Label>
                      <select
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full h-10 rounded-lg bg-muted/30 border border-border/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                        disabled={!estado}
                      >
                        <option value="">Cidade</option>
                        {cidades.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div className="sm:hidden pt-2">
                      <Button type="submit" className="w-full h-11 rounded-xl">Salvar alterações</Button>
                    </div>
                  </form>
                </section>
              </div>

              {/* MODERN: PREFERÊNCIAS COMPACTAS */}
              <div className="lg:col-span-7">
                <section className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm h-full flex flex-col">
                  <h2 className="text-lg font-bold text-foreground tracking-tight mb-5">Preferências</h2>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                        <span className="text-sm font-medium">Notificações</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-3" onClick={requestNotificationsPermission}>
                        {notificationPermission === "granted" ? "Ativo" : "Ativar"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
                        <span className="text-sm font-medium">Localização</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase px-3" onClick={requestLocationPermission}>
                        {locationPermission === "granted" ? "Ativo" : "Ativar"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">Lembretes</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Horários e agenda</span>
                        </div>
                      </div>
                      <Switch 
                        checked={lembretesAgendamento} 
                        onCheckedChange={(v) => {
                          setLembretesAgendamento(v);
                          if (user) setNotificationPrefs(user.id, { lembretesAgendamento: v });
                        }} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">Ofertas</span>
                          <span className="text-[10px] text-muted-foreground mt-1">Clube de benefícios</span>
                        </div>
                      </div>
                      <Switch 
                        checked={promocoes} 
                        onCheckedChange={(v) => {
                          setPromocoes(v);
                          if (user) setNotificationPrefs(user.id, { promocoes: v });
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none">Horário silencioso</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Status: {quietHoursStart !== null ? "Configurado" : "Livre"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={quietHoursStart == null ? "" : String(quietHoursStart)}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setQuietHoursStart(value);
                            if (user) setNotificationPrefs(user.id, { quietHoursStart: value });
                          }}
                          className="rounded-lg bg-muted text-[11px] font-bold border-none px-2 py-1 h-7 focus:ring-0"
                        >
                          <option value="">De</option>
                          {Array.from({ length: 24 }, (_, h) => (<option key={`qhs-m-${h}`} value={h}>{String(h).padStart(2, "0")}:00</option>))}
                        </select>
                        <select
                          value={quietHoursEnd == null ? "" : String(quietHoursEnd)}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setQuietHoursEnd(value);
                            if (user) setNotificationPrefs(user.id, { quietHoursEnd: value });
                          }}
                          className="rounded-lg bg-muted text-[11px] font-bold border-none px-2 py-1 h-7 focus:ring-0"
                        >
                          <option value="">Até</option>
                          {Array.from({ length: 24 }, (_, h) => (<option key={`qhe-m-${h}`} value={h}>{String(h).padStart(2, "0")}:00</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* MODERN: UTILITÁRIOS (PAGAMENTOS + AJUDA) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <section className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Utilidades</h2>
                  <div className="space-y-2">
                    <button onClick={() => navigate("/cliente/cartoes")} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Pagamentos</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button onClick={() => navigate("/suporte")} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <LifeBuoy className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Ajuda e Suporte</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </section>

                {/* MODERN: SEGURANÇA OBJETIVA */}
                <section className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Segurança</h2>
                    <p className="text-xs text-indigo-700/60 font-medium">Conta ativa e monitorada</p>
                    <button 
                      onClick={() => navigate("/cliente/seguranca")}
                      className="mt-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4"
                    >
                      Gerenciar acessos
                    </button>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-12 sm:hidden pt-4">
                 <Button onClick={handleLogout} variant="ghost" className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10">
                   <LogOut className="w-4 h-4 mr-2" />
                   Sair da conta
                 </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;
