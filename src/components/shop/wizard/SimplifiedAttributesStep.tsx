import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Plus, Package, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { 
  BRAND_OPTIONS, 
  TARGET_AUDIENCE_OPTIONS, 
  HAIR_TYPE_OPTIONS, 
  DIFFERENTIAL_OPTIONS,
  CLOTH_SIZE_OPTIONS,
  SHOE_SIZE_OPTIONS,
  COLOR_OPTIONS,
  GENDER_OPTIONS
} from "@/lib/storeProductWizardDefaults";

const WIZARD_SEL = "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)] focus:outline-none";

type SetForm = React.Dispatch<React.SetStateAction<ProductFormState>>;

interface SimplifiedAttributesStepProps {
  form: ProductFormState;
  setForm: SetForm;
}

export function SimplifiedAttributesStep({ form, setForm }: SimplifiedAttributesStepProps) {
  const [differentials, setDifferentials] = useState<string[]>(
    (form.attributes as any).diferenciais || []
  );

  // Detectar categorias
  const isClothingCategory = form.category === "Roupas";
  const isShoesCategory = form.category === "Calçados";
  const isGeneralProductsCategory = form.category === "Produtos físicos gerais";

  // Mapeamento de cores para bolinhas coloridas
  const colorSwatches: Record<string, string> = {
    "Preto": "bg-black",
    "Branco": "bg-white border border-gray-300",
    "Cinza": "bg-gray-500",
    "Marrom": "bg-amber-800",
    "Azul": "bg-blue-500",
    "Verde": "bg-green-500",
    "Vermelho": "bg-red-500",
    "Amarelo": "bg-yellow-400",
    "Rosa": "bg-pink-400",
    "Roxo": "bg-purple-500",
    "Laranja": "bg-orange-500",
    "Bege": "bg-stone-400",
    "Cáqui": "bg-cyan-500",
  };

  // Função para atualizar atributos
  const updateAttribute = useCallback((key: string, value: any) => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        [key]: value,
      },
    }));
  }, [setForm]);

  // Funções para tamanhos e cores
  const handleSizeToggle = (size: string) => {
    setForm((f) => {
      if (isClothingCategory) {
        const currentSizes = (f.attributes as any).tamanhos || [];
        const newSizes = currentSizes.includes(size)
          ? currentSizes.filter(s => s !== size)
          : [...currentSizes, size];
        
        return {
          ...f,
          attributes: {
            ...f.attributes,
            tamanhos: newSizes,
            tamanho: newSizes.length > 0 ? newSizes[0] : "",
          } as any,
        };
      } else if (isShoesCategory) {
        const currentSizes = (f.attributes as any).tamanhosCalcado || [];
        const newSizes = currentSizes.includes(size)
          ? currentSizes.filter(s => s !== size)
          : [...currentSizes, size];
        
        return {
          ...f,
          attributes: {
            ...f.attributes,
            tamanhosCalcado: newSizes,
            tamanhoCalcado: newSizes.length > 0 ? newSizes[0] : "",
          } as any,
        };
      }
      return f;
    });
  };

  const handleColorToggle = (color: string) => {
    setForm((f) => {
      const currentColors = (f.attributes as any).cores || [];
      const newColors = currentColors.includes(color)
        ? currentColors.filter(c => c !== color)
        : [...currentColors, color];
      
      return {
        ...f,
        attributes: {
          ...f.attributes,
          cores: newColors,
          cor: newColors.length > 0 ? newColors[0] : "",
        } as any,
      };
    });
  };

  const handleGenderChange = (gender: string) => {
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        genero: gender,
      } as any,
    }));
  };

  // Estados atuais
  const currentSizes = isClothingCategory 
    ? (form.attributes as any).tamanhos || []
    : isShoesCategory 
    ? (form.attributes as any).tamanhosCalcado || []
    : [];
  const currentColors = (form.attributes as any).cores || [];
  const currentGender = (form.attributes as any).genero || "";

  // Função para adicionar diferencial
  const addDifferential = useCallback((differential: string) => {
    if (!differentials.includes(differential)) {
      const newDifferentials = [...differentials, differential];
      setDifferentials(newDifferentials);
      updateAttribute("diferenciais", newDifferentials);
    }
  }, [differentials, updateAttribute]);

  // Função para remover diferencial
  const removeDifferential = useCallback((toRemove: string) => {
    const newDifferentials = differentials.filter(d => d !== toRemove);
    setDifferentials(newDifferentials);
    updateAttribute("diferenciais", newDifferentials);
  }, [differentials, updateAttribute]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header minimalista */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Características do Produto</h3>
        <p className="text-sm text-muted-foreground">
          Adicione os detalhes essenciais
        </p>
      </div>

      {/* Campos específicos por categoria */}
      {(isClothingCategory || isShoesCategory) ? (
        // Interface para Roupas e Calçados
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              {isClothingCategory ? "ROUPAS" : "CALÇADOS"}
            </h4>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              {/* Tamanhos */}
              <div>
                <Label className="text-sm font-medium">
                  {isClothingCategory ? "Tamanhos disponíveis" : "Números disponíveis"}
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(isClothingCategory ? CLOTH_SIZE_OPTIONS : SHOE_SIZE_OPTIONS).map((size) => (
                    <Badge
                      key={size}
                      variant={currentSizes.includes(size) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
                {currentSizes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentSizes.length} {isClothingCategory ? "tamanho(s)" : "número(s)"} selecionado(s)
                  </p>
                )}
              </div>

              {/* Cores */}
              <div>
                <Label className="text-sm font-medium">Cores disponíveis</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {COLOR_OPTIONS.map((color) => (
                    <div key={color} className="relative">
                      <button
                        type="button"
                        onClick={() => handleColorToggle(color)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                          colorSwatches[color] || "bg-gray-300",
                          currentColors.includes(color)
                            ? "border-primary ring-2 ring-primary/30 scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        title={color}
                      />
                      {currentColors.includes(color) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {currentColors.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentColors.length} cor(es) selecionada(s)
                  </p>
                )}
              </div>

              {/* Gênero */}
              <div>
                <Label className="text-sm font-medium">Gênero</Label>
                <Select value={currentGender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Interface para outras categorias
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">ESSENCIAL</h4>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              {/* Marca */}
              <div>
                <Label className="text-sm font-medium">Marca</Label>
                <Select 
                  value={(form.attributes as any).marca || ""} 
                  onValueChange={(value) => updateAttribute("marca", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_OPTIONS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Público-alvo */}
              <div>
                <Label className="text-sm font-medium">Público-alvo</Label>
                <Select 
                  value={(form.attributes as any).publicoAlvo || ""} 
                  onValueChange={(value) => updateAttribute("publicoAlvo", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCE_OPTIONS.map((audience) => (
                      <SelectItem key={audience} value={audience}>
                        {audience}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de cabelo/pele */}
              <div>
                <Label className="text-sm font-medium">Tipo de cabelo/pele</Label>
                <Select 
                  value={(form.attributes as any).tipoCabelo || ""} 
                  onValueChange={(value) => updateAttribute("tipoCabelo", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diferenciais simplificado */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">DIFERENCIAIS</h4>
        
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          {/* Tags selecionadas */}
          {differentials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {differentials.map((differential) => (
                <Badge 
                  key={differential} 
                  variant="default" 
                  className="flex items-center gap-1"
                >
                  {differential}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-300"
                    onClick={() => removeDifferential(differential)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Sugestões */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Clique para adicionar:</p>
            <div className="flex flex-wrap gap-2">
              {DIFFERENTIAL_OPTIONS
                .filter(option => !differentials.includes(option))
                .slice(0, 6)
                .map((option) => (
                  <Badge
                    key={option}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addDifferential(option)}
                  >
                    + {option}
                  </Badge>
                ))}
            </div>
          </div>

          {/* Input personalizado */}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar diferencial..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  addDifferential(e.currentTarget.value.trim());
                  e.currentTarget.value = "";
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                if (input?.value.trim()) {
                  addDifferential(input.value.trim());
                  input.value = "";
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview minimalista */}
      <div className="bg-border/20 rounded-lg p-4 text-center">
        <div className="text-sm font-medium">{form.name || "Nome do Produto"}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {form.category && `${form.category} • `}
          {(isClothingCategory || isShoesCategory) ? (
            <>
              {currentSizes.length > 0 && `${currentSizes.length} ${isClothingCategory ? "tamanhos" : "números"} • `}
              {currentColors.length > 0 && `${currentColors.length} cores • `}
              {currentGender && `${currentGender}`}
            </>
          ) : (
            <>
              {(form.attributes as any).marca && `${(form.attributes as any).marca} • `}
              {(form.attributes as any).publicoAlvo && `${(form.attributes as any).publicoAlvo}`}
            </>
          )}
        </div>
        {differentials.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {differentials.slice(0, 3).map(differential => (
              <Badge key={differential} variant="secondary" className="text-xs">
                {differential}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
