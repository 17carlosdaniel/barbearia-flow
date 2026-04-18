import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ShopCartItem } from "@/types/shop";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShopCartItem[];
  couponCode: string;
  discountValue: number;
  shippingValue: number;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  onUpdateQuantity: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
  onCheckout: () => void;
}

const CartDrawer = ({
  open,
  onOpenChange,
  items,
  couponCode,
  discountValue,
  shippingValue,
  onCouponCodeChange,
  onApplyCoupon,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartDrawerProps) => {
  const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const total = Math.max(0, subtotal + shippingValue - discountValue);
  const pickupLabel = items[0]?.product.pickupLocation;
  const DISCOUNT_THRESHOLD = 150;
  const progress = Math.min(1, subtotal / DISCOUNT_THRESHOLD);
  const missing = Math.max(0, DISCOUNT_THRESHOLD - subtotal);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col w-[95vw] sm:w-auto sm:max-w-2xl mx-auto rounded-t-3xl sm:rounded-3xl border border-border bg-background p-5 sm:p-6 shadow-[0_-24px_80px_rgba(0,0,0,0.75)]"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <ShoppingCart className="w-5 h-5 text-primary" />
            </motion.div>
            Carrinho
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4 space-y-4">
          {pickupLabel && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
              Retirada na barbearia: <span className="font-semibold">{pickupLabel}</span>
            </div>
          )}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Seu carrinho está vazio.
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  key={item.id || item.product.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 rounded-xl border border-border/60 bg-card p-3"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">
                      {item.product.name}
                    </p>
                    <p className="text-primary font-semibold text-sm">
                      R$ {item.product.price.toFixed(2)}
                    </p>
                    {(item.selectedSize || item.selectedColor || item.selectedMaterial) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {[item.selectedSize, item.selectedColor, item.selectedMaterial].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id || item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <motion.span
                        key={`${item.id || item.product.id}-${item.quantity}`}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-medium w-6 text-center"
                      >
                        {item.quantity}
                      </motion.span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id || item.product.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemove(item.id || item.product.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <SheetFooter className="border-t pt-4">
          <div className="w-full space-y-3">
            <div className="rounded-lg border border-primary/35 bg-primary/5 px-3 py-2 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-muted-foreground">
                  {missing > 0
                    ? `Faltam R$ ${missing.toFixed(2)} para você desbloquear um desconto especial.`
                    : "Você alcançou o valor ideal para aplicar seu melhor desconto."}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full loyalty-progress-bar"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={couponCode}
                onChange={(e) => onCouponCodeChange(e.target.value)}
                placeholder="Inserir cupom"
                className="flex-1 h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
              />
              <Button type="button" variant="outline" className="h-9" onClick={onApplyCoupon}>
                Aplicar
              </Button>
            </div>
            {couponCode.trim() && discountValue > 0 && (
              <p className="text-xs text-emerald-400">
                Cupom {couponCode.toUpperCase()} aplicado com sucesso.
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço sem cupom</span>
              <span className="text-foreground">R$ {(subtotal + shippingValue).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desconto</span>
              <span className="text-foreground">-R$ {discountValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Preço com cupom</span>
              <motion.span
                key={total.toFixed(2)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-foreground"
              >
                R$ {total.toFixed(2)}
              </motion.span>
            </div>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex w-full">
              <Button
                className="w-full shadow-gold hover:shadow-gold"
                variant="gold"
                disabled={items.length === 0}
                onClick={onCheckout}
              >
                Finalizar pedido
              </Button>
            </motion.div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
