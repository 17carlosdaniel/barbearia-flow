import { motion } from "framer-motion";
import { RefreshCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";

const recentList = [
  { name: "Barbearia Premium", note: "Visto recentemente" },
  { name: "Studio Gold", note: "Último agendamento há 8 dias" },
];

const favoriteList = [
  { name: "Barber House", rating: "4.9" },
  { name: "Corte Urbano", rating: "4.8" },
];

const affinityStyles = ["Degradê + barba", "Corte social", "Risco lateral", "Pigmentação"];

/** Ato 3 — continuidade: histórico lidera; favoritos e afinidade como apoio (menos títulos de seção). */
const ClientContinuitySection = () => {
  const { identity } = useTheme();
  const isVintage = identity === "vintage";
  const copy = getClientHomeCopy(identity);

  if (isVintage) {
    return (
      <motion.section
        aria-label={copy.continuity.aria}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative border-t border-primary/10 pt-12"
      >
        <div className="mb-8 max-w-2xl">
          <h2 className="font-vintage-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{copy.continuity.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.continuity.subtitle}</p>
        </div>

        <div className="max-w-3xl space-y-10">
          <div>
            <p className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/50">{copy.continuity.historyLabel}</p>
            <div className="space-y-2">
              {recentList.map((item) => (
                <div
                  key={item.name}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary/80 transition-colors group-hover:text-primary">
                      <RefreshCcw className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">{item.note}</p>
                    </div>
                  </div>
                  <Button
                    variant="outlineGold"
                    size="sm"
                    className="h-9 shrink-0 rounded-lg px-3 text-[9px] font-semibold uppercase tracking-[0.12em]"
                  >
                    {copy.continuity.historyCta}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 border-t border-primary/10 pt-10 sm:flex-row sm:items-start sm:gap-10">
            <div className="sm:w-[42%]">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">{copy.continuity.favoritesBridge}</p>
              <p className="mb-3 text-xs font-semibold text-foreground/90">{copy.continuity.favoritesLabel}</p>
              <div className="grid gap-2">
                {favoriteList.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="flex items-center justify-between rounded-lg border border-primary/10 bg-card/20 px-3 py-2.5 text-left text-sm transition-all hover:border-primary/25 hover:bg-primary/[0.05]"
                  >
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                    <span className="ml-2 flex shrink-0 items-center gap-1 text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-[10px] font-bold tabular-nums">{item.rating}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 border-t border-primary/10 pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-10">
              <p className="text-xs font-semibold text-primary/75">{copy.continuity.affinityLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{copy.continuity.affinityHint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {affinityStyles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-primary/18 bg-card/50 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-all hover:border-primary/35 hover:bg-primary/[0.07] hover:text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <section aria-label={copy.continuity.aria} className="border-t border-primary/10 pt-8">
      <div className="mb-5 px-0.5">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/75">{copy.continuity.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{copy.continuity.subtitle}</p>
      </div>

      <div className="space-y-5">
        <div className="rounded-lg border border-primary/10 bg-card/30 px-3 py-4 sm:px-4">
          <div className="space-y-2">
            {recentList.map((item) => (
              <div
                key={item.name}
                className="group flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/50 p-3 transition-all hover:border-primary/20"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary/60 group-hover:text-primary">
                    <RefreshCcw className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/55">{item.note}</p>
                  </div>
                </div>
                <Button variant="outlineGold" size="sm" className="h-8 shrink-0 px-2.5 text-[8px] font-black uppercase tracking-widest">
                  {copy.continuity.historyCta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-primary/10 bg-card/25 px-3 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{copy.continuity.favoritesLabel}</p>
            <div className="space-y-1.5">
              {favoriteList.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-left text-sm font-semibold transition-colors hover:border-primary/15 hover:bg-primary/[0.04]"
                >
                  {item.name}
                  <span className="flex items-center gap-0.5 text-primary">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-[9px] font-black tabular-nums">{item.rating}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-primary/10 bg-card/25 px-3 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-primary/70">{copy.continuity.affinityLabel}</p>
            <p className="mb-2 text-[11px] text-muted-foreground">{copy.continuity.affinityHint}</p>
            <div className="flex flex-wrap gap-1.5">
              {affinityStyles.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-md border border-white/10 bg-background/40 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/25 hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientContinuitySection;
