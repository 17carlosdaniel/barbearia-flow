import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ColorChipGroupProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (color: string) => void;
  className?: string;
};

export function ColorChipGroup({ label, options, selected, onToggle, className }: ColorChipGroupProps) {
  return (
    <div className={cn("col-span-2 space-y-1.5", className)}>
      <Label className="text-sm text-foreground/80">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((color) => {
          const isOn = selected.includes(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => onToggle(color)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs transition-colors",
                isOn ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}
