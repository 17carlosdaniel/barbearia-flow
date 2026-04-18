import { Clock3, MapPin, Scissors, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";
import ClientAvailabilityNow from "@/components/client-home/ClientAvailabilityNow";

const ACTIONS = [
  { label: "Cortes populares", path: "/cliente/buscar", icon: Scissors },
  { label: "Perto de mim", path: "/cliente/buscar", icon: MapPin },
  { label: "Horários agora", path: "/cliente/buscar", icon: Clock3 },
  { label: "Mais bem avaliadas", path: "/cliente/buscar", icon: Star },
];

/**
 * Ato 2 — mesma camada: exploração rápida + disponibilidade imediata (estrutura distinta Vintage / Modern).
 */
const ClientAct2QuickLayer = () => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = getClientHomeCopy(identity);

  if (isVintage) {
    return (
      <section aria-label={copy.act2.aria} className="relative">
        <div className="vintage-panel overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-primary/[0.03] via-card to-transparent px-4 py-8 sm:px-7 sm:py-9">
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">{copy.act2.leadVintage}</p>

          <nav className="flex flex-wrap gap-2" aria-label={copy.exploreEyebrow}>
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-primary/12 bg-card/40 px-3.5 py-2.5 transition-all hover:border-primary/28 hover:bg-primary/[0.05]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/18 bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary/12">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-foreground group-hover:text-primary">{action.label}</span>
                </Link>
              );
            })}
          </nav>

          <div
            className="my-9 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            aria-hidden
          />

          <ClientAvailabilityNow variant="vintage" asDiv />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={copy.act2.aria}
      className={cn(
        "rounded-xl border border-primary/10 bg-card/35 px-4 py-5 sm:px-5 sm:py-6",
        "space-y-5",
      )}
    >
      <ClientAvailabilityNow variant="modern" asDiv />

      <div className="border-t border-primary/10 pt-5">
        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55">{copy.act2.quickLabelModern}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={`${action.path}-${action.label}`}
                to={action.path}
                className="group flex items-center gap-2.5 rounded-lg border border-primary/5 bg-background/50 px-2.5 py-2.5 transition-all hover:border-primary/25 hover:bg-primary/[0.06]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="min-w-0 truncate text-[10px] font-bold uppercase leading-tight tracking-wide text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClientAct2QuickLayer;
