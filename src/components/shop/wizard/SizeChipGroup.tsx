import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SizeChipGroupProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (size: string) => void;
  className?: string;
};

export function SizeChipGroup({ label, options, selected, onToggle, className }: SizeChipGroupProps) {
  return (
    <div className={cn("col-span-2 space-y-1.5", className)}>
      <Label className="text-sm text-foreground/80">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((size) => {
          const isOn = selected.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => onToggle(size)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs transition-colors",
                isOn ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
