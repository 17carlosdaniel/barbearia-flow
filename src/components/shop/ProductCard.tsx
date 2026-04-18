import { useMemo } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingCart, Flame, Leaf, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ShopProduct } from "@/types/shop";
import StarRating from "@/components/shop/StarRating";
import { useTheme } from "@/contexts/ThemeContext";
import { getClientCommerceCopy } from "@/lib/clientCommerceCopy";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ShopProduct;
  index?: number;
  onAddToCart?: (product: ShopProduct) => void;
  onClickOverride?: () => void;
  /** Modo somente visual: sem navegação nem botão de adicionar ao carrinho */
  viewOnly?: boolean;
}

const ProductCard = ({ product, index = 0, onAddToCart, onClickOverride, viewOnly }: ProductCardProps) => {
  const navigate = useNavigate();
  const { identity } = useTheme();
  const isModern = identity === "modern";
  const sc = useMemo(() => getClientCommerceCopy(identity).store, [identity]);

  const handleClick = () => {
    if (viewOnly) return;
    if (onClickOverride) {
      onClickOverride();
      return;
    }
    navigate(`/cliente/loja/produto/${product.id}`);
  };

  const showAddToCart = !viewOnly && onAddToCart;

  const isLowStock = product.stock <= 12;
  const isOffer = typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const socialReviews = Math.max(product.reviews?.length ?? 0, 120);
  const isBestSeller = (product.soldCount ?? 0) >= 100;
  const isNew =
    typeof product.createdAt === "string" &&
    (() => {
      const created = new Date(product.createdAt);
      if (Number.isNaN(created.getTime())) return false;
      const diffMs = Date.now() - created.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    })();
  const isVegan = product.tags?.some((t) => t.toLowerCase().includes("vegano")) ?? false;
  const showProfileTag = product.featured && isModern;
  const showEditorialTag = product.featured && !isModern;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (index ?? 0) * 0.06 }}
      className={cn(
        "group glass-card cursor-pointer overflow-hidden rounded-2xl border border-border/60 shadow-card",
        viewOnly && "cursor-default",
        !isModern && "rounded-[1.25rem]",
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden",
          !isModern && "aspect-[4/5] sm:aspect-square",
        )}
      >
        <img
          src={product.images?.[0] ?? product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.images?.[1] && (
          <img
            src={product.images[1]}
            alt={`${product.name} variação`}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-end gap-1">
          <div className="ml-auto flex flex-col items-end gap-1">
            {isOffer && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground shadow-card">
                <Sparkles className="h-3 w-3" />
                Oferta
              </span>
            )}
            {isBestSeller && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-1 text-[10px] font-semibold text-amber-50">
                <Flame className="h-3 w-3" />
                Mais vendido
              </span>
            )}
            {showProfileTag && (
              <span className="rounded-md border border-primary/40 bg-background/90 px-2 py-1 text-[9px] font-medium text-primary">
                {sc.productCardTagProfile}
              </span>
            )}
            {showEditorialTag && (
              <span className="rounded-md border border-primary/35 bg-primary/15 px-2 py-1 text-[9px] font-medium text-primary">
                {sc.productCardTagEditorial}
              </span>
            )}
            {product.stock > 0 && isModern && (
              <span className="rounded-md border border-border/50 bg-background/85 px-2 py-0.5 text-[9px] text-muted-foreground">
                {sc.productCardTagFast}
              </span>
            )}
            {isNew && !isBestSeller && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-emerald-50">
                Novo
              </span>
            )}
            {isVegan && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-semibold text-emerald-50">
                <Leaf className="h-3 w-3" />
                Vegano
              </span>
            )}
            {isLowStock && (
              <span className="rounded-md bg-destructive/90 px-2 py-1 text-[10px] font-medium text-destructive-foreground">
                Restam {product.stock} un.
              </span>
            )}
          </div>
        </div>

        {showAddToCart && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
          >
            <div className="flex flex-col items-center gap-2 px-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
              >
                <ShoppingCart className="h-4 w-4" />
                {sc.productCardAddCta}
              </motion.button>
              <span className="text-xs font-medium text-foreground/90">{sc.productCardViewCta}</span>
            </div>
          </motion.div>
        )}
        {showAddToCart && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105"
            aria-label={sc.productCardAddCta}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{product.category}</p>
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            {product.stock}
          </div>
        </div>
        {product.rating && (
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} size={12} />
            <span className="text-[11px] text-muted-foreground">
              {product.rating.toFixed(1)} ({socialReviews})
            </span>
          </div>
        )}
        {!isModern && (
          <p className="line-clamp-2 text-xs italic leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}
        {(product.barbershopName || product.pickupLocation) && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {product.barbershopName ? `${product.barbershopName} · ` : ""}
            {product.pickupLocation || "Retirada na barbearia"}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</span>
          </div>
          {showAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground md:hidden"
            >
              {sc.productCardAddCta}
            </button>
          )}
        </div>
        {product.soldCount ? (
          <p className="text-[10px] text-muted-foreground">{product.soldCount} vendidos</p>
        ) : null}
      </div>
    </motion.div>
  );
};

export default ProductCard;
