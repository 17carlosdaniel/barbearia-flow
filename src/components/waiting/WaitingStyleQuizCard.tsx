import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuizAnswers {
  faceShape: string;
  style: string;
  hairType: string;
  /** Permite passar para APIs que esperam `Record<string, string>`. */
  [key: string]: string;
}

interface WaitingStyleQuizCardProps {
  onComplete: (answers: QuizAnswers, recommendedStyle: string) => void;
  /** Esconde ícone + título — uso dentro de “Personalização” */
  showHeader?: boolean;
  /** Última resposta chama onComplete e não exibe tela de resultado (handoff para pesquisa) */
  embedHandoff?: boolean;
}

const QUESTIONS = [
  {
    key: "faceShape" as const,
    question: "Qual formato de rosto combina com você?",
    options: ["Oval", "Quadrado", "Redondo", "Diamante"],
  },
  {
    key: "style" as const,
    question: "Seu estilo no dia a dia?",
    options: ["Clássico", "Moderno", "Urbano", "Executivo"],
  },
  {
    key: "hairType" as const,
    question: "Seu tipo de cabelo é...",
    options: ["Liso", "Ondulado", "Cacheado", "Crespo"],
  },
];

function getRecommendation(answers: Partial<QuizAnswers>): string {
  if (answers.style === "Executivo") return "Side Part";
  if (answers.style === "Urbano") return "Low Fade";
  if (answers.hairType === "Cacheado" || answers.hairType === "Crespo") return "Curly Fade";
  return "Mid Fade";
}

const WaitingStyleQuizCard = ({ onComplete, showHeader = true, embedHandoff = false }: WaitingStyleQuizCardProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  const current = QUESTIONS[step];
  const completed = step >= QUESTIONS.length;
  const recommendation = getRecommendation(answers);

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Quiz rápido de estilo</h3>
        </div>
      )}

      <div className="glass-card rounded-xl border border-border/60 p-4 shadow-card">
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={current.key}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium">{current.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const nextAnswers = { ...answers, [current.key]: option };
                      setAnswers(nextAnswers);
                      if (step < QUESTIONS.length - 1) {
                        setStep((s) => s + 1);
                        return;
                      }
                      if (embedHandoff) {
                        onComplete(nextAnswers as QuizAnswers, getRecommendation(nextAnswers));
                        return;
                      }
                      setStep(QUESTIONS.length);
                      onComplete(nextAnswers as QuizAnswers, getRecommendation(nextAnswers));
                    }}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Pergunta {step + 1} de {QUESTIONS.length}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">Recomendação para seu perfil:</p>
              <p className="font-display text-xl font-bold text-primary">{recommendation}</p>
              <Button onClick={() => setStep(0)} variant="gold-outline">
                Refazer quiz <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default WaitingStyleQuizCard;
