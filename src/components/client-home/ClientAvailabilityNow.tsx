import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientHomeCopy } from "@/lib/clientHomeCopy";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { mockBarbershops } from "@/lib/mockBarbershops";

const availableNow = [
  { shop: "Barbearia Premium", time: "12:30" },
  { shop: "Studio Corte", time: "13:00" },
  { shop: "Barber Club", time: "13:15" },
];

type Variant = "vintage" | "modern";

interface ClientAvailabilityNowProps {
  variant?: Variant;
  /** Evita `<section>` aninhada quando embutido no Ato 2. */
  asDiv?: boolean;
}

/** Faixa de horários livres — Ato 2 (home) ou uso isolado. */
const ClientAvailabilityNow = ({ variant = "modern", asDiv = false }: ClientAvailabilityNowProps) => {
  const { identity } = useTheme();
  const copy = getClientHomeCopy(identity);
  const isVintageStyle = variant === "vintage";
  const Tag = asDiv ? "div" : "section";
  const navigate = useNavigate();

  const resolveShopId = (shopName: string): number | null => {
    const norm = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    const wanted = norm(shopName);
    const found = mockBarbershops.find((s) => norm(s.name) === wanted);
    return found?.id ?? null;
  };

  return (
    <Tag className={cn("space-y-3", isVintageStyle && "pt-2")} {...(asDiv ? { role: "group" as const } : {})}>
      <div className="flex flex-wrap items-end justify-between gap-2 px-0.5">
        <h3 className={cn(isVintageStyle ? "vintage-label" : "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60")}>
          {copy.availabilityTitle}
        </h3>
        <Button
          variant="link"
          className={cn(
            "h-auto p-0 text-[10px] font-semibold uppercase text-primary",
            isVintageStyle ? "tracking-[0.14em]" : "tracking-widest",
          )}
          onClick={() => navigate("/cliente/agendamentos")}
        >
          {copy.agendaLink}
        </Button>
      </div>

      <div
        className={cn(
          "grid sm:grid-cols-3",
          isVintageStyle ? "gap-3" : "gap-2 sm:gap-3",
        )}
      >
        {availableNow.map((item) => (
          <button
            key={`${item.shop}-${item.time}`}
            type="button"
            className={cn(
              "group relative flex items-center justify-between overflow-hidden border transition-all",
              isVintageStyle
                ? "rounded-xl border-primary/15 bg-card/40 px-4 py-3.5 hover:border-primary/35 hover:bg-primary/[0.06]"
                : "rounded-2xl border-primary/5 bg-[hsl(30,12%,10%)] p-4 hover:border-primary/30",
            )}
            onClick={() => {
              const id = resolveShopId(item.shop);
              if (id != null) {
                navigate(`/cliente/barbearia/${id}`, { state: { highlightNextSlot: item.time } });
              } else {
                navigate(`/cliente/buscar?q=${encodeURIComponent(item.shop)}`);
              }
            }}
          >
            <div className="min-w-0 space-y-0.5 text-left">
              <p className="truncate text-sm font-bold text-foreground">{item.shop}</p>
              <p
                className={cn(
                  "text-[10px] font-semibold uppercase text-muted-foreground/70",
                  isVintageStyle ? "tracking-[0.12em]" : "tracking-widest",
                )}
              >
                {copy.slotHint}
              </p>
            </div>
            <div
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 font-bold tabular-nums transition-all",
                isVintageStyle
                  ? "border border-primary/20 bg-primary/[0.08] text-sm text-primary group-hover:border-primary/35 group-hover:bg-primary/12"
                  : "rounded-xl bg-primary/10 text-xs font-black text-primary group-hover:bg-primary group-hover:text-primary-foreground",
              )}
            >
              {item.time}
            </div>
          </button>
        ))}
      </div>
    </Tag>
  );
};

export default ClientAvailabilityNow;
