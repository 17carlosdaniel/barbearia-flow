import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Sparkles } from "lucide-react";
import type { ShopProduct } from "@/types/shop";
import type { StoreProduct } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getPreviewAttributeLine, getTypeLabel } from "@/lib/storeProductFormHelpers";

type BarberProductDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopProduct: ShopProduct | null;
  linkedStoreProduct: StoreProduct | null;
  onEdit: () => void;
};

export default function BarberProductDetailDialog({
  open,
  onOpenChange,
  shopProduct,
  linkedStoreProduct,
  onEdit,
}: BarberProductDetailDialogProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const gallery = useMemo(() => {
    if (!shopProduct) return [];
    const imgs = shopProduct.images?.length ? shopProduct.images : shopProduct.image ? [shopProduct.image] : [];
    return imgs.filter(Boolean);
  }, [shopProduct]);

  useEffect(() => {
    setSelectedImage(0);
  }, [shopProduct?.id]);

  if (!shopProduct) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhe do produto</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const offer = typeof shopProduct.originalPrice === "number" && shopProduct.originalPrice > shopProduct.price;
  const savingValue = offer ? shopProduct.originalPrice! - shopProduct.price : 0;
  const nameTitle = shopProduct.name.includes("Premium")
    ? shopProduct.name
    : `${shopProduct.name} Premium`;
  const urgencyLabel = shopProduct.stock <= 12 ? `Restam apenas ${shopProduct.stock} unidades` : "Vendendo rápido";

  const typeLabel = linkedStoreProduct?.productType ? getTypeLabel(linkedStoreProduct.productType) : null;
  const technicalLine =
    linkedStoreProduct?.productType && linkedStoreProduct.attributes
      ? getPreviewAttributeLine(linkedStoreProduct.productType, linkedStoreProduct.attributes)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <div className="p-5 sm:p-6 space-y-5">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Detalhe do produto
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Fechar
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="glass-card rounded-2xl overflow-hidden border border-border/60">
                {gallery.length ? (
                  <img
                    src={gallery[Math.min(selectedImage, gallery.length - 1)]}
                    alt={shopProduct.name}
                    className="w-full aspect-square object-cover"
                  />
                ) : null}
              </div>

              {gallery.length > 1 ? (
                <div className="grid grid-cols-4 gap-2">
                  {gallery.map((img, idx) => (
                    <button
                      key={`${shopProduct.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        "rounded-lg overflow-hidden border bg-secondary/20",
                        idx === selectedImage ? "border-primary bg-primary/5" : "border-border/60",
                      )}
                    >
                      <img src={img} alt={`${shopProduct.name} ${idx + 1}`} className="w-full aspect-square object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gradient-gold">{nameTitle}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2 py-1 text-xs">
                    {urgencyLabel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{shopProduct.description}</p>
              </div>

              <div className="space-y-1.5">
                {offer ? (
                  <p className="text-xs text-muted-foreground line-through">De R$ {shopProduct.originalPrice!.toFixed(2)}</p>
                ) : null}
                <p className="text-3xl font-bold text-primary">Por R$ {shopProduct.price.toFixed(2)}</p>
                {savingValue > 0 ? <p className="text-xs text-emerald-400 font-medium">Economize R$ {savingValue.toFixed(2)}</p> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/40 text-primary px-2 py-1">
                  Estoque: {shopProduct.stock}
                </span>
                {shopProduct.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-2 py-1">
                    Destaque
                  </span>
                ) : null}
                {offer ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2 py-1">
                    Oferta
                  </span>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/15 p-3 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Resumo técnico</p>
                {typeLabel ? <p className="text-sm font-semibold text-foreground">{typeLabel}</p> : null}
                {technicalLine ? <p className="text-xs text-muted-foreground">{technicalLine}</p> : <p className="text-xs text-muted-foreground">Sem dados técnicos completos.</p>}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button type="button" onClick={onEdit} className="flex-1 gap-2" variant="gold">
                  <Pencil className="w-4 h-4" />
                  Editar produto
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Continuar vendo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

