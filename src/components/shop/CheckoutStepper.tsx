interface CheckoutStepperProps {
  step: number;
}

const labels = ["Identificação", "Entrega", "Pagamento"];

const CheckoutStepper = ({ step }: CheckoutStepperProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {labels.map((label, idx) => {
        const active = step === idx + 1;
        return (
          <div
            key={label}
            className={`rounded-md px-2 py-1.5 text-center border ${active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}
          >
            {idx + 1}. {label}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutStepper;
