import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cpu, Scissors, Wrench, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductFormState } from "@/lib/storeProductWizardDefaults";
import { HAIR_TYPE_OPTIONS, TARGET_AUDIENCE_OPTIONS } from "@/lib/storeProductWizardDefaults";
import type { StoreUtilitarianFamily } from "@/types/store";
import { WizardSection, WIZARD_EASE } from "@/components/shop/wizard/wizardMotion";
import { currencyMask, formatBRL, formatMoneyInputFromNumber, parsePriceInput } from "@/lib/productPricing";

const WIZARD_IN =
  "product-wizard-input h-10 w-full text-sm md:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 focus:placeholder:opacity-0";
const WIZARD_SEL =
  "product-wizard-select h-10 w-full rounded-md px-3 text-sm md:text-sm appearance-none bg-[hsl(28_18%_11%)] focus-visible:ring-0 focus-visible:ring-offset-0";
const SECTION_CARD =
  "rounded-xl border border-border/50 bg-[hsl(28_22%_11%/0.4)] p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(245,184,65,0.06)]";
const SECTION_HEAD = "text-xs font-semibold uppercase tracking-wider text-primary/90";
const SECTION_HEAD_STRONG = "text-sm font-bold uppercase tracking-wide text-primary";
const SUBLABEL = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

const MATERIAL_ACESSORIO = ["Inox", "Plástico", "Carbono", "Cerâmica", "Madeira", "Titânio", "Outro"];
const SIZE_SUGGESTIONS = ['5"', '6"', '7"'];
const PECA_MEDIDA_SUGGESTIONS = ["#1", "#2", "1.5mm", "3mm", "6mm"];
const COMPAT_MODELOS = ["Wahl Magic Clip", "Andis Master", "Babyliss FX", "Kemei", "Universal", "Outros modelos"];

type SetForm = Dispatch<SetStateAction<ProductFormState>>;

const FAMILY_TILES: Array<{
  id: StoreUtilitarianFamily;
  label: string;
  hint: string;
  Icon: typeof Cpu;
}> = [
  { id: "maquina", label: "Máquina", hint: "Clipper, trimmer, shaver…", Icon: Cpu },
  { id: "acessorio", label: "Ferramentas", hint: "Pente, tesoura, navalha…", Icon: Scissors },
  { id: "pecas", label: "Peças & reposição", hint: "Lâminas, pentes de encaixe, óleo…", Icon: Wrench },
];

function familyTitle(f: StoreUtilitarianFamily | undefined): string {
  switch (f) {
    case "maquina":
      return "Configurar máquina de corte";
    case "acessorio":
      return "Configurar ferramentas";
    case "pecas":
      return "Configurar peças & reposição";
    default:
      return "Equipamentos & acessórios";
  }
}

export function OutrosUtilitarianDetails({ form, setForm }: { form: ProductFormState; setForm: SetForm }) {
  const reduceMotion = useReducedMotion();
  const attrs = form.attributes as Record<string, unknown>;
  const family = attrs.utilitarianFamily as StoreUtilitarianFamily | undefined;
  const semFio = attrs.semFio === true;
  const nivelProduto = String(attrs.nivelProdutoUtil ?? "");
  const tipoFerramenta = String(attrs.tipoAcessorioDetalhe ?? "");
  const tipoPeca = String(attrs.tipoPecaReposicao ?? "");
  const compatLista = Array.isArray(attrs.compatibilidadePecaLista) ? (attrs.compatibilidadePecaLista as string[]) : [];
  const [compatCustomInput, setCompatCustomInput] = useState("");
  const materialPrincipal = String(attrs.materialAcessorioDetalhe ?? "");
  const materiaisSelecionados = Array.isArray(attrs.materialAcessorioDetalhes)
    ? (attrs.materialAcessorioDetalhes as string[])
    : materialPrincipal
      ? [materialPrincipal]
      : [];
  const [customAccessorySize, setCustomAccessorySize] = useState("");

  const machineDynamicTitle =
    nivelProduto === "profissional"
      ? "Configurar máquina profissional"
      : nivelProduto === "intermediario"
        ? "Configurar máquina de corte intermediária"
        : "Configurar máquina de corte";

  useEffect(() => {
    if (family !== "maquina") return;
    if (semFio) return;
    if (!attrs.autonomiaBateriaMin && !attrs.tempoCarregamentoMin) return;
    setForm((f) => ({
      ...f,
      attributes: {
        ...f.attributes,
        autonomiaBateriaMin: "",
        tempoCarregamentoMin: "",
      },
    }));
  }, [family, semFio, attrs.autonomiaBateriaMin, attrs.tempoCarregamentoMin, setForm]);

  useEffect(() => {
    if (family !== "acessorio") return;
    if (!tipoFerramenta.toLowerCase().includes("pente")) return;
    if (!attrs.tamanhoAcessorio) return;
    updateAttribute("tamanhoAcessorio", "");
  }, [family, tipoFerramenta, attrs.tamanhoAcessorio]);

  useEffect(() => {
    if (family !== "pecas") return;
    if (tipoPeca !== "oleo") return;
    if (!attrs.medidaPeca) return;
    updateAttribute("medidaPeca", "");
  }, [family, tipoPeca, attrs.medidaPeca]);

  const toggleMaterial = (mat: string) => {
    const has = materiaisSelecionados.includes(mat);
    const next = has ? materiaisSelecionados.filter((m) => m !== mat) : [...materiaisSelecionados, mat];
    updateAttribute("materialAcessorioDetalhes", next);
    updateAttribute("materialAcessorioDetalhe", next[0] ?? "");
  };
  const toggleCompat = (modelo: string) => {
    const has = compatLista.includes(modelo);
    const next = has ? compatLista.filter((m) => m !== modelo) : [...compatLista, modelo];
    updateAttribute("compatibilidadePecaLista", next);
    const free = String(attrs.compatibilidadePeca ?? "").trim();
    const merged = [...next, free].filter(Boolean).join(" / ");
    updateAttribute("compatibilidadePeca", merged);
  };

  const updateAttribute = (key: string, value: unknown) => {
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, [key]: value },
    }));
  };

  useEffect(() => {
    if (family !== "cosmetico" && family !== "kit_combo") return;
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, utilitarianFamily: "" },
    }));
  }, [family, setForm]);

  const setFamily = (id: StoreUtilitarianFamily) => {
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, utilitarianFamily: id },
    }));
  };

  const linhasKit = Array.isArray(attrs.linhasKit)
    ? (attrs.linhasKit as Array<{ nome: string; qtd: number; shopProductId?: string; unitPrice?: number; imageUrl?: string }>)
    : [];

  const setLinhasKit = (next: typeof linhasKit) => {
    updateAttribute("linhasKit", next);
  };

  const addKitLine = () => {
    setLinhasKit([...linhasKit, { nome: "", qtd: 1 }]);
  };

  const removeKitLine = (idx: number) => {
    setLinhasKit(linhasKit.filter((_, i) => i !== idx));
  };

  const updateKitLine = (idx: number, patch: Partial<(typeof linhasKit)[number]>) => {
    setLinhasKit(linhasKit.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const precoSeparadoNum =
    typeof attrs.precoItensSeparados === "number" && Number.isFinite(attrs.precoItensSeparados)
      ? attrs.precoItensSeparados
      : 0;

  const [precoSeparadoInput, setPrecoSeparadoInput] = useState(
    precoSeparadoNum > 0 ? formatMoneyInputFromNumber(precoSeparadoNum) : "",
  );
  useEffect(() => {
    const n =
      typeof attrs.precoItensSeparados === "number" && Number.isFinite(attrs.precoItensSeparados)
        ? attrs.precoItensSeparados
        : 0;
    setPrecoSeparadoInput(n > 0 ? formatMoneyInputFromNumber(n) : "");
  }, [attrs.precoItensSeparados]);

  const saleKit = parsePriceInput(form.salePrice);
  const somaLinhas = linhasKit.reduce((s, row) => {
    const u = Number(row.unitPrice ?? 0);
    const q = Number(row.qtd ?? 0);
    if (Number.isFinite(u) && Number.isFinite(q)) return s + Math.max(0, u) * Math.max(0, q);
    return s;
  }, 0);
  const referenciaSeparado = precoSeparadoNum > 0 ? precoSeparadoNum : somaLinhas;
  const economiaPct =
    referenciaSeparado > 0 && Number.isFinite(saleKit) && saleKit > 0 && referenciaSeparado > saleKit
      ? Math.round(((referenciaSeparado - saleKit) / referenciaSeparado) * 100)
      : 0;

  return (
    <>
      <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
        <div className="space-y-1 min-w-0">
          <h4 className={cn(SECTION_HEAD_STRONG, "break-words")}>
            {family === "maquina" ? machineDynamicTitle : familyTitle(family)}
          </h4>
          <p className="text-[11px] text-muted-foreground leading-snug break-words">
            Escolha o tipo abaixo: o formulário mostra só o que importa para vender com clareza técnica.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-w-0">
          {FAMILY_TILES.map(({ id, label, hint, Icon }) => {
            const active = family === id;
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setFamily(id)}
                whileHover={reduceMotion ? undefined : { scale: 1.02, y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.2, ease: WIZARD_EASE }}
                className={cn(
                  "min-w-0 w-full max-w-full overflow-hidden rounded-xl border px-2 py-2.5 sm:px-2.5 sm:py-3 text-left flex flex-col gap-1.5 min-h-[88px] items-stretch",
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-[0_6px_20px_-10px_rgba(245,184,65,0.35)]"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/35",
                )}
              >
                <span className="flex items-start gap-1.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <span className="text-xs font-semibold leading-tight break-words min-w-0 flex-1">{label}</span>
                </span>
                <span className="text-[10px] leading-snug opacity-90 break-words line-clamp-3">{hint}</span>
              </motion.button>
            );
          })}
        </div>
      </WizardSection>

      {family ? (
        <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
          <h4 className={SECTION_HEAD}>Identidade</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={SUBLABEL}>Marca</Label>
              <Input
                value={String(attrs.marcaPersonalizada ?? "")}
                onChange={(e) => updateAttribute("marcaPersonalizada", e.target.value)}
                placeholder="Marca no rótulo ou sua marca da loja"
                className={WIZARD_IN}
              />
            </div>
            <div className="space-y-2">
              <Label className={SUBLABEL}>Nível do produto</Label>
              <Select
                value={String(attrs.nivelProdutoUtil ?? "")}
                onValueChange={(v) => updateAttribute("nivelProdutoUtil", v)}
              >
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Básico | Intermediário | Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={SUBLABEL}>Indicação de uso</Label>
              <Select
                value={String(attrs.usoIndicadoBarbearia ?? "")}
                onValueChange={(v) => updateAttribute("usoIndicadoBarbearia", v)}
              >
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Iniciante, profissional ou doméstico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="intenso">Barbearia / uso intenso</SelectItem>
                    <SelectItem value="domestico">Uso doméstico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </WizardSection>
      ) : null}

      {family === "maquina" ? (
        <>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Especificações técnicas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SUBLABEL}>Potência do motor (W)</Label>
                <Input
                  value={String(attrs.potenciaW ?? "")}
                  onChange={(e) => updateAttribute("potenciaW", e.target.value)}
                  placeholder="Ex.: 5"
                  className={WIZARD_IN}
                />
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Tipo de motor</Label>
                <Select
                  value={String(attrs.tipoMotorUtil ?? "")}
                  onValueChange={(v) => updateAttribute("tipoMotorUtil", v)}
                >
                  <SelectTrigger className={WIZARD_SEL}>
                    <SelectValue placeholder="Rotativo ou magnético" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rotativo">Rotativo</SelectItem>
                    <SelectItem value="magnetico">Magnético</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/10 px-3 py-2 sm:col-span-2">
                <div>
                  <Label className="text-sm font-medium text-foreground">Sem fio</Label>
                  <p className="text-[10px] text-muted-foreground">Marque se usa bateria.</p>
                </div>
                <Switch
                  checked={attrs.semFio === true}
                  onCheckedChange={(c) => updateAttribute("semFio", c)}
                />
              </div>
              {semFio ? (
                <>
                  <div className="space-y-2">
                    <Label className={SUBLABEL}>Autonomia da bateria (min)</Label>
                    <Input
                      value={String(attrs.autonomiaBateriaMin ?? "")}
                      onChange={(e) => updateAttribute("autonomiaBateriaMin", e.target.value)}
                      placeholder="Ex.: 120"
                      className={WIZARD_IN}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={SUBLABEL}>Tempo para carga completa</Label>
                    <Input
                      value={String(attrs.tempoCarregamentoMin ?? "")}
                      onChange={(e) => updateAttribute("tempoCarregamentoMin", e.target.value)}
                      placeholder="Ex.: 90 min"
                      className={WIZARD_IN}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </WizardSection>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Garantia & durabilidade</h4>
            <p className="text-[11px] text-muted-foreground">Ajuda a aumentar a confiança na compra.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SUBLABEL}>Garantia</Label>
                <Input
                  value={String(attrs.garantiaMesesUtil ?? "")}
                  onChange={(e) => updateAttribute("garantiaMesesUtil", e.target.value)}
                  placeholder="Ex.: 12 meses"
                  className={WIZARD_IN}
                />
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Vida útil estimada</Label>
                <Input
                  value={String(attrs.vidaUtilEstimada ?? "")}
                  onChange={(e) => updateAttribute("vidaUtilEstimada", e.target.value)}
                  placeholder="Ex.: 2 anos de uso diário"
                  className={WIZARD_IN}
                />
              </div>
            </div>
          </WizardSection>
        </>
      ) : null}

      {family === "acessorio" ? (
        <>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Especificações</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className={SUBLABEL}>Tipo</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                  { value: "Tesoura", Icon: Scissors, label: "Tesoura" },
                  { value: "Navalha", Icon: () => (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v18" />
                      <path d="M3 7h18" />
                      <path d="M3 17h18" />
                    </svg>
                  ), label: "Navalha" },
                  { value: "Pente", Icon: () => (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7h18" />
                      <path d="M5 7v10" />
                      <path d="M9 7v10" />
                      <path d="M13 7v10" />
                      <path d="M17 7v10" />
                      <path d="M21 7v10" />
                    </svg>
                  ), label: "Pente" },
                  { value: "Outro", Icon: Box, label: "Outro" },
                ].map((item) => {
                    const active = tipoFerramenta === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => updateAttribute("tipoAcessorioDetalhe", item.value)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        <item.Icon className="w-3.5 h-3.5 mr-1.5 shrink-0" aria-hidden />
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className={SUBLABEL}>Material principal</Label>
                <div className="flex flex-wrap gap-1.5">
                  {MATERIAL_ACESSORIO.map((mat) => {
                    const active = materiaisSelecionados.includes(mat);
                    return (
                      <motion.button
                        key={mat}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => toggleMaterial(mat)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        {active ? "✓ " : "+ "}
                        {mat}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              {!tipoFerramenta.toLowerCase().includes("pente") ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label className={SUBLABEL}>
                    {tipoFerramenta === "Tesoura" ? "Tamanho (obrigatório para tesoura)" : "Tamanho"}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZE_SUGGESTIONS.map((size) => {
                      const active = String(attrs.tamanhoAcessorio ?? "") === size;
                      return (
                        <motion.button
                          key={size}
                          type="button"
                          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                          onClick={() => updateAttribute("tamanhoAcessorio", size)}
                          className={cn(
                            "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                              : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                          )}
                        >
                          {size}
                        </motion.button>
                      );
                    })}
                  </div>
                  <Input
                    value={String(attrs.tamanhoAcessorio ?? "")}
                    onChange={(e) => updateAttribute("tamanhoAcessorio", e.target.value)}
                    placeholder='Ex.: 6" ou 15 cm'
                    className={WIZARD_IN}
                  />
                  <div className="flex gap-2">
                    <Input
                      value={customAccessorySize}
                      onChange={(e) => setCustomAccessorySize(e.target.value)}
                      placeholder='Custom (ex.: 5.5")'
                      className={WIZARD_IN}
                    />
                    <Button
                      type="button"
                      variant="outlineGold"
                      className="shrink-0"
                      onClick={() => {
                        const v = customAccessorySize.trim();
                        if (!v) return;
                        updateAttribute("tamanhoAcessorio", v);
                        setCustomAccessorySize("");
                      }}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              ) : null}
              {tipoFerramenta.toLowerCase().includes("pente") ? (
                <div className="sm:col-span-2 rounded-lg border border-border/40 bg-background/10 px-3 py-2 text-[11px] text-muted-foreground">
                  Para pente, mantivemos o cadastro simplificado sem campo de tamanho detalhado.
                </div>
              ) : null}
            </div>
          </WizardSection>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Garantia & durabilidade</h4>
            <p className="text-[11px] text-muted-foreground">Ajuda a aumentar a confiança na compra.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SUBLABEL}>Garantia</Label>
                <Input
                  value={String(attrs.garantiaMesesUtil ?? "")}
                  onChange={(e) => updateAttribute("garantiaMesesUtil", e.target.value)}
                  placeholder="Ex.: 6 meses"
                  className={WIZARD_IN}
                />
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Vida útil estimada</Label>
                <Input
                  value={String(attrs.vidaUtilEstimada ?? "")}
                  onChange={(e) => updateAttribute("vidaUtilEstimada", e.target.value)}
                  placeholder="Ex.: afiação a cada 3 meses"
                  className={WIZARD_IN}
                />
              </div>
            </div>
          </WizardSection>
        </>
      ) : null}

      {family === "pecas" ? (
        <>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Especificações da peça</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className={SUBLABEL}>Compatível com quais máquinas?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPAT_MODELOS.map((modelo) => {
                    const active = compatLista.includes(modelo);
                    return (
                      <motion.button
                        key={modelo}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => toggleCompat(modelo)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        {active ? "✓ " : "+ "}
                        {modelo}
                      </motion.button>
                    );
                  })}
                </div>
                <Input
                  value={String(attrs.compatibilidadePeca ?? "")}
                  onChange={(e) => updateAttribute("compatibilidadePeca", e.target.value)}
                  placeholder="Com quais máquinas essa peça funciona? Ex.: Wahl Magic Clip / Universal"
                  className={WIZARD_IN}
                />
                <div className="flex gap-2">
                  <Input
                    value={compatCustomInput}
                    onChange={(e) => setCompatCustomInput(e.target.value)}
                    placeholder="Adicionar outro modelo..."
                    className={WIZARD_IN}
                  />
                  <Button
                    type="button"
                    variant="outlineGold"
                    className="shrink-0"
                    onClick={() => {
                      const value = compatCustomInput.trim();
                      if (!value) return;
                      if (compatLista.includes(value)) return setCompatCustomInput("");
                      const next = [...compatLista, value];
                      updateAttribute("compatibilidadePecaLista", next);
                      const merged = [...next].filter(Boolean).join(" / ");
                      updateAttribute("compatibilidadePeca", merged);
                      setCompatCustomInput("");
                    }}
                  >
                    + Modelo
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Tipo de peça</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "lamina", label: "Lâmina" },
                    { value: "pente_encaixe", label: "Pente de encaixe" },
                    { value: "oleo", label: "Óleo" },
                    { value: "bateria", label: "Bateria" },
                    { value: "outro", label: "Outro" },
                  ].map((item) => {
                    const active = tipoPeca === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => updateAttribute("tipoPecaReposicao", item.value)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Material principal</Label>
                <div className="flex flex-wrap gap-1.5">
                  {["Inox", "Plástico", "Carbono", "Misto"].map((mat) => {
                    const active = materiaisSelecionados.includes(mat);
                    return (
                      <motion.button
                        key={mat}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => toggleMaterial(mat)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        {active ? "✓ " : "+ "}
                        {mat}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label className={SUBLABEL}>Material secundário (opcional)</Label>
                  <Input
                    value={String(attrs.materialSecundarioPeca ?? "")}
                    onChange={(e) => updateAttribute("materialSecundarioPeca", e.target.value)}
                    placeholder="Ex.: revestimento carbono"
                    className={WIZARD_IN}
                  />
                </div>
              </div>
              {tipoPeca === "oleo" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label className={SUBLABEL}>Volume (ml)</Label>
                  <Input
                    value={String(attrs.volumeMlPeca ?? "")}
                    onChange={(e) => updateAttribute("volumeMlPeca", e.target.value)}
                    placeholder="Ex.: 30 ml"
                    className={WIZARD_IN}
                  />
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label className={SUBLABEL}>Tamanho / medida</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PECA_MEDIDA_SUGGESTIONS.map((s) => {
                      const active = String(attrs.medidaPeca ?? "") === s;
                      return (
                        <motion.button
                          key={s}
                          type="button"
                          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                          onClick={() => updateAttribute("medidaPeca", s)}
                          className={cn(
                            "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                              : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                          )}
                        >
                          {s}
                        </motion.button>
                      );
                    })}
                  </div>
                  <Input
                    value={String(attrs.medidaPeca ?? "")}
                    onChange={(e) => updateAttribute("medidaPeca", e.target.value)}
                    placeholder="Ex.: 1.5mm, #2, 6mm"
                    className={WIZARD_IN}
                  />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label className={SUBLABEL}>Para que serve essa peça?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "reposicao", label: "Reposição" },
                    { value: "upgrade", label: "Upgrade" },
                    { value: "manutencao", label: "Manutenção" },
                  ].map((item) => {
                    const active = String(attrs.funcaoPeca ?? "") === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        onClick={() => updateAttribute("funcaoPeca", item.value)}
                        className={cn(
                          "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_22px_-12px_rgba(245,184,65,0.55)]"
                            : "border-primary/30 bg-background/20 text-foreground hover:border-primary/55",
                        )}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
            {tipoPeca === "lamina" ? (
              <p className="text-[11px] text-muted-foreground">Para lâmina, destaque compatibilidade e material para reduzir devolução.</p>
            ) : null}
          </WizardSection>
          <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
            <h4 className={SECTION_HEAD}>Garantia & durabilidade</h4>
            <p className="text-[11px] text-muted-foreground">Ajuda a aumentar a confiança na compra.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={SUBLABEL}>Garantia</Label>
                <Input
                  value={String(attrs.garantiaMesesUtil ?? "")}
                  onChange={(e) => updateAttribute("garantiaMesesUtil", e.target.value)}
                  placeholder="Ex.: 3 meses (uso profissional)"
                  className={WIZARD_IN}
                />
              </div>
              <div className="space-y-2">
                <Label className={SUBLABEL}>Vida útil estimada</Label>
                <Input
                  value={String(attrs.vidaUtilEstimada ?? "")}
                  onChange={(e) => updateAttribute("vidaUtilEstimada", e.target.value)}
                  placeholder="Ex.: até 2 anos com manutenção"
                  className={WIZARD_IN}
                />
              </div>
            </div>
          </WizardSection>
        </>
      ) : null}

      {family === "cosmetico" ? (
        <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
          <h4 className={SECTION_HEAD}>Características (cosmético)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={SUBLABEL}>Público-alvo</Label>
              <Select
                value={String(attrs.publicoAlvo ?? "")}
                onValueChange={(value) => updateAttribute("publicoAlvo", value)}
              >
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Quem compra" />
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
            <div className="space-y-2">
              <Label className={SUBLABEL}>Tipo de cabelo / pele</Label>
              <Select
                value={String(attrs.tipoCabelo ?? "")}
                onValueChange={(value) => updateAttribute("tipoCabelo", value)}
              >
                <SelectTrigger className={WIZARD_SEL}>
                  <SelectValue placeholder="Perfil técnico" />
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
            <div className="space-y-2">
              <Label className={SUBLABEL}>Volume</Label>
              <Input
                value={String(attrs.volume ?? "")}
                onChange={(e) => updateAttribute("volume", e.target.value)}
                placeholder="Ex.: 100 ml"
                className={WIZARD_IN}
              />
            </div>
            <div className="space-y-2">
              <Label className={SUBLABEL}>Peso líquido</Label>
              <Input
                value={String(attrs.pesoLiquido ?? "")}
                onChange={(e) => updateAttribute("pesoLiquido", e.target.value)}
                placeholder="Ex.: 200 g"
                className={WIZARD_IN}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Preencha volume ou peso para facilitar busca e decisão.</p>
        </WizardSection>
      ) : null}

      {family === "kit_combo" ? (
        <WizardSection className={cn(SECTION_CARD, "space-y-4")}>
          <h4 className={SECTION_HEAD}>Estrutura do kit</h4>
          <p className="text-[11px] text-muted-foreground leading-snug">
            O nome do kit é o <strong className="text-foreground font-medium">nome do produto</strong> (passo 1). O preço promocional do kit é o{" "}
            <strong className="text-foreground font-medium">preço de venda</strong> (passo 2). Aqui você organiza itens e referência “separado” para mostrar economia.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={SUBLABEL}>Tipo de kit</Label>
              <Input
                value={String(attrs.tipoKit ?? "")}
                onChange={(e) => updateAttribute("tipoKit", e.target.value)}
                placeholder="Ex.: iniciante, barba completa…"
                className={WIZARD_IN}
              />
            </div>
            <div className="space-y-2">
              <Label className={SUBLABEL}>Qtd. aproximada de itens</Label>
              <Input
                type="number"
                min={0}
                value={attrs.quantidadeItens === undefined ? "" : String(attrs.quantidadeItens)}
                onChange={(e) =>
                  updateAttribute("quantidadeItens", Number(e.target.value || 0) || undefined)
                }
                placeholder="Opcional"
                className={WIZARD_IN}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className={SUBLABEL}>Preço se comprado separado (R$)</Label>
              <Input
                value={precoSeparadoInput}
                onChange={(e) => {
                  const { formatted, raw, isValid } = currencyMask(e.target.value);
                  setPrecoSeparadoInput(formatted);
                  updateAttribute("precoItensSeparados", isValid && raw > 0 ? raw : undefined);
                }}
                placeholder="Soma de referência para calcular economia"
                className={WIZARD_IN}
              />
              {economiaPct > 0 ? (
                <p className="text-[11px] text-emerald-400/95">
                  Referência {formatBRL(referenciaSeparado)} vs kit {formatBRL(saleKit)} — economia ≈ {economiaPct}%
                </p>
              ) : referenciaSeparado > 0 && Number.isFinite(saleKit) && saleKit > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Ajuste o preço do kit na etapa 2 para destacar economia frente a {formatBRL(referenciaSeparado)}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className={SUBLABEL}>Itens incluídos</Label>
              <Button type="button" variant="outlineGold" size="sm" className="text-xs h-8" onClick={addKitLine}>
                + Adicionar linha
              </Button>
            </div>
            {linhasKit.length === 0 ? (
              <p className="text-[11px] text-muted-foreground rounded-lg border border-dashed border-border/50 p-3">
                Adicione itens por nome e quantidade. Na etapa{" "}
                <span className="text-primary font-medium">Venda</span> você pode vincular a produtos da loja e refinar o kit.
              </p>
            ) : (
              <div className="space-y-2">
                {linhasKit.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
                    <Input
                      value={row.nome}
                      onChange={(e) => updateKitLine(idx, { nome: e.target.value })}
                      placeholder="Nome do item"
                      className={WIZARD_IN}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={String(row.qtd ?? 1)}
                      onChange={(e) =>
                        updateKitLine(idx, { qtd: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className={WIZARD_IN}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeKitLine(idx)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </WizardSection>
      ) : null}
    </>
  );
}
