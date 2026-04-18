import type { LucideIcon } from "lucide-react";
import { Droplets, Hammer, Package, Sparkles, Star, UserRound } from "lucide-react";
import type { StoreCategoryItem } from "@/lib/clientCommerceCopy";

const ICON_BY_KEY: Record<string, LucideIcon> = {
  Todos: Package,
  Pomadas: Sparkles,
  Cuidados: Droplets,
  Barba: UserRound,
  Kits: Package,
  Acessórios: Hammer,
  CuidadosDiarios: Droplets,
  Essenciais: Star,
};

interface CategoryNavProps {
  category: string;
  onChange: (category: string) => void;
  items: StoreCategoryItem[];
}

const CategoryNav = ({ category, onChange, items }: CategoryNavProps) => {
  return (
    <div className="glass-card rounded-xl p-2 overflow-x-auto">
      <div className="flex items-center gap-2 min-w-max">
        {items.map((item) => {
          const Icon = ICON_BY_KEY[item.key] ?? Package;
          const active = category === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${
                active
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              <Icon className="w-4 h-4 transition-transform hover:-translate-y-0.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;
