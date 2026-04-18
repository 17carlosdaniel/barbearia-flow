import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: StepItem[];
  currentIndex: number;
  className?: string;
}

/**
 * Indicador de passos para fluxos multi-etapa (ex.: Novo Agendamento).
 * Concluídos: verde + check; atual: borda dourada; futuros: cinza.
 */
const StepIndicator = ({ steps, currentIndex, className }: StepIndicatorProps) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isCompleted && "bg-success text-success-foreground",
                isCurrent && "border-2 border-primary bg-card text-foreground",
                !isCompleted && !isCurrent && "border border-border bg-muted/50 text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {step.icon ?? (i + 1)}
                </span>
              )}
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-6 h-0.5 rounded",
                  isCompleted ? "bg-success" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
