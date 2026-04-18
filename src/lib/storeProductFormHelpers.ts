import { PRODUCT_TYPE_OPTIONS } from "@/lib/storeProductWizardDefaults";
import type { StoreProductAttributes, StoreProductEmbalagem, StoreProductType } from "@/types/store";

export const calcProfit = (cost: number, sale: number) => {
  const costC = Math.round(cost * 100);
  const saleC = Math.round(sale * 100);
  const profitC = saleC - costC;
  const profit = profitC / 100;
  const margin = saleC > 0 ? (profitC / saleC) * 100 : 0;
  const badge = margin >= 70 ? "Excelente margem" : margin >= 40 ? "Boa margem" : "Margem baixa";
  return { profit, margin, badge };
};

export const getTypeLabel = (type: StoreProductType) =>
  PRODUCT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "Produto";

export const toggleStringOption = (values: string[] | undefined, value: string) => {
  const current = Array.isArray(values) ? values : [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
};

export const buildAutoTags = (productType: StoreProductType, attributes: StoreProductAttributes, category: string) => {
  const tags = new Set<string>([productType, category.toLowerCase()]);
  if ("fixacao" in attributes && attributes.fixacao) tags.add(`fixacao-${attributes.fixacao}`);
  if ("volumeMl" in attributes && attributes.volumeMl) tags.add(`${attributes.volumeMl}ml`);
  if ("tamanho" in attributes && attributes.tamanho) tags.add(`tam-${attributes.tamanho.toLowerCase()}`);
  if ("tamanhos" in attributes && Array.isArray(attributes.tamanhos)) {
    attributes.tamanhos.forEach((t) => tags.add(`tam-${String(t).toLowerCase()}`));
  }
  if ("tamanhoCalcado" in attributes && attributes.tamanhoCalcado) tags.add(`calcado-${attributes.tamanhoCalcado}`);
  if ("tamanhosCalcado" in attributes && Array.isArray(attributes.tamanhosCalcado)) {
    attributes.tamanhosCalcado.forEach((t) => tags.add(`calcado-${String(t)}`));
  }
  if ("marca" in attributes && attributes.marca) tags.add(attributes.marca.toLowerCase());
  if ("cor" in attributes && attributes.cor) tags.add(attributes.cor.toLowerCase());
  if ("cores" in attributes && Array.isArray(attributes.cores)) {
    attributes.cores.forEach((c) => tags.add(String(c).toLowerCase()));
  }
  if ("materiais" in attributes && Array.isArray(attributes.materiais)) {
    attributes.materiais.forEach((m) => tags.add(String(m).toLowerCase()));
  }
  if ("tipoKit" in attributes && attributes.tipoKit) tags.add(attributes.tipoKit.toLowerCase());
  return [...tags].filter(Boolean);
};

export const getTypeInsight = (productType: StoreProductType, attributes: StoreProductAttributes) => {
  if (productType === "barbearia" && "fixacao" in attributes && attributes.fixacao === "alta") {
    return "Produtos com fixação alta e acabamento matte costumam ter maior saída.";
  }
  if ((productType === "roupa" || productType === "calca" || productType === "blusa" || productType === "moleton" || productType === "camisa") && "material" in attributes && attributes.material) {
    return `Dica: destaque o material (${attributes.material}) no título para aumentar conversão.`;
  }
  if (productType === "liquido" && "volumeMl" in attributes && attributes.volumeMl) {
    return `Volume ${attributes.volumeMl}ml facilita comparação e melhora decisão de compra.`;
  }
  if (productType === "kit") {
    const k = attributes as { linhasKit?: Array<{ nome: string; qtd: number }>; itensIncluidos?: string };
    if (k.linhasKit?.length || k.itensIncluidos) {
      return "Kits com itens bem descritos aumentam ticket médio — use o resumo de economia na vitrine.";
    }
  }
  return "Atributos claros por tipo ajudam na busca e aumentam a conversão.";
};

export const getPreviewAttributeLine = (productType: StoreProductType, attributes: StoreProductAttributes) => {
  const util = attributes as {
    utilitarianFamily?: string;
    potenciaW?: string;
    tipoMotorUtil?: string;
    semFio?: boolean;
    autonomiaBateriaMin?: string;
    tempoCarregamentoMin?: string;
    tipoAcessorioDetalhe?: string;
    materialAcessorioDetalhe?: string;
    materialAcessorioDetalhes?: string[];
    tamanhoAcessorio?: string;
    tipoPecaReposicao?: string;
    compatibilidadePeca?: string;
    compatibilidadePecaLista?: string[];
    funcaoPeca?: string;
    medidaPeca?: string;
    volumeMlPeca?: string;
    materialSecundarioPeca?: string;
    volume?: string;
    pesoLiquido?: string;
    tipoCabelo?: string;
    linhasKit?: Array<{ nome: string; qtd: number }>;
    tipoKit?: string;
    itensIncluidos?: string;
    quantidadeItens?: number;
    usoIndicadoBarbearia?: string;
    nivelProdutoUtil?: string;
    garantiaMesesUtil?: string;
  };
  if (util.utilitarianFamily === "maquina") {
    const parts: string[] = [];
    if (util.semFio) parts.push("Sem fio");
    if (util.autonomiaBateriaMin) parts.push(`${util.autonomiaBateriaMin} min bateria`);
    if (util.tipoMotorUtil)
      parts.push(`Motor ${util.tipoMotorUtil === "magnetico" ? "magnético" : "rotativo"}`);
    if (util.potenciaW) parts.push(`${util.potenciaW} W`);
    if (util.tempoCarregamentoMin) parts.push(`Carga ${util.tempoCarregamentoMin}`);
    if (util.usoIndicadoBarbearia === "profissional") parts.push("Uso profissional");
    if (util.usoIndicadoBarbearia === "domestico") parts.push("Uso doméstico");
    if (util.usoIndicadoBarbearia === "iniciante") parts.push("Iniciante");
    return parts.filter(Boolean).join(" • ");
  }
  if (util.utilitarianFamily === "acessorio") {
    const materials =
      Array.isArray(util.materialAcessorioDetalhes) && util.materialAcessorioDetalhes.length > 0
        ? util.materialAcessorioDetalhes.join(", ")
        : util.materialAcessorioDetalhe || "";
    return [
      util.tipoAcessorioDetalhe || "",
      materials,
      util.tamanhoAcessorio || "",
      util.garantiaMesesUtil ? `Garantia ${util.garantiaMesesUtil}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (util.utilitarianFamily === "cosmetico") {
    return [util.tipoCabelo || "", util.volume ? `Vol. ${util.volume}` : "", util.pesoLiquido ? `Peso ${util.pesoLiquido}` : ""]
      .filter(Boolean)
      .join(" • ");
  }
  if (util.utilitarianFamily === "pecas") {
    const comp = Array.isArray(util.compatibilidadePecaLista) && util.compatibilidadePecaLista.length > 0
      ? util.compatibilidadePecaLista.join(" / ")
      : util.compatibilidadePeca || "";
    return [
      util.tipoPecaReposicao ? util.tipoPecaReposicao.replace("_", " ") : "",
      comp ? `Compatível ${comp}` : "",
      util.volumeMlPeca ? `${util.volumeMlPeca} ml` : util.medidaPeca || "",
      util.funcaoPeca || "",
      util.materialSecundarioPeca || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (util.utilitarianFamily === "kit_combo") {
    const linhas =
      util.linhasKit?.filter((l) => l.nome?.trim()).map((l) => `${l.nome} (${l.qtd}x)`) ?? [];
    return [
      util.tipoKit || "",
      linhas.length ? linhas.join(", ") : util.itensIncluidos || "",
      util.quantidadeItens ? `${util.quantidadeItens} itens` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  }

  if (productType === "barbearia") {
    const a = attributes as {
      fixacao?: string;
      volumeMl?: number;
      uso?: string;
      duracaoEstimadaDias?: number;
      tipoCabeloRecomendado?: string;
    };
    return [
      a.fixacao ? `Fixação ${a.fixacao}` : "",
      a.volumeMl ? `${a.volumeMl}ml` : "",
      a.uso || "",
      a.duracaoEstimadaDias ? `~${a.duracaoEstimadaDias}d uso` : "",
      a.tipoCabeloRecomendado || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (productType === "roupa" || productType === "calca" || productType === "blusa" || productType === "moleton" || productType === "camisa") {
    const a = attributes as { tamanhos?: string[]; cores?: string[]; materiais?: string[]; tamanho?: string; cor?: string; material?: string };
    return [
      a.tamanhos?.length ? `Tam: ${a.tamanhos.join(", ")}` : a.tamanho || "",
      a.cores?.length ? `Cores: ${a.cores.join(", ")}` : a.cor || "",
      a.materiais?.[0] || a.material || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (productType === "calcado" || productType === "sapato" || productType === "tenis") {
    const a = attributes as { tamanhosCalcado?: string[]; tamanhoCalcado?: string; marca?: string; cores?: string[]; cor?: string };
    return [
      a.tamanhosCalcado?.length ? `Num: ${a.tamanhosCalcado.join(", ")}` : a.tamanhoCalcado ? `Num. ${a.tamanhoCalcado}` : "",
      a.marca || "",
      a.cores?.[0] || a.cor || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (productType === "liquido") {
    const a = attributes as {
      volumeMl?: number;
      tipoUso?: string;
      indicadoPara?: string;
      duracaoEstimadaDias?: number;
      tipoCabeloRecomendado?: string;
    };
    return [
      a.volumeMl ? `${a.volumeMl}ml` : "",
      a.tipoUso || "",
      a.indicadoPara || "",
      a.duracaoEstimadaDias ? `~${a.duracaoEstimadaDias}d` : "",
      a.tipoCabeloRecomendado || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  if (productType === "acessorio") {
    const a = attributes as {
      marca?: string;
      material?: string;
      garantia?: string;
      tipoFerramenta?: string;
      voltagem?: string;
      usoProfissional?: string;
    };
    return [
      a.tipoFerramenta || "",
      a.marca || "",
      a.voltagem || "",
      a.usoProfissional || "",
      a.material || "",
      a.garantia || "",
    ]
      .filter(Boolean)
      .join(" • ");
  }
  const a = attributes as {
    tipoKit?: string;
    quantidadeItens?: number;
    linhasKit?: Array<{ nome: string; qtd: number }>;
    itensIncluidos?: string;
  };
  const linhas =
    a.linhasKit?.filter((l) => l.nome?.trim()).map((l) => `${l.nome} (${l.qtd}x)`) ?? [];
  return [
    a.tipoKit || "",
    linhas.length ? linhas.join(", ") : a.itensIncluidos || "",
    a.quantidadeItens ? `${a.quantidadeItens} itens` : "",
  ]
    .filter(Boolean)
    .join(" • ");
};

/** Linha curta para preview quando há dados de embalagem em `attributes.embalagem`. */
export function formatEmbalagemPreviewLine(attributes: StoreProductAttributes): string | null {
  const emb = (attributes as { embalagem?: StoreProductEmbalagem }).embalagem;
  if (!emb) return null;
  const uDim = emb.unidadeDimensao ?? "cm";
  const uPeso = emb.unidadePeso ?? "kg";
  const dimLabel = uDim === "m" ? "m" : "cm";
  const pesoLabel = uPeso === "g" ? "g" : "kg";
  const parts: string[] = [];
  const hasDim =
    emb.altura !== undefined ||
    emb.largura !== undefined ||
    emb.profundidade !== undefined;
  if (hasDim) {
    const a = emb.altura;
    const l = emb.largura;
    const p = emb.profundidade;
    const fmt = (n: number | undefined) =>
      n !== undefined && Number.isFinite(n) ? `${n} ${dimLabel}` : null;
    const bits = [fmt(a), fmt(l), fmt(p)].filter(Boolean) as string[];
    if (bits.length) parts.push(`Embalagem ${bits.join(" × ")}`);
  }
  if (emb.peso !== undefined && Number.isFinite(emb.peso)) {
    parts.push(`Peso ${emb.peso} ${pesoLabel}`);
  }
  return parts.length ? parts.join(" · ") : null;
}
