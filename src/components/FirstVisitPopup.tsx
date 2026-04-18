import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scissors, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "barberflow_first_visit_dismissed";
const REOPEN_AFTER_DAYS = 30;

const FirstVisitPopup = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const timer = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(timer);
      }
      const parsed = JSON.parse(raw) as { dismissedAt: string } | null;
      const last = parsed?.dismissedAt ? new Date(parsed.dismissedAt) : null;
      if (!last) return;
      const diffMs = Date.now() - last.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= REOPEN_AFTER_DAYS) {
        const timer = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(timer);
      }
    } catch {
      // se der erro no parse, não mostra de novo nessa sessão
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dismissedAt: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }
  };

  const handleCTA = () => {
    dismiss();
    navigate("/cadastro");
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[61] max-w-md w-full"
          >
            <div className="relative bg-card border border-primary/30 rounded-2xl p-8 shadow-gold overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

              <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <Gift className="h-8 w-8 text-primary" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-1 mb-2"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Oferta Exclusiva
                  </span>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-display text-2xl font-bold mb-2"
                >
                  10% OFF no primeiro agendamento!
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground mb-6 leading-relaxed"
                >
                  Cadastre-se agora no BarberFlow e ganhe desconto na sua primeira experiência. Encontre as melhores barbearias perto de você.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-col gap-2"
                >
                  <Button variant="gold" size="lg" onClick={handleCTA} className="w-full">
                    <Scissors className="h-4 w-4 mr-2" />
                    Quero meu desconto!
                  </Button>
                  <button
                    onClick={dismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Agora não, obrigado
                  </button>
                </motion.div>

                <p className="text-[10px] text-muted-foreground/50 mt-4">
                  *Válido para o primeiro agendamento pelo app
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FirstVisitPopup;
