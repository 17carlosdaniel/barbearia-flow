import { motion } from "framer-motion";
import { Flame, Trophy, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FeedCutItem {
  id: string;
  name: string;
  barbershop: string;
  imageUrl?: string;
}

export interface FeedTopShopItem {
  id: string;
  name: string;
  city: string;
  score: number;
}

export interface FeedPromoItem {
  id: string;
  title: string;
  shopName: string;
  priceLabel: string;
}

interface WaitingMiniFeedProps {
  cuts: FeedCutItem[];
  topShops: FeedTopShopItem[];
  promos: FeedPromoItem[];
  onBookCut: (cut: FeedCutItem) => void;
}

const WaitingMiniFeed = ({ cuts, topShops, promos, onBookCut }: WaitingMiniFeedProps) => {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Mini feed enquanto você espera</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Cortes populares hoje</p>
          </div>
          {cuts.slice(0, 3).map((cut) => (
            <motion.div key={cut.id} whileHover={{ x: 2 }} className="rounded-lg border border-border/50 p-2">
              <p className="text-sm font-medium">{cut.name}</p>
              <p className="text-xs text-muted-foreground">{cut.barbershop}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => onBookCut(cut)}>
                Agendar esse corte
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Top barbearias</p>
          </div>
          {topShops.slice(0, 3).map((shop, index) => (
            <div key={shop.id} className="rounded-lg border border-border/50 p-2">
              <p className="text-sm font-medium">#{index + 1} {shop.name}</p>
              <p className="text-xs text-muted-foreground">{shop.city}</p>
              <p className="text-xs text-primary mt-1">Nota {shop.score.toFixed(1)}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl border border-border/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Promoções perto de você</p>
          </div>
          {promos.slice(0, 3).map((promo) => (
            <div key={promo.id} className="rounded-lg border border-border/50 p-2">
              <p className="text-sm font-medium">{promo.title}</p>
              <p className="text-xs text-muted-foreground">{promo.shopName}</p>
              <p className="text-xs text-primary mt-1">{promo.priceLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WaitingMiniFeed;
