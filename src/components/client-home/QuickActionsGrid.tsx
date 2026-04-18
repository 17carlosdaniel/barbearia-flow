import { Clock3, MapPin, Scissors, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "Cortes populares", path: "/cliente/buscar", icon: Scissors },
  { label: "Perto de mim", path: "/cliente/buscar", icon: MapPin },
  { label: "Horários agora", path: "/cliente/buscar", icon: Clock3 },
  { label: "Mais bem avaliadas", path: "/cliente/buscar", icon: Star },
];

const QuickActionsGrid = () => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = getClientHomeCopy(identity);

  if (isVintage) {
    return (
      <section aria-label={copy.exploreEyebrow} className="relative pt-2">
        <div className="mb-6 px-0.5">
          <p className="vintage-label">{copy.exploreEyebrow}</p>
          <h2 className="mt-1 font-vintage-heading text-xl font-bold text-foreground sm:text-2xl">{copy.exploreTitle}</h2>
        </div>
        <div className="rounded-2xl border border-primary/12 bg-card/40 px-1 py-2 sm:px-4 sm:py-5">
          <nav className="flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-stretch sm:divide-x sm:divide-primary/15" aria-label="Exploração rápida">
            {ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3.5 transition-colors sm:flex-1 sm:min-w-[44%] lg:min-w-0 lg:flex-1",
                    i > 0 && "border-t border-primary/10 sm:border-t-0",
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary transition-all group-hover:border-primary/30 group-hover:bg-primary/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-sm font-semibold tracking-wide text-foreground group-hover:text-primary">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={copy.exploreEyebrow} className="space-y-4 pt-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{copy.exploreEyebrow}</h2>
          <p className="mt-1 text-xs text-muted-foreground/80">{copy.exploreTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={`${action.path}-${action.label}`}
              to={action.path}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/5 bg-[hsl(30,12%,10%)] p-4 transition-all hover:border-primary/20 hover:bg-[hsl(30,12%,12%)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">{action.label}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActionsGrid;
