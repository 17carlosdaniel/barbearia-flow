const WIZARD_SEL =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)]";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function FixationSelect({ value, onChange }: Props) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={WIZARD_SEL}>
      <option value="baixa">Fixação baixa</option>
      <option value="media">Fixação média</option>
      <option value="alta">Fixação alta</option>
    </select>
  );
}
