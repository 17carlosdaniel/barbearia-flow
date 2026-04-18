import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WIZARD_IN = "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0";

type SetForm = React.Dispatch<React.SetStateAction<any>>;

interface SpecificationsStepProps {
  form: any;
  setForm: SetForm;
}

export function SpecificationsStep({ form, setForm }: SpecificationsStepProps) {
  const updateAttribute = useCallback((key: string, value: any) => {
    setForm((f: any) => ({
      ...f,
      attributes: {
        ...f.attributes,
        [key]: value,
      },
    }));
  }, [setForm]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header minimalista */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Especificações</h3>
        <p className="text-sm text-muted-foreground">
          Informações básicas do produto
        </p>
      </div>

      {/* Especificações do Produto */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">PRODUTO</h4>
          
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Volume */}
              <div>
                <Label className="text-sm font-medium">Volume</Label>
                <Input
                  value={(form.attributes as any).volume || ""}
                  onChange={(e) => updateAttribute("volume", e.target.value)}
                  placeholder="Ex: 100ml"
                  className={WIZARD_IN}
                />
              </div>

              {/* Peso Líquido */}
              <div>
                <Label className="text-sm font-medium">Peso líquido</Label>
                <Input
                  value={(form.attributes as any).pesoLiquido || ""}
                  onChange={(e) => updateAttribute("pesoLiquido", e.target.value)}
                  placeholder="Ex: 200g"
                  className={WIZARD_IN}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo minimalista */}
      <div className="bg-border/20 rounded-lg p-4 text-center">
        <div className="text-sm font-medium">Resumo das especificações</div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          {(form.attributes as any).volume && (
            <div>Volume: {(form.attributes as any).volume}</div>
          )}
          {(form.attributes as any).pesoLiquido && (
            <div>Peso líquido: {(form.attributes as any).pesoLiquido}</div>
          )}
        </div>
      </div>
    </div>
  );
}
