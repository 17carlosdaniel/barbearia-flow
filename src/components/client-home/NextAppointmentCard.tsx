import { motion } from "framer-motion";
import { Calendar as CalendarIcon, MapPin, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";

export interface NextAppointmentData {
  id: string;
  barbershop: string;
  service: string;
  location: string;
  startAt: Date;
}

interface NextAppointmentCardProps {
  appointment: NextAppointmentData;
  countdownText?: string;
  isUrgent: boolean;
}

const NextAppointmentCard = ({
  appointment,
  countdownText,
  isUrgent,
}: NextAppointmentCardProps) => {
  const navigate = useNavigate();
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const momentLabel = getClientHomeCopy(identity).momentSection;
  const dateLabel = appointment.startAt.toLocaleDateString("pt-BR");
  const timeLabel = appointment.startAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn(isVintage ? "space-y-4" : "space-y-2")}>
      <div className="flex items-center justify-between px-0.5 sm:px-1">
        <h2
          className={cn(
            isVintage ? "vintage-label" : "text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60",
          )}
        >
          {momentLabel}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all",
          isVintage ? "p-5" : "p-3.5 sm:p-4",
          isUrgent
            ? "border-primary/25 bg-primary/[0.08] shadow-sm"
            : "border-border/70 bg-card/90 shadow-sm",
        )}
      >
        <div
          className={cn(
            "flex flex-col md:flex-row md:items-center",
            isVintage ? "gap-6" : "gap-3.5 md:gap-4",
          )}
        >
          <div className="relative shrink-0">
            {isUrgent && (
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-primary/20 animate-ping",
                  !isVintage && "rounded-xl",
                )}
              />
            )}
            <div
              className={cn(
                "relative flex items-center justify-center rounded-2xl border transition-all",
                isVintage ? "h-16 w-16" : "h-12 w-12 rounded-xl",
                isUrgent ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-primary/5 text-primary",
              )}
            >
              <Scissors className={cn(isVintage ? "h-8 w-8" : "h-6 w-6")} />
            </div>
          </div>

          <div className={cn("flex-1", isVintage ? "space-y-3" : "space-y-2")}>
            <div className={cn(isVintage ? "space-y-1" : "space-y-0.5")}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-lg px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]",
                    isVintage && "font-semibold",
                    !isVintage && "font-black tracking-widest",
                    isUrgent ? "bg-primary/15 text-primary" : "border border-border/60 bg-muted/20 text-muted-foreground",
                  )}
                >
                  {isUrgent ? "Falta pouco" : "Próximo agendamento"}
                </span>
                {countdownText && (
                  <span
                    className={cn(
                      "font-bold text-primary tabular-nums",
                      isVintage ? "text-[10px]" : "text-[9px]",
                    )}
                  >
                    em {countdownText}
                  </span>
                )}
              </div>
              <h3
                className={cn(
                  "font-bold leading-tight tracking-tight text-foreground",
                  isVintage ? "font-vintage-heading text-xl" : "text-base sm:text-lg",
                )}
              >
                {appointment.service} na <span className="text-primary">{appointment.barbershop}</span>
              </h3>
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground/80",
                isVintage ? "gap-y-2 text-xs font-medium" : "text-[11px] font-semibold",
              )}
            >
              <div className="flex items-center gap-1.5">
                <CalendarIcon className={cn("text-primary/60", isVintage ? "h-3.5 w-3.5" : "h-3 w-3")} />
                {dateLabel} às {timeLabel}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className={cn("text-primary/60", isVintage ? "h-3.5 w-3.5" : "h-3 w-3")} />
                {appointment.location}
              </div>
            </div>
          </div>

          <div className={cn("flex shrink-0 gap-1.5", !isVintage && "w-full sm:w-auto")}>
            <Button
              variant="outlineGold"
              size="sm"
              onClick={() => navigate(`/cliente/barbearia/${appointment.id}`)}
              className={cn(
                "rounded-xl uppercase tracking-widest",
                isVintage
                  ? "h-10 px-5 text-[9px] font-semibold tracking-[0.12em]"
                  : "h-9 flex-1 px-3 text-[8px] font-black sm:flex-none sm:px-4",
              )}
            >
              Ver detalhes
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() =>
                navigate("/cliente/novo-agendamento", {
                  state: {
                    prefill: {
                      barbershopId: Number(appointment.id),
                      serviceName: appointment.service,
                      date: appointment.startAt.toISOString().split("T")[0],
                      time: appointment.startAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      step: 5,
                    },
                  },
                })
              }
              className={cn(
                "rounded-xl uppercase tracking-widest",
                isVintage
                  ? "h-10 px-5 text-[9px] font-semibold tracking-[0.12em]"
                  : "h-9 flex-1 px-3 text-[8px] font-black sm:flex-none sm:px-4",
              )}
            >
              Reagendar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NextAppointmentCard;
