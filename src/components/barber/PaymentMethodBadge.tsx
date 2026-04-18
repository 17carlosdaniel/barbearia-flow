import { QrCode, CreditCard, Banknote, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethodBadgeProps = {
  method: string;
  size?: "sm" | "md";
  className?: string;
};

export function PaymentMethodBadge({ method, size = "md", className }: PaymentMethodBadgeProps) {
  const icon = (() => {
    switch (method) {
      case "Pix":
        return <QrCode className={cn("text-primary", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />;
      case "Cartão":
        return <CreditCard className={cn("text-blue-400", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />;
      case "Dinheiro":
        return <Banknote className={cn("text-green-400", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />;
      default:
        return <DollarSign className={cn("text-muted-foreground", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />;
    }
  })();

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-background/40 flex items-center justify-center shrink-0",
        size === "sm" ? "w-9 h-9" : "w-10 h-10",
        className,
      )}
    >
      {icon}
    </div>
  );
}

