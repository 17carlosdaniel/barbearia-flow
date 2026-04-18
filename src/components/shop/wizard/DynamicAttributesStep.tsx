import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Lightbulb, ChevronDown, ChevronUp, Plus, X, Tag, Package, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { getProductAttributesConfig, getFieldsByCategory, type AttributeField } from "@/lib/productAttributesConfig";

const WIZARD_IN = "product-wizard-input h-10 text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0";
const WIZARD_SEL = "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)] focus:outline-none";

type SetForm = React.Dispatch<React.SetStateAction<ProductFormState>>;

interface DynamicAttributesStepProps {
  form: ProductFormState;
  setForm: SetForm;
}

export function DynamicAttributesStep({ form, setForm }: DynamicAttributesStepProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [description, setDescription] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [variationsOpen, setVariationsOpen] = useState(false);

  const config = getProductAttributesConfig(form.productType);
  const fieldsByCategory = getFieldsByCategory(config.fields);

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

  // Função para adicionar/remover tags
  const addTag = useCallback((tag: string) => {
    if (tag && !tags.includes(tag)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      updateAttribute("diferenciais", newTags);
    }
    setNewTag("");
  }, [tags, updateAttribute]);

  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    updateAttribute("diferenciais", newTags);
  }, [tags, updateAttribute]);

  // Renderizar campo baseado no tipo
  const renderField = useCallback((field: AttributeField) => {
    const value = (form.attributes as any)[field.key] || "";

    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => updateAttribute(field.key, val)}>
              <SelectTrigger className={WIZARD_SEL}>
                <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => updateAttribute(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={WIZARD_IN}
            />
          </div>
        );

      case "tags":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">{field.label}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="default" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Adicionar diferencial..."
                className={WIZARD_IN}
                onKeyPress={(e) => e.key === "Enter" && addTag(newTag)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {field.options && field.options.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Sugestões:</span>
                {field.options.map((option) => (
                  <Badge
                    key={option}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                    onClick={() => addTag(option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [form.attributes, tags, newTag, updateAttribute, addTag, removeTag]);

  // Renderizar seção de atributos
  const renderCategorySection = useCallback((category: string, fields: AttributeField[], icon: React.ReactNode) => {
    if (fields.length === 0) return null;

    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {category === "specifications" && "Especificações"}
            {category === "characteristics" && "Características"}
            {category === "identity" && "Identidade"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(renderField)}
        </CardContent>
      </Card>
    );
  }, [renderField]);

  // Calcular taxa de preenchimento
  const completionRate = Math.round(
    (config.fields.filter(field => (form.attributes as any)[field.key]).length / config.fields.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho com progresso e copy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Detalhes do Produto</h3>
            <p className="text-sm text-muted-foreground mt-1">{config.copy}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">completo</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-border/30 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Dicas inteligentes */}
      <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Dicas para vender mais</span>
            </div>
            {suggestionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-3">
          {config.suggestions.map((suggestion, index) => (
            <div key={index} className="bg-muted/30 rounded-lg p-3 text-sm">
              {suggestion}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Atributos dinâmicos por categoria */}
      <div className="space-y-4">
        {renderCategorySection("identity", fieldsByCategory.identity || [], <Target className="w-4 h-4" />)}
        {renderCategorySection("characteristics", fieldsByCategory.characteristics || [], <Sparkles className="w-4 h-4" />)}
        {renderCategorySection("specifications", fieldsByCategory.specifications || [], <Package className="w-4 h-4" />)}
      </div>

      {/* Seções avançadas */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description" className="text-xs">Descrição</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">Busca & SEO</TabsTrigger>
          <TabsTrigger value="variations" className="text-xs">Variações</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Descrição do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva seu produto de forma detalhada. Foque nos benefícios e diferenciais que fazem seu cliente comprar..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {description.length} caracteres • Produtos com descrição completa vendem 3x mais
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Palavras-chave</Label>
                <Input
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  placeholder="ex: pomada forte, cabelo masculino, fixação alta"
                  className={WIZARD_IN}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separe por vírgula. Ajuda clientes a encontrarem seu produto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Variações do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Sistema de variações em desenvolvimento</p>
                <p className="text-xs mt-2">Em breve: gerencie tamanhos, cores e estoque por variação</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview do produto */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Como o cliente verá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="font-semibold">{form.name || "Nome do Produto"}</div>
            <div className="text-sm text-muted-foreground">
              {config.fields.slice(0, 3).map(field => {
                const value = (form.attributes as any)[field.key];
                return value ? `${field.label}: ${value}` : null;
              }).filter(Boolean).join(" • ") || "Configure os atributos acima..."}
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
