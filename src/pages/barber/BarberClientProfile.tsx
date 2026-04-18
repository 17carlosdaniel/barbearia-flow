import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CalendarClock, Crown, MessageCircle, Repeat2, Save, Scissors, Sparkles, Tag, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { addAppointment } from "@/lib/appointments";
import { getHistoryInsightsByBarbershop, saveCustomerProfile } from "@/lib/customerInsights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const nextIsoDate = (daysAhead: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
};

const parseStructuredNotes = (raw: string) => {
  const source = raw || "";
  const prefMatch = source.match(/Preferencias:\s*([\s\S]*?)(?:\nObservacoes:|$)/i);
  const obsMatch = source.match(/Observacoes:\s*([\s\S]*)$/i);
  return {
    preferences: (prefMatch?.[1] || "").trim(),
    observations: (obsMatch?.[1] || "").trim(),
  };
};

const toStructuredNotes = (preferences: string, observations: string) =>
  `Preferencias:\n${preferences.trim()}\n\nObservacoes:\n${observations.trim()}`.trim();

const BarberClientProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ clientKey: string }>();
  const clientKey = decodeURIComponent(params.clientKey || "");
  const barbershopId = user?.barbershopId ?? 1;

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState("");
  const [observations, setObservations] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof getHistoryInsightsByBarbershop>>["customers"]>([]);
  const [records, setRecords] = useState<Awaited<ReturnType<typeof getHistoryInsightsByBarbershop>>["records"]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getHistoryInsightsByBarbershop(barbershopId, { period: "month", staleDays: 20 });
      setCustomers(data.customers);
      setRecords(data.records);
      const profile = data.customers.find((item) => item.clientKey === clientKey);
      const structured = parseStructuredNotes(profile?.notes || "");
      setPreferences(structured.preferences);
      setObservations(structured.observations);
      setTagsInput((profile?.tags || []).join(", "));
      setLoading(false);
    };
    void load();
  }, [barbershopId, clientKey]);

  const customer = useMemo(() => customers.find((item) => item.clientKey === clientKey), [customers, clientKey]);
  const timeline = useMemo(
    () => records.filter((item) => item.clientKey === clientKey).sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()),
    [records, clientKey],
  );

  const daysSinceLastVisit = customer?.daysSinceLastVisit ?? 0;
  const recurringBadge = (customer?.visits ?? 0) >= 3;
  const staleAlert = daysSinceLastVisit >= 20;

  const favoriteBarber = useMemo(() => {
    const map = new Map<string, number>();
    timeline.forEach((entry) => {
      const key = entry.barberName || "Sem barbeiro";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const ranked = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    if (!top) return { name: "Sem dados", percent: 0 };
    return { name: top[0], percent: Math.round((top[1] / Math.max(timeline.length, 1)) * 100) };
  }, [timeline]);

  const intervalDays = useMemo(() => {
    if (timeline.length < 2) return 0;
    const sorted = [...timeline].sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());
    let acc = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1].dateIso).getTime();
      const curr = new Date(sorted[i].dateIso).getTime();
      acc += Math.max(1, Math.round((curr - prev) / 86400000));
    }
    return Math.round(acc / (sorted.length - 1));
  }, [timeline]);

  const frequencyPerMonth = intervalDays > 0 ? Number((30 / intervalDays).toFixed(1)) : 0;

  const recentSpend = useMemo(() => timeline.slice(0, 3).map((entry) => ({ service: entry.service, value: entry.price })), [timeline]);

  const upsellSuggestion = useMemo(() => {
    const services = timeline.map((entry) => entry.service.toLowerCase()).join(" ");
    if (services.includes("barba")) return "Cliente costuma fazer barba: sugerir oleo de barba e pos-barba.";
    if (services.includes("corte")) return "Cliente de corte frequente: sugerir pomada modeladora.";
    return "Sugerir kit de manutencao para aumentar ticket medio.";
  }, [timeline]);

  const handleSaveProfile = async () => {
    if (!customer) return;
    const tags = tagsInput
      .split(/[,\s#]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
    await saveCustomerProfile(barbershopId, {
      clientKey: customer.clientKey,
      clientName: customer.clientName,
      customerPhone: customer.customerPhone,
      notes: toStructuredNotes(preferences, observations),
      tags,
    });
    toast({ title: "Perfil atualizado", description: "Notas e tags salvas com sucesso." });
  };

  const handleRepeat = () => {
    if (!customer) return;
    addAppointment(barbershopId, {
      clientId: customer.clientKey.startsWith("id:") ? customer.clientKey.replace("id:", "") : undefined,
      client: customer.clientName,
      service: customer.preferredService || customer.lastService || "Servico",
      date: nextIsoDate(7),
      time: "10:00",
      status: "scheduled",
      price: customer.avgTicket || 0,
      durationMinutes: 30,
    });
    toast({ title: "Novo agendamento criado", description: "Atendimento repetido para a proxima semana." });
  };

  const handleRebookLastCut = () => {
    if (!customer) return;
    addAppointment(barbershopId, {
      clientId: customer.clientKey.startsWith("id:") ? customer.clientKey.replace("id:", "") : undefined,
      client: customer.clientName,
      service: customer.lastService || customer.preferredService || "Servico",
      date: nextIsoDate(2),
      time: "10:00",
      status: "scheduled",
      price: customer.avgTicket || 0,
      durationMinutes: 30,
    });
    toast({ title: "Reagendamento criado", description: "Ultimo corte reagendado para os proximos dias." });
  };

  const handleScheduleFromEntry = (service: string, price: number, duration?: number) => {
    if (!customer) return;
    addAppointment(barbershopId, {
      clientId: customer.clientKey.startsWith("id:") ? customer.clientKey.replace("id:", "") : undefined,
      client: customer.clientName,
      service,
      date: nextIsoDate(3),
      time: "11:00",
      status: "scheduled",
      price,
      durationMinutes: duration ?? 30,
    });
    toast({ title: "Reagendamento criado", description: `${service} adicionado para ${customer.clientName}.` });
  };

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
        <motion.div
          className="flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03 }}
        >
          <Button variant="outline" onClick={() => navigate("/barbeiro/historico")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </motion.div>

        {loading ? (
          <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">Carregando perfil do cliente...</div>
        ) : !customer ? (
          <div className="glass-card rounded-xl p-5 text-sm text-muted-foreground">Cliente nao encontrado para este historico.</div>
        ) : (
          <>
            <motion.div
              className="glass-card rounded-xl p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center">
                    {(customer.clientName || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">{customer.clientName}</h1>
                    <p className="text-sm text-muted-foreground">{customer.customerPhone || "Telefone nao informado"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recurringBadge ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      <Crown className="w-3.5 h-3.5" />
                      Cliente recorrente
                    </span>
                  ) : null}
                  {staleAlert ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Sem retorno ha {daysSinceLastVisit} dias
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Ultima visita: ha {daysSinceLastVisit} dias · Total gasto: {formatCurrency(customer.totalSpent)}
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Visitas</p>
                  <p className="text-xl font-semibold">{customer.visits}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="text-xl font-semibold">{formatCurrency(customer.totalSpent)}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Ticket medio</p>
                  <p className="text-xl font-semibold">{formatCurrency(customer.avgTicket)}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Ultimo servico</p>
                  <p className="text-sm font-semibold">{customer.lastService}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Frequencia</p>
                  <p className="text-sm font-semibold">{frequencyPerMonth > 0 ? `${frequencyPerMonth}x por mes` : "Sem dados"}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Intervalo medio</p>
                  <p className="text-sm font-semibold">{intervalDays > 0 ? `${intervalDays} dias` : "Sem dados"}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Barbeiro favorito</p>
                  <p className="text-sm font-semibold">{favoriteBarber.name} ({favoriteBarber.percent}%)</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleRebookLastCut}>
                  <Repeat2 className="w-4 h-4 mr-2" />
                  Reagendar ultimo corte
                </Button>
                <Button variant="outline" onClick={handleRepeat}>
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Repetir atendimento
                </Button>
                {customer.customerPhone ? (
                  <Button variant="outline" onClick={() => window.open(`https://wa.me/${customer.customerPhone?.replace(/\D/g, "")}`, "_blank")}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contatar no WhatsApp
                  </Button>
                ) : null}
              </div>
              {staleAlert ? (
                <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Cliente nao retorna ha {daysSinceLastVisit} dias. Acao sugerida: enviar convite para novo corte.
                </div>
              ) : null}
            </motion.div>

            <motion.div
              className="glass-card rounded-xl p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
            >
              <h2 className="text-lg font-semibold text-foreground">Preferencias e observacoes</h2>
              <label className="mt-3 block text-xs text-muted-foreground">Preferencias de atendimento</label>
              <textarea
                className="mt-3 min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm"
                placeholder="- gosta de degrade baixo&#10;- nao usa navalha"
                value={preferences}
                onChange={(event) => setPreferences(event.target.value)}
              />
              <label className="mt-3 block text-xs text-muted-foreground">Observacoes</label>
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-border bg-background p-3 text-sm"
                placeholder="- cliente pontual&#10;- prefere sabado"
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
              />
              <div className="mt-3">
                <Input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="Tags (vip, retorno, barba...)"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {tagsInput
                    .split(/[,\s#]+/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((tag) => (
                      <span key={tag} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={() => void handleSaveProfile()}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar perfil
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="glass-card rounded-xl p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14 }}
            >
              <h2 className="text-lg font-semibold text-foreground">Sugestoes comerciais</h2>
              <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                <p className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {upsellSuggestion}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Ultimos 3 servicos (financeiro)</p>
                <div className="mt-2 space-y-1">
                  {recentSpend.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados recentes.</p>
                  ) : (
                    recentSpend.map((item, idx) => (
                      <p key={`${item.service}_${idx}`} className="text-sm text-foreground">
                        - {item.service}: {formatCurrency(item.value)}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card rounded-xl p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16 }}
            >
              <h2 className="text-lg font-semibold text-foreground">Linha do tempo</h2>
              <div className="mt-3 space-y-2">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem registros para este cliente.</p>
                ) : (
                  timeline.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      className="rounded-lg border border-border/50 p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.02 * Math.min(index, 8) }}
                      whileHover={{ y: -2, transition: { duration: 0.18 } }}
                    >
                      <p className="text-sm font-medium text-foreground">{entry.service}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.dateIso).toLocaleDateString("pt-BR")} · {new Date(entry.dateIso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(entry.price)} · {entry.durationMinutes || 30} min · <UserRound className="inline w-3.5 h-3.5" /> {entry.barberName || "Sem barbeiro"} · <Tag className="inline w-3.5 h-3.5" /> {entry.status}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleScheduleFromEntry(entry.service, entry.price, entry.durationMinutes)}>
                          <Scissors className="w-4 h-4 mr-2" />
                          Reagendar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            toast({
                              title: "Detalhe do atendimento",
                              description: `${entry.service} · ${formatCurrency(entry.price)} · ${entry.barberName || "Sem barbeiro"}`,
                            })
                          }
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberClientProfile;
