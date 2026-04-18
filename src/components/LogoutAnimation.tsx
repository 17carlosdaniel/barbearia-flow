import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Scissors } from "lucide-react";

interface LogoutAnimationProps {
  onComplete: () => void;
}

const TOTAL_MS = 3400;
const PHASE_MS = 2400;

/**
 * Micro animação de saída (Sair) — tema BarberFlow, duração curta, com opção de pular.
 */
const LogoutAnimation = ({ onComplete }: LogoutAnimationProps) => {
  const [phase, setPhase] = useState<"greeting" | "exit">("greeting");
  const doneRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), PHASE_MS);
    const t2 = setTimeout(finish, TOTAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => {
    finish();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--background)), hsl(var(--card) / 0.85))",
          }}
        />

        <motion.div
          className="absolute w-[min(90vw,420px)] h-[min(90vw,420px)] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)",
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center gap-5 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Scissors className="w-10 h-10 text-primary" />
            <span className="font-display text-2xl font-bold text-gradient-gold">BarberFlow</span>
          </div>

          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
          >
            <Hand className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.p
            className="font-display text-2xl md:text-3xl font-bold text-gradient-gold text-center"
            animate={phase === "exit" ? { opacity: 0, y: -10 } : { opacity: 1 }}
            transition={{ duration: 0.45 }}
          >
            Até logo!
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2 flex-wrap"
            animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            Volte quando quiser
            <Scissors className="w-4 h-4 text-primary shrink-0" />
          </motion.p>

          <button
            type="button"
            onClick={skip}
            aria-label="Encerrar sessão imediatamente sem esperar a animação"
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Sair agora
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LogoutAnimation;
