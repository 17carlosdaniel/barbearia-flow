import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaitingSurveyCardProps {
  onSubmit: (question: string, answer: string) => void;
  showHeader?: boolean;
  submitLabel?: string;
  submittedLabel?: string;
}

const QUESTION = "Qual dessas coisas você mais valoriza em uma barbearia?";
const OPTIONS = ["Preço", "Qualidade", "Ambiente", "Velocidade"];

const WaitingSurveyCard = ({
  onSubmit,
  showHeader = true,
  submitLabel = "Enviar resposta",
  submittedLabel = "Resposta enviada",
}: WaitingSurveyCardProps) => {
  const [answer, setAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="space-y-3">
      {showHeader && (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Pesquisa rápida</h3>
        </div>
      )}

      <motion.div
        whileHover={{ y: -2 }}
        className="glass-card rounded-xl border border-border/60 p-4 shadow-card"
      >
        <p className="text-sm font-medium">{QUESTION}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              variant={answer === option ? "gold" : "outline"}
              onClick={() => setAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            disabled={!answer || submitted}
            onClick={() => {
              onSubmit(QUESTION, answer);
              setSubmitted(true);
            }}
          >
            {submitted ? submittedLabel : submitLabel}
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default WaitingSurveyCard;
