import { useState, useEffect, useMemo, Fragment } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Mail,
  Trash2,
  Copy,
  Crown,
  Clock,
  ShieldCheck,
  Scissors,
  Star,
  BarChart2,
  Calendar,
  CheckCircle2,
  QrCode,
  Link as LinkIcon,
  Zap,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import {
  getTeam,
  initTeam,
  inviteMember,
  createInviteWithShortCode,
  cancelInvite,
  removeMember,
  getLimitByPlan,
  type TeamData,
} from "@/lib/team";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getBarberCatalog } from "@/lib/barberCatalog";
import { getMockAgendaForMember, type MockAgendaItem, type MockAgendaSummary } from "@/lib/teamMemberAgendaMock";
import { BarberAgendaDrawer, type BarberAgendaDrawerBarber } from "@/components/barber/BarberAgendaDrawer";
import { cn } from "@/lib/utils";

type MemberRole = "gerente" | "barbeiro";
type MemberStatus = "online" | "atendendo" | "offline";
type InviteMode = "email" | "link" | "code";
type MemberMeta = {
  role: MemberRole;
  commissionPercent: number;
  serviceIds: string[];
  status: MemberStatus;
};

const BarberEquipe = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const barbershopId = user?.barbershopId ?? 1;
  const isOwner = user?.isBarbershopOwner !== false;
  const profile = getBarbershopProfile(barbershopId);
  const plano = profile.plano ?? "profissional";
  const catalog = getBarberCatalog(barbershopId);

  const [team, setTeam] = useState<TeamData | null>(null);
  const [emailConvite, setEmailConvite] = useState("");
  const [papelConvite, setPapelConvite] = useState<MemberRole>("barbeiro");
  const [enviando, setEnviando] = useState(false);
  const [codigoAcessoGerado, setCodigoAcessoGerado] = useState<string | null>(null);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [memberMeta, setMemberMeta] = useState<Record<string, MemberMeta>>({});
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmailFocused, setInviteEmailFocused] = useState(false);
  const [inviteMode, setInviteMode] = useState<InviteMode>("email");
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [agendaMemberUserId, setAgendaMemberUserId] = useState<string | null>(null);
  const [agendaOpen, setAgendaOpen] = useState(false);

  useEffect(() => {
    let data = getTeam(barbershopId);
    if (!data && isOwner && user) {
      initTeam(barbershopId, {
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      data = getTeam(barbershopId);
    }
    setTeam(data ?? null);
  }, [barbershopId, isOwner, user]);

  useEffect(() => {
    const key = `barbeflow_team_meta_${barbershopId}`;
    try {
      const raw = localStorage.getItem(key);
      setMemberMeta(raw ? JSON.parse(raw) : {});
    } catch {
      setMemberMeta({});
    }
  }, [barbershopId]);

  const saveMeta = (next: Record<string, MemberMeta>) => {
    setMemberMeta(next);
    localStorage.setItem(`barbeflow_team_meta_${barbershopId}`, JSON.stringify(next));
  };

  const getMeta = (userId: string): MemberMeta => {
    return memberMeta[userId] ?? {
      role: "barbeiro",
      commissionPercent: 50,
      serviceIds: catalog.services.map((s) => s.id).slice(0, 2),
      status: "online",
    };
  };

  const updateMeta = (userId: string, patch: Partial<MemberMeta>) => {
    const next = { ...memberMeta, [userId]: { ...getMeta(userId), ...patch } };
    saveMeta(next);
  };

  const copy = isModern
    ? {
        title: "Equipe",
        subtitle: "Gerencie membros, funções e capacidade da sua operação.",
        planTitle: "Capacidade atual",
        planText: "Acompanhe o limite do plano e adicione membros conforme a operação crescer.",
        membersTitle: "Membros",
        emptyTitle: "Adicione o primeiro membro",
        emptyText: "Amplie a agenda, distribua atendimentos e organize funções da equipe.",
        inviteTitle: "Convidar membro",
        inviteText: "Envie um convite e defina o papel antes da entrada na equipe.",
        pendingTitle: "Convites pendentes",
        pendingText: "Acompanhe convites enviados e ações pendentes de aceite.",
        addCta: "Adicionar membro",
        upgradeCta: "Fazer upgrade",
        inviteMainCta: "Enviar convite",
        inviteSecondaryCta: "Mais opções",
      }
    : {
        title: "Equipe",
        subtitle: "Reúna os profissionais da casa e amplie sua capacidade de atendimento.",
        planTitle: "Ritmo atual da equipe",
        planText: "Veja quantos membros acompanham a operação hoje e quando vale abrir espaço para mais gente na casa.",
        membersTitle: "Membros da casa",
        emptyTitle: "Sua equipe começa aqui",
        emptyText: "Convide o primeiro barbeiro para dividir atendimentos, abrir novos horários e dar mais corpo à operação.",
        inviteTitle: "Convites da casa",
        inviteText: "Traga novos profissionais para a equipe e defina o papel de cada um desde a entrada.",
        pendingTitle: "Convites pendentes",
        pendingText: "Acompanhe quem ainda não entrou para a equipe e mantenha o processo em ordem.",
        addCta: "Adicionar à bancada",
        upgradeCta: "Expandir casa",
        inviteMainCta: "Convidar para a casa",
        inviteSecondaryCta: "Outras formas",
      };

  const iconBadgeClass = cn(
    "flex shrink-0 items-center justify-center rounded-xl border",
    isModern ? "h-9 w-9 border-primary/15 bg-primary/8" : "h-10 w-10 border-primary/25 bg-primary/10",
  );

  const sectionClass = cn(
    "glass-card relative overflow-hidden rounded-xl border p-5 lg:p-6",
    isModern ? "border-border/50 bg-card/90 shadow-sm" : "border-primary/20 bg-card/95 shadow-[0_0_36px_-20px_hsl(var(--primary)/0.35)]",
  );

  const accentColor = "text-primary";
  const accentBorder = "border-primary/25";

  const handleConvidar = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteFeedback(null);
    const email = emailConvite.trim();
    if (!email) {
      toast({ title: "Digite um e-mail", variant: "destructive" });
      return;
    }
    setEnviando(true);
    const result = inviteMember(barbershopId, email, plano);
    setEnviando(false);
    setEmailConvite("");
    if (!result.success) {
      toast({ title: "Convite não enviado", description: result.error, variant: "destructive" });
      return;
    }
    setTeam(getTeam(barbershopId) ?? null);
    const link = `${window.location.origin}/aceitar-convite/${result.token}`;
    navigator.clipboard.writeText(link);
    if (isModern) setInviteModalOpen(false);
    toast({
      title: "Convite enviado!",
      description: "A pessoa recebe um link e entra direto no sistema.",
    });
    setInviteFeedback("Convite enviado!");
  };

  const handleAdicionarMembro = () => {
    if (isModern) {
      setInviteModalOpen(true);
      return;
    }
    const el = document.getElementById("equipe-convite-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      toast({ title: "Use o formulário de convites", description: "Preencha o e-mail e envie o convite." });
    }
  };

  const handleFazerUpgrade = () => {
    window.location.assign("/barbeiro/assinatura");
  };

  const handleGerarCodigoAcesso = () => {
    setInviteFeedback(null);
    setGerandoCodigo(true);
    const result = createInviteWithShortCode(barbershopId, plano);
    setGerandoCodigo(false);
    if (!result.success) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
      return;
    }
    setTeam(getTeam(barbershopId) ?? null);
    const value = result.shortCode ?? result.link ?? "";
    setCodigoAcessoGerado(value);
    if (result.shortCode) {
      navigator.clipboard.writeText(result.shortCode);
      toast({ title: "Código gerado", description: "Código copiado! A pessoa pode colar na tela de Login." });
      setInviteFeedback("Código copiado!");
    } else if (result.link) {
      navigator.clipboard.writeText(result.link);
      toast({ title: "Link de convite gerado", description: "Link copiado! Envie para o convidado." });
      setInviteFeedback("Link copiado!");
    }
  };

  const handleGerarLinkMagico = () => {
    setInviteFeedback(null);
    setGerandoCodigo(true);
    const result = createInviteWithShortCode(barbershopId, plano);
    setGerandoCodigo(false);
    if (!result.success) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
      return;
    }
    setTeam(getTeam(barbershopId) ?? null);
    const link = result.link ?? "";
    setCodigoAcessoGerado(link);
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: "Link mágico gerado", description: "Link copiado! Cole na barra de endereço para compartilhar." });
      setInviteFeedback("Link copiado!");
    }
  };

  const copiarCodigoAcesso = () => {
    if (codigoAcessoGerado) {
      navigator.clipboard.writeText(codigoAcessoGerado);
      toast({ title: "Copiado!", description: "Código na área de transferência." });
      setInviteFeedback(codigoAcessoGerado.startsWith("http") ? "Link copiado!" : "Código copiado!");
    }
  };

  const handleCancelarConvite = (email: string) => {
    cancelInvite(barbershopId, email);
    setTeam(getTeam(barbershopId) ?? null);
    toast({ title: "Convite cancelado" });
  };

  const handleRemover = (userId: string) => {
    removeMember(barbershopId, userId);
    setTeam(getTeam(barbershopId) ?? null);
    const next = { ...memberMeta };
    delete next[userId];
    saveMeta(next);
    toast({ title: "Membro removido da equipe" });
  };

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/aceitar-convite/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const limit = getLimitByPlan(plano);
  const totalAtual = team ? 1 + team.members.length + team.pendingInvites.length : 0;
  const ocupacaoPlano = limit === 999 ? 15 : Math.min(100, Math.round((totalAtual / Math.max(1, limit)) * 100));
  const statusStyle: Record<MemberStatus, string> = {
    online: "bg-emerald-500/15 text-emerald-500",
    atendendo: "bg-amber-500/15 text-amber-500",
    offline: "bg-muted text-muted-foreground",
  };
  const statusLabel: Record<MemberStatus, string> = {
    online: "Online",
    atendendo: "Atendendo",
    offline: "Offline",
  };

  const perfFor = (userId: string, idx: number) => {
    const seed = userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + idx * 17;
    const atendimentos = 18 + (seed % 35);
    const receita = atendimentos * (40 + (seed % 20));
    const avaliacao = (4 + ((seed % 10) / 10)).toFixed(1);
    return { atendimentos, receita, avaliacao };
  };

  const ownerPerfStats = team ? perfFor(team.owner.userId, -1) : null;
  const memberRows = team?.members.map((m, idx) => ({ m, perf: perfFor(m.userId, idx) })) ?? [];
  const sumAtendimentos =
    (ownerPerfStats?.atendimentos ?? 0) + memberRows.reduce((s, r) => s + r.perf.atendimentos, 0);
  const sumReceita = (ownerPerfStats?.receita ?? 0) + memberRows.reduce((s, r) => s + r.perf.receita, 0);
  const ratingVals = [ownerPerfStats?.avaliacao, ...memberRows.map((r) => r.perf.avaliacao)]
    .map((x) => parseFloat(String(x)))
    .filter((n) => !Number.isNaN(n));
  const mediaAvaliacao = ratingVals.length
    ? (ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length).toFixed(1)
    : "—";

  const motionT = isModern
    ? { duration: 0.12 }
    : { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const };
  const roleLabel = papelConvite === "gerente" ? "Gerente" : "Barbeiro";
  const normalizedInviteEmail = emailConvite.trim().toLowerCase();
  const inviteInitials = useMemo(() => {
    const head = normalizedInviteEmail.split("@")[0] || "NN";
    const onlyLetters = head.replace(/[^a-zA-Z]/g, "").toUpperCase();
    return (onlyLetters.slice(0, 2) || "NN").padEnd(2, "N");
  }, [normalizedInviteEmail]);
  const hasBarbershopDomain = normalizedInviteEmail.includes("@barbearia");
  const isEmailAlreadyInTeam = useMemo(() => {
    if (!team || !normalizedInviteEmail) return false;
    const ownerMatch = team.owner.email.trim().toLowerCase() === normalizedInviteEmail;
    const memberMatch = team.members.some((m) => m.email.trim().toLowerCase() === normalizedInviteEmail);
    const pendingMatch = team.pendingInvites.some((i) => i.email.trim().toLowerCase() === normalizedInviteEmail);
    return ownerMatch || memberMatch || pendingMatch;
  }, [team, normalizedInviteEmail]);

  const executeInviteAction = () => {
    if (inviteMode === "email") {
      const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;
      handleConvidar(fakeEvent);
      return;
    }
    if (inviteMode === "code") {
      handleGerarCodigoAcesso();
      return;
    }
    handleGerarLinkMagico();
  };

  const agendaDrawerData = useMemo(() => {
    if (!agendaMemberUserId || !team) {
      return { barber: null as BarberAgendaDrawerBarber | null, items: [] as MockAgendaItem[], summary: null as MockAgendaSummary | null };
    }
    const m = team.members.find((x) => x.userId === agendaMemberUserId);
    if (!m) {
      return { barber: null, items: [], summary: null };
    }
    const cat = getBarberCatalog(barbershopId);
    const meta = getMeta(m.userId);
    const st =
      meta.status === "atendendo" ? ("atendendo" as const) : meta.status === "offline" ? ("offline" as const) : ("online" as const);
    const labels = cat.services.filter((s) => meta.serviceIds.includes(s.id)).map((s) => s.name);
    const { items, summary } = getMockAgendaForMember({
      userId: m.userId,
      status: st,
      serviceLabels: labels.length ? labels : cat.services.map((s) => s.name).slice(0, 3),
    });
    const barber: BarberAgendaDrawerBarber = {
      id: m.userId,
      name: m.name,
      roleLabel: meta.role === "gerente" ? "Gerente" : "Barbeiro",
      status: meta.status === "atendendo" ? "busy" : meta.status === "offline" ? "offline" : "online",
    };
    return { barber, items, summary };
  }, [agendaMemberUserId, team, memberMeta, barbershopId]);

  if (!user) return null;

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={motionT}
        className={cn("mx-auto max-w-5xl", isModern ? "space-y-6" : "space-y-8")}
      >
        {/* Hero + capacidade do plano */}
        <motion.div className={sectionClass}>
          {!isModern && (
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40"
              style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.14), transparent 68%)" }}
              aria-hidden
            />
          )}
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className={iconBadgeClass}>
                <Users className={cn("h-4 w-4", accentColor)} />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {isModern ? "Gestão de pessoas" : "A bancada"}
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{copy.title}</h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{copy.subtitle}</p>
              </div>
            </div>
            {isOwner && (
              <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                <Button variant="default" className="h-10 gap-2 rounded-xl px-5 font-semibold shadow-sm" onClick={handleAdicionarMembro}>
                  <Users className="h-4 w-4" />
                  {copy.addCta}
                </Button>
                <Button
                  variant={isModern ? "outline" : "outlineGold"}
                  className="h-10 rounded-xl px-5 text-xs font-semibold"
                  onClick={handleFazerUpgrade}
                >
                  <Zap className="mr-1 h-4 w-4 shrink-0" />
                  {copy.upgradeCta}
                </Button>
              </div>
            )}
          </div>

          {isOwner && team && (
            <div className={cn("relative z-10 mt-8 border-t pt-6", isModern ? "border-border/50" : "border-primary/15")}>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{copy.planTitle}</h3>
                  <p className="max-w-md text-xs text-muted-foreground">{copy.planText}</p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-right",
                    isModern ? "border-border/50 bg-muted/20" : "border-primary/20 bg-primary/5",
                  )}
                >
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {totalAtual}{" "}
                    <span className="text-sm font-normal text-muted-foreground">/ {limit === 999 ? "∞" : limit}</span>
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isModern ? "Membros no plano" : "Lugares na casa"}
                  </p>
                </div>
              </div>
              <div className={cn("h-2 overflow-hidden rounded-full", isModern ? "bg-muted/40" : "bg-muted/50")}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ocupacaoPlano}%` }}
                  transition={motionT}
                  className="h-full rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {sumAtendimentos} atendimentos {isModern ? "no período" : "registrados"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />R$ {sumReceita.toLocaleString("pt-BR")} faturados
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Média {mediaAvaliacao} ★
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {!isOwner && (
          <div className={cn(sectionClass, "flex items-start gap-3 text-sm text-muted-foreground")}>
            <ShieldCheck className={cn("mt-0.5 h-5 w-5 shrink-0", accentColor)} />
            <p>Você entrou como profissional da equipe. Convites, limites do plano e remoção de membros ficam com o administrador da barbearia.</p>
          </div>
        )}

        {isOwner && team && (
          <>
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <motion.section
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionT}
                className={cn("glass-card overflow-hidden rounded-xl border", isModern ? "border-border/50 bg-card/60" : "border-primary/20 bg-card/80")}
              >
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center gap-2 text-left transition-colors duration-150",
                    isModern
                      ? "px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/30"
                      : "rounded-t-xl px-5 py-4 font-display text-base text-foreground hover:bg-primary/5",
                  )}
                >
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 text-primary transition-transform duration-200", settingsOpen && "rotate-90")}
                  />
                  {isModern ? "Papéis e permissões" : "Permissões da casa"}
                  {!isModern && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-primary/50">Regras</span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={cn("border-t px-5 pb-5 pt-4", isModern ? "border-border/40" : "border-primary/15")}>
                    <div className="grid grid-cols-4 gap-4 text-[10px] pt-6 uppercase tracking-wider font-bold">
                      <div className="text-muted-foreground/60">Ação</div>
                      <div className="text-foreground">Dono</div>
                      <div className="text-primary">Gerente</div>
                      <div className="text-foreground/80">Barbeiro</div>
                      {[
                        ["Gerenciar equipe", "Sim", "Sim", "Não"],
                        ["Ver recebimentos", "Sim", "Sim", "Não"],
                        ["Ver agenda", "Sim", "Sim", "Sim"],
                      ].map((r) => (
                        <Fragment key={r[0]}>
                          <div className="text-muted-foreground/80 font-medium normal-case">{r[0]}</div>
                          <div className="text-emerald-500 font-bold">{r[1]}</div>
                          <div className={r[2] === "Sim" ? "text-emerald-500 font-bold" : "text-muted-foreground/40"}>{r[2]}</div>
                          <div className={r[3] === "Sim" ? "text-emerald-500 font-bold" : "text-muted-foreground/40"}>{r[3]}</div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </motion.section>
            </Collapsible>

            {/* Membros */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionT}
              className="space-y-4"
            >
              <div className="flex items-end gap-3 border-b border-border/40 pb-3">
                <div className={iconBadgeClass}>
                  <Users className={cn("h-4 w-4", accentColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-bold text-foreground">{copy.membersTitle}</h2>
                  <p className="text-[11px] text-muted-foreground">{team.members.length + 1} profissionais na operação</p>
                </div>
              </div>

              {team.members.length === 0 ? (
                <div className={cn(sectionClass, "flex flex-col items-center overflow-hidden py-14 text-center lg:py-16")}>
                  <div
                    className={cn(
                      "mb-6 flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 shadow-sm",
                      isModern ? "h-16 w-16" : "h-20 w-20",
                    )}
                  >
                    <Users className={cn(isModern ? "h-8 w-8" : "h-10 w-10", accentColor)} />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-foreground lg:text-2xl">{copy.emptyTitle}</h3>
                  <p className="mb-8 max-w-md text-sm leading-relaxed text-muted-foreground">{copy.emptyText}</p>
                  <div className="flex w-full max-w-2xl flex-col items-center gap-8">
                    <Button variant="default" size="lg" className="gap-2 rounded-xl px-8 font-semibold shadow-md" onClick={handleAdicionarMembro}>
                      <Users className="h-5 w-5" />
                      {copy.addCta}
                    </Button>
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                      {[
                        { icon: Calendar, t: "Ampliar horários", s: "Mais encaixes" },
                        { icon: BarChart2, t: "Dividir atendimentos", s: "Produtividade" },
                        { icon: ShieldCheck, t: "Organizar papéis", s: "Governança" },
                      ].map(({ icon: Icon, t, s }) => (
                        <div
                          key={t}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-muted/10 p-4 text-center transition-colors hover:border-primary/25 hover:bg-primary/5 sm:items-start sm:text-left"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{t}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-lg font-bold text-primary">
                        {team.owner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{team.owner.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Dono
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">● Online</span>
                        </div>
                      </div>
                    </div>
                    <Crown className="h-5 w-5 shrink-0 text-primary opacity-80" />
                  </div>

                  {memberRows.map(({ m, perf }) => {
                    const meta = getMeta(m.userId);
                    const editing = editMemberId === m.userId;
                    return (
                      <motion.div
                        key={m.userId}
                        whileHover={{ y: -2 }}
                        className="glass-card space-y-4 rounded-xl border border-border/50 bg-card/90 p-4 lg:col-span-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-muted font-bold text-foreground">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${meta.status === "online" ? "bg-emerald-500" : meta.status === "atendendo" ? "bg-amber-500" : "bg-zinc-500"}`} />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-base">{m.name}</p>
                              <div className="flex items-center gap-2">
                                <select
                                  value={meta.role}
                                  onChange={(e) => updateMeta(m.userId, { role: e.target.value as MemberRole })}
                                  className={`bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-wider focus:ring-0 ${accentColor}`}
                                >
                                  <option value="gerente">Gerente</option>
                                  <option value="barbeiro">Barbeiro</option>
                                </select>
                                <span className="text-[10px] text-muted-foreground/40">•</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.status === "online" ? "text-emerald-500" : meta.status === "atendendo" ? "text-amber-500" : "text-muted-foreground"}`}>
                                  {statusLabel[meta.status]}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setAgendaMemberUserId(m.userId) || setAgendaOpen(true)} title="Ver agenda">
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => setEditMemberId(editing ? null : m.userId)} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleRemover(m.userId)} title="Remover">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className={`p-2.5 rounded-xl border border-border/40 ${isModern ? "bg-muted/10" : "bg-muted/20"}`}>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Agenda</p>
                            <p className="text-xs font-bold text-foreground">{perf.atendimentos} serviços</p>
                          </div>
                          <div className={`p-2.5 rounded-xl border border-border/40 ${isModern ? "bg-muted/10" : "bg-muted/20"}`}>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Receita</p>
                            <p className="text-xs font-bold text-foreground">R$ {perf.receita}</p>
                          </div>
                          <div className={`p-2.5 rounded-xl border border-border/40 ${isModern ? "bg-muted/10" : "bg-muted/20"}`}>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avaliação</p>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1">{perf.avaliacao} <Star className="w-3 h-3 text-amber-500 fill-amber-500" /></p>
                          </div>
                        </div>

                        {editing && (
                          <div className={`p-4 rounded-xl border ${accentBorder} bg-primary/5 space-y-4`}>
                            <div className="flex items-center justify-between gap-4">
                              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Comissão (%)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={meta.commissionPercent}
                                onChange={(e) => updateMeta(m.userId, { commissionPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                                className="h-8 w-20 rounded-lg bg-background border-border text-center font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Serviços que executa</p>
                              <div className="flex flex-wrap gap-1.5">
                                {catalog.services.slice(0, 8).map((s) => {
                                  const selected = meta.serviceIds.includes(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => updateMeta(m.userId, { serviceIds: selected ? meta.serviceIds.filter((id) => id !== s.id) : [...meta.serviceIds, s.id] })}
                                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${selected ? "bg-primary/20 border-primary/40 text-primary" : "bg-background border-border text-muted-foreground hover:border-primary/30"}`}
                                    >
                                      {s.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.section>

            {/* Convites */}
            <motion.section
              id="equipe-convite-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionT}
              className={sectionClass}
            >
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-start gap-3">
                  <div className={iconBadgeClass}>
                    <Mail className={cn("h-4 w-4", accentColor)} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{copy.inviteTitle}</h2>
                    <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">{copy.inviteText}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-xl border-border/60 bg-muted/10 text-[10px] font-bold uppercase tracking-widest"
                    onClick={handleGerarCodigoAcesso}
                    disabled={gerandoCodigo || totalAtual >= limit}
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Gerar código
                  </Button>
                  <Button
                    variant={isModern ? "outline" : "outlineGold"}
                    size="sm"
                    className="h-9 gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    onClick={handleGerarLinkMagico}
                    disabled={gerandoCodigo || totalAtual >= limit}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Link mágico
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/10 p-5 lg:p-6">
                <form onSubmit={handleConvidar} className="grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-5">
                  <div className="space-y-2 md:col-span-6">
                    <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail do profissional</Label>
                    <Input
                      type="email"
                      placeholder="ex: barbeiro@gmail.com"
                      value={emailConvite}
                      onChange={(e) => setEmailConvite(e.target.value)}
                      className="h-11 rounded-xl border-border/60 bg-background focus-visible:ring-primary/20"
                      disabled={totalAtual >= limit}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Papel</Label>
                    <select
                      value={papelConvite}
                      onChange={(e) => setPapelConvite(e.target.value as MemberRole)}
                      className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="barbeiro">Barbeiro</option>
                      <option value="gerente">Gerente</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      type="submit"
                      variant="default"
                      className="h-11 w-full gap-2 rounded-xl font-semibold shadow-sm"
                      disabled={enviando || totalAtual >= limit || !emailConvite.trim()}
                    >
                      {enviando ? "Enviando..." : copy.inviteMainCta}
                    </Button>
                  </div>
                </form>

                {codigoAcessoGerado && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {codigoAcessoGerado.startsWith("http") ? <LinkIcon className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/90 dark:text-emerald-400/90">
                          {codigoAcessoGerado.startsWith("http") ? "Link gerado" : "Código gerado"}
                        </p>
                        <p className="max-w-[220px] truncate font-mono text-sm font-bold tracking-wide text-foreground">{codigoAcessoGerado}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0 gap-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400" onClick={copiarCodigoAcesso}>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.section>

            {team.pendingInvites.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionT}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 border-b border-border/40 pb-3">
                  <div className={iconBadgeClass}>
                    <Clock className={cn("h-4 w-4", accentColor)} />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{copy.pendingTitle}</h2>
                    <p className="text-xs text-muted-foreground">{copy.pendingText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {team.pendingInvites.map((inv) => (
                    <motion.div
                      key={inv.token}
                      whileHover={{ y: -2 }}
                      className="glass-card flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/90 p-4 transition-colors hover:border-primary/25"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                          {inv.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{inv.email}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Enviado em {inv.sentAt ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => copiarLink(inv.token)}
                        >
                          <Copy className="h-3.5 w-3.5" /> Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleCancelarConvite(inv.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {!isModern && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionT}
                className={cn(sectionClass, "py-5")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Dica:</span> com a agenda cheia, convidar outro profissional ajuda a manter o ritmo do salão e o acolhimento dos clientes.
                  </p>
                </div>
              </motion.section>
            )}

            <Dialog open={isModern && inviteModalOpen} onOpenChange={setInviteModalOpen}>
              <DialogContent
                className={cn(
                  "glass-card max-h-[min(90vh,640px)] gap-0 overflow-hidden border border-border/50 bg-card/95 p-0 shadow-2xl sm:max-w-md sm:rounded-2xl",
                )}
              >
                <div className="border-b border-border/40 bg-muted/15 px-6 pb-5 pt-6 pr-14">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/8">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <DialogHeader className="space-y-1.5 p-0 text-left">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Convites</p>
                      <DialogTitle className="font-display text-xl font-bold tracking-tight text-foreground">
                        Convidar para a equipe
                      </DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        O profissional recebe um link para aceitar e entrar na sua operação pelo sistema.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>

                <div className="space-y-5 px-6 py-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleConvidar(e);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        E-mail do profissional
                      </Label>
                      <Input
                        type="email"
                        value={emailConvite}
                        onChange={(e) => setEmailConvite(e.target.value)}
                        className="h-11 rounded-xl border-border/60 bg-background focus-visible:ring-primary/20"
                        placeholder="barbeiro@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Papel na operação
                      </Label>
                      <select
                        value={papelConvite}
                        onChange={(e) => setPapelConvite(e.target.value as MemberRole)}
                        className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      >
                        <option value="barbeiro">Barbeiro</option>
                        <option value="gerente">Gerente</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      variant="default"
                      className="h-11 w-full rounded-xl font-semibold shadow-sm"
                      disabled={enviando || !emailConvite.trim()}
                    >
                      {enviando ? "Enviando..." : "Enviar convite"}
                    </Button>
                  </form>

                  <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
                    <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Outras formas de entrada
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        className="h-10 gap-2 rounded-xl border-border/60 text-xs font-semibold"
                        onClick={handleGerarCodigoAcesso}
                        disabled={gerandoCodigo || totalAtual >= limit}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        Código
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        className="h-10 gap-2 rounded-xl border-border/60 text-xs font-semibold"
                        onClick={handleGerarLinkMagico}
                        disabled={gerandoCodigo || totalAtual >= limit}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        Link mágico
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <BarberAgendaDrawer
              open={agendaOpen}
              onClose={() => setAgendaOpen(false)}
              onExitComplete={() => setAgendaMemberUserId(null)}
              barber={agendaDrawerData.barber}
              items={agendaDrawerData.items}
              summary={agendaDrawerData.summary}
            />
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberEquipe;
