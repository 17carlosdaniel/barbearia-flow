import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Search, CalendarClock, ShieldCheck, MapPin, ChevronLeft } from "lucide-react";
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
      () => { setRequestingLocation(false); onFinish({ locationStatus: "granted" }); },
      () => { setRequestingLocation(false); onFinish({ locationStatus: "denied" }); },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  };

  const ScreenIcon = screens[step].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden"
    >
      {/* Imagem hero — ocupa topo da tela */}
      <div className="relative w-full flex-shrink-0" style={{ height: "45dvh" }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={screens[step].imageUrl}
            src={screens[step].imageUrl}
            alt={screens[step].imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        </AnimatePresence>
        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />

        {/* Botão pular — topo direito */}
        <div className="absolute top-4 right-4 z-10">
          {skipAvailable ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm font-medium text-white/90 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
            >
              Pular
            </button>
          ) : null}
        </div>
      </div>

      {/* Conteúdo inferior */}
      <div className="flex flex-col flex-1 px-6 pt-6 pb-8 sm:pb-10 overflow-hidden">

        {/* Indicador de progresso */}
        <div className="flex gap-1.5 mb-6">
          {screens.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full bg-muted overflow-hidden flex-1"
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: i < step ? "100%" : i === step ? "0%" : "0%" }}
                animate={{ width: i < step ? "100%" : i === step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Ícone + texto */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <ScreenIcon className="w-6 h-6 text-primary" />
            </div>

            {step === 0 && (
              <p className="text-sm text-muted-foreground mb-1">
                Olá, <span className="text-gradient-gold font-semibold">{firstName}</span> 👋
              </p>
            )}

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground leading-tight">
              {screens[step].title}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed">
              {screens[step].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Botões de ação */}
        <div className="flex items-center gap-3 mt-6">
          {/* Voltar */}
          <button
            type="button"
            disabled={step === 0 || requestingLocation}
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            className="flex items-center justify-center w-12 h-12 rounded-xl border border-border text-muted-foreground disabled:opacity-30 active:scale-95 transition-transform flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* CTA principal */}
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Button
              size="lg"
              className="w-full h-12 text-base rounded-xl shadow-lg shadow-primary/20 font-semibold"
              onClick={handlePrimary}
              disabled={requestingLocation}
            >
              {step === screens.length - 1
                ? <MapPin className="w-5 h-5 mr-2" />
                : <Search className="w-5 h-5 mr-2" />}
              {requestingLocation ? "Ativando..." : screens[step].cta}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientHomeIntro;
