import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scissors, Search, CalendarClock, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientHomeIntroProps {
  firstName: string;
  onSkip: () => void;
  onFinish: (payload: { locationStatus: "granted" | "denied" | "unavailable" | "skipped" }) => void;
}

const ClientHomeIntro = ({ firstName, onSkip, onFinish }: ClientHomeIntroProps) => {
  const [step, setStep] = useState(0);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [skipAvailable, setSkipAvailable] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSkipAvailable(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  const screens = useMemo(
    () => [
      {
        icon: Scissors,
        title: "Seu próximo corte começa aqui",
        subtitle: "Encontre as melhores barbearias perto de você.",
        cta: "Explorar agora",
        imageUrl:
          "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Cadeira premium de barbearia",
      },
      {
        icon: CalendarClock,
        title: "Agende em segundos",
        subtitle: "Escolha o serviço, horário e pague na hora. Sem fila. Sem espera.",
        cta: "Próximo",
        imageUrl:
          "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Atendimento acontecendo na barbearia",
      },
      {
        icon: ShieldCheck,
        title: "Profissionais verificados",
        subtitle: "Veja avaliações reais antes de escolher. Qualidade garantida.",
        cta: "Próximo",
        imageUrl:
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Profissional verificado com foco em qualidade",
      },
      {
        icon: MapPin,
        title: "Pronto pra mudar o visual?",
        subtitle: "Ative sua localização para ver barbearias próximas de você.",
        cta: "Ativar localização",
        imageUrl:
          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
        imageAlt: "Mapa e localização para encontrar barbearias",
      },
    ],
    [],
  );

  const handlePrimary = () => {
    if (step < screens.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    if (!navigator.geolocation) {
      onFinish({ locationStatus: "unavailable" });
      return;
    }
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setRequestingLocation(false);
        onFinish({ locationStatus: "granted" });
      },
      () => {
        setRequestingLocation(false);
        onFinish({ locationStatus: "denied" });
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  };

  const ScreenIcon = screens[step].icon;
  const ScreenImageUrl = screens[step].imageUrl;
  const ScreenImageAlt = screens[step].imageAlt;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-primary/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_80%_at_50%_30%,hsl(var(--primary)/0.28),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Etapa {step + 1} de {screens.length}
            </p>
            {skipAvailable ? (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={onSkip}
              >
                Pular
              </button>
            ) : (
              <span className="text-xs opacity-0 select-none">Pular</span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / screens.length) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className="mt-6 text-center"
          >
            <motion.div
              className="relative mx-auto w-full h-40 sm:h-44 rounded-xl overflow-hidden border border-border/60"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <img
                src={ScreenImageUrl}
                alt={ScreenImageAlt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/35 to-transparent" />
            </motion.div>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <ScreenIcon className="w-7 h-7 text-primary" />
            </div>
            {step === 0 ? (
              <p className="text-sm text-muted-foreground mb-2">
                Olá, <span className="text-gradient-gold font-semibold">{firstName}</span>
              </p>
            ) : null}
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground">
              {screens[step].title}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{screens[step].subtitle}</p>
          </motion.div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
              disabled={step === 0 || requestingLocation}
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            >
              Voltar
            </button>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="inline-flex w-full max-w-sm">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-6 rounded-xl shadow-lg shadow-primary/20"
                onClick={handlePrimary}
                disabled={requestingLocation}
              >
                {step === screens.length - 1 ? <MapPin className="w-5 h-5 mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                {requestingLocation ? "Ativando..." : screens[step].cta}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientHomeIntro;
