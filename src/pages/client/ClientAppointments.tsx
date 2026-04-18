import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Scissors,
  Star,
  XCircle,
  MapPinned,
  CalendarPlus,
  RotateCcw,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Trophy,
  Route,
  WalletCards,
  Hourglass,
  CircleDashed,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { addCancelledByClient } from "@/lib/cancelledByClient";
import { APPOINTMENTS_CHANGED_EVENT, type AppointmentRecord } from "@/lib/appointments";
import { getBarbershopProfile } from "@/lib/barbershopProfile";
import { getAverageRating, addReview } from "@/lib/reviews";
import { getBarberCatalog } from "@/lib/barberCatalog";
import { mockBarbershops } from "@/lib/mockBarbershops";
import { emitAppointmentNotification } from "@/lib/domainNotifications";
import { getLoyaltySummary } from "@/lib/loyaltyBackend";
import {
  closeOpenSlot,
  getOpenSlotListingMsRemaining,
  getOpenSlotRemainingMinutes,
  getOpenSlotsByBarbershop,
  occupyOpenSlot,
} from "@/lib/openSlots";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { useClientAppointmentMutations, useClientAppointmentsQuery } from "@/hooks/useClientQueries";

type AppointmentUiStatus = AppointmentRecord["status"];

type EnrichedAppointment = AppointmentRecord & {
  barbershopDisplayName: string;
  locationDisplay: string;
  ratingAverage: number;
  ratingCount: number;
  averagePriceDisplay: string;
  averageDurationMinutes: number;
  distanceKmDisplay: string;
  hasReview: boolean;
};

type WaitingSlotUi = {
  id: string;
  barbershopId: number;
  barbershopName: string;
  barberName: string;
  service: string;
  price: number;
  date: string;
  time: string;
  locationDisplay: string;
  distanceKmDisplay: string;
  etaToArriveMinutes: number;
  etaToAttendMinutes: number;
  listingMsRemaining: number;
};

type WaitingPaymentEntry = {
  paidAt: string;
  amount: number;
};

const WAITING_PAYMENTS_KEY = "barberflow_waiting_payments";

function loadWaitingPayments(): Record<string, WaitingPaymentEntry> {
  try {
    const raw = localStorage.getItem(WAITING_PAYMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WaitingPaymentEntry>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveWaitingPayments(data: Record<string, WaitingPaymentEntry>) {
  localStorage.setItem(WAITING_PAYMENTS_KEY, JSON.stringify(data));
}

const ClientAppointments = () => {
  const { user } = useAuth();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<EnrichedAppointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<EnrichedAppointment | null>(null);
  const [reviewTarget, setReviewTarget] = useState<EnrichedAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [loyaltyHint, setLoyaltyHint] = useState<string | null>(null);
  const [waitingSlotDetailsId, setWaitingSlotDetailsId] = useState<string | null>(null);
  const [waitingReserveLoadingId, setWaitingReserveLoadingId] = useState<string | null>(null);
  const [waitingPayingAppointmentId, setWaitingPayingAppointmentId] = useState<number | null>(null);
  const [waitingPayments, setWaitingPayments] = useState<Record<string, WaitingPaymentEntry>>(() =>
    loadWaitingPayments(),
  );
  const appointmentsQuery = useClientAppointmentsQuery(user?.id, user?.name);
  const appointmentMutations = useClientAppointmentMutations(user?.id, user?.name);

  const parseDateAndTime = (date: string, time: string) => {
    const [day, month, year] = date.split("/").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0);
  };

  const parseDateTime = (apt: AppointmentRecord) => {
    return parseDateAndTime(apt.date, apt.time);
  };

  const appointments = useMemo(() => {
    const raw = appointmentsQuery.data ?? [];
    return raw.map((apt) => {
      const profile = getBarbershopProfile(apt.barbershopId);
      const rating = getAverageRating(apt.barbershopId);
      const catalog = getBarberCatalog(apt.barbershopId);
      const avgCatalogPrice =
        catalog.services.length > 0
          ? catalog.services.reduce((sum, item) => sum + item.price, 0) / catalog.services.length
          : 0;
      const avgPrice = Number(profile.precoMedio?.replace(/[^\d.,]/g, "").replace(",", "."));
      const priceValue = Number.isFinite(avgPrice) && avgPrice > 0 ? avgPrice : avgCatalogPrice;
      const duration = profile.tempoMedioMinutos || apt.durationMinutes || 45;
      const locationDisplay =
        apt.location || [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ");
      return {
        ...apt,
        barbershopDisplayName:
          apt.barbershopName || profile.nomeBarbearia || mockBarbershops.find((b) => b.id === apt.barbershopId)?.name || "Barbearia",
        locationDisplay: locationDisplay || "Local não informado",
        ratingAverage: rating.average,
        ratingCount: rating.count,
        averagePriceDisplay: priceValue > 0 ? `R$ ${priceValue.toFixed(0)}` : "R$ --",
        averageDurationMinutes: duration,
        distanceKmDisplay: `${(1.2 + (apt.barbershopId % 4) * 0.7).toFixed(1).replace(".", ",")} km`,
        hasReview: Boolean(apt.ratingSubmittedAt),
      } satisfies EnrichedAppointment;
    });
  }, [appointmentsQuery.data]);

  useEffect(() => {
    setWaitingPayments((prev) => {
      const validIds = new Set(appointments.map((apt) => String(apt.id)));
      let changed = false;
      const next: Record<string, WaitingPaymentEntry> = {};
      Object.entries(prev).forEach(([appointmentId, payment]) => {
        if (!validIds.has(appointmentId)) {
          changed = true;
          return;
        }
        next[appointmentId] = payment;
      });
      if (changed) saveWaitingPayments(next);
      return changed ? next : prev;
    });
  }, [appointments]);

  useEffect(() => {
    const onStorage = () => {
      if (!user?.id) return;
      void queryClient.invalidateQueries({ queryKey: qk.clientAppointments(user.id) });
    };
    window.addEventListener(APPOINTMENTS_CHANGED_EVENT, onStorage);
    return () => window.removeEventListener(APPOINTMENTS_CHANGED_EVENT, onStorage);
  }, [queryClient, user?.id]);

  useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 2500);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const waitingCopy = isModern
    ? {
        sectionEyebrow: "Vagas abertas",
        sectionTitle: "Vagas abertas agora",
        sectionSubtitle: "Reserve uma vaga e acompanhe sua chamada.",
        detailTitle: "Detalhes da vaga",
        detailReserve: "Reservar vaga",
        detailPayReserve: "Pagar e reservar",
        statusActiveTitle: "Você está na espera",
        statusPaymentConfirmed: "Pagamento confirmado",
        statusPaymentPending: "Pagamento pendente",
        statusRoute: "Siga para a barbearia",
        etaLabel: "Tempo estimado até atendimento",
        openRoute: "Abrir rota",
        cancelEntry: "Cancelar entrada",
        emptyTitle: "Nenhuma vaga aberta agora",
        emptyBody: "Quando a barbearia liberar um encaixe, ele aparece aqui.",
      }
    : {
        sectionEyebrow: "Encaixes disponíveis",
        sectionTitle: "Encaixes disponíveis agora",
        sectionSubtitle: "Garanta sua vaga e acompanhe sua vez.",
        detailTitle: "Detalhes do encaixe",
        detailReserve: "Entrar na espera",
        detailPayReserve: "Garantir com pagamento",
        statusActiveTitle: "Sua espera está ativa",
        statusPaymentConfirmed: "Reserva confirmada",
        statusPaymentPending: "Reserva aguardando pagamento",
        statusRoute: "Siga rota até a casa",
        etaLabel: "Previsão de atendimento",
        openRoute: "Ver rota",
        cancelEntry: "Cancelar reserva",
        emptyTitle: "Nenhum encaixe disponível agora",
        emptyBody: "Quando uma nova oportunidade surgir, ela aparece aqui para você.",
      };

  const { upcoming, past, cancelled } = useMemo(() => {
    const upcoming: EnrichedAppointment[] = [];
    const past: EnrichedAppointment[] = [];
    const cancelled: EnrichedAppointment[] = [];
    appointments.forEach((apt) => {
      if (apt.status === "cancelled") {
        cancelled.push(apt);
        return;
      }
      const dateTime = parseDateTime(apt);
      if (dateTime >= now && apt.status !== "completed") {
        upcoming.push(apt);
      } else {
        past.push(apt);
      }
    });
    upcoming.sort((a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime());
    past.sort((a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime());
    cancelled.sort((a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime());
    return { upcoming, past, cancelled };
  }, [appointments]);

  const nextAppointment = upcoming[0] || null;

  const waitingOpenSlots = useMemo(() => {
    void now;
    return mockBarbershops
      .flatMap((shop) => {
        const profile = getBarbershopProfile(shop.id);
        const locationDisplay =
          [profile.endereco, profile.cidade, profile.estado].filter(Boolean).join(", ") || profile.cidade || shop.location;
        const distanceKm = Number((1.2 + (shop.id % 4) * 0.7).toFixed(1));
        const etaToArriveMinutes = Math.max(4, Math.round((distanceKm / 25) * 60));
        return getOpenSlotsByBarbershop(shop.id)
          .filter((slot) => slot.status === "open")
          .map((slot) => {
            const startAt = parseDateAndTime(slot.date, slot.time);
            const etaToAttendMinutes = Math.max(0, Math.round((startAt.getTime() - now.getTime()) / 60000));
            return {
              id: slot.id,
              barbershopId: shop.id,
              barbershopName: profile.nomeBarbearia || shop.name,
              barberName: slot.assignedBarberName || profile.barberName || "Equipe da casa",
              service: "Encaixe rapido",
              price: Number(slot.potentialValue ?? 0),
              date: slot.date,
              time: slot.time,
              locationDisplay,
              distanceKmDisplay: `${distanceKm.toFixed(1).replace(".", ",")} km`,
              etaToArriveMinutes,
              etaToAttendMinutes,
              listingMsRemaining: getOpenSlotListingMsRemaining(slot),
            } satisfies WaitingSlotUi;
          });
      })
      .filter((slot) => slot.listingMsRemaining > 0)
      .sort((a, b) => {
        const etaDiff = a.etaToAttendMinutes - b.etaToAttendMinutes;
        if (etaDiff !== 0) return etaDiff;
        return a.price - b.price;
      });
  }, [now]);

  const activeWaitingAppointment = useMemo(
    () => upcoming.find((apt) => apt.openSlotOrigin && apt.status !== "completed" && apt.status !== "cancelled") || null,
    [upcoming],
  );

  const selectedWaitingSlot = useMemo(
    () => waitingOpenSlots.find((slot) => slot.id === waitingSlotDetailsId) || null,
    [waitingOpenSlots, waitingSlotDetailsId],
  );

  const activeWaitingPayment = activeWaitingAppointment ? waitingPayments[String(activeWaitingAppointment.id)] : undefined;

  const waitingStatusLabel = useMemo(() => {
    if (!activeWaitingAppointment) return null;
    switch (activeWaitingAppointment.status) {
      case "scheduled":
        return "Aguardando confirmação";
      case "confirmed":
        return "Vaga confirmada";
      case "in_service":
        return "Atendimento iniciado";
      default:
        return "Em espera";
    }
  }, [activeWaitingAppointment]);

  const getStatusConfig = (status: AppointmentUiStatus) => {
    switch (status) {
      case "scheduled":
        return { label: "Agendamento criado", className: "bg-muted text-muted-foreground border-border" };
      case "confirmed":
        return { label: "Confirmado pelo barbeiro", className: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
      case "in_service":
        return { label: "Em andamento agora", className: "bg-primary/10 text-primary border-primary/30" };
      case "completed":
        return { label: "Finalizado com sucesso", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" };
      case "cancelled":
        return { label: "Cancelado", className: "bg-red-500/10 text-red-500 border-red-500/30" };
      default:
        return { label: "Agendamento criado", className: "bg-muted text-muted-foreground border-border" };
    }
  };

  const statusFlow = [
    { key: "scheduled", label: "Criado" },
    { key: "confirmed", label: "Confirmado pelo barbeiro" },
    { key: "in_service", label: "Em andamento agora" },
    { key: "completed", label: "Finalizado com sucesso" },
  ] as const;

  const getStatusFlowIndex = (status: AppointmentUiStatus) => {
    if (status === "cancelled") return -1;
    const idx = statusFlow.findIndex((step) => step.key === status);
    return idx >= 0 ? idx : 0;
  };

  const getCountdownText = (apt: AppointmentRecord) => {
    const dateTime = parseDateTime(apt);
    const diffMs = dateTime.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "É em poucos minutos!";
    if (diffHours < 24) return `Faltam ${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "É amanhã!";
    if (diffDays <= 7) return `Faltam ${diffDays} dias`;
    return null;
  };

  const getCountdownClock = (apt: AppointmentRecord) => {
    const diffMs = parseDateTime(apt).getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const getNaturalDateText = (apt: AppointmentRecord) => {
    const dateTime = parseDateTime(apt);
    const midnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const midnightTarget = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate()).getTime();
    const dayDiff = Math.round((midnightTarget - midnightNow) / (1000 * 60 * 60 * 24));
    if (dayDiff === 0) return `Hoje às ${apt.time}`;
    if (dayDiff === 1) return `Amanhã às ${apt.time}`;
    return `${apt.date} às ${apt.time}`;
  };

  const getDistanceEta = (distanceKmDisplay: string) => {
    const distance = Number(distanceKmDisplay.replace(",", ".").replace(" km", ""));
    if (!Number.isFinite(distance)) return "Ver rota";
    const etaMinutes = Math.max(4, Math.round((distance / 25) * 60));
    return `${distanceKmDisplay} • ${etaMinutes} min`;
  };

  const getTimelineItems = (apt: AppointmentRecord) => [
    { label: "Criado", value: apt.createdAt, active: true },
    { label: "Confirmado", value: apt.confirmedAt, active: apt.status !== "scheduled" && apt.status !== "cancelled" },
    { label: "Em atendimento", value: apt.startedAt, active: apt.status === "in_service" || apt.status === "completed" },
    { label: "Finalizado", value: apt.completedAt, active: apt.status === "completed" },
    { label: "Cancelado", value: apt.cancelledAt, active: apt.status === "cancelled" },
    { label: "Avaliado", value: apt.ratingSubmittedAt, active: Boolean(apt.ratingSubmittedAt) },
  ];

  const formatTimelineDate = (iso?: string) => {
    if (!iso) return "--";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "--";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(
      d.getHours(),
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getMapQueryUrl = (locationDisplay: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDisplay)}`;

  const getWaitingListingCountdown = (listingMsRemaining: number) => {
    if (listingMsRemaining <= 0) return "Encerrando";
    const totalSeconds = Math.floor(listingMsRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const saveWaitingPayment = (appointmentId: number, amount: number) => {
    const key = String(appointmentId);
    setWaitingPayments((prev) => {
      const next = {
        ...prev,
        [key]: {
          paidAt: new Date().toISOString(),
          amount,
        },
      };
      saveWaitingPayments(next);
      return next;
    });
  };

  const removeWaitingPayment = (appointmentId: number) => {
    const key = String(appointmentId);
    setWaitingPayments((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      saveWaitingPayments(next);
      return next;
    });
  };

  const reserveWaitingSlot = (slot: WaitingSlotUi, payNow: boolean) => {
    if (!user) return;
    setWaitingReserveLoadingId(slot.id);
    const result = occupyOpenSlot(slot.barbershopId, slot.id, {
      clientName: user.name,
      clientId: user.id,
    });
    setWaitingReserveLoadingId(null);
    if (!result) {
      toast({
        title: "Vaga indisponível",
        description: "Essa vaga foi encerrada ou ocupada agora. Tente outra opção.",
        variant: "destructive",
      });
      return;
    }

    if (payNow) {
      saveWaitingPayment(result.appointment.id, Number(result.appointment.price ?? 0));
    }

    setWaitingSlotDetailsId(null);
    setSuccessMessage(payNow ? "Vaga reservada e pagamento confirmado" : "Vaga reservada com sucesso");
    toast({
      title: payNow ? "Pagamento confirmado" : "Você entrou na espera",
      description: payNow
        ? "Sua vaga foi garantida e o pagamento foi confirmado."
        : "Acompanhe o status da sua vaga em Agendamentos.",
    });
    void queryClient.invalidateQueries({ queryKey: qk.clientAppointments(user.id) });
  };

  const payWaitingAppointment = (apt: EnrichedAppointment) => {
    setWaitingPayingAppointmentId(apt.id);
    saveWaitingPayment(apt.id, Number(apt.price ?? 0));
    setWaitingPayingAppointmentId(null);
    setSuccessMessage("Pagamento confirmado");
    toast({
      title: "Pagamento confirmado",
      description: "Tudo certo. Sua espera segue ativa.",
    });
  };

  const cancelWaitingEntry = (apt: EnrichedAppointment) => {
    appointmentMutations.cancel.mutate(apt.id);
    if (apt.openSlotId) {
      closeOpenSlot(apt.barbershopId, apt.openSlotId);
    }
    removeWaitingPayment(apt.id);
    setSuccessMessage(isModern ? "Entrada cancelada com sucesso" : "Reserva cancelada com sucesso");
    toast({
      title: isModern ? "Entrada cancelada" : "Reserva cancelada",
      description: "A vaga foi encerrada e saiu da sua espera.",
    });
  };

  const getWhatsAppUrl = (apt: EnrichedAppointment) => {
    const digits = (apt.whatsAppPhone || "").replace(/\D/g, "");
    if (!digits) return null;
    const phone = digits.startsWith("55") ? digits : `55${digits}`;
    const text = encodeURIComponent(
      `Olá, ${apt.barbershopDisplayName}! Tenho um agendamento de ${apt.service} no dia ${apt.date} às ${apt.time}.`,
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget || !user) return;
    appointmentMutations.cancel.mutate(cancelTarget.id);
    addCancelledByClient(cancelTarget.barbershopId, {
      client: user?.name ?? "Cliente",
      service: cancelTarget.service,
      date: cancelTarget.date,
      time: cancelTarget.time,
    });
    setCancelTarget(null);
    setSuccessMessage("Agendamento cancelado com sucesso");
    void emitAppointmentNotification({
      userId: user.id,
      event: "cancelled",
      service: cancelTarget.service,
      barbershopName: cancelTarget.barbershopDisplayName,
      date: cancelTarget.date,
      time: cancelTarget.time,
      status: "cancelled",
    });
    toast({
      title: "Agendamento cancelado",
      description: "O agendamento foi cancelado. Lembre-se: a taxa paga não é reembolsada.",
    });
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget || !user || !rescheduleDate || !rescheduleTime) return;
    appointmentMutations.reschedule.mutate({
      appointmentId: rescheduleTarget.id,
      date: rescheduleDate,
      time: rescheduleTime,
    });
    setRescheduleTarget(null);
    setRescheduleDate("");
    setRescheduleTime("");
    setSuccessMessage("Reagendamento salvo");
    void emitAppointmentNotification({
      userId: user.id,
      event: "rescheduled",
      service: rescheduleTarget.service,
      barbershopName: rescheduleTarget.barbershopDisplayName,
      date: rescheduleDate,
      time: rescheduleTime,
      status: "scheduled",
    });
    toast({
      title: "Horário atualizado",
      description: "Seu agendamento foi reagendado com sucesso.",
    });
  };

  const openReview = (apt: EnrichedAppointment) => {
    setReviewTarget(apt);
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSubmitReview = () => {
    if (!reviewTarget || !user) return;
    addReview(reviewTarget.barbershopId, user.name, reviewRating, reviewComment);
    appointmentMutations.markReviewed.mutate(reviewTarget.id);
    setReviewTarget(null);
    setSuccessMessage("Avaliação enviada");
    toast({
      title: "Avaliação enviada",
      description: "Obrigado pelo seu feedback.",
    });
  };

  const recommendation = useMemo(() => {
    const completed = appointments
      .filter((a) => a.status === "completed")
      .sort((a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime());
    if (completed.length < 2) return null;
    const intervals: number[] = [];
    for (let i = 1; i < completed.length; i += 1) {
      const diff = parseDateTime(completed[i]).getTime() - parseDateTime(completed[i - 1]).getTime();
      intervals.push(Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24))));
    }
    const avg = Math.round(intervals.reduce((s, n) => s + n, 0) / intervals.length);
    const suggest = Math.max(3, avg - 2);
    return { avg, suggest };
  }, [appointments]);

  const recommendedCuts = useMemo(() => {
    const baseShopId = nextAppointment?.barbershopId ?? past.find((p) => p.status === "completed")?.barbershopId;
    if (!baseShopId) return [];
    const catalog = getBarberCatalog(baseShopId);
    return catalog.services.slice(0, 3);
  }, [nextAppointment, past]);

  const topBarbershops = useMemo(() => {
    const city = (user?.cidade || "").trim().toLowerCase();
    return mockBarbershops
      .filter((b) => !city || b.location.toLowerCase().includes(city))
      .map((b) => {
        const rating = getAverageRating(b.id);
        return {
          ...b,
          score: rating.count > 0 ? rating.average : b.rating,
          reviewsCount: rating.count,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [user?.cidade]);

  const favoritePattern = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completed");
    if (completed.length === 0) return null;
    const scores = new Map<string, { apt: EnrichedAppointment; count: number; lastTs: number }>();
    completed.forEach((apt) => {
      const key = `${apt.barbershopId}-${apt.service}`;
      const current = scores.get(key);
      const ts = parseDateTime(apt).getTime();
      if (!current) {
        scores.set(key, { apt, count: 1, lastTs: ts });
        return;
      }
      scores.set(key, { apt, count: current.count + 1, lastTs: Math.max(current.lastTs, ts) });
    });
    const best = Array.from(scores.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.lastTs - a.lastTs;
    })[0];
    return best ? { ...best.apt, count: best.count } : null;
  }, [appointments]);

  useEffect(() => {
    let isMounted = true;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const remainder = completedCount % 4;
    const fallbackRemaining = remainder === 0 ? 4 : 4 - remainder;
    const fallbackText =
      completedCount > 0
        ? `Falta${fallbackRemaining > 1 ? "m" : ""} ${fallbackRemaining} corte${fallbackRemaining > 1 ? "s" : ""} para liberar um benefício.`
        : "Conclua seu primeiro corte para começar a acumular benefícios.";

    if (!user?.id) {
      setLoyaltyHint(fallbackText);
      return;
    }

    void getLoyaltySummary(user.id)
      .then((summary) => {
        if (!isMounted) return;
        const nextTarget = Math.ceil((summary.total_points + 1) / 50) * 50;
        const missingPoints = Math.max(nextTarget - summary.total_points, 0);
        const approxCuts = Math.max(1, Math.ceil(missingPoints / 10));
        setLoyaltyHint(
          missingPoints > 0
            ? `Faltam ${approxCuts} corte${approxCuts > 1 ? "s" : ""} para atingir ${nextTarget} pontos e desbloquear um benefício.`
            : "Você já tem pontos disponíveis para aproveitar benefícios.",
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setLoyaltyHint(fallbackText);
      });

    return () => {
      isMounted = false;
    };
  }, [appointments, user?.id]);

  return (
    <DashboardLayout userType="cliente">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Meus Agendamentos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Seus próximos compromissos</p>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/cliente/novo-agendamento")}
          >
            Novo agendamento
          </Button>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2 text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </motion.div>
        )}

        {appointmentsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-5 border border-border/60 animate-pulse">
                <div className="h-4 w-48 bg-secondary rounded mb-3" />
                <div className="h-3 w-72 bg-secondary rounded mb-2" />
                <div className="h-3 w-56 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : (
        <div className="space-y-6">
          <section
            className={`glass-card rounded-2xl border p-4 sm:p-5 ${
              isModern ? "border-primary/35 bg-card/90" : "border-primary/30 bg-card/95 vintage-waiting-queue"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
                  {waitingCopy.sectionEyebrow}
                </p>
                <h2 className={`mt-1 font-semibold ${isModern ? "text-xl" : "font-display text-xl"}`}>
                  {waitingCopy.sectionTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{waitingCopy.sectionSubtitle}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <CircleDashed className="w-3.5 h-3.5" />
                {waitingOpenSlots.length} {waitingOpenSlots.length === 1 ? "vaga aberta" : "vagas abertas"}
              </span>
            </div>

            {activeWaitingAppointment && (
              <div className="mt-4 rounded-xl border border-primary/35 bg-primary/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-primary/80 font-semibold">
                      {waitingCopy.statusActiveTitle}
                    </p>
                    <p className="font-semibold mt-1">
                      {activeWaitingAppointment.barbershopDisplayName} - {activeWaitingAppointment.service}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {waitingStatusLabel} • {waitingCopy.etaLabel}:{" "}
                      {Math.max(
                        0,
                        activeWaitingAppointment.openSlotId
                          ? (getOpenSlotRemainingMinutes({
                              date: activeWaitingAppointment.date,
                              time: activeWaitingAppointment.time,
                              durationMinutes: activeWaitingAppointment.durationMinutes ?? 30,
                            }) ?? 0)
                          : Math.round((parseDateTime(activeWaitingAppointment).getTime() - now.getTime()) / 60000),
                      )}{" "}
                      min
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {activeWaitingPayment ? waitingCopy.statusPaymentConfirmed : waitingCopy.statusPaymentPending}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                    <Hourglass className="w-3.5 h-3.5" />
                    {activeWaitingAppointment.date} • {activeWaitingAppointment.time}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium mt-0.5">{waitingStatusLabel}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium mt-0.5">R$ {(activeWaitingAppointment.price ?? 0).toFixed(2).replace(".", ",")}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-muted-foreground">Pagamento</p>
                    <p className="font-medium mt-0.5">
                      {activeWaitingPayment
                        ? `Pago em ${new Date(activeWaitingPayment.paidAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Pendente"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-muted-foreground">{waitingCopy.statusRoute}</p>
                    <p className="font-medium mt-0.5">{getDistanceEta(activeWaitingAppointment.distanceKmDisplay)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/70"
                    onClick={() => window.open(getMapQueryUrl(activeWaitingAppointment.locationDisplay), "_blank")}
                  >
                    <Route className="w-4 h-4 mr-1" />
                    {waitingCopy.openRoute}
                  </Button>
                  {!activeWaitingPayment && (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => payWaitingAppointment(activeWaitingAppointment)}
                      disabled={waitingPayingAppointmentId === activeWaitingAppointment.id}
                    >
                      <WalletCards className="w-4 h-4 mr-1" />
                      {waitingPayingAppointmentId === activeWaitingAppointment.id ? "Confirmando..." : "Confirmar pagamento"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/45 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => cancelWaitingEntry(activeWaitingAppointment)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {waitingCopy.cancelEntry}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-border/60 bg-card/70 overflow-hidden">
              {waitingOpenSlots.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <CalendarIcon className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className={`font-medium ${isModern ? "" : "font-display"}`}>{waitingCopy.emptyTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">{waitingCopy.emptyBody}</p>
                </div>
              ) : (
                waitingOpenSlots.slice(0, 5).map((slot) => (
                  <div
                    key={slot.id}
                    className="px-4 py-3 border-b border-border/60 last:border-b-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{slot.barbershopName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {slot.barberName} • {slot.service}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {slot.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <WalletCards className="w-3.5 h-3.5" />
                          R$ {slot.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {slot.distanceKmDisplay} • {slot.etaToArriveMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <Hourglass className="w-3.5 h-3.5" />
                          Atendimento em {slot.etaToAttendMinutes} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:shrink-0">
                      <span className="text-[11px] text-primary font-medium rounded-full border border-primary/30 bg-primary/10 px-2 py-1">
                        Expira em {getWaitingListingCountdown(slot.listingMsRemaining)}
                      </span>
                      <Button size="sm" variant="gold" onClick={() => setWaitingSlotDetailsId(slot.id)}>
                        {isModern ? "Reservar vaga" : "Entrar na espera"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {nextAppointment && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: [0, -2, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              className="glass-card rounded-2xl p-5 border border-primary/40 bg-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold">Seu próximo corte</p>
                  <h2 className="font-display text-xl font-bold mt-1">{nextAppointment.barbershopDisplayName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{nextAppointment.service}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                  {getNaturalDateText(nextAppointment)}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-primary">
                {getCountdownClock(nextAppointment)
                  ? `Seu corte começa em ${getCountdownClock(nextAppointment)}`
                  : "Seu horário está em andamento ou já começou."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{nextAppointment.date}</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{nextAppointment.time}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{nextAppointment.locationDisplay}</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <Scissors className="w-3 h-3" />
                  R$ {(nextAppointment.price ?? 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => {
                    setRescheduleTarget(nextAppointment);
                    const [d, m, y] = nextAppointment.date.split("/");
                    setRescheduleDate(`${y}-${m}-${d}`);
                    setRescheduleTime(nextAppointment.time);
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reagendar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/70 text-foreground hover:bg-secondary/80"
                  onClick={() => window.open(getMapQueryUrl(nextAppointment.locationDisplay), "_blank")}
                >
                  <MapPinned className="w-4 h-4 mr-1" />
                  Ver rota
                </Button>
              </div>
            </motion.section>
          )}

          {favoritePattern && (
            <section className="glass-card rounded-2xl p-4 border border-border/60 bg-card/95">
              <p className="text-xs uppercase tracking-wider text-primary font-semibold">Seu estilo favorito</p>
              <p className="mt-1 font-semibold">
                {favoritePattern.service} - {favoritePattern.barbershopDisplayName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você repetiu esse corte {favoritePattern.count}x.
              </p>
              <Button
                variant="gold"
                size="sm"
                className="mt-3"
                onClick={() =>
                  navigate("/cliente/novo-agendamento", {
                    state: {
                      prefill: {
                        barbershopId: favoritePattern.barbershopId,
                        serviceName: favoritePattern.service,
                      },
                    },
                  })
                }
              >
                Repetir esse corte em 1 clique
              </Button>
            </section>
          )}

          {loyaltyHint && (
            <div className="glass-card rounded-2xl p-4 border border-primary/35 bg-primary/5">
              <p className="text-sm font-medium">Beneficios para voce</p>
              <p className="text-xs text-muted-foreground mt-1">{loyaltyHint}</p>
            </div>
          )}

          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Próximos</h2>
            {upcoming.length === 0 ? (
              <div className="glass-card rounded-xl p-5 text-center text-sm text-muted-foreground">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Você não tem agendamentos futuros.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt, idx) => {
                  const statusCfg = getStatusConfig(apt.status);
                  const countdown = getCountdownText(apt);
                  const whatsAppUrl = getWhatsAppUrl(apt);
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ delay: idx * 0.05, duration: 0.28 }}
                      className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-4 border border-border/60 bg-card/95 shadow-card hover:shadow-xl transition-all"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex items-center justify-center shrink-0 border border-border/60">
                          {apt.thumbnailUrl ? (
                            <img
                              src={apt.thumbnailUrl}
                              alt={apt.barbershopDisplayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Scissors className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {apt.barbershopDisplayName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {apt.service}
                              </p>
                              <p className="text-[11px] text-primary inline-flex items-center gap-1 mt-1">
                                <MessageCircle className="w-3 h-3" />
                                Falar com barbeiro
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {apt.date} • {apt.time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {apt.locationDisplay}
                            </span>
                            {countdown && (
                              <span className="inline-flex items-center gap-1 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/5">
                                <Clock className="w-3 h-3" />
                                {countdown}
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              {statusFlow.map((step, flowIndex) => {
                                const currentIndex = getStatusFlowIndex(apt.status);
                                const active = flowIndex <= currentIndex;
                                return (
                                  <div key={step.key} className="flex items-center flex-1 min-w-0">
                                    <div
                                      className={`w-2.5 h-2.5 rounded-full border ${
                                        active
                                          ? "bg-primary border-primary"
                                          : "bg-secondary border-border"
                                      }`}
                                    />
                                    {flowIndex < statusFlow.length - 1 && (
                                      <div
                                        className={`h-[2px] flex-1 mx-1 rounded ${
                                          flowIndex < currentIndex ? "bg-primary" : "bg-border"
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                              {statusFlow.map((step) => (
                                <span key={step.key} className="text-center">
                                  {step.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-baseline gap-1 text-sm font-semibold text-primary">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            Valor
                          </span>
                          <span className="text-base">
                            R$ {(apt.price ?? 0).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border/70 text-foreground hover:bg-secondary/80"
                            onClick={() =>
                              window.open(
                                getMapQueryUrl(apt.locationDisplay),
                                "_blank",
                              )
                            }
                          >
                            <MapPinned className="w-4 h-4 mr-1" />
                            {getDistanceEta(apt.distanceKmDisplay)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border/70 text-foreground hover:bg-secondary/80"
                            onClick={() => {
                              const details = `${apt.service} - ${apt.barbershopDisplayName}`;
                              const start = parseDateTime(apt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                              const endDate = new Date(parseDateTime(apt).getTime() + 60 * 60 * 1000);
                              const end = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                              const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                details,
                              )}&dates=${start}%2F${end}&details=${encodeURIComponent(
                                "Agendamento no BarberFlow",
                              )}&location=${encodeURIComponent(apt.locationDisplay)}`;
                              window.open(url, "_blank");
                            }}
                          >
                            <CalendarPlus className="w-4 h-4 mr-1" />
                            Adicionar ao calendário
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                            onClick={() => {
                              setRescheduleTarget(apt);
                              const [d, m, y] = apt.date.split("/");
                              setRescheduleDate(`${y}-${m}-${d}`);
                              setRescheduleTime(apt.time);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reagendar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border/70 text-foreground hover:bg-secondary/80"
                            onClick={() =>
                              navigate("/cliente/novo-agendamento", {
                                state: {
                                  prefill: {
                                    barbershopId: apt.barbershopId,
                                    serviceName: apt.service,
                                  },
                                },
                              })
                            }
                          >
                            Agendar novamente
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => {
                              if (!whatsAppUrl) {
                                toast({
                                  title: "WhatsApp indisponível",
                                  description: "Essa barbearia não informou telefone.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              window.open(whatsAppUrl, "_blank");
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Falar com barbeiro
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => setCancelTarget(apt)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" />
                          {apt.ratingAverage > 0 ? apt.ratingAverage.toFixed(1) : "Novo"} ({apt.ratingCount})
                        </span>
                        <span>R$ média {apt.averagePriceDisplay.replace("R$ ", "")}</span>
                        <span>{apt.averageDurationMinutes} min</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {apt.distanceKmDisplay}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                        {getTimelineItems(apt).map((item) => (
                          <div
                            key={item.label}
                            className={`rounded-lg px-2 py-1 border ${
                              item.active ? "border-primary/40 text-foreground bg-primary/5" : "border-border text-muted-foreground"
                            }`}
                          >
                            <p className="font-medium">{item.label}</p>
                            <p>{formatTimelineDate(item.value)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Passados</h2>
            {past.length === 0 ? (
              <div className="glass-card rounded-xl p-5 text-center text-sm text-muted-foreground">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Você ainda não tem histórico de agendamentos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((apt, idx) => {
                  const canRate = apt.status === "completed" && !apt.hasReview;
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.995 }}
                      transition={{ delay: idx * 0.04, duration: 0.24 }}
                      className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-4 border border-border/60 bg-card/90 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex items-center justify-center shrink-0 border border-border/60">
                          {apt.thumbnailUrl ? (
                            <img src={apt.thumbnailUrl} alt={apt.barbershopDisplayName} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {apt.barbershopDisplayName}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {apt.service}
                              </p>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {apt.date} • {apt.time}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {apt.locationDisplay}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3 h-3 text-primary" />
                              {apt.ratingAverage > 0 ? apt.ratingAverage.toFixed(1) : "Novo"} ({apt.ratingCount})
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {apt.distanceKmDisplay}
                            </span>
                            <span>R$ média {apt.averagePriceDisplay.replace("R$ ", "")}</span>
                            <span>{apt.averageDurationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-baseline gap-1 text-sm font-semibold text-primary">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            Valor
                          </span>
                          <span className="text-base">
                            R$ {(apt.price ?? 0).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          {canRate ? (
                            <Button
                              variant="gold"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => openReview(apt)}
                            >
                              <Star className="w-4 h-4" />
                              Avaliar atendimento
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border/70 text-muted-foreground cursor-default"
                              disabled
                            >
                              <Star className="w-4 h-4 mr-1" />
                              {apt.hasReview ? "Atendimento avaliado" : "Avaliação indisponível"}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate("/cliente/novo-agendamento", {
                                state: {
                                  prefill: {
                                    barbershopId: apt.barbershopId,
                                    serviceName: apt.service,
                                  },
                                },
                              })
                            }
                          >
                            Agendar novamente
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Cancelados</h2>
            {cancelled.length === 0 ? (
              <div className="glass-card rounded-xl p-5 text-center text-sm text-muted-foreground">
                <XCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Nenhum agendamento cancelado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cancelled.map((apt, idx) => {
                  const statusCfg = getStatusConfig(apt.status);
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ delay: idx * 0.03, duration: 0.22 }}
                      className="glass-card rounded-2xl p-4 sm:p-5 border border-border/60 bg-card/80"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{apt.barbershopDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {apt.date} • {apt.time}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {getTimelineItems(apt).map((item) => (
                          <div
                            key={item.label}
                            className={`rounded-lg px-2 py-1 border ${
                              item.active ? "border-primary/40 text-foreground bg-primary/5" : "border-border text-muted-foreground"
                            }`}
                          >
                            <p className="font-medium">{item.label}</p>
                            <p>{formatTimelineDate(item.value)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {recommendation && (
            <div className="glass-card rounded-2xl p-5 border border-primary/40 bg-primary/5 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Previsão inteligente de corte</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu intervalo médio é de {recommendation.avg} dias. Recomendamos agendar novamente em {recommendation.suggest} dias.
                </p>
              </div>
            </div>
          )}

          {recommendedCuts.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-foreground">Cortes recomendados para você</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendedCuts.map((item) => (
                  <div key={item.id} className="glass-card rounded-xl p-4 border border-border/60">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description || "Serviço recomendado pelo seu histórico."}</p>
                    <p className="text-sm text-primary font-semibold mt-2">R$ {item.price.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {topBarbershops.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-foreground">
                  Top barbearias em {(user?.cidade || "sua cidade").trim()}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topBarbershops.map((shop, idx) => (
                  <div key={shop.id} className="glass-card rounded-xl p-4 border border-border/60">
                    <p className="text-xs text-primary font-semibold">#{idx + 1}</p>
                    <p className="font-semibold mt-1">{shop.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{shop.location}</p>
                    <p className="text-sm mt-2 inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      {shop.score.toFixed(1)} ({shop.reviewsCount || shop.services} avaliações)
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming.length === 0 && past.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-primary/40 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Já faz um tempo desde o último corte.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Que tal agendar novamente na sua barbearia favorita?
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => navigate("/cliente/novo-agendamento")}
                className="shrink-0"
              >
                Agendar agora
              </Button>
            </div>
          )}
        </div>
        )}

        <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nao vai conseguir ir?</AlertDialogTitle>
              <AlertDialogDescription>
                Reagendar e mais rapido e voce nao perde prioridade no atendimento.
                Se cancelar, o valor da taxa de agendamento <strong>nao sera devolvido</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  if (!cancelTarget) return;
                  setRescheduleTarget(cancelTarget);
                  const [d, m, y] = cancelTarget.date.split("/");
                  setRescheduleDate(`${y}-${m}-${d}`);
                  setRescheduleTime(cancelTarget.time);
                  setCancelTarget(null);
                }}
              >
                Reagendar
              </Button>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancelar mesmo assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reagendar atendimento</DialogTitle>
              <DialogDescription>
                Escolha uma nova data e horário para o serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nova data</Label>
                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Novo horário</Label>
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancelar</Button>
              <Button onClick={handleConfirmReschedule}>Salvar novo horário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!reviewTarget} onOpenChange={(open) => !open && setReviewTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avaliar atendimento</DialogTitle>
              <DialogDescription>
                Sua avaliação ajuda outros clientes a escolher melhor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nota</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-1">
                <Label>Comentário</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Conte rapidamente como foi a experiência."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancelar</Button>
              <Button onClick={handleSubmitReview}>Enviar avaliação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedWaitingSlot} onOpenChange={(open) => !open && setWaitingSlotDetailsId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{waitingCopy.detailTitle}</DialogTitle>
              <DialogDescription>
                {selectedWaitingSlot
                  ? `${selectedWaitingSlot.barbershopName} • ${selectedWaitingSlot.barberName}`
                  : "Confira a vaga antes de confirmar."}
              </DialogDescription>
            </DialogHeader>
            {selectedWaitingSlot && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-medium mt-1">{selectedWaitingSlot.service}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-medium mt-1">R$ {selectedWaitingSlot.price.toFixed(2).replace(".", ",")}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{waitingCopy.etaLabel}</p>
                    <p className="font-medium mt-1">
                      {selectedWaitingSlot.etaToAttendMinutes === 0
                        ? "Atendimento imediato"
                        : `${selectedWaitingSlot.etaToAttendMinutes} min`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Chegada estimada</p>
                    <p className="font-medium mt-1">{selectedWaitingSlot.etaToArriveMinutes} min</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="mt-1">{selectedWaitingSlot.locationDisplay}</p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              {selectedWaitingSlot && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.open(getMapQueryUrl(selectedWaitingSlot.locationDisplay), "_blank")}
                  >
                    <Route className="w-4 h-4 mr-1" />
                    {waitingCopy.openRoute}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => reserveWaitingSlot(selectedWaitingSlot, false)}
                    disabled={waitingReserveLoadingId === selectedWaitingSlot.id}
                  >
                    {waitingReserveLoadingId === selectedWaitingSlot.id ? "Confirmando..." : waitingCopy.detailReserve}
                  </Button>
                  <Button
                    variant="gold"
                    onClick={() => reserveWaitingSlot(selectedWaitingSlot, true)}
                    disabled={waitingReserveLoadingId === selectedWaitingSlot.id}
                  >
                    <WalletCards className="w-4 h-4 mr-1" />
                    {waitingReserveLoadingId === selectedWaitingSlot.id ? "Processando..." : waitingCopy.detailPayReserve}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientAppointments;
