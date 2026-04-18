import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Users, UserRound, Wallet, Repeat2, AlertTriangle, MessageCircle, Gift, CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getHistoryInsightsByBarbershop, type CustomerGroup } from "@/lib/customerInsights";
import { getCanonicalAppointmentsForBarbershop, type AppointmentRecord } from "@/lib/appointments";

const toDateIso = (date: string, time: string) => {
  const [d, m, y] = date.split("/").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const parsed = new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  return parsed.toISOString();
};

type SegmentFilter = "todos" | "sem_retorno" | "alto_ticket" | "recorrentes" | "novos";

const BarberCustomers = () => {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId ?? 1;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("todos");
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getHistoryInsightsByBarbershop(barbershopId, { period: "month", staleDays: 20 });
      const appointments = getCanonicalAppointmentsForBarbershop(barbershopId);
      const base = [...data.customers];
      const byName = new Map(base.map((c) => [c.clientName.trim().toLowerCase(), c]));
      const fromAgenda = new Map<
        string,
        {
          clientName: string;
          customerPhone?: string;
          visits: number;
          totalSpent: number;
          lastServiceAt: string;
          lastService: string;
          preferredServiceCounter: Map<string, number>;
        }
      >();

      appointments.forEach((apt: AppointmentRecord) => {
        const key = apt.client.trim().toLowerCase();
        if (!key) return;
        const current = fromAgenda.get(key);
        const dateIso = toDateIso(apt.date, apt.time);
        if (!current) {
          const counter = new Map<string, number>();
          counter.set(apt.service || "Servico", 1);
          fromAgenda.set(key, {
            clientName: apt.client,
            customerPhone: apt.whatsAppPhone || undefined,
            visits: 1,
            totalSpent: Number(apt.price ?? 0),
            lastServiceAt: dateIso,
            lastService: apt.service || "Servico",
            preferredServiceCounter: counter,
          });
          return;
        }
        current.visits += 1;
        current.totalSpent += Number(apt.price ?? 0);
        current.preferredServiceCounter.set(apt.service || "Servico", (current.preferredServiceCounter.get(apt.service || "Servico") ?? 0) + 1);
        if (new Date(dateIso).getTime() > new Date(current.lastServiceAt).getTime()) {
          current.lastServiceAt = dateIso;
          current.lastService = apt.service || "Servico";
        }
      });

      fromAgenda.forEach((item, key) => {
        if (byName.has(key)) return;
        const preferredService =
          Array.from(item.preferredServiceCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? item.lastService;
        const daysSinceLastVisit = Math.max(
          0,
          Math.floor((Date.now() - new Date(item.lastServiceAt).getTime()) / (1000 * 60 * 60 * 24)),
        );
        base.push({
          clientKey: `name:${key}`,
          clientName: item.clientName,
          customerPhone: item.customerPhone,
          visits: item.visits,
          totalSpent: Number(item.totalSpent.toFixed(2)),
          avgTicket: item.visits > 0 ? Number((item.totalSpent / item.visits).toFixed(2)) : 0,
          lastService: item.lastService,
          lastServiceAt: item.lastServiceAt,
          preferredService,
          daysSinceLastVisit,
          tags: [],
          notes: undefined,
          lastBarberName: undefined,
        });
      });

      setCustomers(base.sort((a, b) => new Date(b.lastServiceAt).getTime() - new Date(a.lastServiceAt).getTime()));
      setLoading(false);
    };
    void load();
  }, [barbershopId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const highTicketThreshold = 80;
    return customers.filter((c) => {
      if (segment === "sem_retorno" && c.daysSinceLastVisit < 20) return false;
      if (segment === "alto_ticket" && c.avgTicket < highTicketThreshold) return false;
      if (segment === "recorrentes" && c.visits < 3) return false;
      if (segment === "novos" && c.visits > 2) return false;
      if (!q) return true;
      return (
        c.clientName.toLowerCase().includes(q) ||
        (c.customerPhone || "").includes(q) ||
        (c.preferredService || "").toLowerCase().includes(q)
      );
    });
  }, [customers, search, segment]);

  const staleCount = customers.filter((c) => c.daysSinceLastVisit >= 20).length;
  const recurringCount = customers.filter((c) => c.visits >= 3).length;
  const highTicketCount = customers.filter((c) => c.avgTicket >= 80).length;
  const newThisWeekCount = customers.filter((c) => c.visits <= 2 && c.daysSinceLastVisit <= 7).length;
  const avgTicket =
    customers.length > 0
      ? (customers.reduce((sum, c) => sum + (Number.isFinite(c.avgTicket) ? c.avgTicket : 0), 0) / customers.length).toFixed(0)
      : "0";
  const topSpenders = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);
  const staleLeads = [...customers].filter((c) => c.daysSinceLastVisit >= 30).slice(0, 5);

  const openWhatsApp = (phone?: string, message?: string) => {
    const digits = (phone || "").replace(/\D/g, "");
    if (!digits) return;
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(message || "Oi! Passando para lembrar que estamos com agenda aberta essa semana ✂️");
    window.open(`https://wa.me/${full}?text=${text}`, "_blank");
  };

  return (
    <DashboardLayout userType="barbeiro">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="barber-panel p-4 sm:p-5">
          <h1 className="text-2xl font-display font-bold text-gradient-gold">CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe recorrencia, ticket medio e reativacao de clientes.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="barber-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Clientes ativos</p>
              <p className="text-2xl font-display font-bold text-foreground">{customers.length}</p>
            </div>
            <Users className="w-7 h-7 text-primary" />
          </div>
          <div className="barber-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Recorrentes (3+ visitas)</p>
              <p className="text-2xl font-display font-bold text-foreground">{recurringCount}</p>
            </div>
            <Repeat2 className="w-7 h-7 text-primary" />
          </div>
          <div className="barber-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Ticket medio</p>
              <p className="text-2xl font-display font-bold text-foreground">R$ {avgTicket}</p>
            </div>
            <Wallet className="w-7 h-7 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 border border-amber-500/30 bg-amber-500/10">
            <p className="text-xs text-muted-foreground">Clientes sem retorno (30+ dias)</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{staleLeads.length}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setSegment("sem_retorno")}>
              Ver e reativar
            </Button>
          </div>
          <div className="glass-card rounded-xl p-4 border border-primary/30 bg-primary/10">
            <p className="text-xs text-muted-foreground">Clientes de maior gasto</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{topSpenders.length}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setSegment("alto_ticket")}>
              Ver top clientes
            </Button>
          </div>
          <div className="glass-card rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-xs text-muted-foreground">Clientes novos da semana</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{newThisWeekCount}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setSegment("novos")}>
              Ver novos
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone ou servico preferido..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant={segment === "todos" ? "default" : "outline"} onClick={() => setSegment("todos")}>Todos</Button>
              <Button size="sm" variant={segment === "sem_retorno" ? "default" : "outline"} onClick={() => setSegment("sem_retorno")}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Sem retorno ({staleCount})
              </Button>
              <Button size="sm" variant={segment === "recorrentes" ? "default" : "outline"} onClick={() => setSegment("recorrentes")}>
                <Repeat2 className="w-3.5 h-3.5 mr-1" /> Recorrentes ({recurringCount})
              </Button>
              <Button size="sm" variant={segment === "alto_ticket" ? "default" : "outline"} onClick={() => setSegment("alto_ticket")}>
                <Wallet className="w-3.5 h-3.5 mr-1" /> Alto ticket ({highTicketCount})
              </Button>
              <Button size="sm" variant={segment === "novos" ? "default" : "outline"} onClick={() => setSegment("novos")}>
                Novos ({newThisWeekCount})
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8">Carregando clientes...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">Nenhum cliente encontrado com os filtros atuais.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((customer) => (
                <div key={customer.clientKey} className="rounded-xl border border-border/60 bg-card p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{customer.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {customer.preferredService || "Servico favorito nao identificado"} • {customer.visits} visitas • Ticket medio R$ {customer.avgTicket.toFixed(0)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Ultima visita ha {customer.daysSinceLastVisit} dias
                      {customer.customerPhone ? ` • ${customer.customerPhone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() =>
                        openWhatsApp(
                          customer.customerPhone,
                          `Oi, ${customer.clientName}! Faz um tempo desde sua ultima visita. Quer que eu te encaixe essa semana?`,
                        )
                      }
                      disabled={!customer.customerPhone}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() =>
                        openWhatsApp(
                          customer.customerPhone,
                          `Oi, ${customer.clientName}! Essa semana estamos com condicao especial para ${customer.preferredService || "servicos"}. Quer aproveitar?`,
                        )
                      }
                      disabled={!customer.customerPhone}
                    >
                      <Gift className="w-4 h-4" />
                      Oferecer desconto
                    </Button>
                    <Link to="/barbeiro">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <CalendarPlus className="w-4 h-4" />
                        Agendar novamente
                      </Button>
                    </Link>
                    <Link to={`/barbeiro/clientes/${encodeURIComponent(customer.clientKey)}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <UserRound className="w-4 h-4" />
                        Ver perfil
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default BarberCustomers;

