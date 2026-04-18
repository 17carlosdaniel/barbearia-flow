import { Percent } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const promoList = [
  { title: "Corte + barba", price: "R$ 50", badge: "Oferta do dia" },
  { title: "Barba completa", price: "R$ 30", badge: "Válido hoje" },
];

/**
 * Ato 4 — descoberta editorial; Vintage: imagem protagonista + faixa de ofertas (sem grade 4+8).
 * Modern: coluna útil densa (ofertas em faixa + trilho).
 */
const ClientDiscoverySection = () => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = getClientHomeCopy(identity);
  const navigate = useNavigate();

  const handlePromoClick = (title: string) => {
    navigate(`/cliente/buscar?promos=1&q=${encodeURIComponent(title)}`);
  };

  const promoStripVintage = (
    <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-2 pt-1">
      {promoList.map((item) => (
        <button
          key={item.title}
          type="button"
          onClick={() => handlePromoClick(item.title)}
          className={cn(
            "flex min-w-[260px] shrink-0 items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary/[0.05] px-4 py-4 text-left transition-colors hover:bg-primary/[0.08] sm:min-w-[280px]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm font-semibold text-primary">{item.price}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-md border border-primary/22 bg-primary/[0.07] px-2.5 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
            {item.badge}
          </span>
        </button>
      ))}
    </div>
  );

  const promoStripModern = (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {promoList.map((item) => (
        <button
          key={item.title}
          type="button"
          onClick={() => handlePromoClick(item.title)}
          className={cn(
            "flex min-w-[200px] shrink-0 items-center justify-between gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2.5 text-left transition-colors hover:bg-primary/10",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-foreground">{item.title}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary">{item.price}</p>
          </div>
          <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-primary-foreground">
            {item.badge}
          </span>
        </button>
      ))}
    </div>
  );

  if (isVintage) {
    return (
      <section
        aria-label={copy.discovery.aria}
        className="relative mt-14 border-t border-primary/10 pt-12 lg:mt-20 lg:pt-16"
      >
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
          <p className="font-vintage-heading text-lg font-semibold text-foreground sm:text-xl">{copy.discovery.opportunitiesStripTitle}</p>
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">{copy.discovery.opportunitiesAside}</p>
        </div>
        {promoStripVintage}
      </section>
    );
  }

  return (
    <section aria-label={copy.discovery.aria} className="border-t border-primary/10 pt-8">
      <div className="space-y-5">
        <div>
          <p className="mb-2 px-0.5 text-[9px] font-black uppercase tracking-widest text-primary/80">{copy.discovery.opportunitiesStripTitle}</p>
          {promoStripModern}
        </div>
      </div>
    </section>
  );
};

export default ClientDiscoverySection;
