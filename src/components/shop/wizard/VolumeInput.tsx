import { Input } from "@/components/ui/input";

const WIZARD_IN = "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0";

type Props = {
  value: number | undefined;
  onChange: (ml: number | undefined) => void;
  placeholder?: string;
};

export function VolumeInput({ value, onChange, placeholder = "Volume (ml)" }: Props) {
  return (
    <Input
      type="number"
      min={0}
      value={value === undefined ? "" : String(value)}
      onChange={(e) => onChange(Number(e.target.value || 0) || undefined)}
      placeholder={placeholder}
      className={WIZARD_IN}
    />
  );
}
