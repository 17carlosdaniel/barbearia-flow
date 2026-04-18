import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Sparkles, Scissors } from "lucide-react";

interface FarewellAnimationProps {
  onComplete: () => void;
}

const SCENE_COUNT = 5;
/** Duração de cada cena (ms) — total ≈ SCENE_COUNT × valor */
const SCENE_DURATION_MS = 2400;
export const FAREWELL_ANIMATION_TOTAL_MS = SCENE_COUNT * SCENE_DURATION_MS;

function GoldenParticle({ delay, seed }: { delay: number; seed: number }) {
  const ax = 50 + ((seed * 17) % 70) - 35;
  const ay = 50 + ((seed * 31) % 70) - 35;
  const bx = 50 + ((seed * 23) % 80) - 40;
  const by = 50 + ((seed * 11) % 80) - 40;
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, hsl(var(--gold-light) / 0.65), hsl(var(--gold)) 55%, transparent)",
        boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
      }}
      initial={{ opacity: 0, scale: 0, left: `${ax}%`, top: `${ay}%` }}
      animate={{
        opacity: [0, 1, 0.85, 0],
        scale: [0, 1.1, 1, 0.4],
        left: [`${ax}%`, `${bx}%`],
        top: [`${ay}%`, `${by}%`],
      }}
      transition={{ duration: 3.2, delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeOut" }}
    />
  );
}

function SceneLogo() {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex items-center gap-3">
        <Scissors className="w-14 h-14 text-primary" />
        <span className="font-display text-3xl md:text-4xl font-bold text-gradient-gold">BarberFlow</span>
      </div>
      <p className="text-muted-foreground text-center text-sm max-w-md px-4">
        Encerrando sua conta com cuidado e respeito aos seus dados.
      </p>
    </motion.div>
  );
}

function ScenePrivacy() {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 max-w-lg px-4"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.5 }}
    >
      <Shield className="w-14 h-14 text-primary" />
      <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-gold text-center">
        Seus dados estão seguros
      </h2>
      <p className="text-muted-foreground text-center text-sm leading-relaxed">
        Em conformidade com a LGPD, suas informações pessoais serão tratadas conforme nossa política de privacidade.
      </p>
    </motion.div>
  );
}

function SceneThanks() {
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5 }}
    >
      <Heart className="w-14 h-14 text-primary fill-primary/20" />
      <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-gold text-center">
        Obrigado por confiar no BarberFlow
      </h2>
      <p className="text-muted-foreground text-center text-sm max-w-md">
        Foi um prazer fazer parte da sua rotina.
      </p>
    </motion.div>
  );
}

function SceneJourney() {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 max-w-lg px-4"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5 }}
    >
      <Sparkles className="w-14 h-14 text-primary" />
      <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient-gold text-center">
        Cada visita deixou sua marca
      </h2>
      <p className="text-muted-foreground text-center text-sm">
        Os agendamentos, avaliações e preferências foram parte da nossa jornada juntos.
      </p>
    </motion.div>
  );
}

function SceneFinal() {
  return (
    <motion.div
      className="flex flex-col items-center gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="flex items-center gap-2">
        <Scissors className="w-10 h-10 text-primary" />
        <span className="font-display text-2xl font-bold text-gradient-gold">BarberFlow</span>
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center">
        Até a próxima
      </h2>
      <p className="text-muted-foreground text-sm text-center max-w-sm">
        Você será redirecionado para o login. Se mudar de ideia, estaremos aqui.
      </p>
    </motion.div>
  );
}

const scenes = [SceneLogo, ScenePrivacy, SceneThanks, SceneJourney, SceneFinal] as const;

/**
 * Sequência de despedida para exclusão permanente de conta — tema BarberFlow.
 */
const FarewellAnimation = ({ onComplete }: FarewellAnimationProps) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (sceneIndex >= SCENE_COUNT - 1) {
      const t = setTimeout(finish, SCENE_DURATION_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSceneIndex((i) => i + 1), SCENE_DURATION_MS);
    return () => clearTimeout(t);
  }, [sceneIndex, finish]);

  const CurrentScene = scenes[sceneIndex] ?? SceneFinal;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(165deg, hsl(var(--background)), hsl(var(--card) / 0.9), hsl(var(--background)))",
          }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <GoldenParticle key={i} delay={i * 0.35} seed={i + 1} />
          ))}
        </div>

        <motion.div
          className="absolute w-[min(100vw,520px)] h-[min(100vw,520px)] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.14), transparent 68%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[40vh] px-6 w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={sceneIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="w-full flex justify-center"
            >
              <CurrentScene />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-3 px-4">
          <div className="flex gap-1.5">
            {scenes.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-colors ${
                  i === sceneIndex ? "bg-primary w-8" : "bg-muted w-2"
                }`}
                layout
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Pular animação e encerrar conta agora"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Pular e encerrar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FarewellAnimation;
