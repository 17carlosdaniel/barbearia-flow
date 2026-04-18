import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { formatDateKey } from "@/lib/barberSchedule";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getHistoryInsightsByBarbershop, type CustomerGroup } from "@/lib/customerInsights";
import {
  closeOpenSlot,
  getOpenSlotListingMsRemaining,
  type OpenSlotRecord,
  updateOpenSlotDuration,
} from "@/lib/openSlots";

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

const stalledToastGlobal = new Set<string>();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export type OpenSlotAgendaRowProps = {
  slot: OpenSlotRecord;
  barbershopId: number;
  /** DD/MM/YYYY da vaga — usado para saber se é “hoje”. */
  slotDateKey: string;
  /** Ticket médio estimado (base 30 min) para recalcular valor ao mudar duração. */
  avgTicketEstimate: number;
  listIdx: number;
  onRefresh: () => void;
};

const OpenSlotAgendaRow = ({
  slot,
  barbershopId,
  slotDateKey,
  avgTicketEstimate,
  listIdx,
  onRefresh,
}: OpenSlotAgendaRowProps) => {
  const reducedMotion = useReducedMotion();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const profile = useMemo(() => getBarbershopProfile(barbershopId), [barbershopId]);
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [refreshLocal, setRefreshLocal] = useState(0);
  const [expiryTick, setExpiryTick] = useState(0);

  const bump = () => {
    setRefreshLocal((n) => n + 1);
    onRefresh();
  };

  useEffect(() => {
    const load = async () => {
      const data = await getHistoryInsightsByBarbershop(barbershopId, { period: "month", staleDays: 20 });
      setCustomers(data.customers);
    };
    void load();
  }, [barbershopId, refreshLocal]);

  useEffect(() => {
    const id = window.setInterval(() => setExpiryTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [slot.id]);

  const listingMsLeft = useMemo(() => getOpenSlotListingMsRemaining(slot), [slot, expiryTick]);

  const expiryRefreshDoneRef = useRef(false);
  useEffect(() => {
    if (listingMsLeft > 0) {
      expiryRefreshDoneRef.current = false;
      return;
    }
    if (expiryRefreshDoneRef.current) return;
    expiryRefreshDoneRef.current = true;
    onRefresh();
  }, [listingMsLeft, onRefresh]);

  const isToday = slotDateKey === formatDateKey(startOfDay(new Date()));
  const priceForDuration = (minutes: number) => Math.max(0, Math.round(avgTicketEstimate * (minutes / 30)));

  const openWhatsApp = (name: string, phoneRaw?: string, customText?: string) => {
    const digits = (phoneRaw || "").replace(/\D/g, "");
    if (!digits) {
      toast({ title: "WhatsApp indisponível", description: "Cliente sem telefone cadastrado.", variant: "destructive" });
      return;
    }
    const phone = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(customText || `Olá, ${name}! Pintou um horário livre, quer aproveitar?`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const shareOpenSlotToWhatsApp = (time: string, durationMinutes?: number) => {
    const shop = profile.nomeBarbearia || "nossa barbearia";
    const dur = durationMinutes ? ` (${durationMinutes} min)` : "";
    const msg = encodeURIComponent(
      `Horário livre às ${time}${dur} na ${shop}. Quer garantir? Chama aqui e fecha teu horário.`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const callFirstSuggestedForSlot = (slotTime: string) => {
    const withPhone = customers.find((c) => (c.customerPhone || "").replace(/\D/g, "").length >= 8);
    if (!withPhone) {
      toast({
        title: "Nenhum contato com WhatsApp",
        description: "Cadastre telefones no histórico de clientes ou use outro canal.",
        variant: "destructive",
      });
      return;
    }
    openWhatsApp(
      withPhone.clientName,
      withPhone.customerPhone,
      `Oi, ${withPhone.clientName}! Liberei uma vaga às ${slotTime} — quer encaixar?`,
    );
  };

  const stalledOpen = isToday && Date.now() - new Date(slot.createdAt).getTime() > 20 * 60 * 1000;

  const stallToastFired = useRef(false);
  useEffect(() => {
    if (!stalledOpen || !isToday || stallToastFired.current) return;
    if (stalledToastGlobal.has(slot.id)) return;
    stalledToastGlobal.add(slot.id);
    stallToastFired.current = true;
    toast({
      title: "Vaga parada há um tempo",
      description: `${slot.time}: que tal divulgar no WhatsApp?`,
    });
  }, [stalledOpen, isToday, slot.id, slot.time]);

  return (
    <motion.div
      key={`open-slot-${slot.id}`}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reducedMotion ? 0 : listIdx * 0.02 }}
      className="agenda-item-card relative overflow-hidden rounded-xl border-2 border-amber-500/45 bg-amber-500/6 shadow-none"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" aria-hidden />
      <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{slot.time}</span>
            <span className="rounded-full border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-200">
              Vaga aberta
            </span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200/95">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden />
            Aguardando cliente
          </p>
          {listingMsLeft > 0 ? (
            <p className="text-xs font-medium tabular-nums text-amber-300/95">
              {listingMsLeft >= 60_000
                ? `Expira em ${Math.ceil(listingMsLeft / 60_000)} min (mesmo tempo da duração)`
                : `Expira em ${Math.max(1, Math.ceil(listingMsLeft / 1000))} s`}
            </p>
          ) : null}
          {stalledOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-amber-200/80">Ninguém ainda. Que tal divulgar?</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-amber-500/35 bg-amber-500/10 text-[11px] text-amber-100 hover:bg-amber-500/15"
                onClick={() => shareOpenSlotToWhatsApp(slot.time, slot.durationMinutes)}
              >
                <MessageCircle className="h-3 w-3" strokeWidth={isModern ? 1.7 : 2} />
                Divulgar agora
              </Button>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Duração</span>
            <Select
              value={String(slot.durationMinutes)}
              onValueChange={(v) => {
                const d = Number(v);
                updateOpenSlotDuration(barbershopId, slot.id, d, priceForDuration(d));
                bump();
              }}
            >
              <SelectTrigger className="h-8 w-[100px] border-border/60 bg-card/90 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[180px] sm:items-end">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 text-xs"
              onClick={() => callFirstSuggestedForSlot(slot.time)}
            >
              Chamar cliente
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 shrink-0 text-xs"
              onClick={() => {
                closeOpenSlot(barbershopId, slot.id);
                bump();
                toast({ title: "Vaga fechada" });
              }}
            >
              Fechar vaga
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OpenSlotAgendaRow;
