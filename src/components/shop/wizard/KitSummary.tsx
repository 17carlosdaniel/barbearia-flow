import { formatBRL } from "@/lib/productPricing";
import type { StoreAttributesKit } from "@/types/store";

type Props = {
  kit: StoreAttributesKit;
  salePriceNum: number;
};

/** Lista “Inclui” + economia quando `precoItensSeparados` preenchido */
export function KitSummary({ kit, salePriceNum }: Props) {
  const linhas = kit.linhasKit?.filter((l) => l.nome?.trim()) ?? [];
  const textoLivre = String(kit.itensIncluidos ?? "").trim();
  const separado = kit.precoItensSeparados;
  const economia =
    Number.isFinite(separado) && separado! > 0 && Number.isFinite(salePriceNum) && salePriceNum > 0
      ? Math.max(0, separado! - salePriceNum)
      : null;

  if (linhas.length === 0 && !textoLivre && economia === null) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-2 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Resumo do kit</p>
      {linhas.length > 0 ? (
        <ul className="list-disc pl-4 space-y-0.5 text-foreground/90">
          {linhas.map((l, i) => (
            <li key={`${l.nome}-${i}`}>
              {l.nome} ({l.qtd}x)
            </li>
          ))}
        </ul>
      ) : textoLivre ? (
        <p className="text-muted-foreground text-xs whitespace-pre-wrap">{textoLivre}</p>
      ) : null}
      {economia !== null && Number.isFinite(separado) ? (
        <div className="pt-1 border-t border-primary/15 space-y-0.5 text-xs">
          <p className="text-muted-foreground">
            Valor separado: <span className="text-foreground font-semibold tabular-nums">{formatBRL(separado!)}</span>
          </p>
          <p className="text-muted-foreground">
            Kit: <span className="text-primary font-semibold tabular-nums">{formatBRL(salePriceNum)}</span>
          </p>
          {economia > 0 ? (
            <p className="text-emerald-400 font-medium">
              Economia estimada: {formatBRL(economia)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
