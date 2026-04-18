import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { BARBER_OPERACAO_TABS, isBarberOperacaoZone } from "@/lib/barberOperacaoNav";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const BarberOperacaoSubnav = () => {
  const location = useLocation();
  const { identity } = useTheme();
  const isModern = identity === "modern";

  if (!isBarberOperacaoZone(location.pathname)) return null;

  return (
    <nav
      className="mb-8 flex items-center gap-1 border-b border-border/40 pb-px overflow-x-auto"
      aria-label={isModern ? "Seções da operação" : "Seções do movimento da casa"}
    >
      {BARBER_OPERACAO_TABS.map((tab) => {
        const active = tab.isActive(location.pathname);
        const label = isModern ? tab.labelModern : tab.labelVintage;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative shrink-0",
              active
                ? isModern 
                  ? "text-primary" 
                  : "text-[hsl(var(--gold))]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {active && (
              <motion.div
                layoutId="activeOperacaoTab"
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5",
                  isModern ? "bg-primary" : "bg-[hsl(var(--gold))]"
                )}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default BarberOperacaoSubnav;
